import { createClient } from '@/lib/supabase/server'
import { OrdersClient } from '@/components/admin/orders/orders-client'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Manajemen Pesanan - P1NTO Admin',
}

export default async function OrdersPage() {
  const supabase = await createClient()

  // Initial fetch for today's orders (or recent active orders)
  // We'll fetch orders from the last 24 hours to keep the initial payload reasonable
  const oneDayAgo = new Date(new Date().getTime() - 24 * 60 * 60 * 1000).toISOString()

  const { data: initialOrders } = await supabase
    .from("orders")
    .select(`
      id, order_number, order_type, fulfillment_type, subtotal, total, status, 
      customer_name, created_at,
      table:tables(id, table_number)
    `)
    .gte("created_at", oneDayAgo)
    .order("created_at", { ascending: false })

  // Normalize the to-one relation (Supabase returns it as an array)
  const orders = (initialOrders || []).map((order) => ({
    ...order,
    table: Array.isArray(order.table) ? order.table[0] ?? null : order.table,
  }))

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-coffee">
          Operasional
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">
          Pesanan
        </h1>
        <p className="mt-2 text-sm text-muted-text">
          Kelola alur kerja operasional hari ini.
        </p>
      </div>

      <OrdersClient initialOrders={orders || []} />
    </div>
  )
}
