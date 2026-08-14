import { createClient } from '@/lib/supabase/server'
import { OrdersClient } from '@/components/admin/orders/orders-client'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Order Management - P1NTO Admin',
}

export default async function OrdersPage() {
  const supabase = await createClient()

  // Initial fetch for today's orders (or recent active orders)
  // We'll fetch orders from the last 24 hours to keep the initial payload reasonable
  const oneDayAgo = new Date(new Date().getTime() - 24 * 60 * 60 * 1000).toISOString()

  const { data: initialOrders } = await supabase
    .from('orders')
    .select(`
      id, order_number, order_type, fulfillment_type, subtotal, total, status, 
      customer_name, created_at,
      table:tables(id, table_number)
    `)
    .gte('created_at', oneDayAgo)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground mt-1">Manage today's operational workflow.</p>
        </div>
      </div>

      <OrdersClient initialOrders={initialOrders || []} />
    </div>
  )
}
