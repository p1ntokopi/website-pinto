import Link from 'next/link'
import Image from 'next/image'
import { Plus } from 'lucide-react'

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
  const formattedPrice = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(product.base_price)

  return (
    <Link 
      href={`/t/${tableSlug}/product/${product.slug}`}
      className="group flex flex-col sm:flex-row bg-white rounded-xl shadow-sm border border-border/50 overflow-hidden active:scale-[0.98] transition-transform"
    >
      {/* Mobile: Top image. Desktop/Tablet: Left image */}
      <div className="relative w-full sm:w-32 aspect-[4/3] sm:aspect-square bg-muted shrink-0">
        {product.image_url ? (
          <Image 
            src={product.image_url} 
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 128px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
            <span className="text-xs font-medium uppercase tracking-widest">P1NTO</span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-grow justify-between">
        <div>
          <h3 className="font-semibold text-base leading-tight mb-1 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
              {product.description}
            </p>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-auto pt-2">
          <div className="flex flex-col">
            {product.variants_count && product.variants_count > 0 ? (
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-0.5">Mulai dari</span>
            ) : null}
            <span className="font-medium text-sm text-ink">{formattedPrice}</span>
          </div>
          
          <div className="bg-primary/5 text-primary rounded-full p-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <Plus className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  )
}
