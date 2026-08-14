import { createClient } from '@/lib/supabase/server'
import { KitchenClient } from '@/components/admin/kitchen/kitchen-client'

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

  return (
    <main className="h-screen flex flex-col overflow-hidden">
      <KitchenClient initialOrders={initialOrders || []} />
    </main>
  )
}
