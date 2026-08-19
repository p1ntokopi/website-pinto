import { useState, useEffect } from 'react'
import { OrderStatus } from '@/lib/orders/status-machine'
import { KitchenOrder } from '@/lib/orders/kitchen-types'
import { updateOrderStatus } from '@/app/admin/(dashboard)/orders/actions'
import { useToast } from '@/hooks/use-toast'
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

  const handleAction = async (targetStatus: OrderStatus) => {
    setIsUpdating(true)
    onStatusChangeOptimistic(order.id, targetStatus)

    const res = await updateOrderStatus(order.id, targetStatus)
    if (res?.error) {
      toast({
        variant: 'destructive',
        title: 'Gagal memperbarui status',
        description: res.error,
      })
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
        className="mt-4 flex w-full min-h-14 items-center justify-center gap-2 rounded-sm bg-[#C58B2A] py-4 text-lg font-bold text-[#16140F] transition-colors hover:bg-[#D9A441] disabled:opacity-60 focus-visible:ring-3 focus-visible:ring-[#C58B2A]/50 outline-none"
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
        className="mt-4 flex w-full min-h-14 items-center justify-center gap-2 rounded-sm bg-[#2E8B57] py-4 text-lg font-bold text-[#F7F5F0] transition-colors hover:bg-[#3A9C68] disabled:opacity-60 focus-visible:ring-3 focus-visible:ring-[#2E8B57]/50 outline-none"
      >
        {isUpdating && <Loader2 className="h-5 w-5 animate-spin" />}
        TANDAI SIAP
      </button>
    )
  }

  return (
    <div
      className={cn(
        'flex flex-col rounded-lg border bg-[#201D18] p-5',
        isLate && order.status !== 'READY'
          ? 'border-[#C94C4C]/50 bg-[#C94C4C]/10'
          : 'border-[#2C2923]'
      )}
    >
      <div className="mb-4 flex items-start justify-between border-b border-[#2C2923] pb-4">
        <div>
          <h3 className="text-3xl font-black tracking-tight text-[#F7F5F0]">{order.order_number}</h3>
          {order.table && (
            <div className="mt-1 text-xl font-bold text-[#C89B6D]">
              MEJA {order.table.table_number}
            </div>
          )}
        </div>
        <div
          className={cn(
            'flex items-center gap-1.5 rounded-sm px-3 py-1 font-mono text-lg font-bold',
            isLate && order.status !== 'READY'
              ? 'bg-[#C94C4C]/20 text-[#E0655F]'
              : 'bg-[#2C2923] text-[#A19B8F]'
          )}
        >
          <Clock className="h-4 w-4" />
          {elapsed}
        </div>
      </div>

      {order.notes && (
        <div className="mb-4 flex items-start gap-3 rounded-sm border border-[#C58B2A]/30 bg-[#C58B2A]/10 p-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#C58B2A]" />
          <p className="text-lg font-medium leading-snug text-[#E7C98F]">{order.notes}</p>
        </div>
      )}

      <div className="flex-1 space-y-4">
        {order.items?.map((item) => (
          <div key={item.id} className="flex items-start gap-4">
            <div className="rounded-sm border border-[#2C2923] bg-[#16140F] px-3 py-1 text-2xl font-black text-[#C89B6D]">
              {item.quantity}×
            </div>
            <div className="pt-1">
              <h4 className="mb-1.5 text-xl font-bold leading-none text-[#F7F5F0]">
                {item.product_name_snapshot}
              </h4>
              <div className="space-y-1 text-base font-medium leading-snug text-[#A19B8F]">
                {item.variant_name_snapshot && <p>{item.variant_name_snapshot}</p>}
                {item.options?.map((opt, idx) => (
                  <p key={idx}>+ {opt.option_value_snapshot}</p>
                ))}
                {item.notes && (
                  <p className="mt-1 rounded-sm bg-[#C58B2A]/10 px-2 py-1 italic text-[#E7C98F]">
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