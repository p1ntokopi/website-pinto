'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'
import { OrderStatus } from '@/lib/orders/status-machine'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search, Clock, CheckCircle2, Coffee, Package, Check, XCircle } from 'lucide-react'
import Link from 'next/link'

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

const STATUS_CONFIG: Record<OrderStatus, { label: string, color: string, icon: any }> = {
  PENDING: { label: 'Pending', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock },
  CONFIRMED: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle2 },
  PREPARING: { label: 'Preparing', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Coffee },
  READY: { label: 'Ready', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: Package },
  COMPLETED: { label: 'Completed', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: Check },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
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

    // Setup Realtime subscription
    const channel = supabase.channel('admin_orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            // Need to fetch relation data (table) for the new order
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

  // Derived state
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price)
  }
  
  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }

  // Counts
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {(Object.entries(counts) as [OrderStatus, number][]).map(([status, count]) => (
          <button
            key={status}
            onClick={() => setStatusFilter(statusFilter === status ? 'ALL' : status)}
            className={`p-4 rounded-2xl border flex flex-col items-center justify-center transition-colors ${
              statusFilter === status 
                ? 'bg-primary/5 border-primary shadow-sm' 
                : 'bg-white border-border/50 hover:bg-muted/30'
            }`}
          >
            <span className="text-2xl font-bold">{count}</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-1">
              {STATUS_CONFIG[status].label}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-border/50">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search order, customer, table..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-muted/50 border-transparent focus:bg-white"
          />
        </div>
        
        {statusFilter !== 'ALL' && (
          <button 
            onClick={() => setStatusFilter('ALL')}
            className="text-sm text-primary hover:underline font-medium"
          >
            Clear Filter
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Order #</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Table</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  No orders found for the current filter.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map(order => {
                const config = STATUS_CONFIG[order.status]
                const Icon = config.icon
                
                return (
                  <TableRow key={order.id} className="group">
                    <TableCell className="font-medium text-ink">
                      <Link href={`/admin/orders/${order.id}`} className="hover:underline">
                        {order.order_number}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatTime(order.created_at)}</TableCell>
                    <TableCell>
                      {order.table ? (
                        <Badge variant="outline" className="font-semibold text-xs">
                          T{order.table.table_number}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell>{order.customer_name || 'Guest'}</TableCell>
                    <TableCell className="font-medium">{formatPrice(order.total)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${config.color} border gap-1 font-semibold`}>
                        <Icon className="w-3 h-3" />
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link 
                        href={`/admin/orders/${order.id}`}
                        className="text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Manage →
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
