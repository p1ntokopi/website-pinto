import { CartProvider } from '@/components/ordering/cart-context'
import { Metadata } from 'next'
import { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'P1NTO Ordering',
  description: 'Order directly from your table.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0'
}

export default function CustomerOrderingLayout({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <div className="min-h-screen bg-[#FAFAF8] text-ink selection:bg-coffee/20">
        {children}
      </div>
    </CartProvider>
  )
}
