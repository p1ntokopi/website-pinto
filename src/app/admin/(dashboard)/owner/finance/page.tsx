import type { Metadata } from 'next'
import { Banknote, TriangleAlert } from 'lucide-react'
import { resolvePeriod, formatRangeLabel } from '@/lib/finance/period'
import { getFinancialSummary } from '@/lib/finance/summary'
import { formatIDR, formatNumberID } from '@/lib/finance/format'
import { computeNetSales } from '@/lib/finance/types'
import { PeriodFilter } from '@/components/admin/owner/period-filter'
import { SecondaryMetric } from '@/components/admin/owner/metric-card'
import { EmptyState } from '@/components/admin/owner/empty-state'
import { SectionHeader } from '@/components/admin/owner/section-header'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Ikhtisar Keuangan - Pinto Admin',
}

function BreakdownRow({
  label,
  value,
  emphasis,
  negative,
  hint,
}: {
  label: string
  value: string
  emphasis?: boolean
  negative?: boolean
  hint?: string
}) {
  return (
    <div
      className={cn(
        'flex items-baseline justify-between gap-3 py-2.5',
        emphasis && 'border-t border-border-custom/80 pt-3',
      )}
    >
      <div>
        <p className={cn('text-sm', emphasis ? 'font-bold text-ink' : 'text-muted-text')}>
          {label}
        </p>
        {hint && <p className="mt-0.5 text-xs text-muted-text/80">{hint}</p>}
      </div>
      <span
        className={cn(
          'text-sm tabular-nums',
          emphasis ? 'font-display text-xl font-bold text-ink' : 'font-medium',
          negative ? 'text-danger' : emphasis ? 'text-ink' : 'text-ink',
        )}
      >
        {negative && !emphasis ? '− ' : ''}
        {value}
      </span>
    </div>
  )
}

