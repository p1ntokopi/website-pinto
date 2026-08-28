import { createClient } from '@/lib/supabase/server'
import { getSessionToken } from '@/lib/ordering/session'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { CheckCircle2, Clock } from 'lucide-react'
import { Metadata } from 'next'

import { OrderStatusTimeline } from '@/components/ordering/order-status-timeline'
import { PaymentSection, PaymentInfo } from '@/components/ordering/payment-section'
import { OrderReceipt } from '@/components/ordering/order-receipt'
import { getAppSettings } from '@/lib/settings'
import { Button } from '@/components/ui/button'
import { OrderingHeader } from '@/components/ordering/ordering-header'

export const metadata: Metadata = {
  title: 'Status Pesanan - Pinto',
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
    status: 'PENDING_PAYMENT' | 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED'
    total: number
    payment: PaymentInfo | null
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

  const isAwaitingPayment = order.status === 'PENDING_PAYMENT'
  const settings = await getAppSettings()

  return (
    <div className="min-h-screen bg-background pb-32">
      <OrderingHeader
        backHref={`/t/${resolvedParams.slug}/menu`}
        title={`Pesanan #${order.order_number}`}
      />

      <main className="mx-auto max-w-2xl space-y-6 p-4 pt-6">
        <div className="border border-border/60 bg-white p-6 text-center">
          {isAwaitingPayment ? (
            <>
              <Clock className="mx-auto mb-3 h-12 w-12 text-warning" />
              <h1 className="text-xl font-bold text-ink">Menunggu Pembayaran</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Selesaikan pembayaran di bawah ini untuk mengirim pesanan ke dapur.
              </p>
            </>
          ) : (
            <>
              <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-success" />
              <h1 className="text-xl font-bold text-ink">Pesanan Diterima</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Pesanan Anda telah dikirim ke dapur.
              </p>
            </>
          )}
          <div className="mt-4 inline-flex rounded-full bg-muted px-4 py-1.5 text-sm font-semibold">
            Meja {table.table_number}
          </div>

          <div className="mt-6">
            <OrderStatusTimeline initialStatus={order.status} orderId={order.id} />
          </div>
        </div>

        <div className="flex justify-center">
          <OrderReceipt
            orderNumber={order.order_number}
            tableNumber={table.table_number}
            items={order.items}
            total={order.total}
            paymentStatus={order.payment?.status ?? null}
            business={{
              name: settings.businessName,
              tagline: settings.tagline,
              website: settings.website,
              footerMessage: settings.footerMessage,
            }}
          />
        </div>

        <div className="border border-border/60 bg-white p-6">
          <h2 className="mb-4 text-lg font-bold">Pembayaran</h2>

          <Suspense fallback={null}>
            <PaymentSection
              tableSlug={resolvedParams.slug}
              orderId={order.id}
              orderNumber={order.order_number}
              orderStatus={order.status}
              total={order.total}
              payment={order.payment}
            />
          </Suspense>
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
