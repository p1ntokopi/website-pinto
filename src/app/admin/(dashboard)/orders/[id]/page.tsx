import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { OrderActions } from '@/components/admin/orders/order-actions'
import { OrderStatus, UserRole } from '@/lib/orders/status-machine'
import { STATUS_CONFIG } from '@/lib/orders/status-config'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, Receipt, User, FileText, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { Metadata } from 'next'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Detail Pesanan - Pinto Admin',
}

type OrderItem = {
  id: string
  quantity: number
  product_name_snapshot: string
  variant_name_snapshot: string | null
  subtotal: number
  notes: string | null
  options: { id: string; option_value_snapshot: string; price_adjustment: number }[]
}

type HistoryEvent = {
  id: string
  new_status: OrderStatus
  created_at: string
  metadata: { reason?: string } | null
  changer: { full_name: string } | null
}

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const resolvedParams = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile) redirect('/admin/login')

  const userRole = profile.role as UserRole

  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      table:tables(table_number),
      items:order_items(
        *,
        options:order_item_options(*)
      ),
      history:order_status_history(
        id, old_status, new_status, created_at, metadata,
        changer:profiles!order_status_history_changed_by_fkey(full_name)
      )
    `)
    .eq('id', resolvedParams.id)
    .single()

  if (!order) notFound()

  const { data: payments } = await supabase
    .from('payments')
    .select('id, provider, status, amount, payment_method, payment_channel, paid_at, created_at')
    .eq('order_id', order.id)
    .order('created_at', { ascending: false })
    .limit(1)

  const payment = payments?.[0] ?? null

  const config = STATUS_CONFIG[order.status as OrderStatus]
  const StatusIcon = config.icon
  const items = (order.items || []) as OrderItem[]
  const history = ((order.history || []) as HistoryEvent[]).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(price)

  const formatTime = (isoString: string) =>
    new Date(isoString).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    PAID: { label: 'Lunas', color: 'bg-success/10 text-success border-success/25' },
    PENDING: { label: 'Menunggu', color: 'bg-warning/10 text-warning border-warning/25' },
    EXPIRED: { label: 'Kedaluwarsa', color: 'bg-muted text-muted-text border-border' },
    FAILED: { label: 'Gagal', color: 'bg-destructive/10 text-destructive border-destructive/25' },
    CANCELED: { label: 'Dibatalkan', color: 'bg-muted text-muted-text border-border' },
    REFUNDED: { label: 'Dikembalikan', color: 'bg-info/10 text-info border-info/25' },
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 pb-20">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/admin/orders"
          className="-ml-2 flex h-9 w-9 items-center justify-center rounded-sm text-muted-text transition-colors hover:bg-muted hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/40 outline-none"
          aria-label="Kembali ke pesanan"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Pesanan {order.order_number}
        </h1>
        <Badge
          variant="outline"
          className={cn('gap-1 border font-semibold', config.color)}
        >
          <StatusIcon className="h-3.5 w-3.5" />
          {config.label}
        </Badge>
      </div>

      <div className="flex flex-col justify-between gap-4 border border-border-custom/70 bg-card p-5 md:flex-row md:items-center">
        <div>
          <h3 className="text-sm font-semibold text-ink">Perbarui Status</h3>
          <p className="mt-0.5 text-sm text-muted-text">
            Geser pesanan ini melalui alur kerja operasional.
          </p>
        </div>
        <OrderActions orderId={order.id} currentStatus={order.status as OrderStatus} userRole={userRole} />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <div className="overflow-hidden border border-border-custom/70 bg-card">
            <div className="flex items-center justify-between border-b border-border-custom/60 p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Receipt className="h-4 w-4 text-muted-text" />
                Item
              </h2>
              <span className="text-xs font-medium text-muted-text">
                {items.length} item
              </span>
            </div>

            <div className="space-y-5 p-5">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="font-bold text-muted-text">{item.quantity}×</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-3 font-semibold text-ink">
                      <span>{item.product_name_snapshot}</span>
                      <span className="shrink-0">{formatPrice(item.subtotal)}</span>
                    </div>
                    <div className="mt-1 space-y-1 text-sm text-muted-text">
                      {item.variant_name_snapshot && <p>{item.variant_name_snapshot}</p>}
                      {item.options?.map((opt) => (
                        <p key={opt.id}>
                          {opt.option_value_snapshot}
                          {opt.price_adjustment > 0 ? ` (+${formatPrice(opt.price_adjustment)})` : ''}
                        </p>
                      ))}
                      {item.notes && (
                        <p className="mt-2 flex items-start gap-2 rounded-sm bg-muted/50 p-2 italic text-ink/70">
                          <FileText className="mt-0.5 h-4 w-4 shrink-0" />
                          {item.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 border-t border-border-custom/60 bg-muted/30 p-5">
              <div className="flex justify-between text-sm font-medium text-muted-text">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between border-t border-border-custom/60 pt-3 text-lg font-bold text-ink">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-6 border border-border-custom/70 bg-card p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <User className="h-4 w-4 text-muted-text" />
              Info Pesanan
            </h2>

            <div className="space-y-5">
              <div>
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-text">
                  Meja
                </span>
                {order.table ? (
                  <Badge variant="outline" className="border-border-custom bg-muted/50 px-3 py-1 text-sm font-semibold">
                    Meja {order.table.table_number}
                  </Badge>
                ) : (
                  <span className="text-sm text-muted-text">Bawa pulang</span>
                )}
              </div>

              <div>
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-text">
                  Catatan Pesanan
                </span>
                {order.notes ? (
                  <p className="rounded-sm bg-muted/50 p-3 text-sm italic text-ink/70">
                    {order.notes}
                  </p>
                ) : (
                  <span className="text-sm text-muted-text">Tidak ada</span>
                )}
              </div>

              <div>
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-text">
                  Dibuat Pada
                </span>
                <span className="text-sm font-medium text-ink">{formatTime(order.created_at)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-6 border border-border-custom/70 bg-card p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <CreditCard className="h-4 w-4 text-muted-text" />
              Pembayaran
            </h2>

            {payment ? (
              <div className="space-y-5">
                <div>
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-text">
                    Status
                  </span>
                  {(() => {
                    const pcfg = PAYMENT_STATUS_CONFIG[payment.status] ?? {
                      label: payment.status,
                      color: 'bg-muted text-muted-text border-border',
                    }
                    return (
                      <Badge variant="outline" className={cn('gap-1 border font-semibold', pcfg.color)}>
                        {pcfg.label}
                      </Badge>
                    )
                  })()}
                </div>

                <div>
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-text">
                    Metode
                  </span>
                  <span className="text-sm font-medium text-ink">
                    {payment.payment_channel || payment.payment_method || payment.provider}
                  </span>
                </div>

                <div>
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-text">
                    Nominal
                  </span>
                  <span className="text-sm font-semibold text-ink">{formatPrice(payment.amount)}</span>
                </div>

                {payment.paid_at && (
                  <div>
                    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-text">
                      Dibayar Pada
                    </span>
                    <span className="text-sm font-medium text-ink">{formatTime(payment.paid_at)}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-text">Belum ada pembayaran tercatat.</p>
            )}
          </div>

          <div className="border border-border-custom/70 bg-card p-5">
            <h2 className="mb-5 text-sm font-semibold text-ink">Riwayat</h2>

            <ol className="relative space-y-5 before:absolute before:bottom-1 before:left-[5px] before:top-1 before:w-px before:bg-border-custom">
              <li className="relative flex items-start gap-3">
                <span className="relative z-10 mt-1 h-3 w-3 shrink-0 rounded-full border-2 border-card bg-muted" />
                <div>
                  <p className="text-sm font-medium text-ink">Pesanan Dibuat</p>
                  <p className="text-xs text-muted-text">{formatTime(order.created_at)}</p>
                </div>
              </li>

              {history.map((event) => {
                const eventConfig = STATUS_CONFIG[event.new_status]
                const EventIcon = eventConfig.icon
                return (
                  <li key={event.id} className="relative flex items-start gap-3">
                    <span
                      className={cn(
                        'relative z-10 mt-1 flex h-3 w-3 shrink-0 items-center justify-center rounded-full border-2 border-card',
                        'bg-coffee'
                      )}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">
                        Ditandai{' '}
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                            eventConfig.color
                          )}
                        >
                          <EventIcon className="h-3 w-3" />
                          {eventConfig.label}
                        </span>
                      </p>
                      <p className="mb-1 text-xs text-muted-text">
                        oleh {event.changer?.full_name || 'Sistem'} · {formatTime(event.created_at)}
                      </p>
                      {event.metadata?.reason && (
                        <p className="mt-1 rounded-sm bg-muted/50 p-2 text-xs italic text-ink/70">
                          &ldquo;{event.metadata.reason}&rdquo;
                        </p>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}