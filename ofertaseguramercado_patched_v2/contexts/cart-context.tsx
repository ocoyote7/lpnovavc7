"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image: string
  flavor?: string
}

interface CartContextType {
  items: CartItem[]
  addToCart: (item: Omit<CartItem, "quantity">) => void
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
  isCartOpen: boolean
  setIsCartOpen: (open: boolean) => void
  maxQuantity: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const MAX_QUANTITY = 12

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)

  const addToCart = (item: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const itemId = item.flavor ? `${item.id}-${item.flavor}` : item.id
      const existingItem = prev.find((i) => i.id === itemId)
      if (existingItem) {
        // Limit to max quantity
        if (existingItem.quantity >= MAX_QUANTITY) {
          return prev
        }
        return prev.map((i) =>
          i.id === itemId ? { ...i, quantity: Math.min(i.quantity + 1, MAX_QUANTITY) } : i
        )
      }
      return [...prev, { ...item, id: itemId, quantity: 1 }]
    })
  }

  const removeFromCart = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(id)
      return
    }
    // Limit to max quantity
    const limitedQuantity = Math.min(quantity, MAX_QUANTITY)
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: limitedQuantity } : item))
    )
  }

  const clearCart = () => {
    setItems([])
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isCartOpen,
        setIsCartOpen,
        maxQuantity: MAX_QUANTITY,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
