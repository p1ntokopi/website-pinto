'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/components/ordering/cart-context'
import { ChevronLeft, Minus, Plus, Trash2, Loader2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { submitOrder } from '@/app/t/[slug]/actions'
import Link from 'next/link'

export function CartClient({ tableSlug }: { tableSlug: string }) {
  const { items, updateQuantity, removeItem, clearCart, cartTotal } = useCart()
  const router = useRouter()
  const { toast } = useToast()

  const [customerName, setCustomerName] = useState('')
  const [orderNotes, setOrderNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(price)
  }

  const handleCheckout = async () => {
    if (items.length === 0) return
    if (!customerName.trim()) {
      toast({ variant: 'destructive', title: 'Name Required', description: 'Please tell us your name so we know who to call.' })
      return
    }

    setIsSubmitting(true)
    const requestId = Math.random().toString(36).substring(2, 15) // Simple idempotency key for M3

    const result = await submitOrder(tableSlug, customerName, orderNotes, items, requestId)
    
    setIsSubmitting(false)

    if (result.error) {
      toast({ variant: 'destructive', title: 'Checkout Failed', description: result.error })
      return
    }

    if (result.success && result.orderNumber) {
      clearCart()
      toast({ title: 'Order placed!', description: `Your order #${result.orderNumber} has been received.` })
      router.push(`/t/${tableSlug}/order/${result.orderNumber}`)
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-white">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
          <Info className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Your order is empty</h2>
        <p className="text-muted-foreground mb-8 max-w-xs mx-auto leading-relaxed">
          Explore the P1NTO menu and discover your next favorite cup.
        </p>
        <Button render={<Link href={`/t/${tableSlug}/order`} />} className="h-12 px-8 rounded-xl font-medium">
          View Menu
        </Button>
      </div>
    )
  }

  return (
    <div className="pb-32 bg-white min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-md mx-auto px-4 h-[60px] flex items-center justify-between">
          <div className="flex items-center">
            <Link href={`/t/${tableSlug}/menu`} className="p-2 -ml-2 rounded-full hover:bg-muted text-ink transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <span className="font-semibold ml-2">Review Order</span>
          </div>
          <button 
            onClick={() => { if(confirm('Clear all items?')) clearCart() }}
            className="text-xs font-medium text-destructive hover:opacity-80"
          >
            CLEAR
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-8">
        
        {/* Items */}
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 pb-4 border-b border-border/50 last:border-0 last:pb-0">
              <div className="flex-grow">
                <h4 className="font-semibold">{item.product_name}</h4>
                <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                  {item.variant_name && <p>• {item.variant_name}</p>}
                  {item.options.map(opt => (
                    <p key={opt.option_id}>• {opt.option_value_name} {opt.price_adjustment > 0 ? `(+${formatPrice(opt.price_adjustment)})` : ''}</p>
                  ))}
                  {item.notes && <p className="italic text-ink/60">Note: {item.notes}</p>}
                </div>
                
                <div className="flex items-center justify-between mt-3">
                  <span className="font-medium">
                    {formatPrice((item.base_price + item.options.reduce((s, o) => s + o.price_adjustment, 0)) * item.quantity)}
                  </span>
                  
                  <div className="flex items-center bg-muted rounded-full p-1">
                    <button 
                      onClick={() => item.quantity > 1 ? updateQuantity(item.id, -1) : removeItem(item.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-background transition-colors"
                    >
                      {item.quantity > 1 ? <Minus className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5 text-destructive" />}
                    </button>
                    <span className="w-6 text-center font-medium text-sm">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-background transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Customer Details */}
        <div className="bg-muted/30 p-5 rounded-2xl border border-border/50 space-y-4">
          <h3 className="font-semibold text-lg">Order Details</h3>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Name <span className="text-destructive">*</span></label>
            <Input 
              placeholder="Who should we call?" 
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="bg-white border-border/50 h-12 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">General Notes (Optional)</label>
            <Textarea 
              placeholder="Any general requests for the kitchen?" 
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              className="bg-white border-border/50 resize-none h-20 rounded-xl"
              maxLength={300}
            />
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-3 pt-4 border-t border-border">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatPrice(cartTotal)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-2 border-t border-border/50">
            <span>Total</span>
            <span>{formatPrice(cartTotal)}</span>
          </div>
        </div>
      </main>

      {/* Floating Checkout Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 z-40 bg-gradient-to-t from-white via-white to-transparent pb-safe">
        <div className="max-w-md mx-auto">
          <Button 
            onClick={handleCheckout}
            disabled={isSubmitting || !customerName.trim()}
            className="w-full h-14 rounded-2xl text-base font-semibold transition-transform active:scale-95 shadow-md"
          >
            {isSubmitting ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Placing Order...</>
            ) : (
              `Place Order • ${formatPrice(cartTotal)}`
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
