import { useState, useEffect } from 'react'
import {
  normalizeOrderStatus,
  type CanonicalOrderStatus,
} from '@/lib/orders/status-machine'
import { KitchenOrder } from '@/lib/orders/kitchen-types'
import { updateOrderStatus } from '@/app/admin/(dashboard)/orders/actions'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Clock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KitchenCardProps {
  order: KitchenOrder
  onStatusChangeOptimistic: (orderId: string, newStatus: CanonicalOrderStatus) => void
  onRefreshRequested: () => void
}

export function KitchenCard({
  order,
  onStatusChangeOptimistic,
  onRefreshRequested,
}: KitchenCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [elapsed, setElapsed] = useState('')
  const [isLate, setIsLate] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const updateTime = () => {
      const now = new Date().getTime()
      const created = new Date(order.created_at).getTime()
      const diffMins = Math.floor((now - created) / 60000)

      if (diffMins < 1) setElapsed('< 1 mnt')
      else setElapsed(`${diffMins} mnt`)

      setIsLate(diffMins >= 15)
    }

    updateTime()
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [order.created_at])

  const canonicalStatus = normalizeOrderStatus(order.status)

  const handleAction = async (targetStatus: CanonicalOrderStatus) => {
    setIsUpdating(true)
    onStatusChangeOptimistic(order.id, targetStatus)

    const res = await updateOrderStatus(order.id, targetStatus)
    if (res?.error) {
      toast({
        variant: 'destructive',
        title: 'Gagal memperbarui status',
        description: res.error,
      })
      // Reconcile from the database: a competing transition may already have won.
      onRefreshRequested()
    }

    setIsUpdating(false)
  }

  let actionButton = null

  if (canonicalStatus === 'NEW') {
    actionButton = (
      <button
        type="button"
        onClick={() => handleAction('PREPARING')}
        disabled={isUpdating}
        aria-label={`Mulai siapkan pesanan ${order.order_number}`}
        className="mt-4 flex w-full min-h-14 items-center justify-center gap-2 rounded-panel bg-warning py-4 text-lg font-bold text-ink transition-colors hover:bg-warning/90 disabled:opacity-60 focus-visible:ring-3 focus-visible:ring-warning/50 outline-none"
      >
        {isUpdating && <Loader2 className="h-5 w-5 animate-spin" />}
        MULAI SIAPKAN
      </button>
    )
  } else if (canonicalStatus === 'PREPARING') {
    actionButton = (
      <button
        type="button"
        onClick={() => handleAction('READY')}
        disabled={isUpdating}
        aria-label={`Tandai pesanan ${order.order_number} siap`}
        className="mt-4 flex w-full min-h-14 items-center justify-center gap-2 rounded-panel bg-success py-4 text-lg font-bold text-kds-text transition-colors hover:bg-success/90 disabled:opacity-60 focus-visible:ring-3 focus-visible:ring-success/50 outline-none"
      >
        {isUpdating && <Loader2 className="h-5 w-5 animate-spin" />}
        TANDAI SIAP
      </button>
    )
  }

  return (
    <div
      className={cn(
        'flex flex-col rounded-panel border bg-kds-raised p-5',
        isLate && canonicalStatus !== 'READY'
          ? 'border-danger/50 bg-danger/10'
          : 'border-kds-border'
      )}
    >
      <div className="mb-4 flex items-start justify-between border-b border-kds-border pb-4">
        <div>
          <h3 className="text-3xl font-black tracking-tight text-kds-text">{order.order_number}</h3>
          {order.table && (
            <div className="mt-1 text-xl font-bold text-kds-accent">
              MEJA {order.table.table_number}
            </div>
          )}
        </div>
        <div
          className={cn(
            'flex items-center gap-1.5 rounded-panel px-3 py-1 font-mono text-lg font-bold',
            isLate && canonicalStatus !== 'READY'
              ? 'bg-danger/20 text-danger'
              : 'bg-kds-border text-kds-muted'
          )}
        >
          <Clock className="h-4 w-4" />
          {elapsed}
        </div>
      </div>

      {order.notes && (
        <div className="mb-4 flex items-start gap-3 rounded-panel border border-warning/30 bg-warning/10 p-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <p className="text-lg font-medium leading-snug text-warm">{order.notes}</p>
        </div>
      )}

      <div className="flex-1 space-y-4">
        {order.items?.map((item) => (
          <div key={item.id} className="flex items-start gap-4">
            <div className="rounded-panel border border-kds-border bg-kds-bg px-3 py-1 text-2xl font-black text-kds-accent">
              {item.quantity}×
            </div>
            <div className="pt-1">
              <h4 className="mb-1.5 text-xl font-bold leading-none text-kds-text">
                {item.product_name_snapshot}
              </h4>
              <div className="space-y-1 text-base font-medium leading-snug text-kds-muted">
                {item.variant_name_snapshot && <p>{item.variant_name_snapshot}</p>}
                {item.options?.map((opt, idx) => (
                  <p key={idx}>+ {opt.option_value_snapshot}</p>
                ))}
                {item.notes && (
                  <p className="mt-1 rounded-panel bg-warning/10 px-2 py-1 italic text-warm">
                    Catatan: {item.notes}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {actionButton}
    </div>
  )
}