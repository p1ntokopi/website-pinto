import { CartProvider } from "@/components/ordering/cart-context"
import { Metadata } from "next"
import { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Pinto Ordering",
  description: "Tambah pesanan untuk sesi meja Anda.",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function CustomerOrderingLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  return (
    <CartProvider storageKey={`p1nto_cart_${slug}`}>
      <div className="min-h-screen bg-background text-ink selection:bg-coffee/20">
        {children}
      </div>
    </CartProvider>
  )
}
