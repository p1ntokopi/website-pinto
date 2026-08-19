import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { TableList } from '@/components/admin/table-list'
import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Meja - Pinto Admin',
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
        Gagal memuat meja: {tablesError.message}
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
    <div className="mx-auto w-full max-w-[1240px] space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-coffee">
            Operasional
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">
            Meja &amp; QR
          </h1>
          <p className="mt-2 text-sm text-muted-text">
            Kelola meja kafe dan kode QR pemesanan.
          </p>
        </div>

        <Button render={<Link href="/admin/tables/print" />} variant="outline" className="shrink-0 self-start sm:self-auto">
          <Printer className="h-4 w-4" />
          Cetak Semua QR
        </Button>
      </div>

      <TableList tables={tablesWithSessions} />
    </div>
  )
}
