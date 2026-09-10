import type { Metadata } from 'next'
import { Banknote, Coffee, TriangleAlert } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { resolvePeriod, formatRangeLabel } from '@/lib/finance/period'
import { getFinancialSummary } from '@/lib/finance/summary'
import { formatIDR, formatNumberID } from '@/lib/finance/format'
import {
  computeAov,
  computeEstimatedSurplus,
  computeNetSales,
} from '@/lib/finance/types'
import { PeriodFilter } from '@/components/admin/owner/period-filter'
import {
  PrimaryMetric,
  SecondaryMetric,
} from '@/components/admin/owner/metric-card'
import { TrendChart } from '@/components/admin/owner/charts'
import { EmptyState } from '@/components/admin/owner/empty-state'
import { SectionHeader } from '@/components/admin/owner/section-header'

export const metadata: Metadata = {
  title: 'Ringkasan Owner - Pinto Admin',
}

function greeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      hour12: false,
    }).format(new Date()),
  )
  if (hour < 11) return 'Selamat pagi'
  if (hour < 15) return 'Selamat siang'
  if (hour < 19) return 'Selamat sore'
  return 'Selamat malam'
}

export default async function OwnerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string; from?: string; to?: string }>
}) {
  const params = await searchParams
  const period = resolvePeriod(params)
  const [{ data: summary, error }, supabase] = await Promise.all([
    getFinancialSummary(period.range),
    createClient(),
  ])

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user?.id ?? '')
    .single()

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Owner'
  const netSales = summary ? computeNetSales(summary) : 0
  const surplus = summary ? computeEstimatedSurplus(summary) : 0
  const aov = summary ? computeAov(summary) : 0

  // Latest revenue-ish orders for the "recent transactions" section.
  const { data: recentOrders } = await supabase
    .from('orders')
    .select(
      `id, order_number, total, status, created_at, dining_session_id,
       table:tables(table_number),
       payments(id, status, payment_method, payment_channel, provider, paid_at, created_at)`,
    )
    .gte('created_at', `${period.range.start}T00:00:00+07:00`)
    .lte('created_at', `${period.range.end}T23:59:59+07:00`)
    .order('created_at', { ascending: false })
    .limit(5)

  const sessionIds = [
    ...new Set(
      (recentOrders ?? [])
        .map((order) => order.dining_session_id)
        .filter((id): id is string => typeof id === 'string'),
    ),
  ]
  const paidSessionIds = new Set<string>()
  let sessionPaymentError: string | null = null
  if (sessionIds.length > 0) {
    const { data: sessionPayments, error: paymentError } = await supabase
      .from('payments')
      .select('dining_session_id')
      .in('dining_session_id', sessionIds)
      .eq('status', 'PAID')
    if (paymentError) {
      sessionPaymentError =
        'Status pembayaran tagihan sesi terbaru tidak dapat dimuat.'
    }
    for (const payment of sessionPayments ?? []) {
      if (payment.dining_session_id) {
        paidSessionIds.add(payment.dining_session_id)
      }
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-8">
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-coffee">
          Area Owner
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
          {greeting()}, {firstName}.
        </h1>
        <p className="text-sm text-muted-text">
          Ringkasan bisnis · {formatRangeLabel(period.range)}
        </p>
      </div>

      <PeriodFilter currentKey={period.key} />

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
          <div className="grid gap-4 sm:grid-cols-2">
            <PrimaryMetric
              label="Pendapatan (Net Sales)"
              value={formatIDR(netSales)}
              hint="Pembayaran lunas diterima pada periode ini, setelah diskon &amp; penyesuaian."
            />
            <PrimaryMetric
              label="Estimasi Laba"
              value={formatIDR(surplus)}
              tone={surplus >= 0 ? 'positive' : 'negative'}
              hint="Net Sales − Pengeluaran tercatat. Estimasi — belum memperhitungkan HPP."
            />
          </div>

          <div className="grid grid-cols-1 divide-y divide-border-custom/60 rounded-sm border border-border-custom bg-card sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <SecondaryMetric
              label="Pesanan"
              value={formatNumberID(summary.order_reconciliation.total)}
              hint="Order dibuat dalam periode ini"
            />
            <SecondaryMetric
              label="Rata-rata Nilai Order"
              value={formatIDR(aov)}
              hint="Net Sales ÷ order lunas"
            />
            <SecondaryMetric
              label="Pengeluaran"
              value={formatIDR(summary.expense.total)}
              hint={`${formatNumberID(summary.expense.count)} transaksi tercatat`}
            />
          </div>

          <section className="space-y-4">
            <SectionHeader title="Penjualan" />
            <div className="rounded-sm border border-border-custom bg-card p-4">
              <TrendChart
                data={summary.revenue_series.map((point) => ({
                  day: point.day,
                  value: point.revenue,
                }))}
                kind="currency"
                emptyTitle="Belum ada transaksi"
                emptyDescription="Data penjualan akan muncul setelah pembayaran lunas tercatat."
              />
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="space-y-4">
              <SectionHeader
                title="Produk Terlaris"
                action={{
                  href: '/admin/owner/sales',
                  label: 'Detail Penjualan',
                }}
              />
              {summary.top_products.length === 0 ? (
                <EmptyState
                  icon={Coffee}
                  title="Belum ada penjualan"
                  description="Produk terlaris muncul setelah ada pesanan yang dibayar."
                />
              ) : (
                <ol className="divide-y divide-border-custom/70 rounded-sm border border-border-custom bg-card">
                  {summary.top_products.slice(0, 5).map((product, index) => (
                    <li
                      key={product.name}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      <span className="w-5 text-xs font-bold text-coffee">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">
                          {product.name}
                        </p>
                        <p className="text-xs text-muted-text">
                          {formatNumberID(product.units)} terjual ·{' '}
                          {product.category}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-ink">
                        {formatIDR(product.revenue)}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <section className="space-y-4">
              <SectionHeader
                title="Pengeluaran"
                action={{
                  href: '/admin/owner/expenses',
                  label: 'Kelola Pengeluaran',
                }}
              />
              {summary.expense_by_category.length === 0 ? (
                <EmptyState
                  icon={Banknote}
                  title="Belum ada pengeluaran pada periode ini."
                  description="Catat pengeluaran agar estimasi laba lebih akurat."
                />
              ) : (
                <div className="space-y-3 rounded-sm border border-border-custom bg-card p-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-text">
                      Total Periode
                    </span>
                    <span className="font-display text-2xl font-bold text-ink">
                      {formatIDR(summary.expense.total)}
                    </span>
                  </div>
                  <ul className="space-y-2.5">
                    {summary.expense_by_category.slice(0, 5).map((item) => {
                      const max = summary.expense_by_category[0]?.total || 1
                      return (
                        <li key={item.category}>
                          <div className="flex justify-between text-xs">
                            <span className="font-medium text-ink">
                              {item.category}
                            </span>
                            <span className="text-muted-text">
                              {formatIDR(item.total)}
                            </span>
                          </div>
                          <div className="mt-1 h-1.5 rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-coffee/70"
                              style={{
                                width: `${Math.max((item.total / max) * 100, 4)}%`,
                              }}
                            />
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </section>
          </div>

          <section className="space-y-4">
            <SectionHeader
              title="Transaksi Terbaru"
              action={{ href: '/admin/owner/reports', label: 'Lihat Laporan' }}
            />
            {sessionPaymentError && (
              <p
                role="alert"
                className="rounded-sm border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning"
              >
                {sessionPaymentError}
              </p>
            )}
            {(recentOrders ?? []).length === 0 ? (
              <EmptyState
                icon={Banknote}
                title="Belum ada transaksi"
                description="Data penjualan akan muncul setelah pesanan selesai dan pembayaran tercatat."
              />
            ) : (
              <ul className="divide-y divide-border-custom/70 rounded-sm border border-border-custom bg-card">
                {(recentOrders ?? []).map((order) => {
                  const table = order.table
                  const tableRecord = Array.isArray(table) ? table[0] : table
                  const payments = Array.isArray(order.payments)
                    ? order.payments
                    : []
                  const paid =
                    payments.some((payment) => payment.status === 'PAID') ||
                    (order.dining_session_id
                      ? paidSessionIds.has(order.dining_session_id)
                      : false)
                  return (
                    <li
                      key={order.id}
                      className="flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">
                          {order.order_number}
                          {tableRecord?.table_number
                            ? ` · Meja ${tableRecord.table_number}`
                            : ''}
                        </p>
                        <p className="text-xs text-muted-text">
                          {new Date(order.created_at).toLocaleString('id-ID', {
                            timeZone: 'Asia/Jakarta',
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {' · '}
                          {paid ? 'Lunas' : 'Belum lunas'}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-ink">
                        {formatIDR(Number(order.total ?? 0))}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <p className="text-xs leading-relaxed text-muted-text">
            <span className="font-semibold text-ink">Definisi:</span> Pendapatan
            = setiap pembayaran berstatus PAID pada periode ini, termasuk
            pembayaran per order lama dan satu tagihan sesi kasir yang
            masing-masing dihitung sekali (setelah diskon, refund, dan
            penyesuaian) · Pesanan = order dibuat pada periode ini · Estimasi
            Laba = Net Sales − Pengeluaran tercatat (belum termasuk HPP).
          </p>
        </>
      ) : null}
    </div>
  )
}
