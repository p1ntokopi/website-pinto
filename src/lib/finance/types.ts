/**
 * Shared shape of the `get_financial_summary` RPC result plus the derived
 * financial formulas. Every financial page derives its numbers from these
 * helpers so the rules stay consistent (dashboard = report = breakdown).
 */

export type FinancialSummary = {
  period: { start: string; end: string }
  sales: {
    paid_order_count: number
    gross: number
    discount: number
    tax: number
    service_fee: number
    shipping_fee: number
  }
  refund: { total: number; count: number }
  adjustment: { total: number }
  expense: { total: number; count: number; avg_daily: number }
  expense_by_category: { category: string; total: number; count: number }[]
  payment_breakdown: { method: string; total: number; tx_count: number }[]
  revenue_series: { day: string; revenue: number }[]
  orders_series: { day: string; order_count: number }[]
  top_products: {
    name: string
    category: string
    units: number
    revenue: number
    avg_price: number | null
  }[]
  category_performance: { category: string; units: number; revenue: number }[]
  beans: {
    units: number
    revenue: number
    avg_price: number | null
    top_product: string | null
  }
  order_reconciliation: {
    total: number
    cancelled: number
    paid: number
    unpaid: number
    pending_payment: number
  }
  cash_flow: { in: number; out: number; net: number }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * Light structural validation of the RPC payload. Throws a friendly error so
 * pages can render a proper error state instead of crashing on bad data.
 */
export function parseFinancialSummary(raw: unknown): FinancialSummary {
  if (!isRecord(raw) || !isRecord(raw.sales) || !isRecord(raw.expense)) {
    throw new Error('Format data keuangan tidak valid.')
  }
  if (!Array.isArray(raw.revenue_series) || !Array.isArray(raw.top_products)) {
    throw new Error('Format data keuangan tidak valid.')
  }
  return raw as unknown as FinancialSummary
}

/** Net Sales = Gross - Discount - Refund + Adjustments. */
export function computeNetSales(summary: FinancialSummary): number {
  return (
    summary.sales.gross -
    summary.sales.discount -
    summary.refund.total +
    summary.adjustment.total
  )
}

/**
 * Estimasi Laba = Net Sales - recorded expenses. COGS is not tracked yet, so
 * this is explicitly an estimate — never label it as net profit.
 */
export function computeEstimatedSurplus(summary: FinancialSummary): number {
  return computeNetSales(summary) - summary.expense.total
}

/** AOV = Net Sales / paid, non-cancelled orders. */
export function computeAov(summary: FinancialSummary): number {
  const count = summary.sales.paid_order_count
  return count > 0 ? computeNetSales(summary) / count : 0
}
