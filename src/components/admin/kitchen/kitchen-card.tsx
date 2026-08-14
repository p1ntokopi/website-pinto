import { useState, useEffect } from 'react'
import { OrderStatus } from '@/lib/orders/status-machine'
import { updateOrderStatus } from '@/app/admin/(dashboard)/orders/actions'
import { Loader2, Clock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KitchenCardProps {
  order: Record<string, unknown>
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
      
      if (diffMins < 1) setElapsed('< 1 min')
      else setElapsed(`${diffMins} min`)

      if (diffMins >= 15) setIsLate(true)
      else setIsLate(false)
    }

    updateTime()
    const interval = setInterval(updateTime, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [order.created_at])

  const handleAction = async (targetStatus: OrderStatus) => {
    setIsUpdating(true)
    onStatusChangeOptimistic(order.id, targetStatus) // Optimistic update
    
    const res = await updateOrderStatus(order.id, targetStatus)
    if (res?.error) {
      // Revert optimism by fetching or just letting Realtime fix it eventually
      console.error(res.error)
      // Ideally, trigger a refresh here if it fails
    }
    
    setIsUpdating(false)
  }

  let actionButton = null

  if (order.status === 'PENDING' || order.status === 'CONFIRMED') {
    actionButton = (
      <button 
        onClick={() => handleAction('PREPARING')}
        disabled={isUpdating}
        className="w-full py-4 mt-4 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-lg rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {isUpdating && <Loader2 className="w-5 h-5 animate-spin" />}
        START PREPARING
      </button>
    )
  } else if (order.status === 'PREPARING') {
    actionButton = (
      <button 
        onClick={() => handleAction('READY')}
        disabled={isUpdating}
        className="w-full py-4 mt-4 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-lg rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {isUpdating && <Loader2 className="w-5 h-5 animate-spin" />}
        MARK READY
      </button>
    )
  }

  return (
    <div className={cn(
      "bg-zinc-900 border-2 rounded-2xl p-5 flex flex-col shadow-xl transition-all",
      isLate && order.status !== 'READY' ? "border-red-500/50 bg-red-950/20" : "border-zinc-800"
    )}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4 pb-4 border-b border-zinc-800">
        <div>
          <h3 className="text-3xl font-black text-white tracking-tight">{order.order_number}</h3>
          {order.table && (
            <div className="text-xl font-bold text-amber-500 mt-1">TABLE {order.table.table_number}</div>
          )}
        </div>
        <div className={cn(
          "flex items-center gap-1.5 font-mono text-lg font-bold px-3 py-1 rounded-lg",
          isLate && order.status !== 'READY' ? "bg-red-500/20 text-red-400" : "bg-zinc-800 text-zinc-300"
        )}>
          <Clock className="w-4 h-4" />
          {elapsed}
        </div>
      </div>

      {/* Order Notes */}
      {order.notes && (
        <div className="mb-4 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-amber-200 font-medium text-lg leading-snug">{order.notes}</p>
        </div>
      )}

      {/* Items */}
      <div className="flex-1 space-y-4">
        {(order.items as Record<string, unknown>[])?.map((item: Record<string, unknown>) => (
          <div key={item.id as string} className="flex gap-4 items-start">
            <div className="text-2xl font-black text-amber-500 bg-zinc-950 px-3 py-1 rounded-lg border border-zinc-800">
              {item.quantity as number}×
            </div>
            <div className="pt-1">
              <h4 className="text-xl font-bold text-white leading-none mb-1.5">{item.product_name_snapshot as string}</h4>
              <div className="text-zinc-400 font-medium text-base leading-snug space-y-1">
                {item.variant_name_snapshot && <p>{item.variant_name_snapshot as string}</p>}
                {(item.options as Record<string, unknown>[])?.map((opt: Record<string, unknown>, idx: number) => (
                  <p key={idx}>+ {opt.option_value_snapshot as string}</p>
                ))}
                {item.notes && (
                  <p className="text-amber-300 italic mt-1 bg-amber-500/10 px-2 py-1 rounded">Note: {item.notes as string}</p>
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
