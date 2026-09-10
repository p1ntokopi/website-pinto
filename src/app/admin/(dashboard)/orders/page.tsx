import { createClient } from '@/lib/supabase/server'
import { OrdersClient } from '@/components/admin/orders/orders-client'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Manajemen Pesanan - Pinto Admin',
}

export default async function OrdersPage() {
  const supabase = await createClient()

  // Initial fetch for today's orders (or recent active orders)
  // We'll fetch orders from the last 24 hours to keep the initial payload reasonable
  const oneDayAgo = new Date(new Date().getTime() - 24 * 60 * 60 * 1000).toISOString()

  const { data: initialOrders, error: ordersError } = await supabase
    .from("orders")
    .select(`
      id, order_number, order_type, fulfillment_type, subtotal, total, status,
      customer_name, dining_session_id, created_at,
      table:tables(id, table_number),
      payments:payments(order_id, status, amount, payment_method, payment_channel),
      items:order_items(id)
    `)
    .gte("created_at", oneDayAgo)
    .order("created_at", { ascending: false })

  if (ordersError) {
    console.error("[orders page]", ordersError.code, ordersError.message)
  }

  // Dine-in bills are paid at the session level, so the direct-order embed above
  // cannot see them. Load session payments for these orders separately.
  const sessionIds = [
    ...new Set(
      (initialOrders || [])
        .map((order) => order.dining_session_id)
        .filter((id): id is string => typeof id === "string"),
    ),
  ]
  const sessionPaymentBySession = new Map<string, PaymentDisplayRow>()
  if (sessionIds.length > 0) {
    const { data: sessionPayments, error: sessionPaymentsError } = await supabase
      .from("payments")
      .select("id, dining_session_id, status, amount, payment_method, payment_channel, paid_at, created_at")
      .in("dining_session_id", sessionIds)
      .order("created_at", { ascending: false })
    if (sessionPaymentsError) {
      console.error("[orders page session payments]", sessionPaymentsError.code, sessionPaymentsError.message)
    }
    for (const payment of sessionPayments || []) {
      if (!payment.dining_session_id) continue
      // Deterministic pick: PAID first, then newest; the list is newest-first so
      // the first row kept per session is the preferred display candidate.
      const existing = sessionPaymentBySession.get(payment.dining_session_id)
      if (!existing || isPreferredPaymentDisplay(payment, existing)) {
        sessionPaymentBySession.set(payment.dining_session_id, payment)
      }
    }
  }

  // Normalize the to-one relation (Supabase returns it as an array) and reduce
  // the payments relation to the latest payment record per order.
  const orders = (initialOrders || []).map((order) => {
    const payments = Array.isArray(order.payments) ? order.payments : []
    const latestPayment = payments[0] ?? null
    const sessionPayment = order.dining_session_id
      ? (sessionPaymentBySession.get(order.dining_session_id) ?? null)
      : null
    // Session-level payment is the dine-in bill of record and wins over a
    // stale or partial direct-order payment.
    const displayPayment = sessionPayment ?? latestPayment
    return {
      ...order,
      table: Array.isArray(order.table) ? order.table[0] ?? null : order.table,
      payments: undefined,
      payment: displayPayment
        ? {
            status: displayPayment.status,
            amount: displayPayment.amount,
            payment_method: displayPayment.payment_method,
            payment_channel: displayPayment.payment_channel,
          }
        : null,
      itemCount: Array.isArray(order.items) ? order.items.length : 0,
      items: undefined,
    }
  })

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-coffee">
          Operasional
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">
          Pesanan
        </h1>
        <p className="mt-2 text-sm text-muted-text">
          Kelola alur kerja operasional hari ini.
        </p>
      </div>

      <OrdersClient
        initialOrders={orders || []}
        initialError={
          ordersError ? "Gagal memuat pesanan. Muat ulang halaman." : null
        }
      />
    </div>
  )
}

type PaymentDisplayRow = {
  id: string
  status: string
  amount: number
  payment_method: string | null
  payment_channel: string | null
  paid_at?: string | null
  created_at?: string | null
}

function paymentTime(payment: PaymentDisplayRow): number {
  return new Date(payment.paid_at ?? payment.created_at ?? 0).getTime()
}

function isPreferredPaymentDisplay(
  candidate: PaymentDisplayRow,
  current: PaymentDisplayRow,
): boolean {
  if (candidate.status === "PAID" && current.status !== "PAID") return true
  if (candidate.status !== "PAID" && current.status === "PAID") return false
  return paymentTime(candidate) > paymentTime(current)
}
