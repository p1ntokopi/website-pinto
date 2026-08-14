import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { TableList } from '@/components/admin/table-list'
import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Database } from '@/types/database.types'

export const metadata: Metadata = {
  title: 'Tables - P1NTO Admin',
}

export default async function AdminTablesPage() {
  const supabase = await createClient()

  // Fetch all tables
  const { data: tables, error: tablesError } = await supabase
    .from('tables')
    .select('*')
    .order('table_number', { ascending: true })

  if (tablesError) {
    return (
      <div className="p-8 text-center text-destructive">
        Failed to load tables: {tablesError.message}
      </div>
    )
  }

  // Fetch active sessions to see which tables are occupied
  const { data: sessions } = await supabase
    .from('dining_sessions')
    .select('table_id')
    .eq('status', 'open')

  const activeTableIds = new Set(sessions?.map(s => s.table_id) || [])

  // Combine data
  const tablesWithSessions = tables.map(table => ({
    ...table,
    has_active_session: activeTableIds.has(table.id)
  }))

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-primary">Table Management</h1>
          <p className="text-muted-foreground mt-1">Manage cafe tables and generate QR codes for ordering.</p>
        </div>
        
        <div className="flex gap-3">
          <Button render={<Link href="/admin/tables/print" />} variant="outline">
            <Printer className="w-4 h-4 mr-2" />
            Print All QRs
          </Button>
        </div>
      </div>

      <TableList tables={tablesWithSessions} />
    </div>
  )
}