export default async function OwnerFinancePage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string; from?: string; to?: string }>
}) {
  const params = await searchParams
  const period = resolvePeriod(params)
  const { data: summary, error } = await getFinancialSummary(period.range)

  const netSales = summary ? computeNetSales(summary) : 0
  const revenueOrders = summary?.order_reconciliation.paid ?? 0

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-8">
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-coffee">
          Keuangan
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
          Ikhtisar Keuangan
        </h1>
        <p className="text-sm text-muted-text">Periode {formatRangeLabel(period.range)}</p>
      </div>

      <PeriodFilter currentKey={period.key} />

      {error ? (
        <div className="flex items-start gap-2 rounded-sm border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </div>
      ) : summary ? (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="space-y-4">
              <SectionHeader title="Pendapatan" />
              <div className="rounded-sm border border-border-custom bg-card px-4 py-2">
                <BreakdownRow label="Gross Sales" value={formatIDR(summary.sales.gross)} />
                {summary.sales.discount > 0 && (
                  <BreakdownRow label="Discount" value={formatIDR(summary.sales.discount)} negative />
                )}
                {summary.refund.total > 0 && (
                  <BreakdownRow
                    label={`Refund (${formatNumberID(summary.refund.count)} transaksi)`}
                    value={formatIDR(summary.refund.total)}
                    negative
                  />
                )}
                {summary.adjustment.total !== 0 && (
                  <BreakdownRow
                    label="Penyesuaian"
                    value={formatIDR(Math.abs(summary.adjustment.total))}
                    negative={summary.adjustment.total < 0}
                  />
                )}
                {summary.sales.tax > 0 && (
                  <BreakdownRow label="Pajak (terkumpul)" value={formatIDR(summary.sales.tax)} />
                )}
                {summary.sales.service_fee > 0 && (
                  <BreakdownRow
                    label="Biaya layanan (terkumpul)"
                    value={formatIDR(summary.sales.service_fee)}
                  />
                )}
                <BreakdownRow label="Net Sales" value={formatIDR(netSales)} emphasis />
                <p className="pb-3 text-xs text-muted-text">
                  Dari {formatNumberID(revenueOrders)} order lunas pada periode ini.
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <SectionHeader title="Breakdown Pembayaran" />
              {summary.payment_breakdown.length === 0 ? (
                <EmptyState
                  icon={Banknote}
                  title="Belum ada pembayaran"
                  description="Metode pembayaran muncul otomatis setelah ada transaksi lunas."
                />
              ) : (
                <div className="overflow-x-auto rounded-sm border border-border-custom bg-card">
                  <table className="w-full min-w-[420px] text-sm">
                    <thead>
                      <tr className="border-b border-border-custom/60 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-text">
                        <th className="px-4 py-2.5 font-semibold">Metode</th>
                        <th className="px-4 py-2.5 text-right font-semibold">Transaksi</th>
                        <th className="px-4 py-2.5 text-right font-semibold">Total</th>
                        <th className="px-4 py-2.5 text-right font-semibold">Porsi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-custom/60">
                      {summary.payment_breakdown.map((row) => {
                        const share =
                          netSales > 0 ? Math.round((row.total / netSales) * 100) : 0
                        return (
                          <tr key={row.method}>
                            <td className="px-4 py-2.5 font-medium text-ink">{row.method}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-muted-text">
                              {formatNumberID(row.tx_count)}
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums font-medium text-ink">
                              {formatIDR(row.total)}
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-muted-text">
                              {share}%
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          <section className="space-y-4">
            <SectionHeader title="Rekonsiliasi Order" />
            <div className="grid grid-cols-2 divide-y divide-border-custom/60 rounded-sm border border-border-custom bg-card sm:grid-cols-5 sm:divide-x sm:divide-y-0">
              <SecondaryMetric label="Total Order" value={formatNumberID(summary.order_reconciliation.total)} />
              <SecondaryMetric label="Lunas" value={formatNumberID(summary.order_reconciliation.paid)} tone="positive" />
              <SecondaryMetric label="Belum Lunas" value={formatNumberID(summary.order_reconciliation.unpaid)} tone="negative" />
              <SecondaryMetric
                label="Menunggu Bayar"
                value={formatNumberID(summary.order_reconciliation.pending_payment)}
              />
              <SecondaryMetric
                label="Dibatalkan"
                value={formatNumberID(summary.order_reconciliation.cancelled)}
              />
            </div>
            <p className="text-xs text-muted-text">
              Refund tercatat: {formatNumberID(summary.refund.count)} transaksi (−{' '}
              {formatIDR(summary.refund.total)}). Order yang dibatalkan tidak dihitung dalam
              pendapatan.
            </p>
          </section>

          <section className="space-y-4">
            <SectionHeader title="Arus Kas" />
            <div className="grid grid-cols-1 divide-y divide-border-custom/60 rounded-sm border border-border-custom bg-card sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <SecondaryMetric label="Kas Masuk" value={formatIDR(summary.cash_flow.in)} hint="Pembayaran tunai (CASH)" />
              <SecondaryMetric label="Kas Keluar" value={formatIDR(summary.cash_flow.out)} hint="Pengeluaran tunai" />
              <SecondaryMetric
                label="Arus Kas Bersih"
                value={formatIDR(summary.cash_flow.net)}
                tone={summary.cash_flow.net >= 0 ? 'positive' : 'negative'}
                hint="Kas masuk − kas keluar"
              />
            </div>
            <p className="text-xs text-muted-text">
              Arus kas ≠ pendapatan: hanya transaksi tunai yang dihitung di sini; pembayaran via
              transfer/e-wallet masuk ke saldo terkait, bukan kas.
            </p>
          </section>

          <p className="text-xs leading-relaxed text-muted-text">
            <span className="font-semibold text-ink">Definisi:</span> Pendapatan terealisasi =
            pembayaran berstatus PAID yang tanggal bayarnya jatuh pada periode ini; order yang
            dibatalkan dikecualikan. Net Sales = Gross − Diskon − Refund + Penyesuaian.
          </p>
        </>
      ) : null}
    </div>
  )
}
