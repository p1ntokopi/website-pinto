import type { Metadata } from 'next'
import { TriangleAlert } from 'lucide-react'
import {
  resolvePeriod,
  formatRangeLabel,
  daysBetween,
} from '@/lib/finance/period'
import { getFinancialSummary } from '@/lib/finance/summary'
import { getTransactions } from '@/lib/finance/transactions'
import { toCsv } from '@/lib/finance/csv'
import { formatIDR, formatNumberID } from '@/lib/finance/format'
import {
  computeAov,
  computeEstimatedSurplus,
  computeNetSales,
} from '@/lib/finance/types'
import { PeriodFilter } from '@/components/admin/owner/period-filter'
import { DownloadCsvButton } from '@/components/admin/owner/download-csv-button'
import { TransactionTable } from '@/components/admin/owner/transaction-table'
import { TopProducts } from '@/components/admin/owner/top-products'
import { EmptyState } from '@/components/admin/owner/empty-state'
import { SectionHeader } from '@/components/admin/owner/section-header'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Laporan Keuangan - Pinto Admin',
}

export default async function OwnerReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string; from?: string; to?: string }>
}) {
  const params = await searchParams
  const period = resolvePeriod(params)
  const { data: summary, error } = await getFinancialSummary(period.range)
  const { rows: transactions, rangeCapped } = await getTransactions(
    period.range,
  )

  const netSales = summary ? computeNetSales(summary) : 0
  const surplus = summary ? computeEstimatedSurplus(summary) : 0
  const aov = summary ? computeAov(summary) : 0

  const summaryCsv = summary
    ? toCsv(
        ['Metrik', 'Nilai (Rp)'],
        [
          ['Gross Sales', summary.sales.gross],
          ['Discount', summary.sales.discount],
          ['Refund', -summary.refund.total],
          ['Penyesuaian', summary.adjustment.total],
          ['Net Sales', netSales],
          ['Pengeluaran', -summary.expense.total],
          ['Estimasi Laba', surplus],
          ['Jumlah Order Dibuat', summary.order_reconciliation.total],
          ['Order Dibayar pada Periode', summary.sales.paid_order_count],
          ['Rata-rata Nilai Order', Math.round(aov)],
        ],
      )
    : ''

  const expensesCsv = summary
    ? toCsv(
        ['Kategori', 'Jumlah Transaksi', 'Total (Rp)'],
        summary.expense_by_category.map((item) => [
          item.category,
          item.count,
          item.total,
        ]),
      )
    : ''

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-8">
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-coffee">
          Laporan
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
          Laporan Keuangan
        </h1>
        <p className="text-sm text-muted-text">
          Periode {formatRangeLabel(period.range)}
        </p>
      </div>

      <div className="space-y-3">
        <PeriodFilter currentKey={period.key} />
        <div className="flex flex-wrap items-center gap-2">
          <DownloadCsvButton
            filename={`pinto-ringkasan-${period.range.start}-sd-${period.range.end}.csv`}
            content={summaryCsv}
            label="Ringkasan (CSV)"
          />
          <DownloadCsvButton
            filename={`pinto-pengeluaran-${period.range.start}-sd-${period.range.end}.csv`}
            content={expensesCsv}
            label="Pengeluaran (CSV)"
          />
          <span className="text-xs text-muted-text">
            Ekspor PDF &amp; Excel — segera.
          </span>
        </div>
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-sm border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          <TriangleAlert
            className="mt-0.5 h-4 w-4 shrink-0"
            aria-hidden="true"
          />
          {error}
        </div>
      ) : summary ? (
        <>
          <section className="space-y-4">
            <SectionHeader title="Ringkasan Keuangan" />
            <div className="overflow-x-auto rounded-sm border border-border-custom bg-card">
              <table className="w-full min-w-[380px] text-sm">
                <tbody className="divide-y divide-border-custom/60">
                  {[
                    {
                      label: 'Gross Sales',
                      value: formatIDR(summary.sales.gross),
                    },
                    {
                      label: 'Discount',
                      value: `− ${formatIDR(summary.sales.discount)}`,
                    },
                    {
                      label: 'Refund',
                      value: `− ${formatIDR(summary.refund.total)}`,
                    },
                    {
                      label: 'Penyesuaian',
                      value:
                        summary.adjustment.total >= 0
                          ? `+ ${formatIDR(summary.adjustment.total)}`
                          : `− ${formatIDR(Math.abs(summary.adjustment.total))}`,
                    },
                    {
                      label: 'Net Sales',
                      value: formatIDR(netSales),
                      bold: true,
                    },
                    {
                      label: 'Pengeluaran',
                      value: `− ${formatIDR(summary.expense.total)}`,
                    },
                    {
                      label: 'Estimasi Laba',
                      value: formatIDR(surplus),
                      bold: true,
                      accent: true,
                    },
                  ].map((row) => (
                    <tr
                      key={row.label}
                      className="border-b border-border-custom/40 last:border-0"
                    >
                      <td className="px-4 py-3 text-muted-text">{row.label}</td>
                      <td
                        className={cn(
                          'px-4 py-3 text-right tabular-nums',
                          row.bold
                            ? 'font-bold text-ink'
                            : 'font-medium text-ink',
                          row.accent &&
                            (surplus >= 0
                              ? 'font-display text-lg text-success'
                              : 'font-display text-lg text-danger'),
                        )}
                      >
                        {row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-text">
              Rata-rata nilai order: {formatIDR(aov)} ·{' '}
              {formatNumberID(summary.sales.paid_order_count)} order tercakup
              pembayaran pada periode ini.
            </p>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="space-y-4">
              <SectionHeader title="Metode Pembayaran" />
              {summary.payment_breakdown.length === 0 ? (
                <EmptyState
                  icon={TriangleAlert}
                  title="Belum ada pembayaran"
                  description="Metode pembayaran muncul otomatis setelah ada transaksi lunas."
                />
              ) : (
                <ul className="divide-y divide-border-custom/70 rounded-sm border border-border-custom bg-card">
                  {summary.payment_breakdown.map((row) => (
                    <li
                      key={row.method}
                      className="flex items-center justify-between px-4 py-3"
                    >
                      <span className="text-sm font-medium text-ink">
                        {row.method}
                      </span>
                      <span className="text-sm tabular-nums text-ink">
                        {formatIDR(row.total)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="space-y-4">
              <SectionHeader title="Kategori Produk" />
              {summary.category_performance.length === 0 ? (
                <EmptyState
                  icon={TriangleAlert}
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
                          <span className="font-medium text-ink">
                            {item.category}
                          </span>
                          <span className="text-muted-text">
                            {formatIDR(item.revenue)}
                          </span>
                        </div>
                        <div className="mt-1 h-2 rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-coffee/70"
                            style={{
                              width: `${Math.max((item.revenue / max) * 100, 3)}%`,
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </div>

          <section className="space-y-4">
            <SectionHeader title="Produk Terlaris" />
            <TopProducts products={summary.top_products.slice(0, 10)} />
          </section>

          <section className="space-y-4">
            <SectionHeader title="Pengeluaran per Kategori" />
            {summary.expense_by_category.length === 0 ? (
              <EmptyState
                icon={TriangleAlert}
                title="Belum ada pengeluaran pada periode ini."
                description="Catat pengeluaran agar estimasi laba lebih akurat."
              />
            ) : (
              <ul className="divide-y divide-border-custom/70 rounded-sm border border-border-custom bg-card">
                {summary.expense_by_category.map((item) => (
                  <li
                    key={item.category}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <span className="text-sm font-medium text-ink">
                      {item.category}
                      <span className="ml-2 text-xs text-muted-text">
                        {formatNumberID(item.count)} transaksi
                      </span>
                    </span>
                    <span className="text-sm tabular-nums text-ink">
                      {formatIDR(item.total)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-4">
            <SectionHeader title="Tabel Transaksi" />
            {rangeCapped && (
              <p className="rounded-sm border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
                Rentang terlalu panjang — tabel transaksi menampilkan{' '}
                {daysBetween(period.range.start, period.range.end) + 1} hari
                terakhir saja. Ringkasan keuangan di atas tetap menghitung
                seluruh periode.
              </p>
            )}
            <TransactionTable rows={transactions} />
          </section>

          <p className="text-xs leading-relaxed text-muted-text">
            <span className="font-semibold text-ink">Definisi:</span> Pendapatan
            terealisasi = setiap pembayaran berstatus PAID dengan tanggal bayar
            pada periode ini, baik pembayaran per order maupun satu tagihan sesi
            kasir; setiap pembayaran dihitung sekali dan order dibatalkan
            dikecualikan. Estimasi Laba = Net Sales − Pengeluaran tercatat,
            belum memperhitungkan HPP — bukan laba bersih.
          </p>
        </>
      ) : null}
    </div>
  )
}
