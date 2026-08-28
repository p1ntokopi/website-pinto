import type { Metadata } from 'next'
import { TriangleAlert } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { resolvePeriod, formatRangeLabel } from '@/lib/finance/period'
import { PeriodFilter } from '@/components/admin/owner/period-filter'
import {
  AdjustmentsClient,
  type AdjustmentRow,
} from '@/components/admin/owner/adjustments-client'

export const metadata: Metadata = {
  title: 'Refund & Koreksi - Pinto Admin',
}

export default async function OwnerAdjustmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string; from?: string; to?: string }>
}) {
  const params = await searchParams
  const period = resolvePeriod(params)
  const supabase = await createClient()

  const { data: adjustments } = await supabase
    .from('financial_adjustments')
    .select(
      `id, adjustment_type, amount, reason, effective_date, status, created_at,
       order:orders!financial_adjustments_order_id_fkey(order_number),
       created_by:profiles!financial_adjustments_created_by_fkey(full_name)`,
    )
    .gte('effective_date', period.range.start)
    .lte('effective_date', period.range.end)
    .order('effective_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(500)

  const rows: AdjustmentRow[] = (adjustments ?? []).map((adjustment) => {
    // Untyped embeds (hand-maintained database.types.ts has no Relationships).
    const embed = adjustment as unknown as {
      order?: { order_number?: string } | null
      created_by?: { full_name?: string } | null
    }
    return {
      id: adjustment.id,
      adjustment_type: adjustment.adjustment_type,
      amount: Number(adjustment.amount),
      reason: adjustment.reason,
      effective_date: adjustment.effective_date,
      status: adjustment.status,
      order_number: embed.order?.order_number ?? null,
      created_by_name: embed.created_by?.full_name ?? null,
    }
  })

  const active = rows.filter((row) => row.status === 'ACTIVE')
  const strip = {
    refundTotal: active
      .filter((row) => row.adjustment_type === 'REFUND')
      .reduce((sum, row) => sum + row.amount, 0),
    correctionTotal: active
      .filter((row) => row.adjustment_type === 'CORRECTION')
      .reduce((sum, row) => sum + row.amount, 0),
    count: active.length,
  }

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-8">
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-coffee">
          Keuangan
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
          Refund &amp; Koreksi
        </h1>
        <p className="text-sm text-muted-text">Periode {formatRangeLabel(period.range)}</p>
      </div>

      <PeriodFilter currentKey={period.key} />

      <AdjustmentsClient rows={rows} strip={strip} />

      <p className="text-xs leading-relaxed text-muted-text">
        <span className="font-semibold text-ink">Definisi:</span> Refund dicatat positif dan
        mengurangi Net Sales pada tanggal efektifnya. Koreksi bersifat signed (+/−) untuk
        penyesuaian pembukuan. Penyesuaian yang di-void tidak dihitung lagi.
      </p>
      {rows.length > 0 && (
        <div className="flex items-start gap-2 rounded-sm border border-info/25 bg-info/10 px-3 py-2 text-xs text-info">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Setiap pembuatan dan pembatalan penyesuaian tercatat otomatis di Audit Log.
        </div>
      )}
    </div>
  )
}
