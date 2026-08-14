import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { LiveTablesClient } from '@/components/admin/tables/live-tables-client'
import { Users, Receipt } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Live Tables - P1NTO Admin',
}

export default async function LiveTablesPage() {
  const supabase = await createClient()

  // Fetch all tables
  const { data: tables } = await supabase
    .from('tables')
    .select('id, table_number, capacity, is_active')
    .order('table_number', { ascending: true })

  // Fetch active sessions
  const { data: sessions } = await supabase
    .from('dining_sessions')
    .select('id, table_id, created_at')
    .eq('status', 'open')

  // Fetch open orders for those sessions
  const sessionIds = sessions?.map(s => s.id) || []
  let orders: unknown[] = []
  if (sessionIds.length > 0) {
    const { data: activeOrders } = await supabase
      .from('orders')
      .select('id, order_number, dining_session_id, total, status')
      .in('dining_session_id', sessionIds)
      .in('status', ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED']) // Even completed orders stay on table until session closes

    if (activeOrders) orders = activeOrders
  }

  // Combine data
  const tablesData = tables?.map(table => {
    const session = sessions?.find(s => s.table_id === table.id)
    const tableOrders = session ? orders.filter(o => o.dining_session_id === session.id) : []
    
    return {
      ...table,
      session: session ? {
        id: session.id,
        created_at: session.created_at,
        orders: tableOrders
      } : null
    }
  }) || []

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-primary">Live Tables</h1>
          <p className="text-muted-foreground mt-1">Real-time cafe occupancy and table orders.</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-border/50 shadow-sm">
            <Users className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-semibold">{sessions?.length || 0} Active Tables</span>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-border/50 shadow-sm">
            <Receipt className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-semibold">{orders.length || 0} Open Orders</span>
          </div>
        </div>
      </div>

      <LiveTablesClient initialTables={tablesData} />
    </div>
  )
}
