import { describe, it, expect } from 'vitest'
import {
  addDays,
  daysBetween,
  isValidDateString,
  jakartaToday,
  resolvePeriod,
  formatDateID,
  formatRangeLabel,
} from '@/lib/finance/period'

describe('date helpers', () => {
  it('adds days across month boundaries', () => {
    expect(addDays('2026-08-28', 4)).toBe('2026-09-01')
    expect(addDays('2026-08-28', -31)).toBe('2026-07-28')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
  })

  it('counts day distances', () => {
    expect(daysBetween('2026-08-01', '2026-08-28')).toBe(27)
    expect(daysBetween('2026-08-28', '2026-08-28')).toBe(0)
  })

  it('validates ISO date strings only', () => {
    expect(isValidDateString('2026-08-28')).toBe(true)
    expect(isValidDateString('2026-13-40')).toBe(false)
    expect(isValidDateString('28/08/2026')).toBe(false)
    expect(isValidDateString(null)).toBe(false)
  })

  it('formats today in Jakarta, not the server timezone', () => {
    // 2026-08-28 17:30 UTC is already 29 Aug in Jakarta (UTC+7).
    const now = new Date('2026-08-28T17:30:00Z')
    expect(jakartaToday(now)).toBe('2026-08-29')
  })
})

function query(p?: string, from?: string, to?: string) {
  return { p, from, to }
}

describe('resolvePeriod', () => {
  const today = jakartaToday()
  const year = today.slice(0, 4)
  const month = today.slice(5, 7)

  it('defaults to THIS_MONTH', () => {
    const result = resolvePeriod({})
    expect(result.key).toBe('THIS_MONTH')
    expect(result.range.start).toBe(`${year}-${month}-01`)
    expect(result.range.end).toBe(today)
  })

  it('resolves TODAY and YESTERDAY', () => {
    expect(resolvePeriod(query('TODAY')).range).toEqual({ start: today, end: today })
    expect(resolvePeriod(query('YESTERDAY')).range.start).toBe(addDays(today, -1))
  })

  it('resolves rolling windows', () => {
    expect(resolvePeriod(query('LAST_7')).range.start).toBe(addDays(today, -6))
    expect(resolvePeriod(query('LAST_30')).range.start).toBe(addDays(today, -29))
  })

  it('starts THIS_WEEK on Monday', () => {
    const { range } = resolvePeriod(query('THIS_WEEK'))
    const weekday = new Date(`${range.start}T00:00:00Z`).getUTCDay()
    expect(weekday).toBe(1)
  })

  it('resolves LAST_MONTH as a complete month', () => {
    const { range } = resolvePeriod(query('LAST_MONTH'))
    expect(range.start.endsWith('-01')).toBe(true)
    const nextMonth = addDays(range.end, 1)
    expect(nextMonth.slice(8, 10)).toBe('01')
  })

  it('resolves THIS_YEAR from January 1st', () => {
    const { range } = resolvePeriod(query('THIS_YEAR'))
    expect(range.start).toBe(`${year}-01-01`)
    expect(range.end).toBe(today)
  })

  it('accepts a valid custom range and swaps inverted bounds', () => {
    const result = resolvePeriod(query('CUSTOM', '2026-08-01', '2026-08-10'))
    expect(result.range).toEqual({ start: '2026-08-01', end: '2026-08-10' })
    expect(resolvePeriod(query('CUSTOM', '2026-08-10', '2026-08-01')).range).toEqual({
      start: '2026-08-01',
      end: '2026-08-10',
    })
  })

  it('clamps oversized custom ranges to 366 days', () => {
    const result = resolvePeriod(query('CUSTOM', '2025-01-01', '2026-08-28'))
    expect(result.range.end).toBe('2026-08-28')
    expect(daysBetween(result.range.start, result.range.end)).toBeLessThanOrEqual(365)
  })

  it('falls back to THIS_MONTH for invalid input', () => {
    expect(resolvePeriod(query('CUSTOM', 'bukan-tanggal', '2026-08-28')).key).toBe('THIS_MONTH')
    expect(resolvePeriod(query('HACKED')).key).toBe('THIS_MONTH')
  })
})

describe('formatting', () => {
  it('formats Indonesian short dates', () => {
    expect(formatDateID('2026-08-28')).toBe('28 Agu 2026')
    expect(formatDateID('2026-08-28', false)).toBe('28 Agu')
  })

  it('formats single-day and ranged labels', () => {
    expect(formatRangeLabel({ start: '2026-08-28', end: '2026-08-28' })).toBe('28 Agu 2026')
    expect(formatRangeLabel({ start: '2026-08-01', end: '2026-08-28' })).toBe(
      '1 Agu 2026 – 28 Agu 2026'
    )
  })
})
