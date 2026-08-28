'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Banknote, Loader2, Pencil, Plus, Undo2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatIDR, formatNumberID } from '@/lib/finance/format'
import { formatDateID } from '@/lib/finance/period'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/admin/owner/empty-state'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  createAdjustment,
  voidAdjustment,
} from '@/app/admin/(dashboard)/owner/adjustments/actions'

export type AdjustmentRow = {
  id: string
  adjustment_type: string
  amount: number
  reason: string
  effective_date: string
  status: string
  order_number: string | null
  created_by_name: string | null
}

type StatusFilter = 'ACTIVE' | 'VOIDED' | 'ALL'
type TypeFilter = 'REFUND' | 'CORRECTION'

function todayJakarta(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date())
}

export function AdjustmentsClient({
  rows,
  strip,
}: {
  rows: AdjustmentRow[]
  strip: { refundTotal: number; correctionTotal: number; count: number }
}) {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ACTIVE')
  const [search, setSearch] = useState('')
  const [pending, startTransition] = useTransition()
  const [actionError, setActionError] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return rows.filter((row) => {
      if (statusFilter !== 'ALL' && row.status !== statusFilter) return false
      if (
        query &&
        !`${row.reason} ${row.order_number ?? ''}`.toLowerCase().includes(query)
      ) {
        return false
      }
      return true
    })
  }, [rows, statusFilter, search])

  function handleVoid(row: AdjustmentRow) {
    if (
      !window.confirm(
        `Batalkan (void) penyesuaian "${row.adjustment_type === 'REFUND' ? 'Refund' : 'Koreksi'} ${formatIDR(Math.abs(row.amount))}"? Riwayat tetap tersimpan.`,
      )
    ) {
      return
    }
    setActionError(null)
    startTransition(async () => {
      const result = await voidAdjustment(row.id)
      if (!result.ok) {
        setActionError(result.error ?? 'Gagal membatalkan penyesuaian.')
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 divide-y divide-border-custom/60 rounded-sm border border-border-custom bg-card sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-text">
            Total Refund
          </p>
          <p className="mt-1.5 text-xl font-bold text-danger">− {formatIDR(strip.refundTotal)}</p>
        </div>
        <div className="px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-text">
            Total Koreksi
          </p>
          <p
            className={cn(
              'mt-1.5 text-xl font-bold',
              strip.correctionTotal >= 0 ? 'text-ink' : 'text-danger',
            )}
          >
            {strip.correctionTotal >= 0 ? '+ ' : '− '}
            {formatIDR(Math.abs(strip.correctionTotal))}
          </p>
        </div>
        <div className="px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-text">
            Transaksi
          </p>
          <p className="mt-1.5 text-xl font-bold text-ink">{formatNumberID(strip.count)}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari alasan / no order…"
            aria-label="Cari penyesuaian"
          />
        </div>
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
        <AdjustmentFormDialog
          trigger={
            <Button>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Catat Penyesuaian
            </Button>
          }
        />
      </div>

      {actionError && (
        <p
          role="alert"
          className="rounded-sm border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
        >
          {actionError}
        </p>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={Banknote}
          title="Belum ada penyesuaian pada periode ini."
          description="Catat refund atau koreksi agar Net Sales akurat."
        />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-sm border border-border-custom bg-card md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-custom/60 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-text">
                  <th className="px-4 py-2.5 font-semibold">Tanggal</th>
                  <th className="px-4 py-2.5 font-semibold">Tipe</th>
                  <th className="px-4 py-2.5 font-semibold">Alasan</th>
                  <th className="px-4 py-2.5 font-semibold">Order</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Nominal</th>
                  <th className="px-4 py-2.5 font-semibold">Dicatat Oleh</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-custom/60">
                {filtered.map((row) => (
                  <tr key={row.id} className={cn(row.status === 'VOIDED' && 'opacity-50')}>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-text">
                      {formatDateID(row.effective_date)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium',
                          row.adjustment_type === 'REFUND'
                            ? 'border-info/25 bg-info/10 text-info'
                            : 'border-border-custom bg-muted text-ink',
                        )}
                      >
                        {row.adjustment_type === 'REFUND' ? 'Refund' : 'Koreksi'}
                      </span>
                    </td>
                    <td className="max-w-[16rem] px-4 py-3">
                      <p className={cn('truncate font-medium text-ink', row.status === 'VOIDED' && 'line-through')}>
                        {row.reason}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-text">
                      {row.order_number ?? '—'}
                    </td>
                    <td
                      className={cn(
                        'whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums',
                        row.adjustment_type === 'REFUND' || row.amount < 0
                          ? 'text-danger'
                          : 'text-ink',
                      )}
                    >
                      {row.amount < 0 ? '− ' : row.adjustment_type === 'REFUND' ? '− ' : '+ '}
                      {formatIDR(Math.abs(row.amount))}
                    </td>
                    <td className="px-4 py-3 text-muted-text">{row.created_by_name ?? '—'}</td>
                    <td className="px-4 py-3 text-right">
                      {row.status === 'ACTIVE' ? (
                        <button
                          type="button"
                          onClick={() => handleVoid(row)}
                          disabled={pending}
                          className="inline-flex min-h-9 items-center gap-1.5 rounded-sm px-2.5 text-xs font-semibold text-danger transition-colors hover:bg-danger/10 focus-visible:ring-3 focus-visible:ring-ring/40 outline-none disabled:opacity-50"
                        >
                          <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
                          Void
                        </button>
                      ) : (
                        <span className="text-xs text-muted-text">Di-void</span>
                      )}
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
                      {row.adjustment_type === 'REFUND' ? 'Refund' : 'Koreksi'} · {row.reason}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-text">
                      {formatDateID(row.effective_date)}
                      {row.order_number ? ` · ${row.order_number}` : ''} ·{' '}
                      {row.created_by_name ?? '—'}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 font-semibold tabular-nums',
                      row.adjustment_type === 'REFUND' || row.amount < 0
                        ? 'text-danger'
                        : 'text-ink',
                    )}
                  >
                    {row.amount < 0 ? '− ' : row.adjustment_type === 'REFUND' ? '− ' : '+ '}
                    {formatIDR(Math.abs(row.amount))}
                  </span>
                </div>
                {row.status === 'ACTIVE' && (
                  <div className="mt-3 flex justify-end">
                    <Button variant="destructive" size="sm" onClick={() => handleVoid(row)} disabled={pending}>
                      <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Void
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

function AdjustmentFormDialog({ trigger }: { trigger: React.ReactElement }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<TypeFilter>('REFUND')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(todayJakarta())
  const [orderNumber, setOrderNumber] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    setError(null)
    setSubmitting(true)
    const result = await createAdjustment({
      adjustment_type: type,
      amount,
      effective_date: date,
      reason,
      orderNumber: orderNumber.trim() || undefined,
    })
    setSubmitting(false)
    if (!result.ok) {
      setError(result.error ?? 'Terjadi kesalahan.')
      return
    }
    setOpen(false)
    setAmount('')
    setOrderNumber('')
    setReason('')
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-coffee" />
            Catat Penyesuaian
          </DialogTitle>
          <DialogDescription>
            Refund mengurangi Net Sales; koreksi boleh positif atau negatif.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-text">
              Tipe
            </p>
            <div role="group" aria-label="Tipe penyesuaian" className="flex gap-2">
              {(
                [
                  { value: 'REFUND', label: 'Refund' },
                  { value: 'CORRECTION', label: 'Koreksi' },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={type === option.value}
                  onClick={() => setType(option.value)}
                  className={cn(
                    'min-h-11 flex-1 rounded-sm border px-4 text-sm font-semibold transition-colors focus-visible:ring-3 focus-visible:ring-ring/40 outline-none',
                    type === option.value
                      ? 'border-coffee bg-coffee text-paper'
                      : 'border-border-custom bg-paper text-muted-text hover:text-ink',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-semibold text-muted-text">
              {type === 'REFUND' ? 'Nominal refund (Rp)' : 'Nominal koreksi (Rp)'}
              <Input
                type="number"
                step="1"
                min={type === 'REFUND' ? '1' : undefined}
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder={type === 'REFUND' ? '50000' : 'cth. -25000 atau 25000'}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-muted-text">
              Tanggal efektif
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="h-10 rounded-sm border border-border-custom bg-paper px-3 text-sm text-ink focus-visible:ring-3 focus-visible:ring-ring/40 outline-none"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-xs font-semibold text-muted-text">
            No order (opsional)
            <Input
              value={orderNumber}
              onChange={(event) => setOrderNumber(event.target.value)}
              placeholder="cth. Pinto-260828-0001"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-semibold text-muted-text">
            Alasan (wajib)
            <Textarea
              rows={2}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="cth. Pesanan salah dikirim, kompensasi pelanggan"
            />
          </label>

          {error && (
            <p role="alert" className="rounded-sm border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            Batal
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
            Simpan Penyesuaian
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
