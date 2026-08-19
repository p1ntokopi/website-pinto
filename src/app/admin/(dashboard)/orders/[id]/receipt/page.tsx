import { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { buildReceiptFromOrder } from '@/lib/receipt/receipt-service'
import type { ReceiptOrderInput, ReceiptPayment } from '@/lib/receipt/receipt-types'
import { ReceiptPrintView } from '@/components/admin/orders/receipt-print-view'

export const metadata: Metadata = {
  title: 'Cetak Struk - Pinto',
}

export default async function OrderReceiptPage({ params }: { params: { id: string } }) {
  const resolvedParams = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: order } = await supabase
    .from('orders')
    .select(`
      order_number, order_type, subtotal, tax, discount, total, notes, created_at,
      table:tables(table_number),
      items:order_items(
        quantity, product_name_snapshot, variant_name_snapshot, unit_price, subtotal, notes,
        options:order_item_options(option_value_snapshot, price_adjustment)
      )
    `)
    .eq('id', resolvedParams.id)
    .single()

  if (!order) notFound()

  const { data: paymentRow } = await supabase
    .from('payments')
    .select('status, payment_method, payment_channel')
    .eq('order_id', resolvedParams.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const payment: ReceiptPayment | null = paymentRow
    ? {
        method: paymentRow.payment_method,
        channel: paymentRow.payment_channel,
        status: paymentRow.status,
      }
    : null

  const table = Array.isArray(order.table) ? (order.table[0] ?? null) : order.table

  const receiptData = buildReceiptFromOrder(
    {
      order_number: order.order_number,
      subtotal: order.subtotal,
      tax: order.tax ?? 0,
      discount: order.discount ?? 0,
      total: order.total,
      notes: order.notes ?? null,
      created_at: order.created_at,
      table: table
        ? { table_number: table.table_number }
        : null,
      items: (order.items || []).map((item) => ({
        quantity: item.quantity,
        product_name_snapshot: item.product_name_snapshot,
        variant_name_snapshot: item.variant_name_snapshot ?? null,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
        notes: item.notes ?? null,
        options: (item.options || []).map((opt) => ({
          option_value_snapshot: opt.option_value_snapshot,
          price_adjustment: opt.price_adjustment,
        })),
      })),
    } as ReceiptOrderInput,
    payment
  )

  return <ReceiptPrintView orderId={resolvedParams.id} receiptData={receiptData} />
}