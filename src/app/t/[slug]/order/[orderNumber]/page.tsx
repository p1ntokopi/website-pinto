import { createClient } from '@/lib/supabase/server'
import { getSessionToken } from '@/lib/ordering/session'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { Metadata } from 'next'

import { OrderStatusTimeline } from '@/components/ordering/order-status-timeline'
import { Button } from '@/components/ui/button'
import { OrderingHeader } from '@/components/ordering/ordering-header'

export const metadata: Metadata = {
  title: 'Status Pesanan - P1NTO',
}

export default async function OrderTrackingPage({
  params,
}: {
  params: { slug: string; orderNumber: string }
}) {
  const resolvedParams = await params
  const supabase = await createClient()
  const sessionToken = await getSessionToken()

  const { data: table } = await supabase
    .from('tables')
    .select('id, table_number')
    .eq('slug', resolvedParams.slug)
    .single()

  if (!table || !sessionToken) {
    redirect(`/t/${resolvedParams.slug}`)
  }

  const { data: result } = await supabase.rpc('get_order_tracking', {
    p_table_slug: resolvedParams.slug,
    p_session_token: sessionToken,
    p_order_number: resolvedParams.orderNumber,
  })

  if (!result || !result.success || !result.order) {
    notFound()
  }

  const order = result.order as {
    id: string
    order_number: string
    status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED'
    total: number
    items: {
      id: string
      quantity: number
      product_name_snapshot: string
      variant_name_snapshot: string | null
      unit_price: number
      subtotal: number
      notes: string | null
      options: {
        option_value_snapshot: string
        price_adjustment: number
      }[]
    }[]
  }

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(price)

  return (
    <div className="min-h-screen bg-background pb-32">
      <OrderingHeader
        backHref={`/t/${resolvedParams.slug}/menu`}
        title={`Pesanan #${order.order_number}`}
      />

      <main className="mx-auto max-w-2xl space-y-6 p-4 pt-6">
        <div className="border border-border/60 bg-white p-6 text-center">
          <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-success" />
          <h1 className="text-xl font-bold text-ink">Pesanan Diterima</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pesanan Anda telah dikirim ke dapur.
          </p>
          <div className="mt-4 inline-flex rounded-full bg-muted px-4 py-1.5 text-sm font-semibold">
            Meja {table.table_number}
          </div>

          <div className="mt-6">
            <OrderStatusTimeline initialStatus={order.status} orderId={order.id} />
          </div>
        </div>

        <div className="border border-border/60 bg-white p-6">
          <h2 className="mb-4 border-b border-border/60 pb-4 text-lg font-bold">Ringkasan Pesanan</h2>

          <div className="space-y-4">
            {order.items?.map((item) => (
              <div key={item.id} className="flex gap-4">
                <div className="font-medium text-muted-foreground">{item.quantity}x</div>
                <div className="flex-grow">
                  <div className="flex justify-between font-medium">
                    <span>{item.product_name_snapshot}</span>
                    <span>{formatPrice(item.subtotal)}</span>
                  </div>
                  <div className="mt-0.5 text-sm text-muted-foreground">
                    {item.variant_name_snapshot && <p>• {item.variant_name_snapshot}</p>}
                    {item.options?.map((opt, i) => (
                      <p key={i}>• {opt.option_value_snapshot}</p>
                    ))}
                    {item.notes && <p className="mt-1 italic">&quot;{item.notes}&quot;</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-2 border-t border-dashed border-border/80 pt-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between rounded-xl bg-muted/50 p-4 text-sm">
            <span className="text-muted-foreground">Status Pembayaran</span>
            <span className="font-semibold text-warning">PENDING</span>
          </div>
        </div>

        <div className="pt-2">
          <Button
            render={<Link href={`/t/${resolvedParams.slug}/menu`} />}
            variant="outline"
            className="h-14 w-full"
          >
            Buat Pesanan Baru
          </Button>
        </div>
      </main>
    </div>
  )
}
