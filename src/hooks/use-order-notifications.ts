'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'
import { useToast } from '@/hooks/use-toast'
import { playNewOrderSound, primeAudioContext } from '@/lib/notifications/sound'
import {
  getBrowserNotificationsEnabled,
  getNotificationsEnabled,
  getSoundEnabled,
} from '@/lib/notifications/preferences'

export type NewOrderInfo = {
  id: string
  order_number: string
  status: string
}

type BroadcastMessage =
  | { type: 'order'; id: string; order_number: string; status: string }
  | { type: 'read' }

const BROADCAST_CHANNEL_NAME = 'p1nto:orders'
const NOTIFY_LOCK_NAME = 'p1nto:order-notify'
const SEEN_LIMIT = 200
const NOTIFY_LOCK_HOLD_MS = 900

type UseOrderNotificationsOptions = {
  enabled?: boolean
  onNewOrder?: (order: NewOrderInfo) => void
}

/**
 * Single source of truth for "a genuinely new order arrived".
 *
 * - One Supabase Realtime channel (INSERT on orders).
 * - One notification per order id (in-memory seen-set).
 * - Mobile-resilient: Foreground tab always plays sound; background tabs use Web Locks.
 * - Tab visibility catch-up: If orders arrive while the mobile tab was in the background
 *   or screen was off, notifies immediately when the cashier returns to the tab.
 * - Mobile Touch Priming: AudioContext and HTMLAudio are primed on any user touch/tap.
 * - Screen Wake Lock: Keeps the mobile cashier screen awake when supported.
 */
