'use client'

import { useMemo, useState } from 'react'
import { History, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatIDR } from '@/lib/finance/format'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/admin/owner/empty-state'

export type AuditRow = {
  id: string
  created_at: string
  action: string
  entity_type: string
  metadata: Record<string, unknown> | null
  actor_name: string | null
}

const ACTION_LABELS: Record<string, string> = {
  'expense.created': 'Pengeluaran dibuat',
  'expense.updated': 'Pengeluaran diubah',
  'expense.voided': 'Pengeluaran di-void',
  'adjustment.created': 'Penyesuaian dibuat',
  'adjustment.updated': 'Penyesuaian diubah',
  'adjustment.voided': 'Penyesuaian di-void',
}

const ENTITY_LABELS: Record<string, string> = {
  expenses: 'Pengeluaran',
  financial_adjustments: 'Penyesuaian',
}

type EntityFilter = 'ALL' | 'expenses' | 'financial_adjustments'
type EventFilter = 'ALL' | 'created' | 'updated' | 'voided'

function formatMetadata(metadata: Record<string, unknown> | null): string {
  if (!metadata) return '—'
  const title = typeof metadata.title === 'string' ? metadata.title : null
  const type = typeof metadata.adjustment_type === 'string' ? metadata.adjustment_type : null
  const amount = typeof metadata.amount === 'number' ? formatIDR(metadata.amount) : null
  const parts = [title ?? (type ? (type === 'REFUND' ? 'Refund' : 'Koreksi') : null), amount].filter(
    Boolean,
  )
  return parts.length > 0 ? parts.join(' · ') : '—'
}

function formatStatus(metadata: Record<string, unknown> | null): string {
  const status = metadata && typeof metadata.status === 'string' ? metadata.status : null
  if (status === 'ACTIVE') return 'Aktif'
  if (status === 'VOIDED') return 'Di-void'
  return '—'
}

export function AuditClient({ rows }: { rows: AuditRow[] }) {
  const [search, setSearch] = useState('')
  const [entityFilter, setEntityFilter] = useState<EntityFilter>('ALL')
  const [eventFilter, setEventFilter] = useState<EventFilter>('ALL')

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return rows.filter((row) => {
      if (entityFilter !== 'ALL' && row.entity_type !== entityFilter) return false
      if (eventFilter !== 'ALL' && !row.action.endsWith(`.${eventFilter}`)) return false
      if (query && !JSON.stringify(row.metadata ?? {}).toLowerCase().includes(query)) {
        return false
      }
      return true
    })
  }, [rows, search, entityFilter, eventFilter])

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
            placeholder="Cari detail…"
            className="pl-9"
            aria-label="Cari audit log"
          />
        </div>
        {(
          [
            { value: 'ALL', label: 'Semua Entitas' },
            { value: 'expenses', label: 'Pengeluaran' },
            { value: 'financial_adjustments', label: 'Penyesuaian' },
          ] as const
        ).map((option) => (
          <Chip
            key={option.value}
            active={entityFilter === option.value}
            onClick={() => setEntityFilter(option.value)}
          >
            {option.label}
          </Chip>
        ))}
        {(
          [
            { value: 'ALL', label: 'Semua Aksi' },
            { value: 'created', label: 'Dibuat' },
            { value: 'updated', label: 'Diubah' },
            { value: 'voided', label: 'Di-void' },
          ] as const
        ).map((option) => (
          <Chip
            key={option.value}
            active={eventFilter === option.value}
            onClick={() => setEventFilter(option.value)}
          >
            {option.label}
          </Chip>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={History}
          title="Belum ada aktivitas tercatat"
          description="Setiap perubahan pengeluaran & penyesuaian akan tercatat di sini secara otomatis."
        />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-sm border border-border-custom bg-card md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-custom/60 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-text">
                  <th className="px-4 py-2.5 font-semibold">Waktu</th>
                  <th className="px-4 py-2.5 font-semibold">Aksi</th>
                  <th className="px-4 py-2.5 font-semibold">Detail</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                  <th className="px-4 py-2.5 font-semibold">Oleh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-custom/60">
                {filtered.map((row) => (
                  <tr key={row.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-text">
                      {new Date(row.created_at).toLocaleString('id-ID', {
                        timeZone: 'Asia/Jakarta',
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3 font-medium text-ink">
                      {ACTION_LABELS[row.action] ?? row.action}
                      <span className="ml-1.5 text-xs text-muted-text">
                        ({ENTITY_LABELS[row.entity_type] ?? row.entity_type})
                      </span>
                    </td>
                    <td className="max-w-[18rem] px-4 py-3">
                      <p className="truncate text-ink">{formatMetadata(row.metadata)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'text-xs',
                          formatStatus(row.metadata) === 'Di-void' ? 'text-danger' : 'text-muted-text',
                        )}
                      >
                        {formatStatus(row.metadata)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-text">{row.actor_name ?? 'Sistem'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="space-y-3 md:hidden">
            {filtered.map((row) => (
              <li key={row.id} className="rounded-sm border border-border-custom bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{ACTION_LABELS[row.action] ?? row.action}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-text">
                      {formatMetadata(row.metadata)}
                    </p>
                    <p className="mt-1 text-xs text-muted-text">
                      {new Date(row.created_at).toLocaleString('id-ID', {
                        timeZone: 'Asia/Jakarta',
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      · {row.actor_name ?? 'Sistem'}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 text-xs',
                      formatStatus(row.metadata) === 'Di-void' ? 'text-danger' : 'text-muted-text',
                    )}
                  >
                    {formatStatus(row.metadata)}
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

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'min-h-9 shrink-0 rounded-full border px-3.5 text-xs font-semibold transition-colors focus-visible:ring-3 focus-visible:ring-ring/40 outline-none',
        active
          ? 'border-coffee bg-coffee text-paper'
          : 'border-border-custom bg-paper text-muted-text hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}
