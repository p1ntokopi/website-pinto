"use client"

import { useCart } from "@/components/ordering/cart-context"
import { ShoppingBag } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function CartBar({ tableSlug }: { tableSlug: string }) {
  const { cartCount, cartTotal } = useCart()
  const pathname = usePathname()

  if (cartCount === 0) return null

  // Hide on the cart page itself
  if (pathname === `/t/${tableSlug}/cart`) return null

  const formattedTotal = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(cartTotal)

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background pb-safe">
      <Link
        href={`/t/${tableSlug}/cart`}
        className="mx-auto flex max-w-2xl items-center justify-between gap-3 p-3"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <span className="relative">
            <ShoppingBag className="h-5 w-5" aria-hidden="true" />
            <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-paper">
              {cartCount}
            </span>
          </span>
        </span>
        <span className="flex-1 text-left text-sm font-medium">
          {cartCount} item
        </span>
        <span className="flex items-baseline gap-2">
          <span className="text-sm text-muted-foreground">Periksa</span>
          <span className="text-base font-semibold text-ink">{formattedTotal}</span>
        </span>
      </Link>
    </div>
  )
}
