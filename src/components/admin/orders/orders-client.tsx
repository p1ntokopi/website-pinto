'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'
import { OrderStatus } from '@/lib/orders/status-machine'
import { STATUS_CONFIG } from '@/lib/orders/status-config'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search } from 'lucide-react'
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
  table: { id: string, table_number: string } | null
}

export function OrdersClient({ initialOrders }: { initialOrders: OrderRow[] }) {
  const [orders, setOrders] = useState<OrderRow[]>(initialOrders)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL')

  useEffect(() => {
    const supabase = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const channel = supabase.channel('admin_orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data } = await supabase
              .from('orders')
              .select('id, order_number, order_type, fulfillment_type, subtotal, total, status, customer_name, created_at, table:tables(id, table_number)')
              .eq('id', payload.new.id)
              .single()

            if (data) {
              setOrders(prev => [data as unknown as OrderRow, ...prev])
            }
          } else if (payload.eventType === 'UPDATE') {
            setOrders(prev => prev.map(o =>
              o.id === payload.new.id ? { ...o, ...payload.new } : o
            ))
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev => prev.filter(o => o.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const filteredOrders = orders.filter(o => {
    if (statusFilter !== 'ALL' && o.status !== statusFilter) return false

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesNumber = o.order_number.toLowerCase().includes(query)
      const matchesCustomer = o.customer_name?.toLowerCase().includes(query)
      const matchesTable = o.table?.table_number.toLowerCase().includes(query)
      if (!matchesNumber && !matchesCustomer && !matchesTable) return false
    }

    return true
  })

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price)

  const formatTime = (isoString: string) =>
    new Date(isoString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

  const counts = {
    PENDING: orders.filter(o => o.status === 'PENDING').length,
    CONFIRMED: orders.filter(o => o.status === 'CONFIRMED').length,
    PREPARING: orders.filter(o => o.status === 'PREPARING').length,
    READY: orders.filter(o => o.status === 'READY').length,
    COMPLETED: orders.filter(o => o.status === 'COMPLETED').length,
  }

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {(Object.entries(counts) as [OrderStatus, number][]).map(([status, count]) => {
          const isActive = statusFilter === status
          const config = STATUS_CONFIG[status]
          return (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(isActive ? 'ALL' : status)}
              aria-pressed={isActive}
              className={cn(
                'flex flex-col items-center justify-center rounded-lg border p-4 transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 outline-none',
                isActive
                  ? 'border-primary bg-primary/5 shadow-card'
                  : 'border-border/50 bg-white hover:bg-muted/40'
              )}
            >
              <span className="text-2xl font-bold">{count}</span>
              <span className={cn('mt-1 text-xs font-semibold uppercase tracking-wider', isActive ? 'text-primary' : 'text-muted-foreground')}>
                {config.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 items-center justify-between rounded-lg border border-border/50 bg-white p-4 sm:flex-row">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari pesanan, pelanggan, meja..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 pl-9"
          />
        </div>

        {statusFilter !== 'ALL' && (
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className="text-sm font-medium text-primary hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 outline-none rounded"
          >
            Hapus Filter
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border/50 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Pesanan #</TableHead>
              <TableHead>Waktu</TableHead>
              <TableHead>Meja</TableHead>
              <TableHead>Pelanggan</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  Tidak ada pesanan yang cocok dengan filter saat ini.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map(order => {
                const config = STATUS_CONFIG[order.status]
                const Icon = config.icon

                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium text-ink">
                      <Link href={`/admin/orders/${order.id}`} className="hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 outline-none rounded">
                        {order.order_number}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatTime(order.created_at)}</TableCell>
                    <TableCell>
                      {order.table ? (
                        <Badge variant="outline" className="text-xs font-semibold">
                          T{order.table.table_number}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{order.customer_name || 'Tamu'}</TableCell>
                    <TableCell className="font-medium">{formatPrice(order.total)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('gap-1 border font-semibold', config.color)}>
                        <Icon className="h-3 w-3" />
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-sm font-medium text-primary hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 outline-none rounded"
                      >
                        Kelola →
                      </Link>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
