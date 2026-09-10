'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'
import {
  normalizeOrderStatus,
  type CanonicalOrderStatus,
} from '@/lib/orders/status-machine'
import { KitchenOrder } from '@/lib/orders/kitchen-types'
import { KitchenCard } from './kitchen-card'
import { Maximize, Minimize, Wifi, WifiOff, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { playNewOrderSound } from '@/lib/notifications/sound'
import { getNotificationsEnabled, getSoundEnabled } from '@/lib/notifications/preferences'

// Legacy statuses that still mean "new" so old rows keep flowing to the KDS.
const ACTIVE_STATUSES = [
  'NEW',
  'PENDING_PAYMENT',
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
] as const

const KDS_SELECT = `
  id, order_number, status, created_at, notes,
  table:tables(table_number),
  items:order_items(
    id, quantity, product_name_snapshot, variant_name_snapshot, notes,
    options:order_item_options(option_value_snapshot)
  )
`

function canonicalOrderStatus(status: string): CanonicalOrderStatus {
  return normalizeOrderStatus(status as Parameters<typeof normalizeOrderStatus>[0])
}

function isActiveForKitchen(status: string): boolean {
  return (ACTIVE_STATUSES as readonly string[]).includes(status)
}

// Terminal (or customer-side-only) statuses leave the board.
function isTerminalForKitchen(status: string): boolean {
  const canonical = canonicalOrderStatus(status)
  return canonical === 'SERVED' || canonical === 'CANCELLED'
}

export function KitchenClient({
  initialOrders,
  initialError,
}: {
  initialOrders: KitchenOrder[]
  initialError?: string | null
}) {
  const [orders, setOrders] = useState<KitchenOrder[]>(initialOrders)
  const [loadError, setLoadError] = useState<string | null>(initialError ?? null)
  const [isConnected, setIsConnected] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentTime, setCurrentTime] = useState('')
  const wasConnectedRef = useRef(true)
  const lastInitialSyncRef = useRef(JSON.stringify(initialOrders))
  const supabaseRef = useRef<ReturnType<typeof createBrowserClient<Database>> | null>(null)

  // Keep server-rendered rows in sync after router.refresh() on the page.
  useEffect(() => {
    const next = JSON.stringify(initialOrders)
    if (next !== lastInitialSyncRef.current) {
      lastInitialSyncRef.current = next
      setOrders((prev) => {
        const byId = new Map(prev.map((order) => [order.id, order]))
        for (const order of initialOrders) byId.set(order.id, order)
        return [...byId.values()].filter((order) =>
          isActiveForKitchen(order.status)
        )
      })
    }
  }, [initialOrders])

  // Clock
  useEffect(() => {
    const updateTime = () => setCurrentTime(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }))
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  // Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(e => console.error(e))
    } else {
      if (document.exitFullscreen) document.exitFullscreen()
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const refreshOrders = useCallback(async (
    supabase: ReturnType<typeof createBrowserClient<Database>> | null
  ) => {
    if (!supabase) return
    const { data, error } = await supabase
      .from('orders')
      .select(KDS_SELECT)
      .in('status', [...ACTIVE_STATUSES])
      .order('created_at', { ascending: true })

    if (error) {
      setLoadError('Gagal memuat antrean dapur. Menampilkan data terakhir.')
      return
    }

    setLoadError(null)
    const fetched = (data as unknown as KitchenOrder[]) || []
    setOrders(fetched)
  }, [])

  // Realtime
  useEffect(() => {
    const supabase = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    supabaseRef.current = supabase

    const channel = supabase.channel('kitchen_orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data } = await supabase
              .from('orders')
              .select(KDS_SELECT)
              .eq('id', payload.new.id)
              .single()

            const order = data as unknown as KitchenOrder | null
            if (order && isActiveForKitchen(order.status)) {
              // Upsert by ID: duplicate Realtime deliveries must not double the card.
              setOrders(prev => {
                const exists = prev.some(o => o.id === order.id)
                return exists
                  ? prev.map(o => (o.id === order.id ? order : o))
                  : [...prev, order]
              })
              // Play the synthesized chime when notifications are enabled.
              if (getNotificationsEnabled() && getSoundEnabled()) {
                playNewOrderSound()
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            const newStatus = payload.new.status
            if (isTerminalForKitchen(newStatus)) {
              setOrders(prev => prev.filter(o => o.id !== payload.new.id))
            } else {
              setOrders(prev => prev.map(o =>
                o.id === payload.new.id ? { ...o, status: newStatus } : o
              ))
            }
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev => prev.filter(o => o.id !== payload.old.id))
          }
        }
      )
      .subscribe((status) => {
        const connected = status === 'SUBSCRIBED'
        setIsConnected(connected)
        // Reconcile any events missed while the channel was down.
        if (connected && !wasConnectedRef.current) {
          void refreshOrders(supabase)
        }
        wasConnectedRef.current = connected
      })

    const handleReconcile = () => {
      if (document.visibilityState === 'visible' && !wasConnectedRef.current) {
        void refreshOrders(supabase)
      }
    }
    document.addEventListener('visibilitychange', handleReconcile)
    window.addEventListener('focus', handleReconcile)

    return () => {
      document.removeEventListener('visibilitychange', handleReconcile)
      window.removeEventListener('focus', handleReconcile)
      supabase.removeChannel(channel)
    }
  }, [refreshOrders])

  const handleOptimisticUpdate = (
    orderId: string,
    newStatus: CanonicalOrderStatus
  ) => {
    if (isTerminalForKitchen(newStatus)) {
      setOrders(prev => prev.filter(o => o.id !== orderId))
    } else {
      setOrders(prev => prev.map(o =>
        o.id === orderId ? { ...o, status: newStatus } : o
      ))
    }
  }

  // Column assignment uses the canonical status so legacy rows land correctly.
  const newOrders = orders.filter(o =>
    canonicalOrderStatus(o.status) === 'NEW'
  )
  const preparingOrders = orders.filter(o =>
    canonicalOrderStatus(o.status) === 'PREPARING'
  )
  const readyOrders = orders.filter(o =>
    canonicalOrderStatus(o.status) === 'READY'
  )

  return (
    <>
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-[#2C2923] bg-[#1E1B16] px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3 sm:gap-6">
          <h1 className="truncate font-display text-xl font-black tracking-tight text-[#F7F5F0] sm:text-2xl">
            Pinto<span className="text-[#C89B6D]"> Kitchen</span>
          </h1>
          <div className="hidden rounded-sm border border-[#2C2923] bg-[#16140F] px-4 py-1.5 font-mono text-xl font-bold text-[#C89B6D] md:block">
            {currentTime}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3 sm:gap-6">
          <div className="hidden sm:flex items-center gap-2">
            {isConnected ? (
              <span className="flex items-center gap-2 rounded-sm border border-[#2E8B57]/30 bg-[#2E8B57]/10 px-3 py-1.5 text-sm font-medium text-[#6FBF8F]">
                <Wifi className="h-4 w-4" /> LANGSUNG
              </span>
            ) : (
              <span className="flex animate-pulse items-center gap-2 rounded-sm border border-[#C94C4C]/30 bg-[#C94C4C]/10 px-3 py-1.5 text-sm font-medium text-[#E0655F]">
                <WifiOff className="h-4 w-4" /> MENGHUBUNGKAN ULANG...
              </span>
            )}
          </div>
          <span
            className={cn(
              'sm:hidden flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-xs font-bold',
              isConnected
                ? 'border-[#2E8B57]/30 bg-[#2E8B57]/10 text-[#6FBF8F]'
                : 'border-[#C94C4C]/30 bg-[#C94C4C]/10 animate-pulse text-[#E0655F]'
            )}
            aria-label={isConnected ? 'Langsung' : 'Menghubungkan ulang'}
          >
            {isConnected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
          </span>
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Keluar layar penuh' : 'Layar penuh'}
            className="rounded-sm bg-[#2C2923] p-2 text-[#C89B6D] transition-colors hover:bg-[#3A362E] focus-visible:ring-3 focus-visible:ring-[#C58B2A]/50 outline-none"
          >
            {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 gap-4 overflow-hidden bg-[#16140F] p-4 md:grid-cols-3 md:gap-6 md:p-6">
        {loadError && (
          <div className="md:col-span-3">
            <p
              role="status"
              className="flex items-center gap-2 rounded-sm border border-[#C94C4C]/30 bg-[#C94C4C]/10 px-4 py-3 text-sm font-medium text-[#E0655F]"
            >
              <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
              {loadError}
            </p>
          </div>
        )}
        <div className="flex flex-col overflow-hidden rounded-lg border border-[#2C2923] bg-[#1A1814]">
          <div className="flex items-center justify-between border-b border-[#2C2923] bg-[#201D18] p-4">
            <h2 className="text-lg font-bold tracking-wide text-[#F7F5F0]">BARU / TERKONFIRMASI</h2>
            <div className="rounded-sm bg-[#2C2923] px-3 py-1 text-sm font-bold text-[#F7F5F0]">
              {newOrders.length}
            </div>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {newOrders.map(order => (
              <KitchenCard
                key={order.id}
                order={order}
                onStatusChangeOptimistic={handleOptimisticUpdate}
                onRefreshRequested={() => void refreshOrders(supabaseRef.current)}
              />
            ))}
            {newOrders.length === 0 && (
              <div className="flex h-full items-center justify-center text-lg font-medium text-[#6E665A]">
                Tidak ada pesanan baru
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col overflow-hidden rounded-lg border border-[#2C2923] bg-[#1A1814]">
          <div className="flex items-center justify-between border-b border-[#2C2923] bg-[#C58B2A]/10 p-4">
            <h2 className="text-lg font-bold tracking-wide text-[#D9A441]">DIPROSES</h2>
            <div className="rounded-sm bg-[#C58B2A] px-3 py-1 text-sm font-bold text-[#16140F]">
              {preparingOrders.length}
            </div>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {preparingOrders.map(order => (
              <KitchenCard
                key={order.id}
                order={order}
                onStatusChangeOptimistic={handleOptimisticUpdate}
                onRefreshRequested={() => void refreshOrders(supabaseRef.current)}
              />
            ))}
            {preparingOrders.length === 0 && (
              <div className="flex h-full items-center justify-center text-lg font-medium text-[#6E665A]">
                Dapur kosong
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col overflow-hidden rounded-lg border border-[#2C2923] bg-[#1A1814]">
          <div className="flex items-center justify-between border-b border-[#2C2923] bg-[#2E8B57]/10 p-4">
            <h2 className="text-lg font-bold tracking-wide text-[#6FBF8F]">SIAP</h2>
            <div className="rounded-sm bg-[#2E8B57] px-3 py-1 text-sm font-bold text-[#F7F5F0]">
              {readyOrders.length}
            </div>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {readyOrders.map(order => (
              <KitchenCard
                key={order.id}
                order={order}
                onStatusChangeOptimistic={handleOptimisticUpdate}
                onRefreshRequested={() => void refreshOrders(supabaseRef.current)}
              />
            ))}
            {readyOrders.length === 0 && (
              <div className="flex h-full items-center justify-center text-lg font-medium text-[#6E665A]">
                Tidak ada pesanan menunggu
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
