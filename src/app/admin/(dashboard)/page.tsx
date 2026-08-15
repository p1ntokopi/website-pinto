import { Metadata } from 'next'
import Link from 'next/link'
import { Receipt, PhilippinePeso, Armchair, Coffee, Plus, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { STATUS_CONFIG } from '@/lib/orders/status-config'
import type { OrderStatus } from '@/lib/orders/status-machine'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Dasbor - P1NTO Admin',
}

const formatIDR = (price: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(price)

export default async function AdminDashboard() {
  const supabase = await createClient()

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayStartISO = todayStart.toISOString()

  // Orders today
  const { count: ordersToday } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', todayStartISO)

  // Revenue today (completed orders)
  const { data: completedOrders } = await supabase
    .from('orders')
    .select('total')
    .eq('status', 'COMPLETED')
    .gte('created_at', todayStartISO)
  const revenueToday = completedOrders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0

  // Occupied tables
  const { count: occupiedTables } = await supabase
    .from('dining_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'open')

  // Menu items available
  const { count: productsCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_available', true)

  // Orders currently in progress
  const { count: activeOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .in('status', ['PENDING', 'CONFIRMED', 'PREPARING'])

  // Recent orders today
  const { data: recentOrders } = await supabase
    .from('orders')
    .select('id, order_number, status, total, customer_name, created_at')
    .gte('created_at', todayStartISO)
    .order('created_at', { ascending: false })
    .limit(5)

  const statCards = [
    {
      title: 'Pesanan Hari Ini',
      value: String(ordersToday || 0),
      hint: 'Semua pesanan yang dibuat hari ini',
      icon: Receipt,
    },
    {
      title: 'Pendapatan Hari Ini',
      value: formatIDR(revenueToday),
      hint: 'Pesanan selesai hari ini',
      icon: PhilippinePeso,
    },
    {
      title: 'Meja Terisi',
      value: String(occupiedTables || 0),
      hint: 'Sesi makan yang aktif',
      icon: Armchair,
    },
    {
      title: 'Item Menu',
      value: String(productsCount || 0),
      hint: 'Tersedia di menu digital',
      icon: Coffee,
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold tracking-tight text-primary">Ringkasan</h2>
          <p className="mt-1 text-muted-foreground">Metrik operasional hari ini.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{activeOrders || 0} pesanan sedang diproses</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  {card.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Button render={<Link href="/admin/menu/products/new" />} className="flex-1">
              <Plus className="mr-2 h-4 w-4" /> Tambah Produk
            </Button>
            <Button render={<Link href="/admin/tables" />} variant="outline" className="flex-1">
              <Plus className="mr-2 h-4 w-4" /> Tambah Meja
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="font-display">Pesanan Terbaru</CardTitle>
            <Button
              render={<Link href="/admin/orders" />}
              variant="ghost"
              size="sm"
              className="text-primary"
            >
              Lihat semua <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentOrders && recentOrders.length > 0 ? (
              <ul className="divide-y divide-border/60">
                {recentOrders.map((order) => {
                  const config = STATUS_CONFIG[order.status as OrderStatus]
                  const Icon = config?.icon
                  return (
                    <li key={order.id}>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="flex items-center justify-between gap-3 py-3 transition-colors hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <span
                            className={cn(
                              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border',
                              config?.color
                            )}
                          >
                            {Icon && <Icon className="h-4 w-4" />}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium">
                              {order.order_number}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {order.customer_name || 'Walk-in'}
                            </span>
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          <span className="text-sm font-semibold">{formatIDR(order.total)}</span>
                          <span
                            className={cn(
                              'rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                              config?.color
                            )}
                          >
                            {config?.label ?? order.status}
                          </span>
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <div className="flex h-20 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
                Belum ada pesanan hari ini
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
