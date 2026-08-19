import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { STATUS_CONFIG } from '@/lib/orders/status-config'
import type { OrderStatus, UserRole } from '@/lib/orders/status-machine'
import { OrderQueue, type OrderQueueOrder } from '@/components/admin/dashboard/order-queue'
import { TableStrip } from '@/components/admin/dashboard/table-strip'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Ringkasan - Pinto Admin',
}

const formatIDR = (price: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(price)

function greetingForHour(hour: number): string {
  if (hour < 11) return 'pagi'
  if (hour < 15) return 'siang'
  if (hour < 19) return 'sore'
  return 'malam'
}

function SectionHeader({
  eyebrow,
  title,
  href,
  linkLabel,
  count,
}: {
  eyebrow: string
  title: string
  href: string
  linkLabel: string
  count?: number
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-text">
          {eyebrow}
        </p>
        <h2 className="mt-0.5 flex items-center gap-2 font-display text-xl font-bold tracking-tight text-ink">
          {title}
          {typeof count === 'number' && (
            <span className="rounded-sm bg-coffee/10 px-1.5 py-0.5 font-sans text-xs font-bold text-coffee">
              {count}
            </span>
          )}
        </h2>
      </div>
      <Link
        href={href}
        className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-coffee transition-colors hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/40 outline-none"
      >
        {linkLabel}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}

export default async function AdminDashboard() {
  const supabase = await createClient()

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayStartISO = todayStart.toISOString()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user?.id ?? '')
    .single()

  const { count: ordersToday } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', todayStartISO)

  const { data: completedOrders } = await supabase
    .from('orders')
    .select('total')
    .eq('status', 'COMPLETED')
    .gte('created_at', todayStartISO)
  const revenueToday = completedOrders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0

  const { count: occupiedTables } = await supabase
    .from('dining_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'open')

  const { count: totalTables } = await supabase
    .from('tables')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  const { data: todayOrderIds } = await supabase
    .from('orders')
    .select('id')
    .gte('created_at', todayStartISO)

  let itemsSold = 0
  if (todayOrderIds && todayOrderIds.length > 0) {
    const { data: todayItems } = await supabase
      .from('order_items')
      .select('quantity')
      .in('order_id', todayOrderIds.map((o) => o.id))
    itemsSold = todayItems?.reduce((sum, i) => sum + (i.quantity || 0), 0) || 0
  }

  const { data: activeOrders } = await supabase
    .from('orders')
    .select(
      'id, order_number, status, total, created_at, table:tables(id, table_number), items:order_items(id, quantity, product_name_snapshot)'
    )
    .in('status', ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'])
    .order('created_at', { ascending: true })
    .limit(15)

  const activeOrdersNormalized = (activeOrders || []).map((order) => ({
    ...order,
    table: Array.isArray(order.table) ? order.table[0] ?? null : order.table,
  }))

  const { data: sessions } = await supabase
    .from('dining_sessions')
    .select('id, table_id, created_at')
    .eq('status', 'open')

  const sessionIds = sessions?.map((s) => s.id) || []
  let sessionOrders: { id: string; order_number: string; dining_session_id: string | null; total: number; status: string }[] = []
  if (sessionIds.length > 0) {
    const { data: openOrders } = await supabase
      .from('orders')
      .select('id, order_number, dining_session_id, total, status')
      .in('dining_session_id', sessionIds)
      .in('status', ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED'])
    if (openOrders) sessionOrders = openOrders as typeof sessionOrders
  }

  const { data: tables } = await supabase
    .from('tables')
    .select('id, table_number, capacity, is_active')
    .order('table_number', { ascending: true })

  const tablesData = (tables || []).map((table) => {
    const session = sessions?.find((s) => s.table_id === table.id)
    const tableOrders = session ? sessionOrders.filter((o) => o.dining_session_id === session.id) : []
    return {
      ...table,
      session: session
        ? { id: session.id, created_at: session.created_at, orders: tableOrders }
        : null,
    }
  })

  const { data: recentOrders } = await supabase
    .from('orders')
    .select('id, order_number, status, total, customer_name, created_at, table:tables(table_number)')
    .gte('created_at', todayStartISO)
    .order('created_at', { ascending: false })
    .limit(6)

  const recentOrdersNormalized = (recentOrders || []).map((order) => ({
    ...order,
    table: Array.isArray(order.table) ? order.table[0] ?? null : order.table,
  }))

  const needsAttention = activeOrders?.length || 0
  const role = (profile?.role ?? 'staff') as UserRole
  const firstName = profile?.full_name?.split(' ')[0] || 'Admin'

  const kpiStats = [
    { label: 'Pendapatan', value: formatIDR(revenueToday) },
    { label: 'Meja Terisi', value: `${occupiedTables || 0}/${totalTables || 0}` },
    { label: 'Item Terjual', value: String(itemsSold) },
  ]

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-10">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-coffee">
            {todayStart.toLocaleDateString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Selamat {greetingForHour(todayStart.getHours())}, {firstName}.
          </h1>
          <p className="mt-2 text-sm text-muted-text">
            {needsAttention > 0
              ? `${needsAttention} pesanan menunggu diproses`
              : 'Semua pesanan sudah diproses'}{' '}
            · {occupiedTables || 0} meja terisi sekarang.
          </p>
        </div>
        <Button
          variant="outline"
          render={<Link href="/admin/orders" />}
          className="shrink-0 self-start sm:self-auto"
        >
          Lihat Semua Pesanan
          <ArrowRight className="h-4 w-4" />
        </Button>
      </section>

      <section className="flex flex-wrap items-center gap-x-10 gap-y-5 border-y border-border-custom/70 py-5">
        <div className="pr-10">
          <div className="font-display text-4xl font-bold tracking-tight text-ink">
            {ordersToday || 0}
          </div>
          <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-text">
            Pesanan Hari Ini
          </div>
        </div>
        <div className="h-10 w-px bg-border-custom" aria-hidden="true" />
        {kpiStats.map((stat) => (
          <div key={stat.label}>
            <div className="text-lg font-semibold text-ink">{stat.value}</div>
            <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-text">
              {stat.label}
            </div>
          </div>
        ))}
      </section>

      <div className="grid gap-10 lg:grid-cols-3 lg:gap-6">
        <section className="lg:col-span-2">
          <SectionHeader
            eyebrow="Operasional"
            title="Pesanan Perlu Diproses"
            href="/admin/orders"
            linkLabel="Semua Pesanan"
            count={needsAttention}
          />
          <OrderQueue
            initialOrders={activeOrdersNormalized as unknown as OrderQueueOrder[]}
            role={role}
          />
        </section>

        <section>
          <SectionHeader
            eyebrow="Lantai Kafe"
            title="Status Meja"
            href="/admin/tables/live"
            linkLabel="Meja Langsung"
          />
          <TableStrip initialTables={tablesData} />
        </section>
      </div>

      <section>
        <SectionHeader
          eyebrow="Aktivitas"
          title="Pesanan Terbaru"
          href="/admin/orders"
          linkLabel="Semua Pesanan"
        />
        {recentOrdersNormalized.length > 0 ? (
          <ul className="divide-y divide-border-custom/70 border-y border-border-custom/70">
            {recentOrdersNormalized.map((order) => {
              const config = STATUS_CONFIG[order.status as OrderStatus]
              const Icon = config.icon
              return (
                <li key={order.id}>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="flex items-center justify-between gap-3 py-3 transition-colors hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/40 outline-none"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border',
                          config.color
                        )}
                      >
                        {Icon && <Icon className="h-4 w-4" />}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-ink">
                          {order.order_number}
                        </span>
                        <span className="block truncate text-xs text-muted-text">
                          {order.table
                            ? `Meja ${order.table.table_number}`
                            : order.customer_name || 'Bawa pulang'}
                        </span>
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-3">
                      <span className="text-sm font-semibold text-ink">
                        {formatIDR(order.total)}
                      </span>
                      <span
                        className={cn(
                          'hidden rounded-sm border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide sm:inline-flex',
                          config.color
                        )}
                      >
                        {config.label}
                      </span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-border-custom px-6 py-14 text-center">
            <Receipt className="h-8 w-8 text-muted-text/60" />
            <p className="text-sm font-medium text-ink">Belum ada pesanan hari ini</p>
            <p className="max-w-sm text-sm text-muted-text">
              Pesanan dari QR meja akan tercatat di sini.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}