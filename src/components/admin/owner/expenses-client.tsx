'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Banknote, Pencil, Plus, Search, Undo2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatIDR, formatNumberID } from '@/lib/finance/format'
import { formatDateID } from '@/lib/finance/period'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/admin/owner/empty-state'
import {
  ExpenseFormDialog,
  type EditableExpense,
  type ExpenseCategoryOption,
} from '@/components/admin/owner/expense-form-dialog'
import { voidExpense } from '@/app/admin/(dashboard)/owner/expenses/actions'

export type ClientExpenseRow = {
  id: string
  title: string
  description: string | null
  amount: number
  category_id: string
  category_name: string
  expense_date: string
  payment_method: string
  notes: string | null
  status: string
  created_by_name: string | null
}

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Cash',
  TRANSFER: 'Transfer',
  EWALLET: 'E-Wallet',
  OTHER: 'Lainnya',
}

type StatusFilter = 'ACTIVE' | 'VOIDED' | 'ALL'

export function ExpensesClient({
  rows,
  categories,
  strip,
}: {
  rows: ClientExpenseRow[]
  categories: ExpenseCategoryOption[]
  strip: { total: number; count: number; avgDaily: number; topCategory: string | null }
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ACTIVE')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<EditableExpense | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return rows.filter((row) => {
      if (statusFilter !== 'ALL' && row.status !== statusFilter) return false
      if (categoryFilter !== 'ALL' && row.category_id !== categoryFilter) return false
      if (
        query &&
        !`${row.title} ${row.description ?? ''} ${row.notes ?? ''}`.toLowerCase().includes(query)
      ) {
        return false
      }
      return true
    })
  }, [rows, search, categoryFilter, statusFilter])

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(row: ClientExpenseRow) {
    setEditing({
      id: row.id,
      title: row.title,
      amount: row.amount,
      category_id: row.category_id,
      expense_date: row.expense_date,
      payment_method: row.payment_method,
      description: row.description,
      notes: row.notes,
    })
    setDialogOpen(true)
  }

  function handleVoid(row: ClientExpenseRow) {
    if (!window.confirm(`Batalkan (void) pengeluaran "${row.title}"? Riwayat tetap tersimpan.`)) {
      return
    }
    setActionError(null)
    startTransition(async () => {
      const result = await voidExpense(row.id)
      if (!result.ok) {
        setActionError(result.error ?? 'Gagal membatalkan pengeluaran.')
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold tracking-tight text-ink">Pengeluaran</h2>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Tambah Pengeluaran
        </Button>
      </div>

      <div className="grid grid-cols-2 divide-y divide-border-custom/60 rounded-sm border border-border-custom bg-card sm:grid-cols-4 sm:divide-x sm:divide-y-0">
        <div className="px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-text">
            Total Periode
          </p>
          <p className="mt-1.5 text-xl font-bold text-ink">{formatIDR(strip.total)}</p>
        </div>
        <div className="px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-text">
            Transaksi
          </p>
          <p className="mt-1.5 text-xl font-bold text-ink">{formatNumberID(strip.count)}</p>
        </div>
        <div className="px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-text">
            Rata-rata Harian
          </p>
          <p className="mt-1.5 text-xl font-bold text-ink">{formatIDR(strip.avgDaily)}</p>
        </div>
        <div className="px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-text">
            Kategori Terbesar
          </p>
          <p className="mt-1.5 truncate text-xl font-bold text-ink">
            {strip.topCategory ?? '—'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-text"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari judul, deskripsi, catatan…"
            className="pl-9"
            aria-label="Cari pengeluaran"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          aria-label="Filter kategori"
          className="h-9 rounded-sm border border-border-custom bg-paper px-2.5 text-sm text-ink focus-visible:ring-3 focus-visible:ring-ring/40 outline-none"
        >
          <option value="ALL">Semua Kategori</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {(['ACTIVE', 'VOIDED', 'ALL'] as const).map((status) => (
          <button
            key={status}
            type="button"
            aria-pressed={statusFilter === status}
            onClick={() => setStatusFilter(status)}
            className={cn(
              'min-h-9 rounded-full border px-3.5 text-xs font-semibold transition-colors focus-visible:ring-3 focus-visible:ring-ring/40 outline-none',
              statusFilter === status
                ? 'border-coffee bg-coffee text-paper'
                : 'border-border-custom bg-paper text-muted-text hover:text-ink',
            )}
          >
            {status === 'ACTIVE' ? 'Aktif' : status === 'VOIDED' ? 'Di-void' : 'Semua'}
          </button>
        ))}
      </div>

      {actionError && (
        <p role="alert" className="rounded-sm border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {actionError}
        </p>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={Banknote}
          title="Belum ada pengeluaran pada periode ini."
          description="Catat pengeluaran agar estimasi laba lebih akurat."
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-sm border border-border-custom bg-card md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-custom/60 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-text">
                  <th className="px-4 py-2.5 font-semibold">Tanggal</th>
                  <th className="px-4 py-2.5 font-semibold">Kategori</th>
                  <th className="px-4 py-2.5 font-semibold">Deskripsi</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Nominal</th>
                  <th className="px-4 py-2.5 font-semibold">Metode</th>
                  <th className="px-4 py-2.5 font-semibold">Dicatat Oleh</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-custom/60">
                {filtered.map((row) => (
                  <tr key={row.id} className={cn(row.status === 'VOIDED' && 'opacity-50')}>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-text">
                      {formatDateID(row.expense_date)}
                    </td>
                    <td className="px-4 py-3 font-medium text-ink">{row.category_name}</td>
                    <td className="max-w-[16rem] px-4 py-3">
                      <p className={cn('truncate font-medium text-ink', row.status === 'VOIDED' && 'line-through')}>
                        {row.title}
                      </p>
                      {row.description && (
                        <p className="truncate text-xs text-muted-text">{row.description}</p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-ink">
                      {formatIDR(row.amount)}
                    </td>
                    <td className="px-4 py-3 text-muted-text">
                      {METHOD_LABELS[row.payment_method] ?? row.payment_method}
                    </td>
                    <td className="px-4 py-3 text-muted-text">
                      {row.created_by_name ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {row.status === 'ACTIVE' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => openEdit(row)}
                              aria-label={`Ubah ${row.title}`}
                              className="inline-flex min-h-9 items-center gap-1.5 rounded-sm px-2.5 text-xs font-semibold text-muted-text transition-colors hover:bg-muted hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/40 outline-none"
                            >
                              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                              Ubah
                            </button>
                            <button
                              type="button"
                              onClick={() => handleVoid(row)}
                              disabled={pending}
                              className="inline-flex min-h-9 items-center gap-1.5 rounded-sm px-2.5 text-xs font-semibold text-danger transition-colors hover:bg-danger/10 focus-visible:ring-3 focus-visible:ring-ring/40 outline-none disabled:opacity-50"
                            >
                              <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
                              Void
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-muted-text">Di-void</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="space-y-3 md:hidden">
            {filtered.map((row) => (
              <li
                key={row.id}
                className={cn(
                  'rounded-sm border border-border-custom bg-card p-4',
                  row.status === 'VOIDED' && 'opacity-50',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className={cn('font-semibold text-ink', row.status === 'VOIDED' && 'line-through')}>
                      {row.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-text">
                      {formatDateID(row.expense_date)} · {row.category_name} ·{' '}
                      {METHOD_LABELS[row.payment_method] ?? row.payment_method}
                    </p>
                    {row.description && (
                      <p className="mt-1 text-xs text-muted-text">{row.description}</p>
                    )}
                  </div>
                  <span className="shrink-0 font-semibold tabular-nums text-ink">
                    {formatIDR(row.amount)}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-muted-text">
                    {row.status === 'VOIDED' ? 'Di-void' : `Dicatat ${row.created_by_name ?? '—'}`}
                  </span>
                  {row.status === 'ACTIVE' && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(row)}>
                        Ubah
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleVoid(row)}
                        disabled={pending}
                      >
                        Void
                      </Button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {dialogOpen && (
        <ExpenseFormDialog
          categories={categories}
          expense={editing}
          onClose={() => setDialogOpen(false)}
          onSaved={() => startTransition(() => router.refresh())}
        />
      )}
    </div>
  )
}
