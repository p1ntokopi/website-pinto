import type { Metadata } from 'next'
import Link from 'next/link'
import { Coffee, TriangleAlert } from 'lucide-react'
import { resolvePeriod, formatRangeLabel } from '@/lib/finance/period'
import { getFinancialSummary } from '@/lib/finance/summary'
import { formatIDR, formatNumberID } from '@/lib/finance/format'
import { PeriodFilter } from '@/components/admin/owner/period-filter'
import { TrendChart } from '@/components/admin/owner/charts'
import { TopProducts } from '@/components/admin/owner/top-products'
import { SectionHeader } from '@/components/admin/owner/section-header'
import { EmptyState } from '@/components/admin/owner/empty-state'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Analitik Penjualan - Pinto Admin',
}

const GRANULARITIES = [
  { key: 'DAILY', label: 'Harian' },
  { key: 'WEEKLY', label: 'Mingguan' },
  { key: 'MONTHLY', label: 'Bulanan' },
] as const

type Granularity = (typeof GRANULARITIES)[number]['key']

function buildQuery(period: { key: string; range: { start: string; end: string } }, g: string) {
  const search = new URLSearchParams({ p: period.key, g })
  if (period.key === 'CUSTOM') {
    search.set('from', period.range.start)
    search.set('to', period.range.end)
  }
  return `/admin/owner/sales?${search.toString()}`
}

export default async function OwnerSalesPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string; from?: string; to?: string; g?: string }>
}) {
  const params = await searchParams
  const period = resolvePeriod(params)
  const granularity: Granularity = GRANULARITIES.some((g) => g.key === params.g)
    ? (params.g as Granularity)
    : 'DAILY'
  const { data: summary, error } = await getFinancialSummary(period.range)

  const revenuePoints =
    summary?.revenue_series.map((point) => ({ day: point.day, value: point.revenue })) ?? []
  const orderPoints =
    summary?.orders_series.map((point) => ({ day: point.day, value: point.order_count })) ?? []

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-8">
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-coffee">
          Keuangan
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
          Analitik Penjualan
        </h1>
        <p className="text-sm text-muted-text">Periode {formatRangeLabel(period.range)}</p>
      </div>

      <div className="space-y-3">
        <PeriodFilter currentKey={period.key} />
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-muted-text">Granulasi:</span>
          {GRANULARITIES.map((option) => (
            <Link
              key={option.key}
              href={buildQuery(period, option.key)}
              aria-pressed={granularity === option.key}
              className={cn(
                'inline-flex min-h-9 items-center rounded-full border px-3.5 text-xs font-semibold transition-colors focus-visible:ring-3 focus-visible:ring-ring/40 outline-none',
                granularity === option.key
                  ? 'border-ink bg-ink text-paper'
                  : 'border-border-custom bg-paper text-muted-text hover:text-ink',
              )}
            >
              {option.label}
            </Link>
          ))}
        </div>
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-sm border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </div>
      ) : summary ? (
        <>
          <section className="space-y-4">
            <SectionHeader title="Pendapatan per Waktu" />
            <div className="rounded-sm border border-border-custom bg-card p-4">
              <TrendChart
                data={revenuePoints}
                kind="currency"
                emptyTitle="Belum ada transaksi"
                emptyDescription="Tren pendapatan muncul setelah ada pembayaran tercatat pada periode ini."
              />
            </div>
          </section>

          <section className="space-y-4">
            <SectionHeader title="Volume Order" />
            <div className="rounded-sm border border-border-custom bg-card p-4">
              <TrendChart
                data={orderPoints}
                kind="count"
                emptyTitle="Belum ada order"
                emptyDescription="Volume order dihitung dari order yang dibuat pada periode ini."
              />
            </div>
          </section>

          <section className="space-y-4">
            <SectionHeader title="Produk Terlaris" />
            <TopProducts products={summary.top_products} />
          </section>

          <section className="space-y-4">
            <SectionHeader title="Performa Kategori" />
            {summary.category_performance.length === 0 ? (
              <EmptyState
                icon={Coffee}
                title="Belum ada penjualan"
                description="Performa kategori muncul setelah ada pesanan yang dibayar."
              />
            ) : (
              <div className="space-y-3 rounded-sm border border-border-custom bg-card p-4">
                {summary.category_performance.map((item) => {
                  const max = summary.category_performance[0]?.revenue || 1
                  return (
                    <div key={item.category}>
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="font-medium text-ink">{item.category}</span>
                        <span className="text-muted-text">
                          {formatIDR(item.revenue)} · {formatNumberID(item.units)} item
                        </span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-coffee/70"
                          style={{ width: `${Math.max((item.revenue / max) * 100, 3)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <SectionHeader title="Biji Kopi (Roastery)" />
            {summary.beans.units === 0 ? (
              <EmptyState
                icon={Coffee}
                title="Belum ada penjualan biji kopi"
                description="Insight roastery muncul setelah ada produk Coffee Bean yang terjual."
              />
            ) : (
              <div className="grid grid-cols-2 divide-y divide-border-custom/60 rounded-sm border border-border-custom bg-card sm:grid-cols-4 sm:divide-x sm:divide-y-0">
                {[
                  { label: 'Total Penjualan', value: formatIDR(summary.beans.revenue) },
                  { label: 'Unit Terjual', value: formatNumberID(summary.beans.units) },
                  {
                    label: 'Harga Rata-rata',
                    value: summary.beans.avg_price ? formatIDR(summary.beans.avg_price) : '—',
                  },
                  { label: 'Produk Terlaris', value: summary.beans.top_product ?? '—', small: true },
                ].map((item) => (
                  <div key={item.label} className="px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-text">
                      {item.label}
                    </p>
                    <p
                      className={cn(
                        'mt-1.5 font-bold text-ink',
                        item.small ? 'text-sm' : 'text-xl',
                      )}
                    >
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <p className="text-xs leading-relaxed text-muted-text">
            <span className="font-semibold text-ink">Catatan:</span> Pendapatan produk dihitung
            dari subtotal item (sebelum diskon order) untuk order lunas pada periode ini, sehingga
            total produk dapat sedikit berbeda dari Net Sales.
          </p>
        </>
      ) : null}
    </div>
  )
}
