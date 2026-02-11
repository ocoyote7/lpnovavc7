"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Truck, Shield, ChevronRight, Award, MapPin, Check } from "lucide-react"
import { useCart } from "@/contexts/cart-context"

interface BuyBoxProps {
  selectedFlavor?: string
}

export function BuyBox({ selectedFlavor = "chocolate" }: BuyBoxProps) {
  const [quantity, setQuantity] = useState(1)
  const [showAddedMessage, setShowAddedMessage] = useState(false)
  const router = useRouter()
  const { addToCart, setIsCartOpen, maxQuantity } = useCart()

  const flavorNames: Record<string, string> = {
    chocolate: "Chocolate",
    baunilha: "Baunilha",
    morango: "Morango"
  }

  const product = {
    id: "kit-whey-creatina",
    name: `Kit Suplemento Whey Protein 100% 900g + Creatina 300g - Max Titanium - ${flavorNames[selectedFlavor] || "Chocolate"}`,
    price: 49.87,
    image: "/images/foto-suplemento-1.webp",
    flavor: selectedFlavor
  }

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product)
    }
    setShowAddedMessage(true)
    setTimeout(() => {
      setShowAddedMessage(false)
      setIsCartOpen(true)
    }, 800)
  }

  return (
    <div className="bg-white space-y-0">
      {/* Price section */}
      <div className="px-4 py-3 border-b border-[#E6E6E6]">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#999] line-through">R$ 179,90</span>
          <span className="bg-[#00A650] text-white text-[10px] font-semibold px-1 py-0.5 rounded">
            72% OFF
          </span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-light text-[#333]">R$ 49</span>
          <span className="text-base text-[#333]">,87</span>
        </div>
        <p className="text-sm text-[#333]">
          {[1,2,3,4].map(i => { const total = (product.price * (1 + 0.075)); const parcela = (total / i).toFixed(2).replace(".", ","); return i === 1 ? `1x de R$ ${parcela} sem juros` : `${i}x de R$ ${parcela} com juros` })[3]}
        </p>
        <button className="text-sm text-[#3483FA] flex items-center gap-1 mt-1">
          Ver os meios de pagamento
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Shipping */}
      <div className="px-4 py-3 border-b border-[#E6E6E6]">
        <div className="flex items-start gap-3">
          <Truck className="w-5 h-5 text-[#00A650] flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm">
              <span className="text-[#00A650] font-semibold">Frete grátis</span>
              <span className="text-[#333]"> em até 13 dias úteis</span>
            </p>
            <div className="flex items-center gap-1 mt-1 text-xs text-[#666]">
              <MapPin className="w-3 h-3" />
              <span>Enviar para Meu endereço</span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[#999]" />
        </div>
      </div>

      {/* Returns */}
      <div className="px-4 py-3 border-b border-[#E6E6E6]">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-[#3483FA] flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-[#333]">
              <span className="text-[#3483FA]">Devolução grátis.</span> Você tem 30 dias a partir do recebimento.
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#999]" />
        </div>
      </div>

      {/* Stock info */}
      <div className="px-4 py-3 border-b border-[#E6E6E6]">
        <p className="text-sm text-[#00A650] font-medium">Estoque disponível</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm text-[#333]">Quantidade:</span>
          <div className="flex items-center gap-3 border border-[#E6E6E6] rounded px-3 py-1.5">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="text-[#3483FA] text-lg font-medium w-6"
            >
              -
            </button>
            <span className="text-sm text-[#333] min-w-[20px] text-center">{quantity}</span>
            <button 
              onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
              className="text-[#3483FA] text-lg font-medium w-6"
            >
              +
            </button>
          </div>
          <span className="text-xs text-[#666]">({maxQuantity} disp.)</span>
        </div>
      </div>

      {/* Seller info */}
      <div className="px-4 py-3 border-b border-[#E6E6E6]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[#666]">Vendido por</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm text-[#3483FA] font-medium">MAX TITANIUM</span>
              <span className="bg-[#FFF0EB] text-[#F73] text-[10px] px-1 py-0.5 rounded">
                Loja oficial
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Award className="w-3.5 h-3.5 text-[#00A650]" />
              <span className="text-xs text-[#00A650] font-medium">MercadoLíder Platinum</span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[#999]" />
        </div>
      </div>

      {/* Fixed bottom buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E6E6E6] px-4 py-3 space-y-2 z-50">
        <button 
          onClick={() => router.push("/endereco")}
          className="w-full py-3 bg-[#3483FA] hover:bg-[#2968C8] text-white font-medium rounded-md transition-colors text-sm animate-[subtlePulse_2.5s_ease-in-out_infinite]"
        >
          Comprar agora
        </button>
        <button 
          onClick={handleAddToCart}
          disabled={showAddedMessage}
          className={`w-full py-3 font-medium rounded-md transition-colors text-sm flex items-center justify-center gap-2 ${
            showAddedMessage 
              ? 'bg-[#00A650] text-white' 
              : 'bg-[#D6E9FF] hover:bg-[#C4DFFF] text-[#3483FA]'
          }`}
        >
          {showAddedMessage ? (
            <>
              <Check className="w-5 h-5" />
              Adicionado!
            </>
          ) : (
            'Adicionar ao carrinho'
          )}
        </button>
      </div>
    </div>
  )
}
