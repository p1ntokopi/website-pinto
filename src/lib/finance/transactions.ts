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

  if (daysBetween(start, end) > TRANSACTION_RANGE_DAYS - 1) {
    end = range.end
    start = daysBetween(range.start, range.end) === TRANSACTION_RANGE_DAYS - 1
      ? range.start
      : shiftDays(end, -(TRANSACTION_RANGE_DAYS - 1))
    rangeCapped = start !== range.start
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .select(
      `id, order_number, status, subtotal, discount, total, created_at, customer_name, dining_session_id,
       table:tables(table_number),
       payments(id, payment_method, payment_channel, provider, status, paid_at, created_at)`,
    )
    // Inclusive Jakarta calendar dates; the next day's 00:00 start is the
    // exclusive upper bound so sub-second rows at day end are not dropped.
    .gte('created_at', `${start}T00:00:00+07:00`)
    .lt('created_at', addDaysIso(end, 1))
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    return { rows: [], error: 'Gagal memuat transaksi. Coba lagi beberapa saat.', rangeCapped }
  }

  const orders = data ?? []
  const sessionIds = [
    ...new Set(
      orders
        .map((order) => order.dining_session_id)
        .filter((id): id is string => typeof id === 'string'),
    ),
  ]
  const sessionPayments = new Map<string, PaymentSummary>()

  if (sessionIds.length > 0) {
    const { data: paymentRows, error: paymentError } = await supabase
      .from('payments')
      .select(
        'id, dining_session_id, payment_method, payment_channel, provider, status, paid_at, created_at',
      )
      .in('dining_session_id', sessionIds)

    if (paymentError) {
      return {
        rows: [],
        error: 'Gagal memuat pembayaran transaksi. Coba lagi beberapa saat.',
        rangeCapped,
      }
    }

    for (const payment of paymentRows ?? []) {
      if (!payment.dining_session_id) continue
      const current = sessionPayments.get(payment.dining_session_id)
      if (!current || isPreferredPayment(payment, current)) {
        sessionPayments.set(payment.dining_session_id, payment)
      }
    }
  }

  const rows: TransactionRow[] = orders.map((order) => {
    const orderPayments = Array.isArray(order.payments) ? order.payments : []
    const sessionPayment = order.dining_session_id
      ? (sessionPayments.get(order.dining_session_id) ?? null)
      : null
    const latest = selectPreferredPayment(
      sessionPayment ? [...orderPayments, sessionPayment] : orderPayments,
    )
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

type PaymentSummary = {
  id: string
  status: string
  payment_method: string | null
  payment_channel: string | null
  provider: string
  paid_at: string | null
  created_at: string
}

function paymentTime(payment: PaymentSummary): number {
  return new Date(payment.paid_at ?? payment.created_at).getTime()
}

function isPreferredPayment(
  candidate: PaymentSummary,
  current: PaymentSummary,
): boolean {
  if (candidate.status === 'PAID' && current.status !== 'PAID') return true
  if (candidate.status !== 'PAID' && current.status === 'PAID') return false
  return paymentTime(candidate) > paymentTime(current) ||
    (paymentTime(candidate) === paymentTime(current) && candidate.id > current.id)
}

function selectPreferredPayment(
  payments: readonly PaymentSummary[],
): PaymentSummary | null {
  return payments.reduce<PaymentSummary | null>(
    (selected, payment) =>
      !selected || isPreferredPayment(payment, selected) ? payment : selected,
    null,
  )
}

function shiftDays(dateStr: string, amount: number): string {
  const date = new Date(`${dateStr}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + amount)
  return date.toISOString().slice(0, 10)
}

function addDaysIso(dateStr: string, amount: number): string {
  return new Date(
    new Date(`${dateStr}T00:00:00+07:00`).getTime() + amount * 86_400_000
  ).toISOString()
}
