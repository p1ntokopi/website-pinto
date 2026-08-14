import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { OrderActions } from '@/components/admin/orders/order-actions'
import { OrderStatus, UserRole } from '@/lib/orders/status-machine'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ChevronLeft, Receipt, Clock, User, CheckCircle2, Coffee, Package, Check, XCircle, FileText } from 'lucide-react'
import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Order Detail - P1NTO Admin',
}

const STATUS_CONFIG: Record<OrderStatus, { label: string, color: string, icon: any }> = {
  PENDING: { label: 'Pending', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock },
  CONFIRMED: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle2 },
  PREPARING: { label: 'Preparing', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Coffee },
  READY: { label: 'Ready', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: Package },
  COMPLETED: { label: 'Completed', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: Check },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
}

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const resolvedParams = await params
  const supabase = await createClient()

  // Get User Profile
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')
  
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile) redirect('/admin/login')

  const userRole = profile.role as UserRole

  // Fetch Order
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

  const config = STATUS_CONFIG[order.status as OrderStatus]
  const StatusIcon = config.icon

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price)
  }

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('id-ID', { 
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Link href="/admin/orders" className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors text-muted-foreground">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-display text-3xl font-bold tracking-tight">Order {order.order_number}</h1>
        <Badge variant="outline" className={`${config.color} border gap-1 font-semibold ml-2`}>
          <StatusIcon className="w-3.5 h-3.5" />
          {config.label}
        </Badge>
      </div>

      {/* Main Actions Panel */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-lg">Update Status</h3>
          <p className="text-sm text-muted-foreground">Move this order through the operational workflow.</p>
        </div>
        <OrderActions orderId={order.id} currentStatus={order.status as OrderStatus} userRole={userRole} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Order Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-border/50 overflow-hidden">
            <div className="p-6 border-b border-border/50 flex items-center justify-between">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Receipt className="w-5 h-5 text-muted-foreground" /> Items
              </h2>
              <span className="font-semibold text-muted-foreground">{order.items?.length || 0} items</span>
            </div>
            
            <div className="p-6 space-y-6">
              {order.items?.map((item: any) => (
                <div key={item.id} className="flex gap-4">
                  <div className="font-bold text-lg text-muted-foreground">{item.quantity}×</div>
                  <div className="flex-grow">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>{item.product_name_snapshot}</span>
                      <span>{formatPrice(item.subtotal)}</span>
                    </div>
                    <div className="text-muted-foreground mt-1 space-y-1">
                      {item.variant_name_snapshot && <p>• {item.variant_name_snapshot}</p>}
                      {item.options?.map((opt: any) => (
                        <p key={opt.id}>• {opt.option_value_snapshot} {opt.price_adjustment > 0 ? `(+${formatPrice(opt.price_adjustment)})` : ''}</p>
                      ))}
                      {item.notes && (
                        <p className="italic text-ink/70 bg-muted/50 p-2 rounded-lg mt-2 flex items-start gap-2">
                          <FileText className="w-4 h-4 shrink-0 mt-0.5" /> 
                          {item.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-muted/30 p-6 space-y-3">
              <div className="flex justify-between text-muted-foreground font-medium">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <Separator className="bg-border/50" />
              <div className="flex justify-between font-bold text-xl">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Meta & History */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-border/50 space-y-6">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-muted-foreground" /> Customer Info
            </h2>
            
            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Name</span>
                <span className="font-medium text-lg">{order.customer_name || 'Guest'}</span>
              </div>
              
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Table</span>
                {order.table ? (
                  <Badge variant="outline" className="font-semibold text-base px-3 py-1 bg-muted/50">
                    Table {order.table.table_number}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">None</span>
                )}
              </div>

              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Order Notes</span>
                {order.notes ? (
                  <p className="italic bg-muted/50 p-3 rounded-xl">{order.notes}</p>
                ) : (
                  <span className="text-muted-foreground">None</span>
                )}
              </div>
              
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Created At</span>
                <span className="text-sm font-medium">{formatTime(order.created_at)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-border/50">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" /> History
            </h2>
            
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:translate-x-0 before:h-full before:w-0.5 before:bg-border/50">
              {/* Initial Order */}
              <div className="relative flex items-start gap-4">
                <div className="w-4 h-4 rounded-full bg-muted border-2 border-white shrink-0 mt-1 shadow-sm z-10" />
                <div>
                  <p className="text-sm font-medium">Order Placed</p>
                  <p className="text-xs text-muted-foreground">{formatTime(order.created_at)}</p>
                </div>
              </div>

              {/* Status History */}
              {order.history?.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).map((event: any) => (
                <div key={event.id} className="relative flex items-start gap-4">
                  <div className="w-4 h-4 rounded-full bg-primary border-2 border-white shrink-0 mt-1 shadow-sm z-10" />
                  <div>
                    <p className="text-sm font-medium">
                      Marked <span className="font-bold">{event.new_status}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mb-1">
                      by {event.changer?.full_name || 'System'} • {formatTime(event.created_at)}
                    </p>
                    {event.metadata?.reason && (
                      <p className="text-xs italic bg-muted p-2 rounded-lg mt-1 text-ink/80">"{event.metadata.reason}"</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
