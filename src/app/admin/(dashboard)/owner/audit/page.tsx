import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { resolvePeriod, formatRangeLabel } from '@/lib/finance/period'
import { PeriodFilter } from '@/components/admin/owner/period-filter'
import { AuditClient, type AuditRow } from '@/components/admin/owner/audit-client'

export const metadata: Metadata = {
  title: 'Audit Log - Pinto Admin',
}

/**
 * Owner-only audit trail for financial data. Entries are written by DB
 * triggers (0021) — this page only reads them, so nothing can be edited away.
 */
export default async function OwnerAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string; from?: string; to?: string }>
}) {
  const params = await searchParams
  const period = resolvePeriod(params)
  const supabase = await createClient()

  const { data: logs } = await supabase
    .from('audit_logs')
    .select(
      `id, action, entity_type, entity_id, metadata, created_at,
       actor:profiles!audit_logs_actor_id_fkey(full_name)`,
    )
    .in('entity_type', ['expenses', 'financial_adjustments'])
    .gte('created_at', `${period.range.start}T00:00:00+07:00`)
    .lte('created_at', `${period.range.end}T23:59:59+07:00`)
    .order('created_at', { ascending: false })
    .limit(500)

  const rows: AuditRow[] = (logs ?? []).map((log) => {
    const embed = log as unknown as {
      actor?: { full_name?: string } | null
    }
    return {
      id: log.id,
      created_at: log.created_at,
      action: log.action,
      entity_type: log.entity_type,
      metadata:
        log.metadata && typeof log.metadata === 'object'
          ? (log.metadata as Record<string, unknown>)
          : null,
      actor_name: embed.actor?.full_name ?? null,
    }
  })

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-8">
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-coffee">
          Laporan
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Audit Log</h1>
        <p className="text-sm text-muted-text">
          Jejak perubahan data keuangan · Periode {formatRangeLabel(period.range)}
        </p>
      </div>

      <PeriodFilter currentKey={period.key} />

      <AuditClient rows={rows} />

      <p className="text-xs leading-relaxed text-muted-text">
        Catatan ini ditulis langsung oleh database (trigger) saat pengeluaran atau penyesuaian
        dibuat, diubah, atau di-void — tidak dapat diedit dari aplikasi.
      </p>
    </div>
  )
}
