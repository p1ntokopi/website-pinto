'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { OrderStatus, UserRole, getAvailableTransitions } from '@/lib/orders/status-machine'
import { updateOrderStatus } from '@/app/admin/(dashboard)/orders/actions'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Loader2, AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

export function OrderActions({ orderId, currentStatus, userRole }: { orderId: string, currentStatus: OrderStatus, userRole: UserRole }) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  
  const router = useRouter()
  const { toast } = useToast()
  const availableTransitions = getAvailableTransitions(currentStatus, userRole)

  const handleStatusChange = async (targetStatus: OrderStatus, reason?: string) => {
    setIsUpdating(true)
    const result = await updateOrderStatus(orderId, targetStatus, reason)
    setIsUpdating(false)

    if (result.error) {
      toast({ variant: 'destructive', title: 'Pembaruan Gagal', description: result.error })
    } else {
      toast({ title: 'Pesanan Diperbarui', description: `Status diubah menjadi ${targetStatus}` })
      setCancelDialogOpen(false)
      // We don't necessarily need to router.refresh() if Realtime handles it, 
      // but to ensure the detail page is fresh, we do a refresh.
      router.refresh()
    }
  }

  if (availableTransitions.length === 0) {
    return null // No actions available for this role at this status
  }

  return (
    <div className="flex flex-wrap gap-2">
      {availableTransitions.includes('CONFIRMED') && (
        <Button onClick={() => handleStatusChange('CONFIRMED')} disabled={isUpdating}>
          {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Konfirmasi Pesanan'}
        </Button>
      )}

      {availableTransitions.includes('PREPARING') && (
        <Button onClick={() => handleStatusChange('PREPARING')} disabled={isUpdating} className="bg-warning text-white hover:bg-warning/90">
          {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Mulai Siapkan'}
        </Button>
      )}

      {availableTransitions.includes('READY') && (
        <Button onClick={() => handleStatusChange('READY')} disabled={isUpdating} className="bg-success text-white hover:bg-success/90">
          {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tandai Siap'}
        </Button>
      )}

      {availableTransitions.includes('COMPLETED') && (
        <Button onClick={() => handleStatusChange('COMPLETED')} disabled={isUpdating} variant="outline">
          {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Selesaikan Pesanan'}
        </Button>
      )}

      {availableTransitions.includes('CANCELLED') && (
        <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <DialogTrigger render={
            <Button variant="destructive">
              Batalkan Pesanan
            </Button>
          } />
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                Batalkan Pesanan
              </DialogTitle>
              <DialogDescription>
                Yakin ingin membatalkan pesanan ini? Tindakan ini tidak dapat dibatalkan.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-4">
              <label htmlFor="cancel-reason" className="text-sm font-medium">Alasan (Opsional)</label>
              <Textarea
                id="cancel-reason"
                placeholder="Mengapa pesanan ini dibatalkan?"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="resize-none"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>Pertahankan Pesanan</Button>
              <Button variant="destructive" onClick={() => handleStatusChange('CANCELLED', cancelReason)} disabled={isUpdating} className="rounded-xl">
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Konfirmasi Pembatalan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
