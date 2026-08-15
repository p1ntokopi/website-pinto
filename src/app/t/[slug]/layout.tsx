import { CartProvider } from "@/components/ordering/cart-context"
import { Metadata } from "next"
import { ReactNode } from "react"

export const metadata: Metadata = {
  title: "P1NTO Ordering",
  description: "Pesan langsung dari meja Anda.",
  viewport: {
    width: "device-width",
    initialScale: 1,
  },
}

export default function CustomerOrderingLayout({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <div className="min-h-screen bg-background text-ink selection:bg-coffee/20">
        {children}
      </div>
    </CartProvider>
  )
}
