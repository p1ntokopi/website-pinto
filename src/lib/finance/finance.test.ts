import { describe, it, expect } from 'vitest'
import { jakartaDayBounds } from '@/lib/finance/period'
import { toCsv } from '@/lib/finance/csv'
import { aggregateSeries } from '@/lib/finance/series'
import {
  parseFinancialSummary,
  computeNetSales,
  computeEstimatedSurplus,
  computeAov,
  computeRealizedRevenue,
  canonicalizeRealizedPayments,
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
    expect(() =>
      parseFinancialSummary({ ...baseSummary, revenue_series: undefined }),
    ).toThrow()
  })

  it('computes net sales as gross - discount - refund + adjustments', () => {
    expect(computeNetSales(baseSummary)).toBe(9_350_000)
  })

  it('computes estimated surplus as net sales minus expenses', () => {
    expect(computeEstimatedSurplus(baseSummary)).toBe(6_350_000)
  })

  it('computes AOV from net sales and paid orders', () => {
    expect(computeAov(baseSummary)).toBe(93_500)
    expect(
      computeAov({
        ...baseSummary,
        sales: { ...baseSummary.sales, paid_order_count: 0 },
      }),
    ).toBe(0)
  })
})

describe('Jakarta day bounds', () => {
  it('maps a Jakarta calendar day to an exclusive UTC range', () => {
    expect(jakartaDayBounds('2026-09-10')).toEqual({
      start: '2026-09-09T17:00:00.000Z',
      end: '2026-09-10T17:00:00.000Z',
    })
  })
})

describe('realized payment revenue', () => {
  it('counts historical order payments and session bills once each', () => {
    expect(
      computeRealizedRevenue([
        {
          id: 'pay-order',
          order_id: 'order-1',
          status: 'PAID',
          amount: 45_000,
        },
        {
          id: 'pay-session',
          dining_session_id: 'session-1',
          status: 'PAID',
          amount: 120_000,
        },
      ]),
    ).toBe(165_000)
  })

  it('does not multiply a session payment repeated by an order join', () => {
    const sessionPayment = {
      id: 'pay-session',
      dining_session_id: 'session-1',
      status: 'PAID',
      amount: 120_000,
    }

    expect(
      computeRealizedRevenue([sessionPayment, sessionPayment, sessionPayment]),
    ).toBe(120_000)
  })

  it('chooses the latest PAID row for each target with an ID tie-breaker', () => {
    const canonical = canonicalizeRealizedPayments([
      {
        id: 'payment-a',
        order_id: 'order-1',
        status: 'PAID',
        amount: 10_000,
        paid_at: '2026-09-10T10:00:00.000Z',
      },
      {
        id: 'payment-b',
        order_id: 'order-1',
        status: 'PAID',
        amount: 20_000,
        paid_at: '2026-09-10T11:00:00.000Z',
      },
      {
        id: 'payment-c',
        dining_session_id: 'session-1',
        status: 'PAID',
        amount: 30_000,
        created_at: '2026-09-10T12:00:00.000Z',
      },
      {
        id: 'payment-d',
        dining_session_id: 'session-1',
        status: 'PAID',
        amount: 40_000,
        created_at: '2026-09-10T12:00:00.000Z',
      },
    ])

    expect(canonical.map((payment) => payment.id).sort()).toEqual([
      'payment-b',
      'payment-d',
    ])
    expect(computeRealizedRevenue(canonical)).toBe(60_000)
  })

  it('lets a session bill suppress direct payments for its underlying orders', () => {
    expect(
      computeRealizedRevenue(
        [
          {
            id: 'direct-order-payment',
            order_id: 'order-1',
            status: 'PAID',
            amount: 45_000,
          },
          {
            id: 'session-bill',
            dining_session_id: 'session-1',
            status: 'PAID',
            amount: 120_000,
          },
        ],
        [{ id: 'order-1', dining_session_id: 'session-1' }],
      ),
    ).toBe(120_000)
  })

  it('ignores PAID rows without an order or session target', () => {
    expect(
      computeRealizedRevenue([
        { id: 'targetless', status: 'PAID', amount: 999_999 },
      ]),
    ).toBe(0)
  })

  it('ignores unrealized payment attempts', () => {
    expect(
      computeRealizedRevenue([
        {
          id: 'pending',
          order_id: 'order-1',
          status: 'PENDING',
          amount: 45_000,
        },
        { id: 'failed', order_id: 'order-2', status: 'FAILED', amount: 75_000 },
      ]),
    ).toBe(0)
  })
})
