/**
 * Aggregation of the daily series returned by the RPC into weekly/monthly
 * buckets for the sales analytics charts. Pure functions, unit tested.
 */

export type SeriesGranularity = 'DAILY' | 'WEEKLY' | 'MONTHLY'

export type SeriesPoint = { day: string; value: number }

function toUtcDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

function bucketStart(day: string, granularity: SeriesGranularity): string {
  if (granularity === 'DAILY') return day
  const date = toUtcDate(day)
  if (granularity === 'MONTHLY') {
    return `${day.slice(0, 7)}-01`
  }
  // Week starts on Monday.
  const weekday = date.getUTCDay()
  const diff = weekday === 0 ? -6 : 1 - weekday
  date.setUTCDate(date.getUTCDate() + diff)
  return date.toISOString().slice(0, 10)
}

export function aggregateSeries(
  points: SeriesPoint[],
  granularity: SeriesGranularity,
): SeriesPoint[] {
  const buckets = new Map<string, number>()
  for (const point of points) {
    const key = bucketStart(point.day, granularity)
    buckets.set(key, (buckets.get(key) ?? 0) + point.value)
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([day, value]) => ({ day, value }))
}
