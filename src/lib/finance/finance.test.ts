import { describe, it, expect } from 'vitest'
import { toCsv } from '@/lib/finance/csv'
import { aggregateSeries } from '@/lib/finance/series'
import {
  parseFinancialSummary,
  computeNetSales,
  computeEstimatedSurplus,
  computeAov,
  type FinancialSummary,
} from '@/lib/finance/types'

describe('toCsv', () => {
  it('joins with ; and CRLF, prefixed with a UTF-8 BOM', () => {
    const csv = toCsv(['Tanggal', 'Total'], [['2026-08-28', 1250000]])
    expect(csv.charCodeAt(0)).toBe(0xfeff)
    expect(csv).toContain('Tanggal;Total\r\n')
    expect(csv).toContain('2026-08-28;1250000\r\n')
  })

  it('escapes cells containing delimiter, quotes, or newlines', () => {
    const csv = toCsv(['Deskripsi'], [['Gas; "5kg"']])
    expect(csv).toContain('"Gas; ""5kg"""')
  })

  it('renders null and undefined as empty cells', () => {
    const csv = toCsv(['A', 'B'], [[null, undefined]])
    expect(csv).toContain(';\r\n')
  })
})

describe('aggregateSeries', () => {
  it('keeps daily points as-is', () => {
    const points = [
      { day: '2026-08-25', value: 100 },
      { day: '2026-08-26', value: 200 },
    ]
    expect(aggregateSeries(points, 'DAILY')).toEqual(points)
  })

  it('buckets into weeks starting Monday', () => {
    const points = [
      // Sen (24 Aug) + Sel (25 Aug) are in the week starting 24 Aug 2026.
      { day: '2026-08-24', value: 100 },
      { day: '2026-08-25', value: 50 },
      // Min (30 Aug) belongs to the same Monday-based week.
      { day: '2026-08-30', value: 25 },
      // Sen (31 Aug) starts a new week.
      { day: '2026-08-31', value: 10 },
    ]
    expect(aggregateSeries(points, 'WEEKLY')).toEqual([
      { day: '2026-08-24', value: 175 },
      { day: '2026-08-31', value: 10 },
    ])
  })

  it('buckets into months', () => {
    const points = [
      { day: '2026-07-30', value: 100 },
      { day: '2026-07-31', value: 10 },
      { day: '2026-08-01', value: 5 },
    ]
    expect(aggregateSeries(points, 'MONTHLY')).toEqual([
      { day: '2026-07-01', value: 110 },
      { day: '2026-08-01', value: 5 },
    ])
  })

  it('returns an empty array for empty input', () => {
    expect(aggregateSeries([], 'WEEKLY')).toEqual([])
  })
})

const baseSummary: FinancialSummary = {
  period: { start: '2026-08-01', end: '2026-08-28' },
  sales: {
    paid_order_count: 100,
    gross: 10_000_000,
    discount: 500_000,
    tax: 0,
    service_fee: 0,
    shipping_fee: 0,
  },
  refund: { total: 200_000, count: 2 },
  adjustment: { total: 50_000 },
  expense: { total: 3_000_000, count: 12, avg_daily: 107_142.86 },
  expense_by_category: [],
  payment_breakdown: [],
  revenue_series: [],
  orders_series: [],
  top_products: [],
  category_performance: [],
  beans: { units: 0, revenue: 0, avg_price: null, top_product: null },
  order_reconciliation: {
    total: 120,
    cancelled: 8,
    paid: 100,
    unpaid: 12,
    pending_payment: 5,
  },
  cash_flow: { in: 1_500_000, out: 450_000, net: 1_050_000 },
}

describe('financial formulas', () => {
  it('parses a valid RPC payload', () => {
    expect(parseFinancialSummary(baseSummary).sales.gross).toBe(10_000_000)
  })

  it('rejects malformed payloads', () => {
    expect(() => parseFinancialSummary(null)).toThrow()
    expect(() => parseFinancialSummary({ foo: 1 })).toThrow()
    expect(() => parseFinancialSummary({ ...baseSummary, revenue_series: undefined })).toThrow()
  })

  it('computes net sales as gross - discount - refund + adjustments', () => {
    expect(computeNetSales(baseSummary)).toBe(9_350_000)
  })

  it('computes estimated surplus as net sales minus expenses', () => {
    expect(computeEstimatedSurplus(baseSummary)).toBe(6_350_000)
  })

  it('computes AOV from net sales and paid orders', () => {
    expect(computeAov(baseSummary)).toBe(93_500)
    expect(computeAov({ ...baseSummary, sales: { ...baseSummary.sales, paid_order_count: 0 } })).toBe(0)
  })
})
