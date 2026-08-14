'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ChevronLeft, Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart, CartItemOption } from '@/components/ordering/cart-context'
import { useToast } from '@/hooks/use-toast'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'

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

export function ProductDetailClient({ tableSlug, product, variants, options }: ProductDetailClientProps) {
  const router = useRouter()
  const { addItem } = useCart()
  const { toast } = useToast()

  // State
  const defaultVariant = variants.find(v => v.is_default) || variants[0]
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(defaultVariant?.id)
  
  // selectedOptions maps option_id to selected option_value_id(s)
  // For simplicity in M3, assuming single choice per option (radio) unless it's not required (then checkbox can be used, but radio with 'none' is better).
  // The schema doesn't specify multi-select options. We'll treat all options as single-choice (Radio) for now.
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')

  // Derived
  const selectedVariant = variants.find(v => v.id === selectedVariantId)
  const currentBasePrice = selectedVariant ? selectedVariant.price : product.base_price

  const optionsTotal = Object.entries(selectedOptions).reduce((sum, [optId, valId]) => {
    const opt = options.find(o => o.id === optId)
    const val = opt?.values.find(v => v.id === valId)
    return sum + (val?.price_adjustment || 0)
  }, 0)

  const totalPrice = (currentBasePrice + optionsTotal) * quantity

  const handleAddToCart = () => {
    // Validate required options
    for (const opt of options) {
      if (opt.is_required && !selectedOptions[opt.id]) {
        toast({ variant: 'destructive', title: 'Required Option', description: `Please select a value for ${opt.name}` })
        return
      }
    }

    if (variants.length > 0 && !selectedVariantId) {
      toast({ variant: 'destructive', title: 'Required Variant', description: 'Please select a variant' })
      return
    }

    // Build cart item options
    const cartOptions: CartItemOption[] = Object.entries(selectedOptions).map(([optId, valId]) => {
      const opt = options.find(o => o.id === optId)!
      const val = opt.values.find(v => v.id === valId)!
      return {
        option_id: opt.id,
        option_value_id: val.id,
        option_name: opt.name,
        option_value_name: val.name,
        price_adjustment: val.price_adjustment
      }
    })

    addItem({
      product_id: product.id,
      product_name: product.name,
      product_image_url: product.image_url,
      variant_id: selectedVariantId,
      variant_name: selectedVariant?.name,
      base_price: currentBasePrice,
      quantity,
      notes: notes.trim() || undefined,
      options: cartOptions
    })

    toast({ title: 'Added to cart', description: `${quantity}x ${product.name} added.` })
    router.push(`/t/${tableSlug}/menu`)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(price)
  }

  return (
    <div className="pb-32 bg-white min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-md mx-auto px-4 h-[60px] flex items-center">
          <Link href={`/t/${tableSlug}/menu`} className="p-2 -ml-2 rounded-full hover:bg-muted text-ink transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <span className="font-semibold ml-2 flex-grow truncate">{product.name}</span>
        </div>
      </header>

      <main className="max-w-md mx-auto">
        {/* Product Image */}
        <div className="relative w-full aspect-square bg-muted">
          {product.image_url ? (
            <Image 
              src={product.image_url} 
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
              <span className="text-xl font-medium uppercase tracking-widest">P1NTO</span>
            </div>
          )}
        </div>

        <div className="p-4 space-y-6">
          {/* Header Info */}
          <div>
            <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
            {product.description && (
              <p className="text-muted-foreground leading-relaxed text-sm">
                {product.description}
              </p>
            )}
            {variants.length === 0 && (
              <p className="font-medium text-lg mt-3">{formatPrice(product.base_price)}</p>
            )}
          </div>

          {/* Variants */}
          {variants.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Size / Type <span className="text-destructive">*</span></h3>
              </div>
              <RadioGroup value={selectedVariantId} onValueChange={setSelectedVariantId}>
                <div className="grid gap-2">
                  {variants.map(variant => (
                    <Label
                      key={variant.id}
                      className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-colors ${
                        selectedVariantId === variant.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value={variant.id} />
                        <span className="font-medium">{variant.name}</span>
                      </div>
                      <span className="text-muted-foreground">{formatPrice(variant.price)}</span>
                    </Label>
                  ))}
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Options */}
          {options.map(option => (
            <div key={option.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">
                  {option.name} {option.is_required && <span className="text-destructive">*</span>}
                </h3>
                {!option.is_required && (
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Optional</span>
                )}
              </div>
              
              <RadioGroup 
                value={selectedOptions[option.id] || ''} 
                onValueChange={(val) => setSelectedOptions(prev => ({ ...prev, [option.id]: val }))}
              >
                <div className="grid gap-2">
                  {/* For optional options, provide a "None" choice if one is selected */}
                  {!option.is_required && selectedOptions[option.id] && (
                    <Label className="flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-colors hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="" onClick={() => {
                          const newOpts = {...selectedOptions}
                          delete newOpts[option.id]
                          setSelectedOptions(newOpts)
                        }} />
                        <span className="font-medium">None</span>
                      </div>
                    </Label>
                  )}

                  {option.values.map(val => (
                    <Label
                      key={val.id}
                      className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-colors ${
                        selectedOptions[option.id] === val.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value={val.id} />
                        <span className="font-medium">{val.name}</span>
                      </div>
                      {val.price_adjustment > 0 && (
                        <span className="text-muted-foreground">+{formatPrice(val.price_adjustment)}</span>
                      )}
                    </Label>
                  ))}
                </div>
              </RadioGroup>
            </div>
          ))}

          {/* Notes */}
          <div className="space-y-3">
            <h3 className="font-semibold">Special Instructions</h3>
            <Textarea 
              placeholder="e.g. Less sweet, extra hot..." 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none h-24 rounded-xl"
              maxLength={200}
            />
          </div>
        </div>
      </main>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 z-40 bg-gradient-to-t from-white via-white to-transparent pb-safe">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <div className="flex items-center bg-muted rounded-full p-1 border">
            <button 
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-background transition-colors disabled:opacity-50"
              disabled={quantity <= 1}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-medium">{quantity}</span>
            <button 
              onClick={() => setQuantity(q => Math.min(20, q + 1))}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-background transition-colors disabled:opacity-50"
              disabled={quantity >= 20}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <Button 
            onClick={handleAddToCart}
            className="flex-grow h-14 rounded-2xl text-base font-semibold transition-transform active:scale-95"
          >
            Add to Order • {formatPrice(totalPrice)}
          </Button>
        </div>
      </div>
    </div>
  )
}
