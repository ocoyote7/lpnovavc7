"use client"

import React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { 
  ChevronLeft, 
  MapPin, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Truck,
  Zap
} from "lucide-react"

// ============================================
// INTERFACES
// ============================================

interface AddressData {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}

interface FormData {
  cep: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function maskCEP(value: string): string {
  const cleaned = value.replace(/\D/g, "").slice(0, 8)
  if (cleaned.length > 5) {
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`
  }
  return cleaned
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function AddressPage() {
  const router = useRouter()
  
  // Form state - CEP vazio para o usuario preencher
  const [formData, setFormData] = useState<FormData>({
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: ""
  })
  
  // UI state
  const [cepLoading, setCepLoading] = useState(false)
  const [cepError, setCepError] = useState("")
  const [cepValid, setCepValid] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // ============================================
  // CEP LOOKUP
  // ============================================
  
  const fetchCEP = useCallback(async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "")
    
    if (cleanCep.length !== 8) {
      setCepValid(false)
      setCepError("")
      return
    }
    
    setCepLoading(true)
    setCepError("")
    setCepValid(false)
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
      const data: AddressData = await response.json()
      
      if (data.erro) {
        setCepError("CEP nao encontrado. Verifique e tente novamente.")
        setCepValid(false)
        return
      }
      
      setFormData(prev => ({
        ...prev,
        street: data.logradouro || "",
        neighborhood: data.bairro || "",
        city: data.localidade || "",
        state: data.uf || "",
        complement: data.complemento || prev.complement
      }))
      
      setCepValid(true)
      setCepError("")
      
    } catch {
      setCepError("Erro ao buscar CEP. Tente novamente.")
      setCepValid(false)
    } finally {
      setCepLoading(false)
    }
  }, [])
  
  // Fetch CEP when it changes
  useEffect(() => {
    const cleanCep = formData.cep.replace(/\D/g, "")
    if (cleanCep.length === 8) {
      const timeoutId = setTimeout(() => {
        fetchCEP(formData.cep)
      }, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [formData.cep, fetchCEP])
  
  // ============================================
  // VALIDATION
  // ============================================
  
  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors }
    
    switch (name) {
      case "cep":
        if (!value) {
          newErrors.cep = "Digite o CEP"
        } else if (value.replace(/\D/g, "").length !== 8) {
          newErrors.cep = "CEP deve ter 8 digitos"
        } else {
          delete newErrors.cep
        }
        break
      case "number":
        if (!value.trim()) {
          newErrors.number = "Digite o numero"
        } else {
          delete newErrors.number
        }
        break
      case "street":
        if (!value.trim()) {
          newErrors.street = "Digite a rua"
        } else {
          delete newErrors.street
        }
        break
      case "neighborhood":
        if (!value.trim()) {
          newErrors.neighborhood = "Digite o bairro"
        } else {
          delete newErrors.neighborhood
        }
        break
      case "city":
        if (!value.trim()) {
          newErrors.city = "Digite a cidade"
        } else {
          delete newErrors.city
        }
        break
      case "state":
        if (!value.trim()) {
          newErrors.state = "Digite o estado"
        } else {
          delete newErrors.state
        }
        break
    }
    
    setErrors(newErrors)
  }
  
  const handleBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }))
    validateField(name, formData[name as keyof FormData])
  }
  
  const handleChange = (name: keyof FormData, value: string) => {
    let processedValue = value
    
    if (name === "cep") {
      processedValue = maskCEP(value)
    }
    
    setFormData(prev => ({ ...prev, [name]: processedValue }))
    
    if (touched[name]) {
      validateField(name, processedValue)
    }
  }
  
  // Check if form is valid
  const isFormValid = () => {
    const requiredFields = ["cep", "street", "number", "neighborhood", "city", "state"]
    return requiredFields.every(field => {
      const value = formData[field as keyof FormData]
      return value && value.trim() !== ""
    }) && cepValid && Object.keys(errors).length === 0
  }
  
  // ============================================
  // SUBMIT
  // ============================================
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate all fields
    const requiredFields = ["cep", "street", "number", "neighborhood", "city", "state"]
    const allTouched: Record<string, boolean> = {}
    
    requiredFields.forEach(field => {
      allTouched[field] = true
      validateField(field, formData[field as keyof FormData])
    })
    
    setTouched(allTouched)
    
    if (!isFormValid()) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Salvar endereco em localStorage para usar no checkout
      localStorage.setItem("deliveryAddress", JSON.stringify(formData))
      
      // Simular delay de processamento
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Redirecionar para checkout
      router.push("/checkout")
      
    } catch (error) {
      console.error("Error saving address:", error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // ============================================
  // INPUT CLASS
  // ============================================
  
  const inputClass = (fieldName: string, hasError?: boolean) => `
    w-full px-3 py-3 border rounded-md text-[#333] text-base bg-white
    focus:outline-none focus:ring-2 focus:ring-[#3483FA] focus:border-transparent
    transition-colors
    ${(touched[fieldName] && errors[fieldName]) || hasError ? "border-red-500" : "border-[#E6E6E6]"}
    ${cepValid && fieldName === "cep" ? "border-[#00A650]" : ""}
  `

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-[#EBEBEB] max-w-md mx-auto">
      {/* Header */}
      <header className="bg-[#FFF159] px-4 py-3 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-[#333]">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-lg font-normal text-[#333]">Endereco de entrega</h1>
        </div>
      </header>

      {/* Progress Indicator */}
      <div className="bg-white px-4 py-3 border-b border-[#E6E6E6]">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#3483FA] text-white text-xs font-semibold flex items-center justify-center">
              1
            </div>
            <span className="text-sm font-medium text-[#3483FA]">Endereco</span>
          </div>
          <div className="flex-1 h-0.5 bg-[#E6E6E6]" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#E6E6E6] text-[#999] text-xs font-semibold flex items-center justify-center">
              2
            </div>
            <span className="text-sm text-[#999]">Pagamento</span>
          </div>
        </div>
      </div>

      {/* Delivery Info Banner */}
      <div className="bg-[#E8F5E9] px-4 py-3 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#00A650]" />
          <span className="text-xs font-semibold text-[#00A650]">FULL</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#333]">
          <Truck className="w-4 h-4 text-[#00A650]" />
          <span>Entrega <strong>gratis</strong> em todo Brasil</span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* CEP Field */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <label className="block text-sm font-medium text-[#333] mb-2">
            CEP <span className="text-red-500">*</span>
          </label>
          
          <div className="relative">
            <input
              type="text"
              value={formData.cep}
              onChange={(e) => handleChange("cep", e.target.value)}
              onBlur={() => handleBlur("cep")}
              placeholder="00000-000"
              className={inputClass("cep", !!cepError)}
            />
            
            {/* Loading indicator */}
            {cepLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="w-5 h-5 text-[#3483FA] animate-spin" />
              </div>
            )}
            
            {/* Success indicator */}
            {cepValid && !cepLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <CheckCircle className="w-5 h-5 text-[#00A650]" />
              </div>
            )}
          </div>
          
          {/* CEP Error */}
          {cepError && (
            <div className="flex items-center gap-1.5 mt-2 text-red-500">
              <AlertCircle className="w-4 h-4" />
              <span className="text-xs">{cepError}</span>
            </div>
          )}
          
          {/* Field error */}
          {touched.cep && errors.cep && !cepError && (
            <p className="text-xs text-red-500 mt-1">{errors.cep}</p>
          )}
          
          <a 
            href="https://buscacepinter.correios.com.br/app/endereco/index.php" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-[#3483FA] mt-2 inline-block hover:underline"
          >
            Nao sei meu CEP
          </a>
        </div>

        {/* Address Fields */}
        <div className="bg-white rounded-lg p-4 shadow-sm space-y-4">
          <h3 className="text-sm font-medium text-[#333] flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#666]" />
            Dados do endereco
          </h3>
          
          {/* Street */}
          <div>
            <label className="block text-sm text-[#666] mb-1">
              Rua / Avenida <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.street}
              onChange={(e) => handleChange("street", e.target.value)}
              onBlur={() => handleBlur("street")}
              placeholder="Nome da rua"
              className={inputClass("street")}
            />
            {touched.street && errors.street && (
              <p className="text-xs text-red-500 mt-1">{errors.street}</p>
            )}
          </div>
          
          {/* Number and Complement */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[#666] mb-1">
                Numero <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.number}
                onChange={(e) => handleChange("number", e.target.value)}
                onBlur={() => handleBlur("number")}
                placeholder="123"
                className={inputClass("number")}
              />
              {touched.number && errors.number && (
                <p className="text-xs text-red-500 mt-1">{errors.number}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm text-[#666] mb-1">
                Complemento
              </label>
              <input
                type="text"
                value={formData.complement}
                onChange={(e) => handleChange("complement", e.target.value)}
                placeholder="Apto, Bloco..."
                className={inputClass("complement")}
              />
            </div>
          </div>
          
          {/* Neighborhood */}
          <div>
            <label className="block text-sm text-[#666] mb-1">
              Bairro <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.neighborhood}
              onChange={(e) => handleChange("neighborhood", e.target.value)}
              onBlur={() => handleBlur("neighborhood")}
              placeholder="Nome do bairro"
              className={inputClass("neighborhood")}
            />
            {touched.neighborhood && errors.neighborhood && (
              <p className="text-xs text-red-500 mt-1">{errors.neighborhood}</p>
            )}
          </div>
          
          {/* City and State */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-sm text-[#666] mb-1">
                Cidade <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleChange("city", e.target.value)}
                onBlur={() => handleBlur("city")}
                placeholder="Nome da cidade"
                className={inputClass("city")}
              />
              {touched.city && errors.city && (
                <p className="text-xs text-red-500 mt-1">{errors.city}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm text-[#666] mb-1">
                Estado <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => handleChange("state", e.target.value.toUpperCase())}
                onBlur={() => handleBlur("state")}
                placeholder="UF"
                maxLength={2}
                className={inputClass("state")}
              />
              {touched.state && errors.state && (
                <p className="text-xs text-red-500 mt-1">{errors.state}</p>
              )}
            </div>
          </div>
        </div>

        {/* Address Preview */}
        {cepValid && formData.street && formData.number && (
          <div className="bg-[#F5F5F5] rounded-lg p-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-[#00A650] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[#333]">Entregar em:</p>
                <p className="text-sm text-[#666] mt-1">
                  {formData.street}, {formData.number}
                  {formData.complement && `, ${formData.complement}`}
                  <br />
                  {formData.neighborhood} - {formData.city}, {formData.state}
                  <br />
                  CEP: {formData.cep}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isFormValid() || isSubmitting}
          className={`
            w-full py-3.5 rounded-md font-medium text-base transition-colors
            flex items-center justify-center gap-2
            ${isFormValid() && !isSubmitting
              ? "bg-[#3483FA] text-white hover:bg-[#2968C8]"
              : "bg-[#E6E6E6] text-[#999] cursor-not-allowed"
            }
          `}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Salvando...
            </>
          ) : (
            "Avancar para pagamento"
          )}
        </button>

        {/* Security Info */}
        <div className="flex items-center justify-center gap-2 text-xs text-[#999]">
          <Image
            src="/images/ml-logo-icon.png"
            alt="Mercado Livre"
            width={16}
            height={16}
            className="opacity-50"
          />
          <span>Seus dados estao protegidos</span>
        </div>
      </form>
    </div>
  )
}
