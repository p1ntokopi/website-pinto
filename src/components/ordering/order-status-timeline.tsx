'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { CheckCircle2, Clock, Coffee, Package, Check, TriangleAlert } from 'lucide-react'

type OrderStatus = 'PENDING_PAYMENT' | 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED'

const STATUS_STEPS: { id: OrderStatus, label: string, icon: React.ElementType }[] = [
  { id: 'PENDING', label: 'Pesanan Diterima', icon: Clock },
  { id: 'CONFIRMED', label: 'Terkonfirmasi', icon: CheckCircle2 },
  { id: 'PREPARING', label: 'Disiapkan', icon: Coffee },
  { id: 'READY', label: 'Siap', icon: Package },
  { id: 'COMPLETED', label: 'Selesai', icon: Check },
]

export function OrderStatusTimeline({ initialStatus, orderId }: { initialStatus: OrderStatus, orderId: string }) {
  const [status, setStatus] = useState<OrderStatus>(initialStatus)

  useEffect(() => {
    // Setup Supabase Realtime subscription
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const channel = supabase
      .channel(`order_tracking_${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          if (payload.new && payload.new.status) {
            setStatus(payload.new.status as OrderStatus)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId])

  if (status === 'CANCELLED') {
    return (
      <div className="bg-destructive/10 text-destructive p-4 rounded-xl text-center">
        <p className="font-semibold">Pesanan Dibatalkan</p>
        <p className="text-sm opacity-80 mt-1">Silakan hubungi staf untuk detail.</p>
      </div>
    )
  }

  if (status === 'PENDING_PAYMENT') {
    return (
      <div className="bg-warning/10 text-warning p-4 rounded-xl text-center">
        <TriangleAlert className="mx-auto mb-2 h-8 w-8" />
        <p className="font-semibold">Menunggu Pembayaran</p>
        <p className="text-sm opacity-80 mt-1">
          Pesanan belum dikirim ke dapur hingga pembayaran selesai.
        </p>
      </div>
    )
  }

  const currentIndex = STATUS_STEPS.findIndex(s => s.id === status)

  return (
    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
      {STATUS_STEPS.map((step, index) => {
        const isCompleted = index < currentIndex
        const isCurrent = index === currentIndex
        const Icon = step.icon

        return (
          <div key={step.id} className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active`}>
            {/* Icon */}
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 transition-colors duration-300 ${
              isCompleted ? 'bg-primary text-primary-foreground' :
              isCurrent ? 'bg-primary text-primary-foreground animate-pulse' :
              'bg-muted text-muted-foreground'
            }`}>
              <Icon className="w-4 h-4" />
            </div>
            
            {/* Content */}
            <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border/50 shadow-sm transition-colors duration-300 ${
              isCurrent ? 'bg-white border-primary/20 shadow-md' : 'bg-muted/30'
            }`}>
              <div className="flex items-center justify-between space-x-2">
                <div className={`font-semibold ${isCurrent ? 'text-primary' : isCompleted ? 'text-ink' : 'text-muted-foreground'}`}>
                  {step.label}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
