'use client'

import { useCart } from '@/components/ordering/cart-context'
import { ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function CartBar({ tableSlug }: { tableSlug: string }) {
  const { cartCount, cartTotal } = useCart()
  const pathname = usePathname()
  
  if (cartCount === 0) return null

  // Hide on the cart page itself
  if (pathname === `/t/${tableSlug}/cart`) return null

  const formattedTotal = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(cartTotal)

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 z-40 bg-gradient-to-t from-background via-background to-transparent pointer-events-none pb-safe">
      <Link 
        href={`/t/${tableSlug}/cart`}
        className="flex items-center justify-between w-full max-w-md mx-auto bg-primary text-primary-foreground p-4 rounded-2xl shadow-lg pointer-events-auto transition-transform active:scale-95"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            <span className="absolute -top-2 -right-2 bg-coffee text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          </div>
          <span className="font-medium text-sm">{cartCount} {cartCount === 1 ? 'item' : 'items'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold">{formattedTotal}</span>
          <span className="opacity-80 text-sm ml-1">View Cart →</span>
        </div>
      </Link>
    </div>
  )
}
