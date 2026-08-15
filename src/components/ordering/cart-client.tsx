'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Minus, Plus, Trash2, Loader2, Info } from 'lucide-react'

import { useCart } from '@/components/ordering/cart-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { OrderingHeader } from '@/components/ordering/ordering-header'
import { useToast } from '@/hooks/use-toast'
import { submitOrder } from '@/app/t/[slug]/actions'

export function CartClient({ tableSlug }: { tableSlug: string }) {
  const { items, updateQuantity, removeItem, clearCart, cartTotal } = useCart()
  const router = useRouter()
  const { toast } = useToast()

  const [customerName, setCustomerName] = useState('')
  const [orderNotes, setOrderNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(price)

  useEffect(() => {
    return () => {
      if (clearTimer.current) clearTimeout(clearTimer.current)
    }
  }, [])

  const handleClear = () => {
    if (!confirmClear) {
      setConfirmClear(true)
      clearTimer.current = setTimeout(() => setConfirmClear(false), 3000)
      return
    }
    clearCart()
    setConfirmClear(false)
    toast({ title: 'Pesanan dibersihkan', description: 'Keranjang Anda sekarang kosong.' })
  }

  const handleCheckout = async () => {
    if (items.length === 0) return
    if (!customerName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Nama Wajib Diisi',
        description: 'Beri tahu kami nama Anda agar kami tahu siapa yang dipanggil.',
      })
      return
    }

    setIsSubmitting(true)
    const requestId = Math.random().toString(36).substring(2, 15)

    const result = await submitOrder(tableSlug, customerName, orderNotes, items, requestId)
    setIsSubmitting(false)

    if (result.error) {
      toast({ variant: 'destructive', title: 'Pembayaran Gagal', description: result.error })
      return
    }

    if (result.success && result.orderNumber) {
      clearCart()
      toast({
        title: 'Pesanan terkirim!',
        description: `Pesanan #${result.orderNumber} Anda telah diterima.`,
      })
      router.push(`/t/${tableSlug}/order/${result.orderNumber}`)
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white p-6 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <Info className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-ink">Pesanan Anda kosong</h2>
        <p className="mx-auto mb-8 max-w-xs leading-relaxed text-muted-foreground">
          Jelajahi menu P1NTO dan temukan cangkir favorit Anda berikutnya.
        </p>
        <Button render={<Link href={`/t/${tableSlug}/menu`} />} className="h-12 px-8">
          Lihat Menu
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pb-32">
      <OrderingHeader
        backHref={`/t/${tableSlug}/menu`}
        title="Review Pesanan"
        right={
          <button
            type="button"
            onClick={handleClear}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 outline-none ${
              confirmClear
                ? 'bg-destructive text-white'
                : 'text-destructive hover:bg-destructive/10'
            }`}
          >
            {confirmClear ? 'Ketuk untuk konfirmasi' : 'Hapus'}
          </button>
        }
      />

      <main className="mx-auto max-w-2xl space-y-8 p-4">
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 border-b border-border/50 pb-4 last:border-0 last:pb-0"
            >
              <div className="flex-grow">
                <h4 className="font-semibold text-ink">{item.product_name}</h4>
                <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
                  {item.variant_name && <p>• {item.variant_name}</p>}
                  {item.options.map((opt) => (
                    <p key={opt.option_id}>
                      • {opt.option_value_name}
                      {opt.price_adjustment > 0 ? ` (+${formatPrice(opt.price_adjustment)})` : ''}
                    </p>
                  ))}
                  {item.notes && <p className="italic text-ink/60">Catatan: {item.notes}</p>}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="font-medium text-ink">
                    {formatPrice(
                      (item.base_price +
                        item.options.reduce((s, o) => s + o.price_adjustment, 0)) *
                        item.quantity
                    )}
                  </span>

                  <div className="flex items-center rounded-full bg-muted p-1">
                    <button
                      type="button"
                      onClick={() =>
                        item.quantity > 1 ? updateQuantity(item.id, -1) : removeItem(item.id)
                      }
                      aria-label={
                        item.quantity > 1
                          ? `Kurangi jumlah ${item.product_name}`
                          : `Hapus ${item.product_name}`
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-background focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
                    >
                      {item.quantity > 1 ? (
                        <Minus className="h-3.5 w-3.5" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      )}
                    </button>
                    <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, 1)}
                      aria-label={`Tambah jumlah ${item.product_name}`}
                      className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-background focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <section className="space-y-4 border border-border/60 bg-muted/30 p-5">
          <h3 className="text-lg font-semibold">Detail Pesanan</h3>

          <div className="space-y-2">
            <Label htmlFor="customer-name">
              Nama Anda <span className="text-destructive">*</span>
            </Label>
            <Input
              id="customer-name"
              placeholder="Siapa yang akan kami panggil?"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="h-12 bg-white"
              autoComplete="name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="order-notes">Catatan Umum (Opsional)</Label>
            <Textarea
              id="order-notes"
              placeholder="Ada permintaan khusus untuk dapur?"
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              className="h-20 resize-none bg-white"
              maxLength={300}
            />
          </div>
        </section>

        <section className="space-y-3 border-t border-border pt-4">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatPrice(cartTotal)}</span>
          </div>
          <div className="flex justify-between border-t border-border/50 pt-2 text-lg font-bold">
            <span>Total</span>
            <span>{formatPrice(cartTotal)}</span>
          </div>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-white pb-safe">
        <div className="mx-auto max-w-2xl p-3">
          <Button
            onClick={handleCheckout}
            disabled={isSubmitting || !customerName.trim()}
            className="h-14 w-full text-base font-semibold transition-transform active:scale-[0.99]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Membuat Pesanan...
              </>
            ) : (
              `Pesan Sekarang • ${formatPrice(cartTotal)}`
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
