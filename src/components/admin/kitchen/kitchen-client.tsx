'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'
import { OrderStatus } from '@/lib/orders/status-machine'
import { KitchenCard } from './kitchen-card'
import { Maximize, Minimize, Wifi, WifiOff } from 'lucide-react'

export function KitchenClient({ initialOrders }: { initialOrders: Record<string, unknown>[] }) {
  const [orders, setOrders] = useState<Record<string, unknown>[]>(initialOrders)
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
            
            if (data && ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'].includes(data.status)) {
              setOrders(prev => [...prev, data])
              // Play notification sound if browser allows
              try {
                const audio = new Audio('/notification.mp3') // Placeholder path, can be ignored if file doesn't exist
                audio.play().catch(() => {})
              } catch (_) {}
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
      <header className="h-16 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-6">
          <h1 className="font-display text-2xl font-black tracking-tight text-white">
            P1NTO<span className="text-amber-500">KITCHEN</span>
          </h1>
          <div className="bg-zinc-950 px-4 py-1.5 rounded-lg border border-zinc-800 font-mono text-xl font-bold text-zinc-300">
            {currentTime}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <span className="flex items-center gap-2 text-emerald-500 font-medium text-sm bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                <Wifi className="w-4 h-4" /> LIVE
              </span>
            ) : (
              <span className="flex items-center gap-2 text-red-500 font-medium text-sm bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20 animate-pulse">
                <WifiOff className="w-4 h-4" /> RECONNECTING...
              </span>
            )}
          </div>
          <button 
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Board */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 p-6 overflow-hidden bg-zinc-950">
        {/* NEW Column */}
        <div className="flex flex-col bg-zinc-900/50 rounded-3xl border border-zinc-800/50 overflow-hidden">
          <div className="p-4 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900">
            <h2 className="font-bold text-xl text-zinc-300 tracking-wide">NEW / CONFIRMED</h2>
            <div className="bg-zinc-800 px-3 py-1 rounded-full text-sm font-bold text-white">
              {newOrders.length}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {newOrders.map(order => (
              <KitchenCard key={order.id} order={order} onStatusChangeOptimistic={handleOptimisticUpdate} />
            ))}
            {newOrders.length === 0 && (
              <div className="h-full flex items-center justify-center text-zinc-600 font-medium text-lg">
                No new orders
              </div>
            )}
          </div>
        </div>

        {/* PREPARING Column */}
        <div className="flex flex-col bg-zinc-900/50 rounded-3xl border border-zinc-800/50 overflow-hidden">
          <div className="p-4 border-b border-zinc-800/50 flex justify-between items-center bg-amber-500/10">
            <h2 className="font-bold text-xl text-amber-500 tracking-wide">PREPARING</h2>
            <div className="bg-amber-500 text-amber-950 px-3 py-1 rounded-full text-sm font-bold">
              {preparingOrders.length}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {preparingOrders.map(order => (
              <KitchenCard key={order.id} order={order} onStatusChangeOptimistic={handleOptimisticUpdate} />
            ))}
            {preparingOrders.length === 0 && (
              <div className="h-full flex items-center justify-center text-zinc-600 font-medium text-lg">
                Kitchen is clear
              </div>
            )}
          </div>
        </div>

        {/* READY Column */}
        <div className="flex flex-col bg-zinc-900/50 rounded-3xl border border-zinc-800/50 overflow-hidden">
          <div className="p-4 border-b border-zinc-800/50 flex justify-between items-center bg-emerald-500/10">
            <h2 className="font-bold text-xl text-emerald-500 tracking-wide">READY</h2>
            <div className="bg-emerald-500 text-emerald-950 px-3 py-1 rounded-full text-sm font-bold">
              {readyOrders.length}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {readyOrders.map(order => (
              <KitchenCard key={order.id} order={order} onStatusChangeOptimistic={handleOptimisticUpdate} />
            ))}
            {readyOrders.length === 0 && (
              <div className="h-full flex items-center justify-center text-zinc-600 font-medium text-lg">
                No orders waiting
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