export function useOrderNotifications({ enabled = true, onNewOrder }: UseOrderNotificationsOptions = {}) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [lastOrder, setLastOrder] = useState<NewOrderInfo | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const seenIdsRef = useRef<Set<string>>(new Set())
  const channelRef = useRef<BroadcastChannel | null>(null)
  const onNewOrderRef = useRef(onNewOrder)
  const isInitialMountRef = useRef(true)
  const { toast } = useToast()

  useEffect(() => {
    onNewOrderRef.current = onNewOrder
  })

  const addSeen = useCallback((id: string) => {
    const seen = seenIdsRef.current
    seen.add(id)
    if (seen.size > SEEN_LIMIT) {
      seenIdsRef.current = new Set([...seen].slice(-SEEN_LIMIT))
    }
  }, [])

  const showBrowserNotification = useCallback((order: NewOrderInfo) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission !== 'granted') return
    if (!getNotificationsEnabled() || !getBrowserNotificationsEnabled()) return
    try {
      new Notification('Pinto — Pesanan Baru', {
        body: `Pesanan #${order.order_number} masuk antrean`,
        tag: `p1nto-order-${order.id}`,
      })
    } catch {
      // Notification construction failed (unsupported edge) - ignore.
    }
  }, [])

  const handleRemoteOrder = useCallback(
    (order: NewOrderInfo) => {
      if (seenIdsRef.current.has(order.id)) return
      addSeen(order.id)
      setLastOrder(order)
      setUnreadCount((count) => count + 1)
    },
    [addSeen]
  )

  const performNotification = useCallback(
    (order: NewOrderInfo) => {
      onNewOrderRef.current?.(order)
      toast({
        title: 'Pesanan Baru',
        description: `#${order.order_number} masuk antrean.`,
      })
      if (getNotificationsEnabled() && getSoundEnabled()) {
        playNewOrderSound().catch(() => {})
      }
      showBrowserNotification(order)
    },
    [showBrowserNotification, toast]
  )

  const notify = useCallback(
    (order: NewOrderInfo) => {
      if (!order?.id) return
      if (seenIdsRef.current.has(order.id)) return
      addSeen(order.id)

      setLastOrder(order)
      setUnreadCount((count) => count + 1)

      const broadcast = () => {
        channelRef.current?.postMessage({
          type: 'order',
          id: order.id,
          order_number: order.order_number,
          status: order.status,
        } satisfies BroadcastMessage)
      }

      // Check if current tab is actively visible to user
      const isVisible =
        typeof document !== 'undefined'
          ? document.visibilityState === 'visible'
          : true

      if (isVisible) {
        // Visible tab ALWAYS triggers notification immediately (no lock drop on mobile)
        performNotification(order)
        broadcast()
      } else {
        // Background tab uses Web Locks to coordinate with other tabs
        const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined
        if (locks?.request) {
          void locks.request(NOTIFY_LOCK_NAME, { ifAvailable: true }, async (lock) => {
            if (!lock) return
            performNotification(order)
            broadcast()
            await new Promise((resolve) => setTimeout(resolve, NOTIFY_LOCK_HOLD_MS))
          })
        } else {
          performNotification(order)
          broadcast()
        }
      }
    },
    [addSeen, performNotification]
  )

  const markAllRead = useCallback(() => {
    setUnreadCount(0)
    channelRef.current?.postMessage({ type: 'read' } satisfies BroadcastMessage)
  }, [])

  // Prime and unlock audio from user gestures.
  // Critical for mobile browsers (iOS Safari, Android Chrome).
  useEffect(() => {
    const prime = () => {
      primeAudioContext().catch(() => {})
    }

    const events = ['click', 'touchstart', 'touchend', 'pointerdown', 'keydown']
    events.forEach((event) => {
      window.addEventListener(event, prime, { passive: true })
    })

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, prime)
      })
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    const supabase = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const bc =
      typeof window !== 'undefined' && 'BroadcastChannel' in window
        ? new BroadcastChannel(BROADCAST_CHANNEL_NAME)
        : null
    channelRef.current = bc

    bc?.addEventListener('message', (event: MessageEvent<BroadcastMessage>) => {
      const msg = event.data
      if (!msg) return
      if (msg.type === 'order') {
        handleRemoteOrder({ id: msg.id, order_number: msg.order_number, status: msg.status })
      } else if (msg.type === 'read') {
        setUnreadCount(0)
      }
    })

    // Reconcile orders that arrived while tab was hidden/asleep
    const reconcileMissedOrders = async (isInitial = false) => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return
      }

      try {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
        const { data: recentOrders } = await supabase
          .from('orders')
          .select('id, order_number, status, created_at')
          .gte('created_at', fiveMinutesAgo)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(10)

        const rawOrders = (recentOrders ?? []) as unknown as Array<{
          id: string
          order_number: string
          status: string
        }>

        if (rawOrders.length === 0) return

        if (isInitial) {
          // On first page load, mark existing recent orders as already seen so we don't chime for old orders
          rawOrders.forEach((ord) => seenIdsRef.current.add(ord.id))
          return
        }

        // On tab wakeup / return from background, find genuinely unnotified orders
        const unnotified = rawOrders.filter((ord) => !seenIdsRef.current.has(ord.id))
        if (unnotified.length > 0) {
          unnotified.forEach((o) => addSeen(o.id))
          const newest = unnotified[0]
          setLastOrder({
            id: newest.id,
            order_number: newest.order_number,
            status: newest.status,
          })
          setUnreadCount((count) => count + unnotified.length)
          performNotification({
            id: newest.id,
            order_number: newest.order_number,
            status: newest.status,
          })
        }
      } catch (err) {
        console.error('Failed to reconcile missed orders:', err)
      }
    }

    // Seed seen list with existing recent orders on mount
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false
      void reconcileMissedOrders(true)
    }

    const channel = supabase
      .channel('admin_order_notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const record = payload.new as unknown as NewOrderInfo
          notify(record)
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    // Catch-up when returning to tab from background or screen wake
    const handleVisibilityOrFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        void primeAudioContext().catch(() => {})
        void reconcileMissedOrders(false)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityOrFocus)
    window.addEventListener('focus', handleVisibilityOrFocus)

    // Keep mobile screen awake if WakeLock API is available
    let wakeLockSentinel: { release: () => Promise<void> } | null = null
    const requestWakeLock = async () => {
      if (
        typeof navigator !== 'undefined' &&
        'wakeLock' in navigator &&
        typeof document !== 'undefined' &&
        document.visibilityState === 'visible'
      ) {
        try {
          const navWithWake = navigator as unknown as {
            wakeLock: { request: (type: string) => Promise<{ release: () => Promise<void> }> }
          }
          wakeLockSentinel = await navWithWake.wakeLock.request('screen')
        } catch {
          // Wake lock not permitted or unsupported
        }
      }
    }
    void requestWakeLock()

    return () => {
      supabase.removeChannel(channel)
      bc?.close()
      channelRef.current = null
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus)
      window.removeEventListener('focus', handleVisibilityOrFocus)
      if (wakeLockSentinel) {
        wakeLockSentinel.release().catch(() => {})
      }
    }
  }, [enabled, handleRemoteOrder, notify, addSeen, performNotification])

  return {
    unreadCount,
    markAllRead,
    lastOrder,
    isConnected,
  }
}