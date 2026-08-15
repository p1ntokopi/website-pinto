"use client"

import { useCart } from "@/components/ordering/cart-context"
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
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-paper pb-safe lg:hidden">
      <div className="mx-auto max-w-2xl p-3">
        <Link
          href={`/t/${tableSlug}/cart`}
          className="flex items-center justify-between gap-3 bg-ink px-5 py-4 text-paper transition-colors hover:bg-coffee"
        >
          <span className="flex items-baseline gap-2 text-sm">
            <span className="font-semibold">{cartCount} item</span>
            <span aria-hidden="true" className="h-1 w-1 rounded-full bg-paper/40" />
            <span>Periksa pesanan</span>
          </span>
          <span className="text-base font-semibold">{formattedTotal}</span>
        </Link>
      </div>
    </div>
  )
}