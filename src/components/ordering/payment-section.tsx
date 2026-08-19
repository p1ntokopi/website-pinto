'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { CheckCircle2, Clock, CreditCard, Loader2, TriangleAlert } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { initiatePayment } from '@/app/t/[slug]/actions'

export type PaymentInfo = {
  status: string | null
  payment_method: string | null
  payment_channel: string | null
  amount: number | null
  paid_at: string | null
  expired_at: string | null
}

export function PaymentSection({
  tableSlug,
  orderId,
  orderNumber,
  orderStatus,
  total,
  payment,
}: {
  tableSlug: string
  orderId: string
  orderNumber: string
  orderStatus: string
  total: number
  payment: PaymentInfo | null
}) {
  const searchParams = useSearchParams()
  const paymentResult = searchParams.get('payment')

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [liveStatus, setLiveStatus] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const channel = supabase
      .channel(`payment_section_${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          if (payload.new && payload.new.status) {
            setLiveStatus(payload.new.status as string)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId])

  const currentStatus = liveStatus ?? orderStatus
  const isAwaitingPayment = currentStatus === 'PENDING_PAYMENT'
  const isPaid = payment?.status === 'PAID' || (!isAwaitingPayment && currentStatus !== 'PENDING_PAYMENT')

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(price)

  const formatDate = (iso: string | null | undefined) => {
    if (!iso) return null
    return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }

  const handlePay = async () => {
    setIsLoading(true)
    setError(null)
    const result = await initiatePayment(tableSlug, orderNumber)
    setIsLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    if (result.paymentLinkUrl) {
      window.location.href = result.paymentLinkUrl
    }
  }

  const isExpired = payment?.status === 'EXPIRED' && isAwaitingPayment

  return (
    <div className="border border-border/60 bg-white p-6">
      <h2 className="mb-4 flex items-center gap-2 border-b border-border/60 pb-4 text-lg font-bold">
        <CreditCard className="h-5 w-5" />
        Pembayaran
      </h2>

      {paymentResult === 'success' && (
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-success/10 p-4 text-sm text-success">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>Pembayaran berhasil! Pesanan Anda sedang diproses.</span>
        </div>
      )}

      {paymentResult === 'cancelled' && isAwaitingPayment && (
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-warning/10 p-4 text-sm text-warning">
          <TriangleAlert className="h-5 w-5 shrink-0" />
          <span>Pembayaran dibatalkan. Anda dapat mencoba lagi kapan saja.</span>
        </div>
      )}

      {isPaid ? (
        <div className="flex items-center gap-3 rounded-xl bg-success/10 p-4 text-sm">
          <CheckCircle2 className="h-6 w-6 shrink-0 text-success" />
          <div>
            <p className="font-semibold text-success">Pembayaran Lunas</p>
            <p className="mt-0.5 text-muted-foreground">
              {payment?.payment_channel || payment?.payment_method || 'Pembayaran'}{' '}
              {formatPrice(payment?.amount ?? total)}
              {payment?.paid_at ? ` • ${formatDate(payment.paid_at)}` : ''}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-ink">Total Tagihan</p>
              <p className="text-sm text-muted-foreground">
                {isExpired ? 'Pembayaran sebelumnya kedaluwarsa.' : 'Selesaikan pembayaran untuk mengirim pesanan ke dapur.'}
              </p>
            </div>
            <span className="font-display text-2xl font-semibold tabular-nums text-ink">
              {formatPrice(total)}
            </span>
          </div>

          {payment?.expired_at && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Sesi pembayaran berlaku hingga {formatDate(payment.expired_at)}
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}

          <Button
            onClick={handlePay}
            disabled={isLoading}
            className="h-14 w-full bg-ink text-base font-semibold text-paper transition-transform duration-200 hover:bg-coffee active:scale-[0.99] disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                Menyiapkan Pembayaran...
              </>
            ) : isExpired ? (
              'Bayar Ulang'
            ) : (
              'Bayar Sekarang'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
