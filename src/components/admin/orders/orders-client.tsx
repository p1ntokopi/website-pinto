'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'
import { OrderStatus } from '@/lib/orders/status-machine'
import { STATUS_CONFIG } from '@/lib/orders/status-config'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, ArrowRight, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type OrderRow = {
  id: string
  order_number: string
  order_type: string
  fulfillment_type: string
  subtotal: number
  total: number
  status: OrderStatus
  customer_name: string | null
  created_at: string
  table: { id: string; table_number: string } | null
}

const ALL_STATUSES: OrderStatus[] = ['PENDING_PAYMENT', 'PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED']

export function OrdersClient({ initialOrders }: { initialOrders: OrderRow[] }) {
  const [orders, setOrders] = useState<OrderRow[]>(initialOrders)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL')

  useEffect(() => {
    const supabase = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const channel = supabase
      .channel('admin_orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data } = await supabase
              .from('orders')
              .select(
                'id, order_number, order_type, fulfillment_type, subtotal, total, status, customer_name, created_at, table:tables(id, table_number)'
              )
              .eq('id', payload.new.id)
              .single()

            if (data) {
              setOrders((prev) => [data as unknown as OrderRow, ...prev])
            }
          } else if (payload.eventType === 'UPDATE') {
            setOrders((prev) =>
              prev.map((o) => (o.id === payload.new.id ? { ...o, ...payload.new } : o))
            )
          } else if (payload.eventType === 'DELETE') {
            setOrders((prev) => prev.filter((o) => o.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'ALL' && o.status !== statusFilter) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesNumber = o.order_number.toLowerCase().includes(query)
      const matchesTable = o.table?.table_number.toLowerCase().includes(query)
      if (!matchesNumber && !matchesTable) return false
    }
    return true
  })

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(price)

  const formatTime = (isoString: string) =>
    new Date(isoString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

  const counts: Record<OrderStatus, number> = {
    PENDING_PAYMENT: orders.filter((o) => o.status === 'PENDING_PAYMENT').length,
    PENDING: orders.filter((o) => o.status === 'PENDING').length,
    CONFIRMED: orders.filter((o) => o.status === 'CONFIRMED').length,
    PREPARING: orders.filter((o) => o.status === 'PREPARING').length,
    READY: orders.filter((o) => o.status === 'READY').length,
    COMPLETED: orders.filter((o) => o.status === 'COMPLETED').length,
    CANCELLED: orders.filter((o) => o.status === 'CANCELLED').length,
  }

  const totalCount = orders.length

  return (
    <div className="space-y-6">
      <div className="-mb-1 flex gap-1.5 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setStatusFilter('ALL')}
          aria-pressed={statusFilter === 'ALL'}
          className={cn(
            'inline-flex shrink-0 items-center gap-1.5 rounded-sm px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/40 outline-none',
            statusFilter === 'ALL'
              ? 'bg-ink text-paper'
              : 'text-muted-text hover:bg-muted hover:text-ink'
          )}
        >
          Semua
          <span
            className={cn(
              'rounded-sm px-1.5 py-0.5 text-[10px] font-bold',
              statusFilter === 'ALL' ? 'bg-paper/20 text-paper' : 'bg-muted text-muted-text'
            )}
          >
            {totalCount}
          </span>
        </button>
        {ALL_STATUSES.map((status) => {
          const config = STATUS_CONFIG[status]
          const isActive = statusFilter === status
          return (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(isActive ? 'ALL' : status)}
              aria-pressed={isActive}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-sm px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/40 outline-none',
                isActive
                  ? 'bg-ink text-paper'
                  : 'text-muted-text hover:bg-muted hover:text-ink'
              )}
            >
              {config.label}
              <span
                className={cn(
                  'rounded-sm px-1.5 py-0.5 text-[10px] font-bold',
                  isActive ? 'bg-paper/20 text-paper' : 'bg-muted text-muted-text'
                )}
              >
                {counts[status]}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-text" />
          <Input
            placeholder="Cari nomor pesanan atau meja..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 rounded-sm pl-9"
            aria-label="Cari pesanan"
          />
        </div>
        {statusFilter !== 'ALL' || searchQuery ? (
          <button
            type="button"
            onClick={() => {
              setStatusFilter('ALL')
              setSearchQuery('')
            }}
            className="shrink-0 text-sm font-medium text-coffee hover:underline focus-visible:ring-3 focus-visible:ring-ring/40 outline-none rounded-sm"
          >
            Hapus filter
          </button>
        ) : null}
      </div>

      <div className="hidden overflow-hidden border border-border-custom/70 md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border-custom/70">
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-text">
                Pesanan
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-text">
                Waktu
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-text">
                Meja
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-text">
                Total
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-text">
                Status
              </TableHead>
              <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-muted-text">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-16 text-center text-muted-text">
                  <ShoppingBag className="mx-auto mb-3 h-7 w-7 text-muted-text/50" />
                  Tidak ada pesanan yang cocok dengan filter saat ini.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => {
                const config = STATUS_CONFIG[order.status]
                const Icon = config.icon
                return (
                  <TableRow key={order.id} className="border-b border-border-custom/60">
                    <TableCell className="font-semibold text-ink">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="rounded-sm focus-visible:ring-3 focus-visible:ring-ring/40 outline-none hover:text-coffee"
                      >
                        {order.order_number}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-text">
                      {formatTime(order.created_at)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {order.table ? (
                        <span className="font-semibold text-ink">
                          T{tableNumberLabel(order.table.table_number)}
                        </span>
                      ) : (
                        <span className="text-muted-text">Bawa pulang</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-ink">
                      {formatPrice(order.total)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
                          config.color
                        )}
                      >
                        <Icon className="h-3 w-3" />
                        {config.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-coffee hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/40 outline-none rounded-sm"
                      >
                        Kelola
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 md:hidden">
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-border-custom px-6 py-14 text-center">
            <ShoppingBag className="mb-3 h-7 w-7 text-muted-text/50" />
            <p className="text-sm font-medium text-ink">Tidak ada pesanan yang cocok</p>
            <p className="mt-1 text-sm text-muted-text">Coba ubah filter atau pencarian.</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const config = STATUS_CONFIG[order.status]
            const Icon = config.icon
            return (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="block rounded-sm border border-border-custom bg-card p-4 transition-colors hover:border-coffee/40 focus-visible:ring-3 focus-visible:ring-ring/40 outline-none"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-ink">{order.order_number}</span>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                      config.color
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {config.label}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-muted-text">
                  {order.table ? `Meja ${order.table.table_number}` : 'Bawa pulang'} ·{' '}
                  {formatTime(order.created_at)}
                </p>
                <div className="mt-3 flex items-center justify-between border-t border-border-custom/60 pt-3">
                  <span className="text-sm font-semibold text-ink">
                    {formatPrice(order.total)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-coffee">
                    Kelola
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}

function tableNumberLabel(number: string | number) {
  return String(number)
}