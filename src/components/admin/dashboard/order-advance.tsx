'use client'

import { useState } from 'react'
import { Loader2, ArrowRight } from 'lucide-react'
import { getAvailableTransitions, OrderStatus, UserRole } from '@/lib/orders/status-machine'
import { updateOrderStatus } from '@/app/admin/(dashboard)/orders/actions'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const PRIORITY: OrderStatus[] = ['CONFIRMED', 'PREPARING', 'READY', 'COMPLETED']

const LABELS: Partial<Record<OrderStatus, string>> = {
  CONFIRMED: 'Terima',
  PREPARING: 'Siapkan',
  READY: 'Tandai Siap',
  COMPLETED: 'Selesai',
}

interface OrderAdvanceProps {
  orderId: string
  currentStatus: OrderStatus
  role: UserRole
  onSuccess: (orderId: string, newStatus: OrderStatus) => void
}

export function OrderAdvance({ orderId, currentStatus, role, onSuccess }: OrderAdvanceProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const { toast } = useToast()

  const available = getAvailableTransitions(currentStatus, role)
  const target = PRIORITY.find((t) => available.includes(t))

  if (!target) return null

  const handleClick = async () => {
    setIsUpdating(true)
    const res = await updateOrderStatus(orderId, target)
    if (res?.success) {
      onSuccess(orderId, target)
    } else {
      toast({
        variant: 'destructive',
        title: 'Gagal memperbarui status',
        description: res?.error ?? 'Terjadi kesalahan tak terduga.',
      })
    }
    setIsUpdating(false)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isUpdating}
      className={cn(
        'inline-flex min-h-10 items-center justify-center gap-1.5 rounded-sm bg-coffee px-3.5 py-2 text-xs font-bold uppercase tracking-wide text-paper transition-colors hover:bg-ink disabled:opacity-60 focus-visible:ring-3 focus-visible:ring-ring/40 outline-none'
      )}
    >
      {isUpdating ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <ArrowRight className="h-3.5 w-3.5" />
      )}
      {LABELS[target]}
    </button>
  )
}