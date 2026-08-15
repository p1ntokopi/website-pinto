import Link from "next/link"
import Image from "next/image"
import { Plus } from "lucide-react"

interface ProductCardProps {
  product: {
    id: string
    name: string
    slug: string
    description: string | null
    base_price: number
    image_url: string | null
    variants_count?: number
  }
  tableSlug: string
}

export function ProductCard({ product, tableSlug }: ProductCardProps) {
  const formattedPrice = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(product.base_price)

  return (
    <Link
      href={`/t/${tableSlug}/product/${product.slug}`}
      className="group flex items-stretch gap-4 border border-border/60 bg-white p-3 transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 outline-none hover:border-coffee/40"
    >
      <div className="relative h-24 w-24 shrink-0 overflow-hidden bg-muted">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="96px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] font-medium uppercase tracking-widest text-muted-foreground/40">
            P1NTO
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-grow flex-col py-0.5">
        <h3 className="truncate font-semibold leading-snug text-ink transition-colors group-hover:text-primary">
          {product.name}
        </h3>
        {product.description && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {product.description}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-sm font-semibold text-ink">{formattedPrice}</span>
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors group-hover:bg-ink"
          >
            <Plus className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  )
}
