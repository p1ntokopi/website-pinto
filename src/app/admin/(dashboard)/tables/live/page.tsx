import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { LiveTablesClient } from '@/components/admin/tables/live-tables-client'
import { Users, Receipt } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Meja Langsung - P1NTO Admin',
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
  let orders: { id: string; order_number: string; dining_session_id: string | null; total: number; status: string }[] = []
  if (sessionIds.length > 0) {
    const { data: activeOrders } = await supabase
      .from('orders')
      .select('id, order_number, dining_session_id, total, status')
      .in('dining_session_id', sessionIds)
      .in('status', ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED']) // Even completed orders stay on table until session closes

    if (activeOrders) orders = activeOrders as typeof orders
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
    <div className="mx-auto w-full max-w-[1240px] space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-coffee">
            Operasional
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">
            Meja Langsung
          </h1>
          <p className="mt-2 text-sm text-muted-text">
            Okupansi kafe dan pesanan meja secara real-time.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 rounded-sm border border-border-custom bg-card px-4 py-2">
            <Users className="h-4 w-4 text-success" />
            <span className="text-sm font-semibold text-ink">{sessions?.length || 0} Meja Aktif</span>
          </div>
          <div className="flex items-center gap-2 rounded-sm border border-border-custom bg-card px-4 py-2">
            <Receipt className="h-4 w-4 text-warning" />
            <span className="text-sm font-semibold text-ink">{orders.length || 0} Pesanan Terbuka</span>
          </div>
        </div>
      </div>

      <LiveTablesClient initialTables={tablesData} />
    </div>
  )
}
