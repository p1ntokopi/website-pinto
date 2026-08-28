'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Banknote, Loader2, Minus, Plus, Search, ShoppingBag, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatIDR } from '@/lib/finance/format'
import { createPosOrder } from '@/app/admin/(dashboard)/orders/actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { EmptyState } from '@/components/admin/owner/empty-state'

export type PosItem = {
  key: string
  productId: string | null
  coffeeVariantId: string | null
  name: string
  variantLabel: string | null
  price: number
  categoryId: string | null
}

type PosCategory = { id: string; name: string }
type PosTable = { id: string; tableNumber: string }

type CartLine = { item: PosItem; quantity: number; note: string }

export function PosClient({
  items,
  categories,
  tables,
}: {
  items: PosItem[]
  categories: PosCategory[]
  tables: PosTable[]
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState<string>('ALL')
  const [cart, setCart] = useState<Record<string, CartLine>>({})
  const [tableId, setTableId] = useState<string>('')
  const [customerName, setCustomerName] = useState('')
  const [submitting, setSubmitting] = useState<'save' | 'paid' | null>(null)

  const categoryHasItems = useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of items) {
      if (item.categoryId) counts.set(item.categoryId, (counts.get(item.categoryId) ?? 0) + 1)
    }
    return counts
  }, [items])

  const visibleCategories = categories.filter((c) => (categoryHasItems.get(c.id) ?? 0) > 0)

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return items.filter((item) => {
      if (categoryId !== 'ALL' && item.categoryId !== categoryId) return false
      if (query && !`${item.name} ${item.variantLabel ?? ''}`.toLowerCase().includes(query)) {
        return false
      }
      return true
    })
  }, [items, categoryId, search])

  const lines = Object.values(cart)
  const total = lines.reduce((sum, line) => sum + line.item.price * line.quantity, 0)
  const totalQuantity = lines.reduce((sum, line) => sum + line.quantity, 0)

  function addItem(item: PosItem) {
    setCart((current) => {
      const existing = current[item.key]
      return {
        ...current,
        [item.key]: {
          item,
          quantity: (existing?.quantity ?? 0) + 1,
          note: existing?.note ?? '',
        },
      }
    })
  }

  function changeQuantity(key: string, delta: number) {
    setCart((current) => {
      const line = current[key]
      if (!line) return current
      const quantity = line.quantity + delta
      if (quantity <= 0) {
        const next = { ...current }
        delete next[key]
        return next
      }
      return { ...current, [key]: { ...line, quantity } }
    })
  }

  function setNote(key: string, note: string) {
    setCart((current) => {
      const line = current[key]
      if (!line) return current
      return { ...current, [key]: { ...line, note } }
    })
  }

  async function submit(markPaidCash: boolean) {
    if (lines.length === 0) return
    setSubmitting(markPaidCash ? 'paid' : 'save')
    const result = await createPosOrder({
      items: lines.map((line) => ({
        productId: line.item.productId,
        coffeeVariantId: line.item.coffeeVariantId,
        quantity: line.quantity,
        notes: line.note.trim() || null,
      })),
      tableId: tableId || null,
      customerName: customerName.trim() || null,
      markPaidCash,
    })
    setSubmitting(null)

    if (result.error || !result.orderId) {
      toast({ variant: 'destructive', title: 'Gagal', description: result.error ?? 'Terjadi kesalahan.' })
      return
    }
    toast({
      title: 'Pesanan Dibuat',
      description: markPaidCash
        ? `${result.orderNumber} tercatat & lunas (cash).`
        : `${result.orderNumber} berhasil dibuat.`,
    })
    router.push(`/admin/orders/${result.orderId}`)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      {/* Catalog */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-text"
              aria-hidden="true"
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari produk…"
              className="pl-9"
              aria-label="Cari produk"
            />
          </div>
        </div>

        {visibleCategories.length > 0 && (
          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              aria-pressed={categoryId === 'ALL'}
              onClick={() => setCategoryId('ALL')}
              className={cn(
                'min-h-9 shrink-0 rounded-full border px-3.5 text-xs font-semibold transition-colors focus-visible:ring-3 focus-visible:ring-ring/40 outline-none',
                categoryId === 'ALL'
                  ? 'border-coffee bg-coffee text-paper'
                  : 'border-border-custom bg-paper text-muted-text hover:text-ink',
              )}
            >
              Semua
            </button>
            {visibleCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                aria-pressed={categoryId === category.id}
                onClick={() => setCategoryId(category.id)}
                className={cn(
                  'min-h-9 shrink-0 rounded-full border px-3.5 text-xs font-semibold transition-colors focus-visible:ring-3 focus-visible:ring-ring/40 outline-none',
                  categoryId === category.id
                    ? 'border-coffee bg-coffee text-paper'
                    : 'border-border-custom bg-paper text-muted-text hover:text-ink',
                )}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Tidak ada produk yang cocok"
            description="Coba kata kunci lain atau kategori berbeda."
          />
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => addItem(item)}
                className="flex min-h-24 flex-col justify-between rounded-sm border border-border-custom bg-card p-3 text-left transition-colors hover:border-coffee/50 hover:bg-coffee/[0.04] focus-visible:ring-3 focus-visible:ring-ring/40 outline-none"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
                  {item.variantLabel && (
                    <p className="mt-0.5 truncate text-xs text-muted-text">{item.variantLabel}</p>
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold tabular-nums text-coffee">
                    {formatIDR(item.price)}
                  </span>
                  <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-muted text-muted-text">
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cart */}
      <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className="space-y-4 rounded-sm border border-border-custom bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <ShoppingBag className="h-4 w-4 text-muted-text" aria-hidden="true" />
              Keranjang
              {totalQuantity > 0 && (
                <span className="rounded-full bg-coffee px-2 py-0.5 text-[10px] font-bold text-paper">
                  {totalQuantity}
                </span>
              )}
            </h2>
            {lines.length > 0 && (
              <button
                type="button"
                onClick={() => setCart({})}
                className="inline-flex min-h-9 items-center gap-1 rounded-sm px-2 text-xs font-semibold text-muted-text transition-colors hover:text-danger focus-visible:ring-3 focus-visible:ring-ring/40 outline-none"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Kosongkan
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3">
            <label className="flex flex-col gap-1 text-xs font-semibold text-muted-text">
              Meja (opsional)
              <select
                value={tableId}
                onChange={(event) => setTableId(event.target.value)}
                className="h-10 rounded-sm border border-border-custom bg-paper px-2.5 text-sm text-ink focus-visible:ring-3 focus-visible:ring-ring/40 outline-none"
              >
                <option value="">Tanpa meja (walk-in)</option>
                {tables.map((table) => (
                  <option key={table.id} value={table.id}>
                    Meja {table.tableNumber}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-muted-text">
              Nama pelanggan (opsional)
              <Input
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="cth. Bu Sari / Catering Ani"
              />
            </label>
          </div>

          {lines.length === 0 ? (
            <p className="rounded-sm border border-dashed border-border-custom px-4 py-8 text-center text-sm text-muted-text">
              Keranjang kosong. Pilih produk di sebelah kiri.
            </p>
          ) : (
            <ul className="max-h-[22rem] space-y-3 overflow-y-auto">
              {lines.map((line) => (
                <li key={line.item.key} className="rounded-sm border border-border-custom/70 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{line.item.name}</p>
                      {line.item.variantLabel && (
                        <p className="truncate text-xs text-muted-text">{line.item.variantLabel}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">
                      {formatIDR(line.item.price * line.quantity)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => changeQuantity(line.item.key, -1)}
                      aria-label={`Kurangi ${line.item.name}`}
                      className="flex h-9 w-9 items-center justify-center rounded-sm border border-border-custom text-ink transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40 outline-none"
                    >
                      <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <span className="min-w-8 text-center text-sm font-bold tabular-nums text-ink">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => changeQuantity(line.item.key, 1)}
                      aria-label={`Tambah ${line.item.name}`}
                      className="flex h-9 w-9 items-center justify-center rounded-sm border border-border-custom text-ink transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40 outline-none"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <input
                      value={line.note}
                      onChange={(event) => setNote(line.item.key, event.target.value)}
                      placeholder="Catatan…"
                      aria-label={`Catatan untuk ${line.item.name}`}
                      className="h-9 min-w-0 flex-1 rounded-sm border border-border-custom bg-paper px-2.5 text-xs text-ink focus-visible:ring-3 focus-visible:ring-ring/40 outline-none"
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="space-y-3 border-t border-border-custom/60 pt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold text-ink">Total</span>
              <span className="font-display text-2xl font-bold text-ink">{formatIDR(total)}</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Button
                onClick={() => submit(true)}
                disabled={lines.length === 0 || submitting !== null}
                className="h-12"
              >
                {submitting === 'paid' ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Banknote className="h-4 w-4" aria-hidden="true" />
                )}
                Buat &amp; Lunas (Cash)
              </Button>
              <Button
                variant="outline"
                onClick={() => submit(false)}
                disabled={lines.length === 0 || submitting !== null}
                className="h-12"
              >
                {submitting === 'save' && (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                )}
                Buat Pesanan (Belum Bayar)
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
