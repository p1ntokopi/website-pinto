"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Minus, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { OrderingHeader } from "@/components/ordering/ordering-header"
import { useCart, CartItemOption } from "@/components/ordering/cart-context"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

type Product = {
  id: string
  name: string
  description: string | null
  base_price: number
  image_url: string | null
}

type Variant = {
  id: string
  name: string
  price: number
  is_default: boolean
}

type OptionValue = {
  id: string
  name: string
  price_adjustment: number
}

type Option = {
  id: string
  name: string
  is_required: boolean
  values: OptionValue[]
}

interface ProductDetailClientProps {
  tableSlug: string
  product: Product
  variants: Variant[]
  options: Option[]
}

export function ProductDetailClient({
  tableSlug,
  product,
  variants,
  options,
}: ProductDetailClientProps) {
  const router = useRouter()
  const { addItem } = useCart()
  const { toast } = useToast()

  const defaultVariant = variants.find((v) => v.is_default) || variants[0]
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(
    defaultVariant?.id
  )
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState("")

  const selectedVariant = variants.find((v) => v.id === selectedVariantId)
  const currentBasePrice = selectedVariant ? selectedVariant.price : product.base_price

  const optionsTotal = useMemo(
    () =>
      Object.entries(selectedOptions).reduce((sum, [optId, valId]) => {
        const opt = options.find((o) => o.id === optId)
        const val = opt?.values.find((v) => v.id === valId)
        return sum + (val?.price_adjustment || 0)
      }, 0),
    [selectedOptions, options]
  )

  const totalPrice = (currentBasePrice + optionsTotal) * quantity

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(price)

  const handleAddToCart = () => {
    for (const opt of options) {
      if (opt.is_required && !selectedOptions[opt.id]) {
        toast({
          variant: "destructive",
          title: "Pilihan wajib diisi",
          description: `Silakan pilih opsi untuk ${opt.name}.`,
        })
        return
      }
    }

    if (variants.length > 0 && !selectedVariantId) {
      toast({
        variant: "destructive",
        title: "Pilihan wajib diisi",
        description: "Silakan pilih ukuran atau varian.",
      })
      return
    }

    const cartOptions: CartItemOption[] = Object.entries(selectedOptions)
      .map(([optId, valId]) => {
        const opt = options.find((o) => o.id === optId)
        const val = opt?.values.find((v) => v.id === valId)
        if (!opt || !val) return null
        return {
          option_id: opt.id,
          option_value_id: val.id,
          option_name: opt.name,
          option_value_name: val.name,
          price_adjustment: val.price_adjustment,
        }
      })
      .filter((o): o is CartItemOption => o !== null)

    addItem({
      product_id: product.id,
      product_name: product.name,
      product_image_url: product.image_url,
      variant_id: selectedVariantId,
      variant_name: selectedVariant?.name,
      base_price: currentBasePrice,
      quantity,
      notes: notes.trim() || undefined,
      options: cartOptions,
    })

    toast({
      title: "Ditambahkan ke pesanan",
      description: `${quantity}x ${product.name} ditambahkan.`,
    })
    router.push(`/t/${tableSlug}/menu`)
  }

  return (
    <div className="min-h-screen bg-white pb-28">
      <OrderingHeader backHref={`/t/${tableSlug}/menu`} title={product.name} />

      <main className="mx-auto max-w-2xl">
        {/* Product Image */}
        <div className="relative aspect-square w-full bg-muted">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 672px) 100vw, 672px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground/30">
              <span className="text-xl font-medium uppercase tracking-widest">P1NTO</span>
            </div>
          )}
        </div>

        <div className="space-y-8 p-4">
          {/* Header Info */}
          <div>
            <h2 className="text-2xl font-bold text-ink">{product.name}</h2>
            {product.description && (
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {product.description}
              </p>
            )}
            {variants.length === 0 && (
              <p className="mt-3 text-lg font-semibold text-ink">
                {formatPrice(product.base_price)}
              </p>
            )}
          </div>

          {/* Variants */}
          {variants.length > 0 && (
            <section>
              <h3 className="mb-3 font-semibold">
                Ukuran / Jenis <span className="text-destructive">*</span>
              </h3>
              <RadioGroup
                name={`variant-${product.id}`}
                value={selectedVariantId || ""}
                onValueChange={setSelectedVariantId}
              >
                <div className="space-y-2">
                  {variants.map((variant) => {
                    const isSelected = selectedVariantId === variant.id
                    return (
                      <Label
                        key={variant.id}
                        onClick={() => setSelectedVariantId(variant.id)}
                        className={cn(
                          "flex cursor-pointer items-center justify-between border p-4 transition-colors",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted/40"
                        )}
                      >
                        <span className="flex items-center gap-3">
                          <RadioGroupItem value={variant.id} />
                          <span className="font-medium">{variant.name}</span>
                        </span>
                        <span className="text-muted-foreground">{formatPrice(variant.price)}</span>
                      </Label>
                    )
                  })}
                </div>
              </RadioGroup>
            </section>
          )}

          {/* Options */}
          {options.map((option) => (
            <section key={option.id}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">
                  {option.name}{" "}
                  {option.is_required && <span className="text-destructive">*</span>}
                </h3>
                {!option.is_required && (
                  <span className="text-xs text-muted-foreground">Opsional</span>
                )}
              </div>

              <RadioGroup
                name={`option-${option.id}`}
                value={selectedOptions[option.id] || ""}
                onValueChange={(val) =>
                  setSelectedOptions((prev) => ({ ...prev, [option.id]: val }))
                }
              >
                <div className="space-y-2">
                  {!option.is_required && selectedOptions[option.id] && (
                    <Label
                      className="flex cursor-pointer items-center border border-border p-4 transition-colors hover:bg-muted/40"
                      onClick={() => {
                        const newOpts = { ...selectedOptions }
                        delete newOpts[option.id]
                        setSelectedOptions(newOpts)
                      }}
                    >
                      <span className="flex items-center gap-3">
                        <RadioGroupItem value="" />
                        <span className="font-medium">Tidak ada</span>
                      </span>
                    </Label>
                  )}

                  {option.values.map((val) => {
                    const isSelected = selectedOptions[option.id] === val.id
                    return (
                      <Label
                        key={val.id}
                        onClick={() =>
                          setSelectedOptions((prev) => ({ ...prev, [option.id]: val.id }))
                        }
                        className={cn(
                          "flex cursor-pointer items-center justify-between border p-4 transition-colors",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted/40"
                        )}
                      >
                        <span className="flex items-center gap-3">
                          <RadioGroupItem value={val.id} />
                          <span className="font-medium">{val.name}</span>
                        </span>
                        {val.price_adjustment > 0 && (
                          <span className="text-muted-foreground">
                            +{formatPrice(val.price_adjustment)}
                          </span>
                        )}
                      </Label>
                    )
                  })}
                </div>
              </RadioGroup>
            </section>
          ))}

          {/* Notes */}
          <section>
            <Label htmlFor="product-notes" className="mb-3 block font-semibold">
              Instruksi Khusus
            </Label>
            <Textarea
              id="product-notes"
              placeholder="mis. Kurang manis, ekstra panas..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-24 resize-none"
              maxLength={200}
            />
          </section>
        </div>
      </main>

      {/* Floating Action Bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-white pb-safe">
        <div className="mx-auto flex max-w-2xl items-center gap-3 p-3">
          <div className="flex items-center rounded-full border border-border bg-muted/40 p-1">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label="Kurangi jumlah"
              className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-background disabled:opacity-40 focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span aria-live="polite" className="w-8 text-center font-semibold">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(20, q + 1))}
              disabled={quantity >= 20}
              aria-label="Tambah jumlah"
              className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-background disabled:opacity-40 focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <Button onClick={handleAddToCart} className="h-14 flex-grow text-base font-semibold">
            Tambah ke Pesanan • {formatPrice(totalPrice)}
          </Button>
        </div>
      </div>
    </div>
  )
}
