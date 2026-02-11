"use client"

import { useState, useEffect } from "react"
import { MapPin, Plus, X, ChevronLeft } from "lucide-react"
import { useCart } from "@/contexts/cart-context"

interface AddressModalProps {
  isOpen: boolean
  onClose: () => void
}

interface AddressData {
  cep: string
  logradouro: string
  bairro: string
  localidade: string
  uf: string
  numero: string
}

export function AddressModal({ isOpen, onClose }: AddressModalProps) {
  const [step, setStep] = useState<"options" | "cep" | "address" | "confirm">("options")
  const [cep, setCep] = useState("")
  const [loading, setLoading] = useState(false)
  const [address, setAddress] = useState<AddressData | null>(null)
  const [numero, setNumero] = useState("")
  const { addToCart, setIsCartOpen } = useCart()

  // Fetch CEP by IP on component mount
  useEffect(() => {
    if (isOpen && step === "options") {
      fetchCepByIp()
    }
  }, [isOpen, step])

  const fetchCepByIp = async () => {
    try {
      // Using a free IP geolocation API
      const ipResponse = await fetch("https://ipapi.co/json/")
      const ipData = await ipResponse.json()
      
      if (ipData.postal) {
        setCep(ipData.postal.replace("-", ""))
      }
    } catch (error) {
      console.log("Could not fetch CEP by IP")
    }
  }

  const fetchAddressByCep = async (cepValue: string) => {
    const cleanCep = cepValue.replace(/\D/g, "")
    if (cleanCep.length !== 8) return

    setLoading(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
      const data = await response.json()
      
      if (!data.erro) {
        setAddress({
          cep: data.cep,
          logradouro: data.logradouro || "Rua não identificada",
          bairro: data.bairro || "",
          localidade: data.localidade,
          uf: data.uf,
          numero: ""
        })
        setStep("address")
      }
    } catch (error) {
      console.log("Error fetching address")
    } finally {
      setLoading(false)
    }
  }

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 5) return numbers
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`
  }

  const handleAccept = () => {
    // Add kit to cart
    addToCart({
      id: "kit-whey-creatina",
      name: "Kit Suplemento Whey Protein 100% 900g + Creatina 300g - Max Titanium - Chocolate",
      price: 49.87,
      image: "/images/foto-suplemento-1.webp",
      flavor: "chocolate"
    })
    
    // Save address to localStorage
    if (address) {
      localStorage.setItem("ml_address", JSON.stringify({
        ...address,
        numero: numero || "S/N"
      }))
    }
    
    onClose()
    setIsCartOpen(true)
  }

  const handleBack = () => {
    if (step === "cep") setStep("options")
    else if (step === "address") setStep("cep")
    else if (step === "confirm") setStep("address")
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-end justify-center">
      <div className="bg-white w-full max-w-md rounded-t-2xl animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#E6E6E6]">
          {step !== "options" ? (
            <button onClick={handleBack} className="p-1">
              <ChevronLeft className="w-6 h-6 text-[#333]" />
            </button>
          ) : (
            <div className="w-8" />
          )}
          <h2 className="text-base font-medium text-[#333]">
            {step === "options" && "Onde você quer receber?"}
            {step === "cep" && "Informar CEP"}
            {step === "address" && "Confirmar endereço"}
            {step === "confirm" && "Detalhe da entrega"}
          </h2>
          <button onClick={onClose} className="p-1">
            <X className="w-6 h-6 text-[#666]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Step: Options */}
          {step === "options" && (
            <div className="space-y-0">
              <button
                onClick={() => setStep("cep")}
                className="w-full flex items-center gap-4 py-4 border-b border-[#E6E6E6] text-left"
              >
                <MapPin className="w-5 h-5 text-[#3483FA]" />
                <span className="text-sm text-[#333]">Informar um CEP</span>
              </button>
              <button
                onClick={() => setStep("cep")}
                className="w-full flex items-center gap-4 py-4 text-left"
              >
                <Plus className="w-5 h-5 text-[#3483FA]" />
                <span className="text-sm text-[#333]">Adicionar endereço completo</span>
              </button>
            </div>
          )}

          {/* Step: CEP Input */}
          {step === "cep" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#666] mb-2">CEP</label>
                <input
                  type="text"
                  value={formatCep(cep)}
                  onChange={(e) => setCep(e.target.value.replace(/\D/g, ""))}
                  placeholder="00000-000"
                  maxLength={9}
                  className="w-full px-4 py-3 border border-[#E6E6E6] rounded-lg text-[#333] text-base focus:outline-none focus:border-[#3483FA]"
                  inputMode="numeric"
                />
              </div>
              <button
                onClick={() => fetchAddressByCep(cep)}
                disabled={cep.length < 8 || loading}
                className="w-full py-4 bg-[#3483FA] hover:bg-[#2968C8] disabled:bg-[#E6E6E6] text-white font-medium rounded-lg transition-colors"
              >
                {loading ? "Buscando..." : "Continuar"}
              </button>
            </div>
          )}

          {/* Step: Address Confirmation */}
          {step === "address" && address && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 py-3">
                <div className="w-8 h-8 rounded-full bg-[#F5F5F5] flex items-center justify-center flex-shrink-0 mt-1">
                  <MapPin className="w-4 h-4 text-[#333]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#333]">
                    {address.logradouro}{numero ? `, ${numero}` : ""}
                  </p>
                  <p className="text-xs text-[#666]">{address.bairro}</p>
                  <p className="text-xs text-[#666]">{address.localidade} - {address.uf}</p>
                  <p className="text-xs text-[#666]">CEP: {address.cep}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm text-[#666] mb-2">Número</label>
                <input
                  type="text"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  placeholder="Número (opcional)"
                  className="w-full px-4 py-3 border border-[#E6E6E6] rounded-lg text-[#333] text-base focus:outline-none focus:border-[#3483FA]"
                  inputMode="numeric"
                />
              </div>

              <button
                onClick={() => setStep("confirm")}
                className="w-full py-4 bg-[#3483FA] hover:bg-[#2968C8] text-white font-medium rounded-lg transition-colors"
              >
                Continuar
              </button>
            </div>
          )}

          {/* Step: Final Confirmation */}
          {step === "confirm" && address && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-[#666] mb-3">Detalhe da entrega</p>
                <div className="flex items-start gap-3 py-3 border border-[#E6E6E6] rounded-lg px-3">
                  <div className="w-8 h-8 rounded-full bg-[#F5F5F5] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4 text-[#333]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#333]">
                      {address.logradouro} {numero || "S/N"}
                    </p>
                    <p className="text-xs text-[#666]">Entrega no endereço</p>
                    <button className="text-xs text-[#3483FA] mt-1">
                      Alterar a forma entrega
                    </button>
                  </div>
                </div>
                <button className="text-sm text-[#3483FA] mt-3">
                  Alterar ou escolher outro endereço
                </button>
              </div>

              {/* Shipping info */}
              <div className="bg-[#E8F8E8] rounded-lg p-3">
                <p className="text-sm text-[#00A650] font-medium">Frete grátis</p>
                <p className="text-xs text-[#666]">Chegará em até 13 dias úteis</p>
              </div>

              <button
                onClick={handleAccept}
                className="w-full py-4 bg-[#3483FA] hover:bg-[#2968C8] text-white font-medium rounded-lg transition-colors"
              >
                Aceitar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
