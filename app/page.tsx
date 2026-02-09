"use client"

import { useState } from "react"
import Image from "next/image"
import { Header } from "@/components/mercadolivre/header"
import { ImageGallery } from "@/components/mercadolivre/image-gallery"
import { ProductInfo } from "@/components/mercadolivre/product-info"
import { BuyBox } from "@/components/mercadolivre/buy-box"
import { ProductDescription } from "@/components/mercadolivre/product-description"
import { CustomerReviews } from "@/components/mercadolivre/customer-reviews"

export default function ProductPage() {
  const [selectedFlavor, setSelectedFlavor] = useState("chocolate")

  return (
    <div className="min-h-screen bg-[#EDEDED] max-w-md mx-auto">
      <Header />

      <main>
        {/* Breadcrumb */}
        <nav className="bg-white px-4 py-2 text-xs text-[#666] overflow-x-auto whitespace-nowrap">
          <span className="text-[#3483FA]">Suplementos</span>
          <span className="mx-1">&gt;</span>
          <span className="text-[#3483FA]">Whey Protein</span>
          <span className="mx-1">&gt;</span>
          <span>Max Titanium</span>
        </nav>

        {/* Product image gallery */}
        <ImageGallery selectedFlavor={selectedFlavor} />

        {/* Product info */}
        <ProductInfo 
          selectedFlavor={selectedFlavor} 
          onFlavorChange={setSelectedFlavor} 
        />

        {/* Separator */}
        <div className="h-2 bg-[#EDEDED]" />

        {/* Buy box (price, shipping, seller) */}
        <BuyBox selectedFlavor={selectedFlavor} />

        {/* Separator */}
        <div className="h-2 bg-[#EDEDED]" />

        {/* Product description */}
        <ProductDescription />

        {/* Separator */}
        <div className="h-2 bg-[#EDEDED]" />

        {/* Banner promocional Mercado Livre */}
        <div className="bg-white">
          <Image
            src="/images/banner-ml.jpg"
            alt="Descontaco Mercado Livre - Ate 70% OFF com Frete Gratis"
            width={768}
            height={400}
            className="w-full h-auto"
            priority={false}
          />
        </div>

        {/* Separator */}
        <div className="h-2 bg-[#EDEDED]" />

        {/* Customer reviews */}
        <CustomerReviews />
      </main>
    </div>
  )
}
