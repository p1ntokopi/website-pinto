import Link from "next/link"
import Image from "next/image"
import { Plus } from "lucide-react"

import { cn } from "@/lib/utils"

interface MenuProductRowProps {
  product: {
    id: string
    name: string
    slug: string
    description: string | null
    base_price: number
    image_url: string | null
    variants_count?: number
    is_available?: boolean
  }
  tableSlug: string
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price)
}

export function MenuProductRow({ product, tableSlug }: MenuProductRowProps) {
  const hasVariants = (product.variants_count ?? 0) > 0
  const isAvailable = product.is_available ?? true

  const row = (
    <div
      className={cn(
        "group flex items-center gap-5 py-5 transition-colors duration-200",
        isAvailable ? "hover:bg-ink/[0.03]" : "opacity-45"
      )}
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-sm bg-cream/50 ring-1 ring-ink/10">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="64px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[9px] font-semibold uppercase tracking-[0.2em] text-coffee/70">
            P1NTO
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="font-display text-lg leading-snug text-ink transition-colors group-hover:text-coffee">
          {product.name}
        </h3>
        {product.description && (
          <p className="mt-0.5 line-clamp-1 text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <div className="text-right">
          <span className="text-sm font-semibold text-ink">
            {hasVariants ? `Mulai ${formatPrice(product.base_price)}` : formatPrice(product.base_price)}
          </span>
          {hasVariants && (
            <span className="block text-[11px] uppercase tracking-wider text-muted-foreground">
              Pilih varian
            </span>
          )}
        </div>
        <span
          aria-hidden="true"
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-sm border transition-all duration-200",
            isAvailable
              ? "border-ink/20 text-ink group-hover:border-coffee group-hover:bg-coffee group-hover:text-paper"
              : "border-ink/15 text-ink/60"
          )}
        >
          <Plus className="h-4 w-4" />
        </span>
      </div>
    </div>
  )

  if (!isAvailable) {
    return (
      <div className="flex items-center gap-5 py-5">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-sm bg-cream/50 ring-1 ring-ink/10">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
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
          <h3 className="font-display text-lg leading-snug text-ink">{product.name}</h3>
          {product.description && (
            <p className="mt-0.5 line-clamp-1 text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          )}
        </div>
        <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Habis
        </span>
      </div>
    )
  }

  return (
    <Link
      href={`/t/${tableSlug}/product/${product.slug}`}
      className="block border-b border-ink/[0.08] last:border-b-0 outline-none focus-visible:ring-2 focus-visible:ring-coffee/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
    >
      {row}
    </Link>
  )
}