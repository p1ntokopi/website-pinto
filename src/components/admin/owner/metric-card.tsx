import { cn } from '@/lib/utils'

type MetricTone = 'default' | 'positive' | 'negative'

const TONE_VALUE_CLASS: Record<MetricTone, string> = {
  default: 'text-ink',
  positive: 'text-success',
  negative: 'text-danger',
}

/**
 * Visual hierarchy per spec: revenue & estimated surplus are primary (large),
 * everything else is secondary (compact strip).
 */
export function PrimaryMetric({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string
  value: string
  hint?: string
  tone?: MetricTone
}) {
  return (
    <div className="rounded-sm border border-border-custom bg-card p-5 sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-text">
        {label}
      </p>
      <p
        className={cn(
          'mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl',
          TONE_VALUE_CLASS[tone],
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1.5 text-xs text-muted-text">{hint}</p>}
    </div>
  )
}

export function SecondaryMetric({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string
  value: string
  hint?: string
  tone?: MetricTone
}) {
  return (
    <div className="px-4 py-4 sm:px-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-text">
        {label}
      </p>
      <p className={cn('mt-1.5 text-xl font-bold tracking-tight', TONE_VALUE_CLASS[tone])}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-text">{hint}</p>}
    </div>
  )
}
