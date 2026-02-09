"use client"

import React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import { Heart, ChevronLeft, ChevronRight, Share2 } from "lucide-react"

interface ImageGalleryProps {
  selectedFlavor?: string
}

const flavorImages: Record<string, string> = {
  chocolate: "/images/foto-suplemento-1.webp",
  baunilha: "/images/baunilha-creatina.webp",
  morango: "/images/morango.jpg",
}

export function ImageGallery({ selectedFlavor = "chocolate" }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartX = useRef(0)
  const dragStartTime = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const images = [
    flavorImages[selectedFlavor] || flavorImages.chocolate,
    "/images/creapure.webp",
    "/images/tabela-nutricional.png",
    "/images/protein-bar.webp",
  ]

  useEffect(() => {
    setCurrentIndex(0)
  }, [selectedFlavor])

  const goTo = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(images.length - 1, index))
    setCurrentIndex(clamped)
    setDragOffset(0)
  }, [images.length])

  const nextImage = () => goTo(currentIndex + 1)
  const prevImage = () => goTo(currentIndex - 1)

  // Touch / pointer drag handlers
  const handleDragStart = useCallback((clientX: number) => {
    setIsDragging(true)
    dragStartX.current = clientX
    dragStartTime.current = Date.now()
  }, [])

  const handleDragMove = useCallback((clientX: number) => {
    if (!isDragging) return
    const diff = clientX - dragStartX.current
    // Resist dragging past first/last image
    if ((currentIndex === 0 && diff > 0) || (currentIndex === images.length - 1 && diff < 0)) {
      setDragOffset(diff * 0.3)
    } else {
      setDragOffset(diff)
    }
  }, [isDragging, currentIndex, images.length])

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return
    setIsDragging(false)

    const containerWidth = containerRef.current?.offsetWidth || 375
    const elapsed = Date.now() - dragStartTime.current
    const velocity = Math.abs(dragOffset) / elapsed // px/ms

    // Swipe threshold: 25% of width or fast flick (velocity > 0.5)
    const threshold = containerWidth * 0.25
    if (dragOffset < -threshold || (dragOffset < -30 && velocity > 0.5)) {
      goTo(currentIndex + 1)
    } else if (dragOffset > threshold || (dragOffset > 30 && velocity > 0.5)) {
      goTo(currentIndex - 1)
    } else {
      setDragOffset(0)
    }
  }, [isDragging, dragOffset, currentIndex, goTo])

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => handleDragStart(e.touches[0].clientX)
  const onTouchMove = (e: React.TouchEvent) => handleDragMove(e.touches[0].clientX)
  const onTouchEnd = () => handleDragEnd()

  // Mouse events (for desktop drag)
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    handleDragStart(e.clientX)
  }
  const onMouseMove = (e: React.MouseEvent) => handleDragMove(e.clientX)
  const onMouseUp = () => handleDragEnd()
  const onMouseLeave = () => { if (isDragging) handleDragEnd() }

  const translateX = -(currentIndex * 100) + (dragOffset / (containerRef.current?.offsetWidth || 375)) * 100

  return (
    <div className="relative">
      {/* Swipeable image track */}
      <div
        ref={containerRef}
        className="relative aspect-square bg-white overflow-hidden touch-pan-y select-none"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
      >
        <div
          className="flex h-full"
          style={{
            transform: `translateX(${translateX}%)`,
            transition: isDragging ? "none" : "transform 0.3s ease-out",
            willChange: "transform",
          }}
        >
          {images.map((src, i) => (
            <div key={i} className="relative w-full h-full flex-shrink-0">
              <Image
                src={src || "/placeholder.svg"}
                alt={`Foto ${i + 1} - Kit Whey Protein 900g + Creatina 300g`}
                fill
                className="object-contain p-4 pointer-events-none"
                priority={i === 0}
                draggable={false}
              />
            </div>
          ))}
        </div>

        {/* Navigation arrows */}
        {currentIndex > 0 && (
          <button
            onClick={prevImage}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full shadow-md flex items-center justify-center z-10"
          >
            <ChevronLeft className="w-5 h-5 text-[#333]" />
          </button>
        )}
        {currentIndex < images.length - 1 && (
          <button
            onClick={nextImage}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full shadow-md flex items-center justify-center z-10"
          >
            <ChevronRight className="w-5 h-5 text-[#333]" />
          </button>
        )}

        {/* Action buttons */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
          <button className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center">
            <Heart className="w-5 h-5 text-[#3483FA]" />
          </button>
          <button className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center">
            <Share2 className="w-5 h-5 text-[#3483FA]" />
          </button>
        </div>

        {/* Image counter */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded-full z-10">
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* Dots indicator */}
      <div className="flex justify-center gap-1.5 py-3 bg-white">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goTo(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              currentIndex === index ? "bg-[#3483FA]" : "bg-[#E6E6E6]"
            }`}
          />
        ))}
      </div>
    </div>
  )
}
