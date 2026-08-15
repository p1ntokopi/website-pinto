import { createClient } from '@/lib/supabase/server'
import { KitchenClient } from '@/components/admin/kitchen/kitchen-client'
import { KitchenOrder } from '@/lib/orders/kitchen-types'

export default async function KitchenPage() {
  const supabase = await createClient()

  // Fetch active orders for the KDS (only those that are operational)
  const { data: initialOrders } = await supabase
    .from('orders')
    .select(`
      id, order_number, status, created_at, notes,
      table:tables(table_number),
      items:order_items(
        id, quantity, product_name_snapshot, variant_name_snapshot, notes,
        options:order_item_options(option_value_snapshot)
      )
    `)
    .in('status', ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'])
    .order('created_at', { ascending: true })

  const orders: KitchenOrder[] = (initialOrders || []).map((order) => ({
    id: order.id,
    order_number: order.order_number,
    status: order.status,
    created_at: order.created_at,
    notes: order.notes,
    table: Array.isArray(order.table) ? order.table[0] ?? null : order.table,
    items: order.items ?? [],
  }))

  return (
    <main className="h-screen flex flex-col overflow-hidden">
      <KitchenClient initialOrders={orders} />
    </main>
  )
}
