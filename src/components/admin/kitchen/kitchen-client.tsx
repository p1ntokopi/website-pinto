'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'
import { OrderStatus } from '@/lib/orders/status-machine'
import { KitchenOrder } from '@/lib/orders/kitchen-types'
import { KitchenCard } from './kitchen-card'
import { Maximize, Minimize, Wifi, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { playNewOrderSound } from '@/lib/notifications/sound'
import { getNotificationsEnabled, getSoundEnabled } from '@/lib/notifications/preferences'

export function KitchenClient({ initialOrders }: { initialOrders: KitchenOrder[] }) {
  const [orders, setOrders] = useState<KitchenOrder[]>(initialOrders)
  const [isConnected, setIsConnected] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentTime, setCurrentTime] = useState('')

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

  // Realtime
  useEffect(() => {
    const supabase = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const channel = supabase.channel('kitchen_orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data } = await supabase
              .from('orders')
              .select(`
                id, order_number, status, created_at, notes,
                table:tables(table_number),
                items:order_items(
                  id, quantity, product_name_snapshot, variant_name_snapshot, notes,
                  options:order_item_options(option_value_snapshot)
                )
              `)
              .eq('id', payload.new.id)
              .single()

            const order = data as unknown as KitchenOrder | null
            if (order && ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'].includes(order.status)) {
              setOrders(prev => [...prev, order])
              // Play the synthesized chime when notifications are enabled.
              if (getNotificationsEnabled() && getSoundEnabled()) {
                playNewOrderSound()
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            const newStatus = payload.new.status
            if (['COMPLETED', 'CANCELLED'].includes(newStatus)) {
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
        setIsConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleOptimisticUpdate = (orderId: string, newStatus: OrderStatus) => {
    if (['COMPLETED', 'CANCELLED'].includes(newStatus)) {
      setOrders(prev => prev.filter(o => o.id !== orderId))
    } else {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
    }
  }

  // Filter columns
  const newOrders = orders.filter(o => o.status === 'PENDING' || o.status === 'CONFIRMED')
  const preparingOrders = orders.filter(o => o.status === 'PREPARING')
  const readyOrders = orders.filter(o => o.status === 'READY')

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
        <div className="flex flex-col overflow-hidden rounded-lg border border-[#2C2923] bg-[#1A1814]">
          <div className="flex items-center justify-between border-b border-[#2C2923] bg-[#201D18] p-4">
            <h2 className="text-lg font-bold tracking-wide text-[#F7F5F0]">BARU / TERKONFIRMASI</h2>
            <div className="rounded-sm bg-[#2C2923] px-3 py-1 text-sm font-bold text-[#F7F5F0]">
              {newOrders.length}
            </div>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {newOrders.map(order => (
              <KitchenCard key={order.id} order={order} onStatusChangeOptimistic={handleOptimisticUpdate} />
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
              <KitchenCard key={order.id} order={order} onStatusChangeOptimistic={handleOptimisticUpdate} />
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
              <KitchenCard key={order.id} order={order} onStatusChangeOptimistic={handleOptimisticUpdate} />
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
