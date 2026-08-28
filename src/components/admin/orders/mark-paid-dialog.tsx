'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Banknote, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { markOrderPaid, type ManualPaymentMethod } from '@/app/admin/(dashboard)/orders/actions'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const METHOD_OPTIONS: { value: ManualPaymentMethod; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'TRANSFER', label: 'Transfer' },
  { value: 'EWALLET', label: 'E-Wallet' },
  { value: 'OTHER', label: 'Lainnya' },
]

/**
 * Cashier flow: record a manual payment (provider 'MANUAL') so an order can
 * become paid without Xendit — cash at the counter, transfer, etc.
 */
export function MarkPaidDialog({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false)
  const [method, setMethod] = useState<ManualPaymentMethod>('CASH')
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  async function submit() {
    setSubmitting(true)
    const result = await markOrderPaid(orderId, method)
    setSubmitting(false)

    if (result.error) {
      toast({ variant: 'destructive', title: 'Gagal', description: result.error })
      return
    }
    toast({ title: 'Pembayaran Tercatat', description: 'Pesanan ditandai lunas.' })
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button variant="outline" className="border-success/30 bg-success/5 text-success hover:bg-success/10 hover:text-success">
          <Banknote className="h-4 w-4" />
          Tandai Lunas
        </Button>
      } />
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-success" />
            Tandai Lunas
          </DialogTitle>
          <DialogDescription>
            Catat pembayaran manual untuk pesanan ini. Pembayaran disimpan sebagai provider
            MANUAL — bukan Xendit.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-text">
            Metode pembayaran
          </p>
          <div role="group" aria-label="Metode pembayaran" className="flex flex-wrap gap-2">
            {METHOD_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={method === option.value}
                onClick={() => setMethod(option.value)}
                className={cn(
                  'min-h-11 rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:ring-3 focus-visible:ring-ring/40 outline-none',
                  method === option.value
                    ? 'border-coffee bg-coffee text-paper'
                    : 'border-border-custom bg-paper text-muted-text hover:text-ink',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            Batal
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
            Catat Pembayaran
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
