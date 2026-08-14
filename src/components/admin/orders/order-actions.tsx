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
      toast({ variant: 'destructive', title: 'Update Failed', description: result.error })
    } else {
      toast({ title: 'Order Updated', description: `Status changed to ${targetStatus}` })
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
        <Button onClick={() => handleStatusChange('CONFIRMED')} disabled={isUpdating} className="rounded-xl bg-blue-600 hover:bg-blue-700">
          {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Order'}
        </Button>
      )}
      
      {availableTransitions.includes('PREPARING') && (
        <Button onClick={() => handleStatusChange('PREPARING')} disabled={isUpdating} className="rounded-xl bg-purple-600 hover:bg-purple-700">
          {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Start Preparing'}
        </Button>
      )}
      
      {availableTransitions.includes('READY') && (
        <Button onClick={() => handleStatusChange('READY')} disabled={isUpdating} className="rounded-xl bg-indigo-600 hover:bg-indigo-700">
          {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Mark as Ready'}
        </Button>
      )}
      
      {availableTransitions.includes('COMPLETED') && (
        <Button onClick={() => handleStatusChange('COMPLETED')} disabled={isUpdating} className="rounded-xl bg-emerald-600 hover:bg-emerald-700">
          {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Complete Order'}
        </Button>
      )}

      {availableTransitions.includes('CANCELLED') && (
        <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <DialogTrigger render={
            <Button variant="destructive" size="sm" className="w-full">
              Cancel Order
            </Button>
          } />
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                Cancel Order
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel this order? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-4">
              <label className="text-sm font-medium">Reason (Optional)</label>
              <Textarea 
                placeholder="Why is this order being cancelled?"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="resize-none rounded-xl"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCancelDialogOpen(false)} className="rounded-xl">Keep Order</Button>
              <Button variant="destructive" onClick={() => handleStatusChange('CANCELLED', cancelReason)} disabled={isUpdating} className="rounded-xl">
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Confirm Cancellation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
