import { createClient } from '@/lib/supabase/server'
import { getSessionToken } from '@/lib/ordering/session'
import { redirect, notFound } from 'next/navigation'
import { OrderStatusTimeline } from '@/components/ordering/order-status-timeline'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Order Status - P1NTO',
}

export default async function OrderTrackingPage({ params }: { params: { slug: string, orderNumber: string } }) {
  const resolvedParams = await params
  const supabase = await createClient()
  const sessionToken = await getSessionToken()

  // Verify Table & Session
  const { data: table } = await supabase
    .from('tables')
    .select('id, table_number')
    .eq('slug', resolvedParams.slug)
    .single()

  if (!table || !sessionToken) {
    redirect(`/t/${resolvedParams.slug}`)
  }

  const { data: session } = await supabase
    .from('dining_sessions')
    .select('id')
    .eq('session_token', sessionToken)
    .eq('table_id', table.id)
    .single()

  if (!session) {
    redirect(`/t/${resolvedParams.slug}`)
  }

  // Fetch Order
  // IMPORTANT: We filter by dining_session_id to ensure customer can only see orders from their current secure session
  const { data: order } = await supabase
    .from('orders')
    .select(`
      id, order_number, status, total,
      items:order_items(
        id, quantity, product_name_snapshot, variant_name_snapshot, unit_price, subtotal, notes,
        options:order_item_options(option_value_snapshot, price_adjustment)
      )
    `)
    .eq('order_number', resolvedParams.orderNumber)
    .eq('dining_session_id', session.id)
    .single()

  if (!order) {
    notFound()
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(price)
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-md mx-auto px-4 h-[60px] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-display font-bold text-lg tracking-widest uppercase text-primary leading-none">P1NTO</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Coffee</span>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-8 mt-4">
        
        {/* Order Header */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-border/50 text-center">
          <h1 className="text-xl font-bold mb-1">Order Received</h1>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">#{order.order_number}</p>
          <div className="inline-block px-4 py-1.5 bg-muted rounded-full text-sm font-semibold mb-6">
            Table {table.table_number}
          </div>
          
          <OrderStatusTimeline initialStatus={order.status} orderId={order.id} />
        </div>

        {/* Receipt */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-border/50">
          <h2 className="font-bold text-lg mb-4 border-b pb-4">Order Summary</h2>
          
          <div className="space-y-4">
            {order.items?.map(item => (
              <div key={item.id} className="flex gap-4">
                <div className="font-medium text-muted-foreground">{item.quantity}x</div>
                <div className="flex-grow">
                  <div className="flex justify-between font-medium">
                    <span>{item.product_name_snapshot}</span>
                    <span>{formatPrice(item.subtotal)}</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    {item.variant_name_snapshot && <p>• {item.variant_name_snapshot}</p>}
                    {item.options?.map((opt, i) => (
                      <p key={i}>• {opt.option_value_snapshot}</p>
                    ))}
                    {item.notes && <p className="italic mt-1">&quot;{item.notes}&quot;</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-dashed border-border/80 space-y-2">
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-muted/50 rounded-xl flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Payment Status</span>
            <span className="font-semibold text-amber-600">PENDING</span>
          </div>
        </div>

        <div className="pt-4">
          <Button render={<Link href={`/t/${resolvedParams.slug}/order`} />} variant="outline" className="w-full h-14 rounded-2xl shadow-sm">
            Make New Order
          </Button>
        </div>
      </main>
    </div>
  )
}
