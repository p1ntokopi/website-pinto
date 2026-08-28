'use client'

import { useMemo, useState } from 'react'
import { Download, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatIDR, formatNumberID } from '@/lib/finance/format'
import { toCsv, downloadCsv } from '@/lib/finance/csv'
import { STATUS_CONFIG } from '@/lib/orders/status-config'
import type { OrderStatus } from '@/lib/orders/status-machine'
import type { TransactionRow } from '@/lib/finance/transactions'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/admin/owner/empty-state'

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PAID: 'Lunas',
  PENDING: 'Pending',
  FAILED: 'Gagal',
  EXPIRED: 'Kedaluwarsa',
  CANCELED: 'Dibatalkan',
  REFUNDED: 'Dikembalikan',
}

type SortKey = 'NEWEST' | 'OLDEST' | 'TOTAL_DESC'

export function TransactionTable({ rows }: { rows: TransactionRow[] }) {
  const [search, setSearch] = useState('')
  const [methodFilter, setMethodFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sortKey, setSortKey] = useState<SortKey>('NEWEST')

  const methods = useMemo(
    () => [...new Set(rows.map((row) => row.payment_method).filter((m): m is string => !!m))].sort(),
    [rows],
  )
  const statuses = useMemo(
    () => [...new Set(rows.map((row) => row.payment_status).filter((s): s is string => !!s))],
    [rows],
  )

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    const result = rows.filter((row) => {
      if (
        query &&
        !`${row.order_number} ${row.customer_name ?? ''}`.toLowerCase().includes(query)
      ) {
        return false
      }
      if (methodFilter !== 'ALL' && (row.payment_method ?? '') !== methodFilter) return false
      if (statusFilter !== 'ALL' && (row.payment_status ?? 'UNPAID') !== statusFilter) {
        return false
      }
      return true
    })
    switch (sortKey) {
      case 'OLDEST':
        return result.sort((a, b) => a.created_at.localeCompare(b.created_at))
      case 'TOTAL_DESC':
        return result.sort((a, b) => b.total - a.total)
      default:
        return result.sort((a, b) => b.created_at.localeCompare(a.created_at))
    }
  }, [rows, search, methodFilter, statusFilter, sortKey])

  function exportCsv() {
    const csv = toCsv(
      ['Tanggal', 'No Order', 'Meja', 'Sumber', 'Subtotal', 'Diskon', 'Total', 'Metode Bayar', 'Status Bayar', 'Status Order'],
      filtered.map((row) => [
        new Date(row.created_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
        row.order_number,
        row.table_number ?? '',
        row.customer_name ?? (row.table_number ? 'Meja' : 'Kasir/Online'),
        row.subtotal,
        row.discount,
        row.total,
        row.payment_method ?? '-',
        row.payment_status ? (PAYMENT_STATUS_LABELS[row.payment_status] ?? row.payment_status) : 'BELUM BAYAR',
        STATUS_CONFIG[row.status as OrderStatus]?.label ?? row.status,
      ]),
    )
    downloadCsv(`pinto-transaksi-${new Date().toISOString().slice(0, 10)}.csv`, csv)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-text"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari no order / nama…"
            className="pl-9"
            aria-label="Cari transaksi"
          />
        </div>
        <select
          value={methodFilter}
          onChange={(event) => setMethodFilter(event.target.value)}
          aria-label="Filter metode pembayaran"
          className="h-9 rounded-sm border border-border-custom bg-paper px-2.5 text-sm text-ink focus-visible:ring-3 focus-visible:ring-ring/40 outline-none"
        >
          <option value="ALL">Semua Metode</option>
          {methods.map((method) => (
            <option key={method} value={method}>
              {method}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter status pembayaran"
          className="h-9 rounded-sm border border-border-custom bg-paper px-2.5 text-sm text-ink focus-visible:ring-3 focus-visible:ring-ring/40 outline-none"
        >
          <option value="ALL">Semua Status</option>
          <option value="UNPAID">Belum Bayar</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {PAYMENT_STATUS_LABELS[status] ?? status}
            </option>
          ))}
        </select>
        <select
          value={sortKey}
          onChange={(event) => setSortKey(event.target.value as SortKey)}
          aria-label="Urutkan"
          className="h-9 rounded-sm border border-border-custom bg-paper px-2.5 text-sm text-ink focus-visible:ring-3 focus-visible:ring-ring/40 outline-none"
        >
          <option value="NEWEST">Terbaru</option>
          <option value="OLDEST">Terlama</option>
          <option value="TOTAL_DESC">Total Terbesar</option>
        </select>
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-sm border border-border-custom bg-paper px-3 text-xs font-semibold text-ink transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40 outline-none"
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          CSV
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Tidak ada transaksi yang cocok"
          description="Ubah filter atau periode untuk melihat transaksi lain."
        />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-sm border border-border-custom bg-card lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-custom/60 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-text">
                  <th className="px-3 py-2.5 font-semibold">Tanggal</th>
                  <th className="px-3 py-2.5 font-semibold">No Order</th>
                  <th className="px-3 py-2.5 font-semibold">Meja</th>
                  <th className="px-3 py-2.5 font-semibold">Sumber</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Subtotal</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Diskon</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Total</th>
                  <th className="px-3 py-2.5 font-semibold">Metode</th>
                  <th className="px-3 py-2.5 font-semibold">Status Bayar</th>
                  <th className="px-3 py-2.5 font-semibold">Status Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-custom/60">
                {filtered.map((row) => (
                  <tr key={row.id}>
                    <td className="whitespace-nowrap px-3 py-2.5 text-muted-text">
                      {new Date(row.created_at).toLocaleDateString('id-ID', {
                        timeZone: 'Asia/Jakarta',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 font-medium text-ink">
                      {row.order_number}
                    </td>
                    <td className="px-3 py-2.5 text-muted-text">
                      {row.table_number ?? '—'}
                    </td>
                    <td className="max-w-[8rem] truncate px-3 py-2.5 text-muted-text">
                      {row.customer_name ?? (row.table_number ? 'Meja' : 'Kasir/Online')}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-muted-text">
                      {formatNumberID(row.subtotal)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-muted-text">
                      {formatNumberID(row.discount)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold tabular-nums text-ink">
                      {formatIDR(row.total)}
                    </td>
                    <td className="px-3 py-2.5 text-muted-text">{row.payment_method ?? '—'}</td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <PaymentStatusBadge status={row.payment_status} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-muted-text">
                      {STATUS_CONFIG[row.status as OrderStatus]?.label ?? row.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="space-y-3 lg:hidden">
            {filtered.map((row) => (
              <li key={row.id} className="rounded-sm border border-border-custom bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{row.order_number}</p>
                    <p className="mt-0.5 text-xs text-muted-text">
                      {new Date(row.created_at).toLocaleString('id-ID', {
                        timeZone: 'Asia/Jakarta',
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {row.table_number ? ` · Meja ${row.table_number}` : ''}
                      {` · ${row.payment_method ?? '—'}`}
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold tabular-nums text-ink">
                    {formatIDR(row.total)}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <PaymentStatusBadge status={row.payment_status} />
                  <span className="text-xs text-muted-text">
                    {STATUS_CONFIG[row.status as OrderStatus]?.label ?? row.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

function PaymentStatusBadge({ status }: { status: string | null }) {
  const label = status ? (PAYMENT_STATUS_LABELS[status] ?? status) : 'Belum Bayar'
  const tone =
    status === 'PAID'
      ? 'bg-success/10 text-success border-success/25'
      : status === 'PENDING' || status === null
        ? 'bg-warning/10 text-warning border-warning/25'
        : 'bg-danger/10 text-danger border-danger/25'
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium',
        tone,
      )}
    >
      {label}
    </span>
  )
}
