'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'
import { Coffee, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { OrderStatus, UserRole } from '@/lib/orders/status-machine'
import { STATUS_CONFIG } from '@/lib/orders/status-config'
import { OrderAdvance } from '@/components/admin/dashboard/order-advance'

const ACTIVE: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY']

const SELECT_QUERY =
  'id, order_number, status, total, created_at, table:tables(id, table_number), items:order_items(id, quantity, product_name_snapshot)'

export type OrderQueueOrder = {
  id: string
  order_number: string
  status: OrderStatus
  total: number
  created_at: string
  table: { id: string; table_number: string } | null
  items: { id: string; quantity: number; product_name_snapshot: string }[]
}

interface OrderQueueProps {
  initialOrders: OrderQueueOrder[]
  role: UserRole
}

export function OrderQueue({ initialOrders, role }: OrderQueueProps) {
  const [orders, setOrders] = useState<OrderQueueOrder[]>(initialOrders)

  useEffect(() => {
    const supabase = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const fetchOrder = async (id: string): Promise<OrderQueueOrder | null> => {
      const { data } = await supabase
        .from('orders')
        .select(SELECT_QUERY)
        .eq('id', id)
        .single()
      if (!data) return null
      const raw = data as unknown as OrderQueueOrder & {
        table: OrderQueueOrder['table'] | OrderQueueOrder['table'][] | null
      }
      return {
        ...raw,
        table: Array.isArray(raw.table) ? raw.table[0] ?? null : raw.table,
      }
    }

    const channel = supabase
      .channel('dashboard_order_queue')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        async (payload) => {
          const order = await fetchOrder(payload.new.id)
          if (order && ACTIVE.includes(order.status)) {
            setOrders((prev) => sortOrders([...prev.filter((o) => o.id !== order.id), order]))
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        async (payload) => {
          const order = await fetchOrder(payload.new.id)
          setOrders((prev) => {
            if (!order || !ACTIVE.includes(order.status)) {
              return prev.filter((o) => o.id !== payload.new.id)
            }
            return sortOrders([...prev.filter((o) => o.id !== order.id), order])
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'orders' },
        (payload) => {
          setOrders((prev) => prev.filter((o) => o.id !== payload.old.id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const formatTime = (isoString: string) =>
    new Date(isoString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(price)

  if (orders.length === 0) {
    return (
      <div className="rounded-sm border border-dashed border-border-custom px-6 py-14 text-center">
        <Coffee className="mx-auto h-8 w-8 text-muted-text/60" />
        <h3 className="mt-3 text-sm font-semibold text-ink">Belum ada pesanan masuk</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-text">
          Pesanan baru dari QR meja akan muncul di sini secara otomatis.
        </p>
        <Link
          href="/admin/tables/live"
          className="mt-4 inline-flex min-h-10 items-center justify-center gap-1.5 rounded-sm border border-coffee/30 bg-coffee/5 px-4 py-2 text-xs font-bold uppercase tracking-wide text-coffee transition-colors hover:bg-coffee/10 focus-visible:ring-3 focus-visible:ring-ring/40 outline-none"
        >
          <Users className="h-3.5 w-3.5" />
          Lihat Meja Langsung
        </Link>
      </div>
    )
  }

  return (
    <div className="divide-y divide-border-custom/70 border-y border-border-custom/70">
      {orders.map((order) => {
        const config = STATUS_CONFIG[order.status]
        const StatusIcon = config.icon
        const itemsSummary =
          order.items
            .map((item) => `${item.quantity}× ${item.product_name_snapshot}`)
            .join(' · ') || 'Tanpa item'

        return (
          <div key={order.id} className="flex items-start gap-3 py-3.5 sm:items-center">
            <div
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border',
                config.color
              )}
            >
              <StatusIcon className="h-4 w-4" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="text-sm font-semibold text-ink transition-colors hover:text-coffee focus-visible:ring-3 focus-visible:ring-ring/40 outline-none"
                >
                  {order.order_number}
                </Link>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                    config.color
                  )}
                >
                  {config.label}
                </span>
              </div>
              <p className="mt-1 truncate text-xs text-muted-text">
                {order.table ? `Meja ${order.table.table_number}` : 'Bawa pulang'} ·{' '}
                {formatTime(order.created_at)} · {itemsSummary}
              </p>

              <div className="mt-3 flex items-center justify-between gap-3 md:hidden">
                <span className="text-sm font-semibold text-ink">
                  {formatPrice(order.total)}
                </span>
                <OrderAdvance
                  orderId={order.id}
                  currentStatus={order.status}
                  role={role}
                  onSuccess={(id, status) =>
                    setOrders((prev) =>
                      prev
                        .map((o) => (o.id === id ? { ...o, status } : o))
                        .filter((o) => ACTIVE.includes(o.status))
                    )
                  }
                />
              </div>
            </div>

            <div className="hidden shrink-0 flex-col items-end gap-2 md:flex">
              <span className="text-sm font-semibold text-ink">{formatPrice(order.total)}</span>
              <OrderAdvance
                orderId={order.id}
                currentStatus={order.status}
                role={role}
                onSuccess={(id, status) =>
                  setOrders((prev) =>
                    prev
                      .map((o) => (o.id === id ? { ...o, status } : o))
                      .filter((o) => ACTIVE.includes(o.status))
                  )
                }
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function sortOrders(orders: OrderQueueOrder[]): OrderQueueOrder[] {
  return orders.sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
}