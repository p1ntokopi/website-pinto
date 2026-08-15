import { useState, useEffect } from 'react'
import { OrderStatus } from '@/lib/orders/status-machine'
import { KitchenOrder } from '@/lib/orders/kitchen-types'
import { updateOrderStatus } from '@/app/admin/(dashboard)/orders/actions'
import { Loader2, Clock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KitchenCardProps {
  order: KitchenOrder
  onStatusChangeOptimistic: (orderId: string, newStatus: OrderStatus) => void
}

export function KitchenCard({ order, onStatusChangeOptimistic }: KitchenCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [elapsed, setElapsed] = useState('')
  const [isLate, setIsLate] = useState(false)

  // Calculate elapsed time
  useEffect(() => {
    const updateTime = () => {
      const now = new Date().getTime()
      const created = new Date(order.created_at).getTime()
      const diffMins = Math.floor((now - created) / 60000)

      if (diffMins < 1) setElapsed('< 1 mnt')
      else setElapsed(`${diffMins} mnt`)

      if (diffMins >= 15) setIsLate(true)
      else setIsLate(false)
    }

    updateTime()
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [order.created_at])

  const handleAction = async (targetStatus: OrderStatus) => {
    setIsUpdating(true)
    onStatusChangeOptimistic(order.id, targetStatus)

    const res = await updateOrderStatus(order.id, targetStatus)
    if (res?.error) {
      console.error(res.error)
    }

    setIsUpdating(false)
  }

  let actionButton = null

  if (order.status === 'PENDING' || order.status === 'CONFIRMED') {
    actionButton = (
      <button
        type="button"
        onClick={() => handleAction('PREPARING')}
        disabled={isUpdating}
        aria-label={`Mulai siapkan pesanan ${order.order_number}`}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 py-4 text-lg font-bold text-amber-950 transition-colors hover:bg-amber-400 disabled:opacity-60 focus-visible:ring-3 focus-visible:ring-amber-400/50 outline-none"
      >
        {isUpdating && <Loader2 className="h-5 w-5 animate-spin" />}
        MULAI SIAPKAN
      </button>
    )
  } else if (order.status === 'PREPARING') {
    actionButton = (
      <button
        type="button"
        onClick={() => handleAction('READY')}
        disabled={isUpdating}
        aria-label={`Tandai pesanan ${order.order_number} siap`}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 py-4 text-lg font-bold text-emerald-950 transition-colors hover:bg-emerald-400 disabled:opacity-60 focus-visible:ring-3 focus-visible:ring-emerald-400/50 outline-none"
      >
        {isUpdating && <Loader2 className="h-5 w-5 animate-spin" />}
        TANDAI SIAP
      </button>
    )
  }

  return (
    <div
      className={cn(
        'flex flex-col rounded-lg border-2 bg-zinc-900 p-5 shadow-xl transition-all',
        isLate && order.status !== 'READY'
          ? 'border-red-500/50 bg-red-950/20'
          : 'border-zinc-800'
      )}
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between border-b border-zinc-800 pb-4">
        <div>
          <h3 className="text-3xl font-black tracking-tight text-white">{order.order_number}</h3>
          {order.table && (
            <div className="mt-1 text-xl font-bold text-amber-500">
              MEJA {order.table.table_number}
            </div>
          )}
        </div>
        <div
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3 py-1 font-mono text-lg font-bold',
            isLate && order.status !== 'READY'
              ? 'bg-red-500/20 text-red-400'
              : 'bg-zinc-800 text-zinc-300'
          )}
        >
          <Clock className="h-4 w-4" />
          {elapsed}
        </div>
      </div>

      {/* Order Notes */}
      {order.notes && (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <p className="text-lg font-medium leading-snug text-amber-200">{order.notes}</p>
        </div>
      )}

      {/* Items */}
      <div className="flex-1 space-y-4">
        {order.items?.map((item) => (
          <div key={item.id} className="flex items-start gap-4">
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1 text-2xl font-black text-amber-500">
              {item.quantity}×
            </div>
            <div className="pt-1">
              <h4 className="mb-1.5 text-xl font-bold leading-none text-white">
                {item.product_name_snapshot}
              </h4>
              <div className="space-y-1 text-base font-medium leading-snug text-zinc-400">
                {item.variant_name_snapshot && <p>{item.variant_name_snapshot}</p>}
                {item.options?.map((opt, idx) => (
                  <p key={idx}>+ {opt.option_value_snapshot}</p>
                ))}
                {item.notes && (
                  <p className="mt-1 rounded bg-amber-500/10 px-2 py-1 italic text-amber-300">
                    Catatan: {item.notes}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action */}
      {actionButton}
    </div>
  )
}
