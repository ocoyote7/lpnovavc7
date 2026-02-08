"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { X, Trash2, Plus, Minus } from "lucide-react"
import { useCart } from "@/contexts/cart-context"

export function CartDrawer() {
  const router = useRouter()
  const { items, removeFromCart, updateQuantity, totalItems, totalPrice, isCartOpen, setIsCartOpen } = useCart()

  if (!isCartOpen) return null

  const handleCheckout = () => {
    setIsCartOpen(false)
    router.push("/checkout")
  }

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-[100]"
        onClick={() => setIsCartOpen(false)}
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white z-[101] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E6E6E6] bg-[#FFF159]">
          <h2 className="text-lg font-semibold text-[#333]">
            Carrinho ({totalItems})
          </h2>
          <button 
            onClick={() => setIsCartOpen(false)}
            className="p-1 hover:bg-black/10 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-[#333]" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-4 text-center">
              <div className="w-20 h-20 bg-[#F5F5F5] rounded-full flex items-center justify-center mb-4">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
              </div>
              <p className="text-[#333] font-medium mb-1">Seu carrinho está vazio</p>
              <p className="text-sm text-[#666]">Adicione produtos para continuar</p>
            </div>
          ) : (
            <div className="divide-y divide-[#E6E6E6]">
              {items.map((item) => (
                <div key={item.id} className="p-4 flex gap-3">
                  <Image
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    width={80}
                    height={80}
                    className="w-20 h-20 object-contain rounded border border-[#E6E6E6] flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#333] line-clamp-2 mb-1">{item.name}</p>
                    <p className="text-lg font-semibold text-[#333]">
                      R$ {item.price.toFixed(2).replace(".", ",")}
                    </p>
                    
                    {/* Quantity controls */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2 border border-[#E6E6E6] rounded">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1.5 hover:bg-[#F5F5F5] transition-colors"
                        >
                          <Minus className="w-4 h-4 text-[#3483FA]" />
                        </button>
                        <span className="text-sm text-[#333] min-w-[20px] text-center">
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1.5 hover:bg-[#F5F5F5] transition-colors"
                        >
                          <Plus className="w-4 h-4 text-[#3483FA]" />
                        </button>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="p-1.5 text-[#999] hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-[#E6E6E6] p-4 space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#666]">Subtotal ({totalItems} {totalItems === 1 ? 'produto' : 'produtos'})</span>
              <span className="text-xl font-semibold text-[#333]">
                R$ {totalPrice.toFixed(2).replace(".", ",")}
              </span>
            </div>
            <p className="text-xs text-[#00A650] flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M5 12l4-4m-4 4l4 4"/>
              </svg>
              Frete grátis
            </p>
            <button 
              onClick={handleCheckout}
              className="w-full py-3 bg-[#3483FA] hover:bg-[#2968C8] text-white font-medium rounded-md transition-colors text-sm"
            >
              Continuar compra
            </button>
          </div>
        )}
      </div>
    </>
  )
}
