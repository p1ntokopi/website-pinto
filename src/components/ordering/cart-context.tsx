'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Database } from '@/types/database.types'

export type CartItemOption = {
  option_id: string
  option_value_id: string
  option_name: string
  option_value_name: string
  price_adjustment: number
}

export type CartItem = {
  id: string // Client-side unique ID
  product_id: string
  product_name: string
  product_image_url: string | null
  variant_id?: string
  variant_name?: string
  base_price: number
  quantity: number
  notes?: string
  options: CartItemOption[]
}

type CartContextType = {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, delta: number) => void
  clearCart: () => void
  cartTotal: number
  cartCount: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({
  children,
  storageKey = 'p1nto_cart',
}: {
  children: React.ReactNode
  storageKey?: string
}) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setItems(JSON.parse(saved))
      }
    } catch (e) {
      console.error('Failed to load cart', e)
    }
    setIsLoaded(true)
  }, [storageKey])

  // Save to localStorage when items change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(storageKey, JSON.stringify(items))
    }
  }, [items, isLoaded, storageKey])

  const addItem = (newItem: Omit<CartItem, 'id'>) => {
    setItems((prev) => {
      // Check if item exactly matches existing one
      const existingIndex = prev.findIndex(item => {
        if (item.product_id !== newItem.product_id) return false
        if (item.variant_id !== newItem.variant_id) return false
        if (item.notes !== newItem.notes) return false
        if (item.options.length !== newItem.options.length) return false
        
        // Deep compare options
        const sortedExistingOptions = [...item.options].sort((a, b) => a.option_id.localeCompare(b.option_id))
        const sortedNewOptions = [...newItem.options].sort((a, b) => a.option_id.localeCompare(b.option_id))
        
        for (let i = 0; i < sortedExistingOptions.length; i++) {
          if (sortedExistingOptions[i].option_value_id !== sortedNewOptions[i].option_value_id) {
            return false
          }
        }
        return true
      })

      if (existingIndex >= 0) {
        // Merge quantities
        const updated = [...prev]
        updated[existingIndex].quantity += newItem.quantity
        return updated
      }

      // Add new
      return [...prev, { ...newItem, id: Math.random().toString(36).substring(2, 9) }]
    })
  }

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  const updateQuantity = (id: string, delta: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQ = item.quantity + delta
        if (newQ <= 0) return item // handled by remove button instead
        return { ...item, quantity: newQ }
      }
      return item
    }))
  }

  const clearCart = () => setItems([])

  const cartTotal = items.reduce((total, item) => {
    const optionsTotal = item.options.reduce((sum, opt) => sum + opt.price_adjustment, 0)
    return total + ((item.base_price + optionsTotal) * item.quantity)
  }, 0)

  const cartCount = items.reduce((count, item) => count + item.quantity, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, cartTotal, cartCount }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
