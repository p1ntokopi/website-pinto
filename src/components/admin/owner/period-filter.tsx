'use client'

import { useState, useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  PERIOD_OPTIONS,
  type PeriodKey,
} from '@/lib/finance/period'

/**
 * Period filter that writes ?p=&from=&to= into the URL, so every financial
 * page state is shareable and survives refreshes. Server pages re-query the
 * RPC with the resolved range.
 */
export function PeriodFilter({ currentKey }: { currentKey: PeriodKey }) {
  const router = useRouter()
  const pathname = usePathname()
  const [pending, startTransition] = useTransition()
  const [customOpen, setCustomOpen] = useState(currentKey === 'CUSTOM')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  function navigate(params: { p: string; from?: string; to?: string }) {
    const search = new URLSearchParams({ p: params.p })
    if (params.from) search.set('from', params.from)
    if (params.to) search.set('to', params.to)
    startTransition(() => router.push(`${pathname}?${search.toString()}`))
  }

  function applyCustomRange() {
    if (!from || !to) return
    navigate({ p: 'CUSTOM', from, to })
  }

  return (
    <div className="space-y-2">
      <div
        role="group"
        aria-label="Filter periode"
        className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-1"
      >
        <CalendarDays
          className="mr-1 h-4 w-4 shrink-0 text-coffee"
          aria-hidden="true"
        />
        {PERIOD_OPTIONS.map((option) => {
          const isActive = currentKey === option.key
          return (
            <button
              key={option.key}
              type="button"
              aria-pressed={isActive}
              disabled={pending}
              onClick={() => navigate({ p: option.key })}
              className={cn(
                'min-h-9 shrink-0 rounded-full border px-3.5 text-xs font-semibold transition-colors focus-visible:ring-3 focus-visible:ring-ring/40 outline-none disabled:opacity-60',
                isActive
                  ? 'border-coffee bg-coffee text-paper'
                  : 'border-border-custom bg-paper text-muted-text hover:border-coffee/40 hover:text-ink',
              )}
            >
              {option.label}
            </button>
          )
        })}
        <button
          type="button"
          aria-pressed={currentKey === 'CUSTOM'}
          aria-expanded={customOpen}
          disabled={pending}
          onClick={() => setCustomOpen((open) => !open)}
          className={cn(
            'min-h-9 shrink-0 rounded-full border px-3.5 text-xs font-semibold transition-colors focus-visible:ring-3 focus-visible:ring-ring/40 outline-none disabled:opacity-60',
            currentKey === 'CUSTOM'
              ? 'border-coffee bg-coffee text-paper'
              : 'border-border-custom bg-paper text-muted-text hover:border-coffee/40 hover:text-ink',
          )}
        >
          Kustom
        </button>
      </div>

      {customOpen && (
        <div className="flex flex-wrap items-end gap-2 rounded-sm border border-border-custom bg-card p-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-muted-text">
            Tanggal mulai
            <input
              type="date"
              value={from}
              max={to || undefined}
              onChange={(event) => setFrom(event.target.value)}
              className="h-9 rounded-sm border border-border-custom bg-paper px-2.5 text-sm text-ink focus-visible:ring-3 focus-visible:ring-ring/40 outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-muted-text">
            Tanggal akhir
            <input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(event) => setTo(event.target.value)}
              className="h-9 rounded-sm border border-border-custom bg-paper px-2.5 text-sm text-ink focus-visible:ring-3 focus-visible:ring-ring/40 outline-none"
            />
          </label>
          <button
            type="button"
            onClick={applyCustomRange}
            disabled={!from || !to || pending}
            className="min-h-9 rounded-sm bg-ink px-4 text-sm font-semibold text-paper transition-colors hover:bg-ink/90 focus-visible:ring-3 focus-visible:ring-ring/40 outline-none disabled:opacity-60"
          >
            Terapkan
          </button>
          <p className="w-full text-xs text-muted-text">Rentang maksimal 366 hari.</p>
        </div>
      )}
    </div>
  )
}
