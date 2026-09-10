/**
 * Period filter resolution for the owner financial area.
 *
 * All date math works on 'yyyy-MM-dd' strings anchored to UTC so there is no
 * timezone drift; "today" is determined in Asia/Jakarta because that is the
 * shop's operating timezone (and matches the SQL RPC bucketing).
 */

export const FINANCE_TIMEZONE = 'Asia/Jakarta'

export const PERIOD_PRESETS = [
  'TODAY',
  'YESTERDAY',
  'LAST_7',
  'LAST_30',
  'THIS_WEEK',
  'THIS_MONTH',
  'LAST_MONTH',
  'THIS_YEAR',
] as const

export type PeriodKey = (typeof PERIOD_PRESETS)[number] | 'CUSTOM'

export type DateRange = { start: string; end: string }

export type ResolvedPeriod = {
  key: PeriodKey
  range: DateRange
  label: string
}

export const MAX_RANGE_DAYS = 366
export const TRANSACTION_RANGE_DAYS = 92

export const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: 'TODAY', label: 'Hari Ini' },
  { key: 'YESTERDAY', label: 'Kemarin' },
  { key: 'LAST_7', label: '7 Hari Terakhir' },
  { key: 'LAST_30', label: '30 Hari Terakhir' },
  { key: 'THIS_WEEK', label: 'Minggu Ini' },
  { key: 'THIS_MONTH', label: 'Bulan Ini' },
  { key: 'LAST_MONTH', label: 'Bulan Lalu' },
  { key: 'THIS_YEAR', label: 'Tahun Ini' },
]

const DAY_MS = 86_400_000

function toUtcDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

function fromUtcDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function addDays(dateStr: string, amount: number): string {
  const date = toUtcDate(dateStr)
  date.setUTCDate(date.getUTCDate() + amount)
  return fromUtcDate(date)
}

export function daysBetween(start: string, end: string): number {
  return Math.round((toUtcDate(end).getTime() - toUtcDate(start).getTime()) / DAY_MS)
}

export function isValidDateString(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = toUtcDate(value)
  if (Number.isNaN(date.getTime())) return false
  // Reject calendar-invalid inputs like '2026-13-40' (Date.UTC rolls them over).
  return fromUtcDate(date) === value
}

/** Today's date in the shop timezone as 'yyyy-MM-dd'. */
export function jakartaToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: FINANCE_TIMEZONE }).format(now)
}

/** UTC bounds for one Jakarta calendar day, suitable for timestamptz filters. */
export function jakartaDayBounds(dateStr: string): { start: string; end: string } {
  if (!isValidDateString(dateStr)) {
    throw new Error(`Tanggal Jakarta tidak valid: ${dateStr}`)
  }

  const start = new Date(`${dateStr}T00:00:00+07:00`)
  const end = new Date(start.getTime() + DAY_MS)
  return { start: start.toISOString(), end: end.toISOString() }
}

function firstOfMonth(dateStr: string): string {
  return `${dateStr.slice(0, 7)}-01`
}

function endOfMonth(dateStr: string): string {
  const date = toUtcDate(firstOfMonth(dateStr))
  date.setUTCMonth(date.getUTCMonth() + 1)
  date.setUTCDate(0)
  return fromUtcDate(date)
}

function startOfWeek(dateStr: string): string {
  // Week starts on Monday.
  const date = toUtcDate(dateStr)
  const weekday = date.getUTCDay() // 0 = Sunday
  const diff = weekday === 0 ? -6 : 1 - weekday
  return addDays(dateStr, diff)
}

function resolvePreset(key: (typeof PERIOD_PRESETS)[number], today: string): DateRange {
  switch (key) {
    case 'TODAY':
      return { start: today, end: today }
    case 'YESTERDAY':
      return { start: addDays(today, -1), end: addDays(today, -1) }
    case 'LAST_7':
      return { start: addDays(today, -6), end: today }
    case 'LAST_30':
      return { start: addDays(today, -29), end: today }
    case 'THIS_WEEK':
      return { start: startOfWeek(today), end: today }
    case 'THIS_MONTH':
      return { start: firstOfMonth(today), end: today }
    case 'LAST_MONTH': {
      const lastMonthToday = (() => {
        const date = toUtcDate(today)
        date.setUTCDate(0)
        return fromUtcDate(date)
      })()
      return { start: firstOfMonth(lastMonthToday), end: endOfMonth(lastMonthToday) }
    }
    case 'THIS_YEAR':
      return { start: `${today.slice(0, 4)}-01-01`, end: today }
  }
}

function readParam(value: string | string[] | undefined): string | undefined {
  const first = Array.isArray(value) ? value[0] : value
  return first || undefined
}

/**
 * Resolve the period from URL search params. Falls back to THIS_MONTH when
 * the requested key or custom range is invalid; custom ranges are clamped to
 * MAX_RANGE_DAYS ending at the requested end date.
 */
export function resolvePeriod(query: {
  p?: string | string[]
  from?: string | string[]
  to?: string | string[]
}): ResolvedPeriod {
  const today = jakartaToday()
  const key = (readParam(query.p) ?? 'THIS_MONTH') as PeriodKey

  if (key === 'CUSTOM') {
    const from = readParam(query.from)
    const to = readParam(query.to)
    if (isValidDateString(from) && isValidDateString(to)) {
      let start = from
      let end = to
      if (end < start) [start, end] = [end, start]
      if (daysBetween(start, end) > MAX_RANGE_DAYS) {
        start = addDays(end, -(MAX_RANGE_DAYS - 1))
      }
      return {
        key: 'CUSTOM',
        range: { start, end },
        label: 'Kustom',
      }
    }
    return {
      key: 'THIS_MONTH',
      range: resolvePreset('THIS_MONTH', today),
      label: 'Bulan Ini',
    }
  }

  if (PERIOD_PRESETS.includes(key as (typeof PERIOD_PRESETS)[number])) {
    return { key, range: resolvePreset(key, today), label: labelFor(key) }
  }

  return {
    key: 'THIS_MONTH',
    range: resolvePreset('THIS_MONTH', today),
    label: 'Bulan Ini',
  }
}

function labelFor(key: PeriodKey): string {
  return PERIOD_OPTIONS.find((option) => option.key === key)?.label ?? 'Bulan Ini'
}

/** Formats 'yyyy-MM-dd' as e.g. '28 Agu 2026' for display. */
const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
]

export function formatDateID(dateStr: string, withYear = true): string {
  if (!isValidDateString(dateStr)) return dateStr
  const date = toUtcDate(dateStr)
  const month = SHORT_MONTHS[date.getUTCMonth()]
  const day = date.getUTCDate()
  if (!withYear) return `${day} ${month}`
  return `${day} ${month} ${date.getUTCFullYear()}`
}

export function formatRangeLabel(range: DateRange): string {
  if (range.start === range.end) return formatDateID(range.start)
  return `${formatDateID(range.start)} – ${formatDateID(range.end)}`
}
