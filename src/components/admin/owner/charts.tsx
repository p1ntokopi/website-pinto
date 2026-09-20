'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartColumn } from 'lucide-react'
import { formatIDR, formatIDRCompact, formatNumberID } from '@/lib/finance/format'
import { formatDateID } from '@/lib/finance/period'
import { EmptyState } from '@/components/admin/owner/empty-state'

export type TrendPoint = { day: string; value: number }

/**
 * Minimal bar chart — one series, coffee accent, no decorations. Revenue and
 * order volume deliberately use separate charts: they are different metrics.
 */
export function TrendChart({
  data,
  kind,
  emptyTitle,
  emptyDescription,
}: {
  data: TrendPoint[]
  kind: 'currency' | 'count'
  emptyTitle: string
  emptyDescription: string
}) {
  const valueFormatter = kind === 'currency' ? formatIDR : formatNumberID
  const axisFormatter = kind === 'currency' ? formatIDRCompact : (value: number) => String(value)
  const hasData = data.some((point) => point.value > 0)

  if (!hasData) {
    return <EmptyState icon={ChartColumn} title={emptyTitle} description={emptyDescription} />
  }

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border-custom)" strokeDasharray="3 3" />
          <XAxis
            dataKey="day"
            tickFormatter={(day: string) => formatDateID(day, false)}
            tick={{ fontSize: 11, fill: 'var(--muted-text)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border-custom)' }}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            tickFormatter={axisFormatter}
            tick={{ fontSize: 11, fill: 'var(--muted-text)' }}
            tickLine={false}
            axisLine={false}
            width={56}
          />
          <Tooltip
            cursor={{ fill: 'color-mix(in srgb, var(--coffee) 6%, transparent)' }}
            content={<TrendTooltip format={valueFormatter} />}
          />
          <Bar dataKey="value" fill="var(--coffee)" radius={[2, 2, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function TrendTooltip({
  active,
  payload,
  label,
  format,
}: {
  active?: boolean
  payload?: { value?: number }[]
  label?: string
  format: (value: number) => string
}) {
  if (!active || !payload?.length) return null
  const value = payload[0]?.value ?? 0
  return (
    <div className="rounded-sm border border-border-custom bg-paper px-3 py-2 shadow-sm">
      <p className="text-xs font-semibold text-ink">{format(value)}</p>
      <p className="text-xs text-muted-text">{label ? formatDateID(label) : ''}</p>
    </div>
  )
}
