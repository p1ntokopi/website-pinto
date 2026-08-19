'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'
import { useToast } from '@/hooks/use-toast'
import { playNewOrderSound, primeAudioContext } from '@/lib/notifications/sound'
import {
  getBrowserNotificationsEnabled,
  getNotificationsEnabled,
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
 * - One Supabase Realtime channel (INSERT on orders + UPDATE -> PENDING when a
 *   paid PENDING_PAYMENT order enters the kitchen queue).
 * - One notification per order id (in-memory seen-set).
 * - Cross-tab: Web Locks pick a single "notifying" tab (no duplicate sound /
 *   toast); BroadcastChannel syncs the unread badge to every open tab.
 * - Master toggle OFF still keeps visual feedback (toast + badge) but silences
 *   sound and browser notifications.
 * - Cleanup on unmount (channel removed, listeners closed).
 */
export function useOrderNotifications({ enabled = true, onNewOrder }: UseOrderNotificationsOptions = {}) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [lastOrder, setLastOrder] = useState<NewOrderInfo | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const seenIdsRef = useRef<Set<string>>(new Set())
  const channelRef = useRef<BroadcastChannel | null>(null)
  const onNewOrderRef = useRef(onNewOrder)
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

  const notify = useCallback(
    (order: NewOrderInfo) => {
      if (!order?.id) return
      if (seenIdsRef.current.has(order.id)) return
      addSeen(order.id)

      setLastOrder(order)
      setUnreadCount((count) => count + 1)

      const perform = () => {
        onNewOrderRef.current?.(order)
        toast({
          title: 'Pesanan Baru',
          description: `#${order.order_number} masuk antrean.`,
        })
        if (getNotificationsEnabled()) {
          playNewOrderSound().catch(() => {})
        }
        showBrowserNotification(order)
      }

      const broadcast = () => {
        channelRef.current?.postMessage({
          type: 'order',
          id: order.id,
          order_number: order.order_number,
          status: order.status,
        } satisfies BroadcastMessage)
      }

      const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined
      if (locks?.request) {
        // Only one tab becomes the notifier; the rest update their badge only.
        void locks.request(NOTIFY_LOCK_NAME, { ifAvailable: true }, async () => {
          perform()
          broadcast()
          // Keep the lock briefly so a concurrently-open tab skips the sound.
          await new Promise((resolve) => setTimeout(resolve, NOTIFY_LOCK_HOLD_MS))
        })
      } else {
        perform()
        broadcast()
      }
    },
    [addSeen, showBrowserNotification, toast]
  )

  const markAllRead = useCallback(() => {
    setUnreadCount(0)
    channelRef.current?.postMessage({ type: 'read' } satisfies BroadcastMessage)
  }, [])

  // Prime the audio context from the first user gesture (autoplay policy).
  useEffect(() => {
    const prime = () => primeAudioContext()
    window.addEventListener('pointerdown', prime)
    window.addEventListener('keydown', prime)
    return () => {
      window.removeEventListener('pointerdown', prime)
      window.removeEventListener('keydown', prime)
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
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          const record = payload.new as unknown as NewOrderInfo
          const previous = payload.old as { status?: string } | undefined
          // A paid PENDING_PAYMENT order entering the kitchen queue is a new
          // operational event worth notifying even though the row already exists.
          if (record.status === 'PENDING' && previous?.status === 'PENDING_PAYMENT') {
            notify(record)
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
      bc?.close()
      channelRef.current = null
    }
  }, [enabled, handleRemoteOrder, notify])

  return {
    unreadCount,
    markAllRead,
    lastOrder,
    isConnected,
  }
}