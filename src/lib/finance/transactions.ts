import { createClient } from '@/lib/supabase/server'
import type { DateRange } from '@/lib/finance/period'
import { TRANSACTION_RANGE_DAYS, daysBetween } from '@/lib/finance/period'

export type TransactionRow = {
  id: string
  order_number: string
  status: string
  subtotal: number
  discount: number
  total: number
  created_at: string
  table_number: string | null
  customer_name: string | null
  payment_method: string | null
  payment_status: string | null
}

export type TransactionsResult = {
  rows: TransactionRow[]
  error: string | null
  rangeCapped: boolean
}

/**
 * Detailed order rows for the report transaction table. Ordered by creation
 * date (the operational timeline) — use get_financial_summary for revenue
 * figures so both reconcile through the same definitions.
 */
export async function getTransactions(
  range: DateRange,
  limit = 500,
): Promise<TransactionsResult> {
  let { start, end } = range
  let rangeCapped = false

  if (daysBetween(start, end) >= TRANSACTION_RANGE_DAYS) {
    end = range.end
    start = daysBetween(range.start, range.end) === TRANSACTION_RANGE_DAYS
      ? range.start
      : shiftDays(end, -(TRANSACTION_RANGE_DAYS - 1))
    rangeCapped = start !== range.start
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .select(
      `id, order_number, status, subtotal, discount, total, created_at, customer_name,
       table:tables(table_number),
       payments(payment_method, payment_channel, provider, status, paid_at, created_at)`,
    )
    .gte('created_at', `${start}T00:00:00+07:00`)
    .lte('created_at', `${end}T23:59:59+07:00`)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    return { rows: [], error: 'Gagal memuat transaksi. Coba lagi beberapa saat.', rangeCapped }
  }

  const rows: TransactionRow[] = (data ?? []).map((order) => {
    const payments = Array.isArray(order.payments) ? order.payments : []
    // Latest paid payment wins; otherwise take the most recent attempt.
    const sorted = [...payments].sort(
      (a, b) =>
        new Date(b.paid_at ?? b.created_at ?? 0).getTime() -
        new Date(a.paid_at ?? a.created_at ?? 0).getTime(),
    )
    const latest = sorted.find((p) => p.status === 'PAID') ?? sorted[0] ?? null
    const table = order.table
    const tableRecord = Array.isArray(table) ? table[0] : table

    return {
      id: order.id,
      order_number: order.order_number,
      status: order.status,
      subtotal: Number(order.subtotal ?? 0),
      discount: Number(order.discount ?? 0),
      total: Number(order.total ?? 0),
      created_at: order.created_at,
      table_number: tableRecord?.table_number ?? null,
      customer_name: order.customer_name ?? null,
      payment_method: latest
        ? (latest.payment_method || latest.payment_channel || latest.provider || null)
        : null,
      payment_status: latest?.status ?? null,
    }
  })

  return { rows, error: null, rangeCapped }
}

function shiftDays(dateStr: string, amount: number): string {
  const date = new Date(`${dateStr}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + amount)
  return date.toISOString().slice(0, 10)
}
