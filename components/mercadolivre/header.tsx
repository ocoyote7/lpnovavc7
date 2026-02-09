"use client"

import React from "react"

import { useState } from "react"
import Image from "next/image"
import { Search, MapPin, ShoppingCart } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { CartDrawer } from "./cart-drawer"
import { AddressModal } from "./address-modal"

export function Header() {
  const { totalItems, setIsCartOpen } = useCart()
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `https://www.mercadolivre.com.br/jm/search?as_word=${encodeURIComponent(searchQuery)}`
    }
  }

  return (
    <>
      <header className="w-full sticky top-0 z-50">
        {/* Top yellow bar */}
        <div className="bg-[#FFF159] px-3 py-2">
          <div className="flex items-center gap-2">
            {/* Logo - Handshake icon */}
            <div className="flex-shrink-0">
              <Image
                src="/images/ml-logo-icon.png"
                alt="Mercado Livre"
                width={40}
                height={40}
                className="w-10 h-10 object-contain"
                priority
              />
            </div>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="flex items-center bg-white rounded shadow-sm">
                <div className="pl-2 py-2">
                  <Search className="w-4 h-4 text-[#999]" />
                </div>
                <input
                  type="text"
                  placeholder="Estou buscando..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-2 py-2 text-sm text-[#333] placeholder:text-[#999] outline-none bg-transparent"
                />
              </div>
            </form>

            {/* Cart icon only */}
            <button 
              className="p-1.5 relative flex-shrink-0"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingCart className="w-6 h-6 text-[#333]" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#E02020] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </button>
          </div>

          {/* Location */}
          <button 
            onClick={() => setIsAddressModalOpen(true)}
            className="flex items-center gap-1 mt-2 text-xs text-[#333] bg-transparent"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Enviar para</span>
            <span className="font-medium text-[#3483FA]">Meu endereço</span>
          </button>
        </div>
      </header>

      {/* Cart Drawer */}
      <CartDrawer />

      {/* Address Modal */}
      <AddressModal 
        isOpen={isAddressModalOpen} 
        onClose={() => setIsAddressModalOpen(false)} 
      />
    </>
  )
}
