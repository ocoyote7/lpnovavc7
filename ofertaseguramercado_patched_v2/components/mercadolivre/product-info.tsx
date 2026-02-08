"use client"

import { useState } from "react"
import { Star, ChevronRight } from "lucide-react"

const flavors = [
  { id: "chocolate", name: "Chocolate" },
  { id: "baunilha", name: "Baunilha" },
  { id: "morango", name: "Morango" },
]

interface ProductInfoProps {
  selectedFlavor?: string
  onFlavorChange?: (flavor: string) => void
}

export function ProductInfo({ selectedFlavor = "chocolate", onFlavorChange }: ProductInfoProps) {
  const [flavor, setFlavor] = useState(selectedFlavor)

  const handleFlavorChange = (newFlavor: string) => {
    setFlavor(newFlavor)
    onFlavorChange?.(newFlavor)
  }

  return (
    <div className="bg-white px-4 py-3 space-y-3">
      {/* Badges and sales info */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="bg-[#F73] text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
          MAIS VENDIDO
        </span>
        <span className="text-xs text-[#666]">Novo | +100mil vendidos</span>
      </div>

      {/* Title */}
      <h1 className="text-base font-normal text-[#333] leading-snug">
        Kit Suplemento Whey Protein 100% 900g + Creatina 300g - Max Titanium
      </h1>

      {/* Rating */}
      <div className="flex items-center gap-1">
        <span className="text-[#3483FA] text-sm font-medium">4.8</span>
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-3.5 h-3.5 ${
                star <= 4
                  ? "fill-[#3483FA] text-[#3483FA]"
                  : "fill-[#3483FA]/80 text-[#3483FA]"
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-[#3483FA]">(69588)</span>
        <ChevronRight className="w-4 h-4 text-[#3483FA]" />
      </div>

      {/* Kit info */}
      <div className="space-y-2 pt-2">
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1.5 text-xs rounded-full border border-[#3483FA] text-[#3483FA] bg-[#F0F7FF]">
            100% Whey 900g
          </span>
          <span className="px-3 py-1.5 text-xs rounded-full border border-[#3483FA] text-[#3483FA] bg-[#F0F7FF]">
            Creatina 300g
          </span>
        </div>
      </div>

      {/* Flavor Selection */}
      <div className="space-y-2 pt-2 border-t border-[#E6E6E6]">
        <p className="text-sm text-[#333] font-medium">Sabor: <span className="font-normal capitalize">{flavor}</span></p>
        <div className="flex flex-wrap gap-2">
          {flavors.map((f) => (
            <button
              key={f.id}
              onClick={() => handleFlavorChange(f.id)}
              className={`px-4 py-2 text-sm rounded-full border transition-colors ${
                flavor === f.id
                  ? "border-[#3483FA] text-[#3483FA] bg-[#F0F7FF]"
                  : "border-[#E6E6E6] text-[#333] hover:border-[#3483FA]"
              }`}
            >
              {f.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export { flavors }
