'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Minus, Plus, Trash2, Loader2, ShoppingBag } from 'lucide-react'

import { useCart } from '@/components/ordering/cart-context'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { OrderingHeader } from '@/components/ordering/ordering-header'
import { useToast } from '@/hooks/use-toast'
import { submitOrder } from '@/app/t/[slug]/actions'
import { cn } from '@/lib/utils'

export function CartClient({
  tableSlug,
  tableNumber,
}: {
  tableSlug: string
  tableNumber: string | null
}) {
  const { items, updateQuantity, removeItem, clearCart, cartTotal } = useCart()
  const router = useRouter()
  const { toast } = useToast()

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

    setIsSubmitting(true)
    const requestId = Math.random().toString(36).substring(2, 15)

    const result = await submitOrder(tableSlug, orderNotes, items, requestId)
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
      <div className="flex min-h-dvh flex-col items-center justify-center bg-paper px-6 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-sm border border-ink/15 bg-white/60">
          <ShoppingBag className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
        </div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-coffee">
          Pesanan Anda
        </p>
        <h2 className="font-display text-3xl text-ink">Belum ada yang dipesan</h2>
        <p className="mx-auto mt-3 max-w-xs leading-relaxed text-muted-foreground">
          Jelajahi menu P1NTO dan temukan cangkir favorit Anda berikutnya.
        </p>
        <Button
          render={<Link href={`/t/${tableSlug}/menu`} />}
          className="mt-8 h-12 bg-ink px-8 text-paper hover:bg-coffee"
        >
          Lihat Menu
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-paper pb-32 lg:pb-12">
      <OrderingHeader
        backHref={`/t/${tableSlug}/menu`}
        title="Pesanan Anda"
        tableNumber={tableNumber ?? undefined}
        right={
          <button
            type="button"
            onClick={handleClear}
            aria-label={confirmClear ? 'Konfirmasi hapus semua pesanan' : 'Hapus semua pesanan'}
            className={cn(
              'rounded-sm px-3 py-2 text-xs font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/40',
              confirmClear
                ? 'bg-danger text-white'
                : 'text-danger hover:bg-danger/10'
            )}
          >
            {confirmClear ? 'Ketuk untuk konfirmasi' : 'Hapus'}
          </button>
        }
      />

      <main className="mx-auto max-w-6xl px-4 pt-8 md:px-8 lg:grid lg:grid-cols-[1fr_360px] lg:gap-16 lg:pt-12">
        {/* Items */}
        <div className="min-w-0">
          <p className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-coffee">
            <span>Review</span>
            <span aria-hidden="true" className="h-px w-8 bg-coffee/40" />
          </p>
          <h1 className="font-display text-4xl leading-tight text-ink md:text-5xl">
            Pesanan Anda
          </h1>

          <ul className="mt-8">
            {items.map((item) => {
              const lineTotal =
                (item.base_price +
                  item.options.reduce((s, o) => s + o.price_adjustment, 0)) *
                item.quantity
              return (
                <li
                  key={item.id}
                  className="flex gap-4 border-b border-ink/[0.08] py-5 first:border-t lg:gap-5 lg:py-6"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-sm bg-cream/50 ring-1 ring-ink/10">
                    {item.product_image_url ? (
                      <Image
                        src={item.product_image_url}
                        alt={item.product_name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[9px] font-semibold uppercase tracking-[0.2em] text-coffee/70">
                        P1NTO
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-display text-lg leading-snug text-ink">
                        {item.product_name}
                      </h3>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">
                        {formatPrice(lineTotal)}
                      </span>
                    </div>

                    {(item.variant_name || item.options.length > 0) && (
                      <div className="mt-1 space-y-0.5 text-[13px] leading-relaxed text-muted-foreground">
                        {item.variant_name && <p>{item.variant_name}</p>}
                        {item.options.map((opt) => (
                          <p key={opt.option_id}>
                            {opt.option_value_name}
                            {opt.price_adjustment > 0
                              ? ` +${formatPrice(opt.price_adjustment)}`
                              : ''}
                          </p>
                        ))}
                      </div>
                    )}

                    {item.notes && (
                      <p className="mt-1 text-[13px] italic leading-relaxed text-ink/60">
                        Catatan: {item.notes}
                      </p>
                    )}

                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex items-center border border-ink/15 rounded-sm">
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
                          className="flex h-11 w-11 items-center justify-center rounded-sm text-ink transition-colors duration-200 hover:bg-ink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coffee/40"
                        >
                          {item.quantity > 1 ? (
                            <Minus className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-danger" aria-hidden="true" />
                          )}
                        </button>
                        <span
                          aria-live="polite"
                          className="w-8 text-center text-sm font-medium tabular-nums text-ink"
                        >
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 1)}
                          aria-label={`Tambah jumlah ${item.product_name}`}
                          className="flex h-11 w-11 items-center justify-center rounded-sm text-ink transition-colors duration-200 hover:bg-ink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coffee/40"
                        >
                          <Plus className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Summary */}
        <aside className="mt-12 lg:sticky lg:top-24 lg:mt-0 lg:h-fit">
          <section className="border border-ink/10 bg-white/60 p-6">
            <h2 className="font-display text-2xl text-ink">Detail Pesanan</h2>

            <div className="mt-5 space-y-2">
              <Label htmlFor="order-notes" className="text-sm font-semibold text-ink">
                Catatan Umum <span className="font-normal text-muted-foreground">(opsional)</span>
              </Label>
              <Textarea
                id="order-notes"
                placeholder="Ada permintaan khusus untuk dapur?"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="h-24 resize-none border-ink/15 bg-paper"
                maxLength={300}
              />
            </div>

            {tableNumber && (
              <div className="mt-5 flex items-center justify-between rounded-sm bg-coffee/10 px-4 py-3">
                <span className="text-sm text-muted-foreground">Pesanan untuk</span>
                <span className="font-display text-lg font-semibold text-coffee">
                  Meja {tableNumber}
                </span>
              </div>
            )}
          </section>

          <section className="mt-8 border-t border-ink/10 pt-5">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatPrice(cartTotal)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-ink/10 pt-4">
              <span className="text-base font-semibold text-ink">Total</span>
              <span className="font-display text-2xl font-semibold tabular-nums text-ink">
                {formatPrice(cartTotal)}
              </span>
            </div>

            <Button
              onClick={handleCheckout}
              disabled={isSubmitting}
              className="mt-6 hidden h-14 w-full bg-ink text-base font-semibold text-paper transition-transform duration-200 hover:bg-coffee active:scale-[0.99] disabled:opacity-50 lg:flex"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                  Membuat Pesanan...
                </>
              ) : (
                `Pesan Sekarang • ${formatPrice(cartTotal)}`
              )}
            </Button>
          </section>
        </aside>
      </main>

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-paper pb-safe lg:hidden">
        <div className="mx-auto max-w-2xl p-3">
          <Button
            onClick={handleCheckout}
            disabled={isSubmitting}
            className="h-14 w-full bg-ink text-base font-semibold text-paper transition-transform duration-200 hover:bg-coffee active:scale-[0.99] disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                Membuat Pesanan...
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