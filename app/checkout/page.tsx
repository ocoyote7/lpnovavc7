"use client"

import React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import Script from "next/script"
import { 
  ChevronLeft, 
  CreditCard, 
  HelpCircle, 
  Lock, 
  Loader2, 
  ChevronDown, 
  QrCode, 
  Copy, 
  CheckCircle,
  AlertCircle,
  RefreshCw
} from "lucide-react"
import { getInPagamentosPublicKey } from "@/app/actions/get-public-key"

// ============================================
// INPAGAMENTOS / INFINITYPAY TYPES
// ============================================

declare global {
  interface Window {
    InfinityPay?: {
      setPublicKey: (key: string) => Promise<void>
      encrypt: (card: {
        number: string
        holderName: string
        expMonth: number
        expYear: number
        cvv: string
      }) => Promise<string>
    }
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function detectCardBrand(number: string): string {
  const cleaned = number.replace(/\s/g, "")
  if (/^4/.test(cleaned)) return "visa"
  if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) return "mastercard"
  if (/^(636368|438935|504175|451416|636297|5067|4576|4011)/.test(cleaned)) return "elo"
  if (/^(606282|3841)/.test(cleaned)) return "hipercard"
  return "generic"
}

const cardBrandLogos: Record<string, string> = {
  visa: "https://http2.mlstatic.com/storage/logos-api-admin/a5f047d0-9be0-11ec-aad4-c3381f368c68-s.svg",
  mastercard: "https://http2.mlstatic.com/storage/logos-api-admin/aa2b8f70-5c85-11ec-ae75-df2bef173be2-s.svg",
  elo: "https://http2.mlstatic.com/storage/logos-api-admin/f8c06600-a55c-11ec-8b34-dbb30b22eecf-s.svg",
  hipercard: "https://http2.mlstatic.com/storage/logos-api-admin/feca6a40-a55a-11ec-8334-e57f7e9a5cc1-s.svg",
  generic: "",
}

// Mask functions
function maskCardNumber(value: string): string {
  const cleaned = value.replace(/\D/g, "").slice(0, 16)
  return cleaned.replace(/(\d{4})/g, "$1 ").trim()
}

function maskExpiry(value: string): string {
  const cleaned = value.replace(/\D/g, "").slice(0, 4)
  if (cleaned.length >= 2) {
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`
  }
  return cleaned
}

function maskCPF(value: string): string {
  const cleaned = value.replace(/\D/g, "").slice(0, 11)
  return cleaned
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
}

function maskCNPJ(value: string): string {
  const cleaned = value.replace(/\D/g, "").slice(0, 14)
  return cleaned
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2")
}

function maskDocument(value: string): string {
  const cleaned = value.replace(/\D/g, "")
  if (cleaned.length <= 11) {
    return maskCPF(value)
  }
  return maskCNPJ(value)
}

// Validation functions
function validateCardNumber(value: string): boolean {
  const cleaned = value.replace(/\D/g, "")
  if (cleaned.length < 13 || cleaned.length > 19) return false
  
  let sum = 0
  let isEven = false
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10)
    if (isEven) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
    isEven = !isEven
  }
  return sum % 10 === 0
}

function validateExpiry(value: string): boolean {
  const cleaned = value.replace(/\D/g, "")
  if (cleaned.length !== 4) return false
  
  const month = parseInt(cleaned.slice(0, 2), 10)
  const year = parseInt(`20${cleaned.slice(2)}`, 10)
  
  if (month < 1 || month > 12) return false
  
  const now = new Date()
  const expiry = new Date(year, month - 1)
  return expiry > now
}

function validateCVV(value: string): boolean {
  const cleaned = value.replace(/\D/g, "")
  return cleaned.length >= 3 && cleaned.length <= 4
}

function validateDocument(value: string): boolean {
  const cleaned = value.replace(/\D/g, "")
  return cleaned.length === 11 || cleaned.length === 14
}

// ============================================
// LOCAL PIX GENERATION (FALLBACK)
// ============================================

function generateLocalPixCode(amount: number, description: string): string {
  const pixKey = "contato@maxtitanium.com.br"
  const merchantName = "MAX TITANIUM"
  const merchantCity = "SAO PAULO"
  const txId = `KIT${Date.now().toString().slice(-10)}`
  
  const amountStr = amount.toFixed(2)
  
  const buildTLV = (id: string, value: string) => {
    const len = value.length.toString().padStart(2, "0")
    return `${id}${len}${value}`
  }
  
  const gui = buildTLV("00", "br.gov.bcb.pix")
  const key = buildTLV("01", pixKey)
  const merchantAccount = buildTLV("26", gui + key)
  
  let payload = ""
  payload += buildTLV("00", "01")
  payload += merchantAccount
  payload += buildTLV("52", "0000")
  payload += buildTLV("53", "986")
  payload += buildTLV("54", amountStr)
  payload += buildTLV("58", "BR")
  payload += buildTLV("59", merchantName)
  payload += buildTLV("60", merchantCity)
  payload += buildTLV("62", buildTLV("05", txId))
  payload += "6304"
  
  // CRC16 CCITT-FALSE
  let crc = 0xFFFF
  const polynomial = 0x1021
  
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ polynomial
      } else {
        crc <<= 1
      }
      crc &= 0xFFFF
    }
  }
  
  const crcStr = crc.toString(16).toUpperCase().padStart(4, "0")
  return payload.slice(0, -4) + buildTLV("63", crcStr)
}

// ============================================
// INTERFACES
// ============================================

interface PixResponse {
  qr_code: string
  qr_code_base64: string
  transaction_id?: string
  status?: string
  expiration_date?: string
  error?: string
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function CheckoutPage() {
  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix")
  
  // Card form
  const [cardNumber, setCardNumber] = useState("")
  const [cardName, setCardName] = useState("")
  const [expiry, setExpiry] = useState("")
  const [cvv, setCvv] = useState("")
  const [document, setDocument] = useState("")
  const [email, setEmail] = useState("")
  const [installments, setInstallments] = useState("1")
  
  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [cardBrand, setCardBrand] = useState("generic")
  
  // PIX
  const [pixData, setPixData] = useState<PixResponse | null>(null)
  const [pixLoading, setPixLoading] = useState(false)
  const [pixError, setPixError] = useState("")
  const [pixCopied, setPixCopied] = useState(false)
  const [pixRetryCount, setPixRetryCount] = useState(0)
  
  // InfinityPay
  const [infinityPayReady, setInfinityPayReady] = useState(false)
  const infinityPayInitialized = useRef(false)
  const [cardError, setCardError] = useState("")
  const [cardSuccess, setCardSuccess] = useState(false)
  
  // Upsell - Power Protein Bar (8 unidades)
  const [showUpsell, setShowUpsell] = useState(true)
  const [upsellAdded, setUpsellAdded] = useState(false)
  const upsellPrice = 17.99 // Power Protein Bar (8un) - preco promocional
  const upsellOriginalPrice = 61.99 // Power Protein Bar (8un) - preco original
  
  // Pricing
  const basePrice = 49.87
  const totalPrice = basePrice + (upsellAdded ? upsellPrice : 0)
  
  // Track if PIX was already generated for current amount
  const [pixGeneratedForAmount, setPixGeneratedForAmount] = useState<number | null>(null)
  
  // ============================================
  // PIX GENERATION
  // ============================================
  
  const generatePix = useCallback(async () => {
    setPixLoading(true)
    setPixError("")
    
    const currentAmount = totalPrice
    const description = "Kit Whey Protein 900g + Creatina 300g - Max Titanium"
    
    try {
      // Primeiro, tentar o endpoint da API
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout
      
      const response = await fetch("/api/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: currentAmount,
          description,
          name: "Cliente",
          cpf: "00000000000",
          email: "cliente@email.com"
        }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      // Ler resposta como texto primeiro
      const rawText = await response.text()
      
      // Tentar parsear JSON
      let data: PixResponse
      try {
        data = JSON.parse(rawText)
      } catch {
        // Se falhar o parse, gerar localmente
        console.log("[Checkout] API retornou resposta invalida, gerando PIX local")
        throw new Error("Invalid JSON response")
      }
      
      // Verificar se a resposta tem os dados necessarios
      if (data.error) {
        console.log("[Checkout] API retornou erro:", data.error)
        throw new Error(data.error)
      }
      
      if (!data.qr_code) {
        console.log("[Checkout] API nao retornou qr_code")
        throw new Error("QR Code nao disponivel")
      }
      
      // Se chegou aqui, temos um PIX valido da API
      setPixData(data)
      setPixError("")
      setPixGeneratedForAmount(currentAmount)
      
    } catch (err) {
      console.log("[Checkout] Erro na API, gerando PIX local:", err)
      
      // Fallback: Gerar PIX localmente
      try {
        const localPixCode = generateLocalPixCode(currentAmount, description)
        
        // Gerar QR Code via API externa
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(localPixCode)}`
        const qrResponse = await fetch(qrApiUrl)
        
        if (!qrResponse.ok) {
          throw new Error("Falha ao gerar QR Code")
        }
        
        const qrBuffer = await qrResponse.arrayBuffer()
        const qrBase64 = btoa(
          new Uint8Array(qrBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        )
        
        setPixData({
          qr_code: localPixCode,
          qr_code_base64: qrBase64,
          transaction_id: `LOCAL_${Date.now()}`,
          status: "pending",
          expiration_date: new Date(Date.now() + 30 * 60 * 1000).toISOString()
        })
        setPixError("")
        setPixGeneratedForAmount(currentAmount)
        
      } catch (localErr) {
        console.error("[Checkout] Falha total ao gerar PIX:", localErr)
        setPixError("Erro ao gerar QR Code. Tente novamente.")
        setPixData(null)
      }
    } finally {
      setPixLoading(false)
    }
  }, [totalPrice])
  
  // Generate PIX only when PIX is selected and amount changes or retry is triggered
  useEffect(() => {
    // Only generate PIX if:
    // 1. Payment method is PIX
    // 2. Either PIX was never generated OR the amount changed OR retry was triggered
    if (paymentMethod === "pix" && (pixGeneratedForAmount === null || pixGeneratedForAmount !== totalPrice)) {
      generatePix()
    }
  }, [paymentMethod, totalPrice, generatePix, pixRetryCount, pixGeneratedForAmount])

  // Detect card brand
  useEffect(() => {
    const brand = detectCardBrand(cardNumber)
    setCardBrand(brand)
  }, [cardNumber])
  
  // Initialize InfinityPay when script loads
  // A chave publica e buscada via server action para nao expor no bundle do cliente
  const handleInfinityPayLoad = useCallback(async () => {
    if (infinityPayInitialized.current) return
    
    try {
      // Buscar chave publica via server action (seguro)
      const publicKey = await getInPagamentosPublicKey()
      
      if (!publicKey) {
        console.error("[Checkout] Chave publica InPagamentos nao configurada")
        return
      }
      
      if (window.InfinityPay) {
        await window.InfinityPay.setPublicKey(publicKey)
        infinityPayInitialized.current = true
        setInfinityPayReady(true)
      }
    } catch (err) {
      console.error("[Checkout] Erro ao inicializar InfinityPay:", err)
    }
  }, [])

  // ============================================
  // VALIDATION
  // ============================================
  
  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors }
    
    switch (name) {
      case "cardNumber":
        if (!value) {
          newErrors.cardNumber = "Digite o numero do cartao"
        } else if (!validateCardNumber(value)) {
          newErrors.cardNumber = "Confira o numero do cartao"
        } else {
          delete newErrors.cardNumber
        }
        break
      case "cardName":
        if (!value.trim()) {
          newErrors.cardName = "Digite o nome do titular"
        } else if (value.trim().split(" ").length < 2) {
          newErrors.cardName = "Digite o nome completo"
        } else {
          delete newErrors.cardName
        }
        break
      case "expiry":
        if (!value) {
          newErrors.expiry = "Digite a validade"
        } else if (!validateExpiry(value)) {
          newErrors.expiry = "Data invalida"
        } else {
          delete newErrors.expiry
        }
        break
      case "cvv":
        if (!value) {
          newErrors.cvv = "Digite o CVV"
        } else if (!validateCVV(value)) {
          newErrors.cvv = "CVV invalido"
        } else {
          delete newErrors.cvv
        }
        break
      case "document":
        if (!value) {
          newErrors.document = "Digite o CPF ou CNPJ"
        } else if (!validateDocument(value)) {
          newErrors.document = "Documento invalido"
        } else {
          delete newErrors.document
        }
        break
      case "email":
        if (!value) {
          newErrors.email = "Digite o e-mail"
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = "E-mail invalido"
        } else {
          delete newErrors.email
        }
        break
    }
    
    setErrors(newErrors)
  }

  const handleBlur = (name: string) => {
    setTouched({ ...touched, [name]: true })
    const values: Record<string, string> = { cardNumber, cardName, expiry, cvv, document, email }
    validateField(name, values[name] || "")
  }

  // ============================================
  // HANDLERS
  // ============================================
  
  const handleCopyPix = async () => {
    if (!pixData?.qr_code) return
    try {
      await navigator.clipboard.writeText(pixData.qr_code)
      setPixCopied(true)
      setTimeout(() => setPixCopied(false), 3000)
    } catch {
      // Fallback para browsers antigos
      const textarea = window.document.createElement("textarea")
      textarea.value = pixData.qr_code
      window.document.body.appendChild(textarea)
      textarea.select()
      window.document.execCommand("copy")
      window.document.body.removeChild(textarea)
      setPixCopied(true)
      setTimeout(() => setPixCopied(false), 3000)
    }
  }
  
  const handleRetryPix = () => {
    setPixRetryCount(prev => prev + 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (paymentMethod === "pix") {
      handleCopyPix()
      return
    }
    
    // Validate all fields for card payment
    const fields = ["cardNumber", "cardName", "expiry", "cvv", "document", "email"]
    const allTouched: Record<string, boolean> = {}
    const values: Record<string, string> = { cardNumber, cardName, expiry, cvv, document, email }
    fields.forEach(field => {
      allTouched[field] = true
      validateField(field, values[field] || "")
    })
    setTouched(allTouched)
    
    if (Object.keys(errors).length > 0) {
      return
    }
    
    setIsLoading(true)
    setCardError("")
    setCardSuccess(false)
    
    try {
      // Extrair mes e ano da validade
      const expiryParts = expiry.split("/")
      const expMonth = parseInt(expiryParts[0], 10)
      const expYear = 2000 + parseInt(expiryParts[1], 10)
      
      // Verificar se InfinityPay esta disponivel
      if (!window.InfinityPay) {
        throw new Error("Sistema de pagamento nao carregado. Recarregue a pagina.")
      }
      
      // Gerar token do cartao usando InfinityPay
      console.log("[Checkout] Gerando token do cartao...")
      const cardToken = await window.InfinityPay.encrypt({
        number: cardNumber.replace(/\s/g, ""),
        holderName: cardName,
        expMonth: expMonth,
        expYear: expYear,
        cvv: cvv,
      })
      
      console.log("[Checkout] Token gerado com sucesso")
      
      // Enviar para API de pagamento
      const response = await fetch("/api/card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardToken: cardToken,
          amount: totalPrice,
          installments: installments,
          description: "Kit Whey Protein 900g + Creatina 300g - Max Titanium",
          customer: {
            name: cardName,
            email: email,
            document: document.replace(/\D/g, ""),
          },
        }),
      })
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || "Erro ao processar pagamento")
      }
      
      // Verificar se precisa de 3D Secure
      if (data.status === "requires_action" && data.redirect_url) {
        window.location.href = data.redirect_url
        return
      }
      
      // Pagamento aprovado - redirecionar com token anti-fraude
      if (data.status === "paid" || data.status === "authorized" || data.status === "pending" || data.status === "processing") {
        setCardSuccess(true)
        setCardError("")
        if (upsellAdded) {
          localStorage.setItem("upsellAdded", "true")
        }
        const token = data.token || ""
        setTimeout(() => {
          window.location.href = `/sucesso?id=${data.transaction_id}&method=card&amount=${totalPrice}&token=${token}`
        }, 500)
      } else {
        throw new Error(data.error || "Pagamento nao aprovado")
      }
      
    } catch (error) {
      console.error("[Checkout] Payment error:", error)
      const errorMessage = error instanceof Error ? error.message : "Erro ao processar pagamento. Tente novamente."
      setCardError(errorMessage)
      setCardSuccess(false)
    } finally {
      setIsLoading(false)
    }
  }

  const inputClass = (fieldName: string) => `
    w-full px-3 py-3 border rounded-md text-[#333] text-base bg-white
    focus:outline-none focus:ring-2 focus:ring-[#3483FA] focus:border-transparent
    ${touched[fieldName] && errors[fieldName] ? "border-red-500" : "border-[#E6E6E6]"}
  `

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-[#EBEBEB] max-w-md mx-auto">
      {/* InfinityPay Tokenization Script */}
      <Script 
        src="https://api.inpagamentos.com/v1/js" 
        strategy="afterInteractive"
        onLoad={handleInfinityPayLoad}
      />
      
      {/* Header */}
      <header className="bg-[#FFF159] px-4 py-3 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-[#333]">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-lg font-normal text-[#333]">Escolha como pagar</h1>
        </div>
      </header>

      {/* Upsell notification - Power Protein Bar (8un) */}
      {showUpsell && !upsellAdded && (
        <div className="bg-[#FFFBEA] px-4 py-3 border-b border-[#F5D742]">
          <div className="flex items-center gap-3">
            <Image
              src="/images/power-protein-bar.jpg"
              alt="Power Protein Bar"
              width={60}
              height={60}
              className="w-14 h-14 object-contain rounded border border-[#E6E6E6] bg-white"
            />
            <div className="flex-1">
              <p className="text-xs text-[#00A650] font-semibold">OFERTA ESPECIAL!</p>
              <p className="text-sm text-[#333] font-medium">Power Protein Bar (8un)</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#999] line-through">R$ {upsellOriginalPrice.toFixed(2).replace(".", ",")}</span>
                <span className="text-sm text-[#00A650] font-bold">R$ {upsellPrice.toFixed(2).replace(".", ",")}</span>
                <span className="bg-[#00A650] text-white text-[10px] px-1 py-0.5 rounded">71% OFF</span>
              </div>
            </div>
            <button
              onClick={() => {
                setUpsellAdded(true)
                setShowUpsell(false)
                // Invalidar o PIX atual para gerar um novo com o valor atualizado
                setPixGeneratedForAmount(null)
              }}
              className="px-3 py-2 bg-[#3483FA] text-white text-xs font-medium rounded-md"
            >
              Adicionar
            </button>
            <button
              onClick={() => setShowUpsell(false)}
              className="text-[#999] text-lg leading-none"
            >
              x
            </button>
          </div>
        </div>
      )}

      {/* Order Summary */}
      <div className="bg-white px-4 py-3 border-b border-[#E6E6E6]">
        <div className="flex items-center gap-3">
          <Image
            src="/images/foto-suplemento-1.webp"
            alt="Kit Whey 900g + Creatina 300g"
            width={48}
            height={48}
            className="w-12 h-12 object-contain rounded border border-[#E6E6E6]"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[#333] truncate">
              Kit Whey 900g + Creatina 300g
            </p>
            <p className="text-xs text-[#666]">Qtd: 1</p>
          </div>
          <div className="text-right">
            <p className="text-base font-semibold text-[#333]">R$ 49,87</p>
            <p className="text-xs text-[#00A650]">Frete gratis</p>
          </div>
        </div>
        {upsellAdded && (
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#E6E6E6]">
            <Image
              src="/images/power-protein-bar.jpg"
              alt="Power Protein Bar"
              width={48}
              height={48}
              className="w-12 h-12 object-contain rounded border border-[#E6E6E6]"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[#333] truncate">
                Power Protein Bar (8un)
              </p>
              <p className="text-xs text-[#666]">Qtd: 1</p>
            </div>
            <div className="text-right">
              <p className="text-base font-semibold text-[#333]">R$ {upsellPrice.toFixed(2).replace(".", ",")}</p>
            </div>
          </div>
        )}
        {upsellAdded && (
          <div className="flex justify-between mt-3 pt-3 border-t border-[#E6E6E6]">
            <span className="text-sm font-medium text-[#333]">Total</span>
            <span className="text-base font-bold text-[#333]">R$ {totalPrice.toFixed(2).replace(".", ",")}</span>
          </div>
        )}
      </div>

      {/* Payment Method Selector */}
      <div className="bg-white mx-4 mt-4 rounded-lg overflow-hidden">
        <button
          onClick={() => setPaymentMethod("pix")}
          className={`w-full flex items-center gap-3 px-4 py-4 border-b border-[#E6E6E6] transition-colors ${
            paymentMethod === "pix" ? "bg-[#F5F5F5]" : ""
          }`}
        >
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
            paymentMethod === "pix" ? "border-[#3483FA]" : "border-[#999]"
          }`}>
            {paymentMethod === "pix" && (
              <div className="w-2.5 h-2.5 rounded-full bg-[#3483FA]" />
            )}
          </div>
          <QrCode className="w-6 h-6 text-[#32BCAD]" />
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-[#333]">Pix</p>
            <p className="text-xs text-[#00A650]">Aprovacao imediata</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-[#333]">
              R$ {totalPrice.toFixed(2).replace(".", ",")}
            </p>
          </div>
        </button>

        <button
          onClick={() => setPaymentMethod("card")}
          className={`w-full flex items-center gap-3 px-4 py-4 transition-colors ${
            paymentMethod === "card" ? "bg-[#F5F5F5]" : ""
          }`}
        >
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
            paymentMethod === "card" ? "border-[#3483FA]" : "border-[#999]"
          }`}>
            {paymentMethod === "card" && (
              <div className="w-2.5 h-2.5 rounded-full bg-[#3483FA]" />
            )}
          </div>
          <CreditCard className="w-6 h-6 text-[#3483FA]" />
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-[#333]">Cartao de credito</p>
            <p className="text-xs text-[#666]">Em ate 4x</p>
          </div>
        </button>
      </div>

      {/* Payment Form */}
      <main className="px-4 py-4 pb-32">
        {paymentMethod === "pix" ? (
          /* PIX Payment */
          <div className="bg-white rounded-lg p-4">
            <h2 className="text-base font-semibold text-[#333] mb-4">
              Pague com Pix
            </h2>
            
            {/* QR Code */}
            <div className="flex flex-col items-center mb-4">
              <div className="bg-white p-4 rounded-lg border border-[#E6E6E6] mb-4">
                {pixLoading ? (
                  <div className="w-48 h-48 bg-[#F5F5F5] rounded flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-12 h-12 text-[#3483FA] animate-spin" />
                    <p className="text-xs text-[#666]">Gerando QR Code...</p>
                  </div>
                ) : pixError ? (
                  <div className="w-48 h-48 bg-[#FEF2F2] rounded flex flex-col items-center justify-center p-4 gap-2">
                    <AlertCircle className="w-10 h-10 text-red-500" />
                    <p className="text-sm text-red-500 text-center">{pixError}</p>
                    <button 
                      onClick={handleRetryPix}
                      className="flex items-center gap-1 text-xs text-[#3483FA] font-medium mt-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Tentar novamente
                    </button>
                  </div>
                ) : pixData?.qr_code_base64 ? (
                  <Image
                    src={`data:image/png;base64,${pixData.qr_code_base64}`}
                    alt="QR Code PIX"
                    width={192}
                    height={192}
                    className="w-48 h-48"
                  />
                ) : (
                  <div className="w-48 h-48 bg-[#F5F5F5] rounded flex items-center justify-center">
                    <QrCode className="w-32 h-32 text-[#333]" />
                  </div>
                )}
              </div>
              <p className="text-sm text-[#666] text-center">
                Escaneie o QR Code ou copie o codigo abaixo
              </p>
            </div>

            {/* PIX Code */}
            <div className="bg-[#F5F5F5] rounded-lg p-3 mb-4">
              <p className="text-xs text-[#666] mb-2">Codigo Pix copia e cola:</p>
              <div className="flex items-center gap-2">
                <p className="flex-1 text-xs text-[#333] break-all line-clamp-2 font-mono">
                  {pixData?.qr_code || "Gerando codigo..."}
                </p>
              </div>
            </div>

            {/* Copy Button */}
            <button
              onClick={handleCopyPix}
              disabled={!pixData?.qr_code || pixLoading}
              className={`w-full py-3 rounded-md font-medium transition-colors flex items-center justify-center gap-2 ${
                pixCopied 
                  ? "bg-[#00A650] text-white" 
                  : pixData?.qr_code 
                    ? "bg-[#3483FA] hover:bg-[#2968C8] text-white"
                    : "bg-[#CCCCCC] text-white cursor-not-allowed"
              }`}
            >
              {pixCopied ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Codigo copiado!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  Copiar codigo Pix
                </>
              )}
            </button>

            {/* Instructions */}
            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#3483FA] text-white text-xs flex items-center justify-center flex-shrink-0">
                  1
                </div>
                <p className="text-sm text-[#666]">
                  Abra o app do seu banco ou carteira digital
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#3483FA] text-white text-xs flex items-center justify-center flex-shrink-0">
                  2
                </div>
                <p className="text-sm text-[#666]">
                  Escolha pagar com Pix e escaneie o QR Code ou cole o codigo
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#3483FA] text-white text-xs flex items-center justify-center flex-shrink-0">
                  3
                </div>
                <p className="text-sm text-[#666]">
                  Confirme as informacoes e finalize o pagamento
                </p>
              </div>
            </div>

            {/* Timer */}
            <div className="mt-4 p-3 bg-[#FFF3CD] rounded-lg">
              <p className="text-sm text-[#856404] text-center">
                Este codigo expira em <span className="font-semibold">30 minutos</span>
              </p>
            </div>

            {/* Confirm Payment Button */}
            <button
              onClick={async () => {
                if (!pixData?.qr_code) return
                setIsLoading(true)
                try {
                  // Verificar pagamento e gerar token anti-fraude
                  const txId = pixData?.transaction_id || String(Date.now())
                  const response = await fetch("/api/verify-payment", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      transaction_id: txId,
                      method: "pix",
                      amount: totalPrice,
                    }),
                  })
                  const data = await response.json()
                  
                  if (data.token) {
                    if (upsellAdded) {
                      localStorage.setItem("upsellAdded", "true")
                    }
                    window.location.href = `/sucesso?id=${txId}&method=pix&amount=${totalPrice}&token=${data.token}`
                  } else {
                    // Token nao recebido - pagamento pode nao ter sido confirmado
                    setPixError("Pagamento ainda nao confirmado. Aguarde alguns instantes e tente novamente.")
                  }
                } catch {
                  setPixError("Erro ao verificar pagamento. Tente novamente.")
                } finally {
                  setIsLoading(false)
                }
              }}
              disabled={!pixData?.qr_code || isLoading}
              className={`w-full mt-4 py-3.5 rounded-md font-medium transition-colors flex items-center justify-center gap-2 ${
                pixData?.qr_code && !isLoading
                  ? "bg-[#00A650] hover:bg-[#009040] text-white"
                  : "bg-[#E6E6E6] text-[#999] cursor-not-allowed"
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verificando pagamento...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Ja fiz o pagamento
                </>
              )}
            </button>
          </div>
        ) : (
          /* Card Payment */
          <div>
            <h1 className="text-base font-semibold text-[#333] mb-4">
              Pagar com cartao
            </h1>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Card Number */}
              <div>
                <label className="block text-sm text-[#666] mb-1.5">
                  Numero do cartao
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(maskCardNumber(e.target.value))}
                    onBlur={() => handleBlur("cardNumber")}
                    placeholder="1234 1234 1234 1234"
                    className={inputClass("cardNumber")}
                    maxLength={19}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {cardBrand !== "generic" && cardBrandLogos[cardBrand] ? (
                      <Image
                        src={cardBrandLogos[cardBrand] || "/placeholder.svg"}
                        alt={cardBrand}
                        width={32}
                        height={20}
                        className="h-5 w-auto"
                      />
                    ) : (
                      <CreditCard className="w-6 h-6 text-[#999]" />
                    )}
                  </div>
                </div>
                {touched.cardNumber && errors.cardNumber && (
                  <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>
                )}
              </div>

              {/* Card Name */}
              <div>
                <label className="block text-sm text-[#666] mb-1.5">
                  Nome do titular
                </label>
                <input
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value.toUpperCase())}
                  onBlur={() => handleBlur("cardName")}
                  placeholder="Como esta no cartao"
                  className={inputClass("cardName")}
                />
                {touched.cardName && errors.cardName && (
                  <p className="text-red-500 text-xs mt-1">{errors.cardName}</p>
                )}
              </div>

              {/* Expiry and CVV */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-[#666] mb-1.5">
                    Vencimento
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={expiry}
                    onChange={(e) => setExpiry(maskExpiry(e.target.value))}
                    onBlur={() => handleBlur("expiry")}
                    placeholder="MM/AA"
                    className={inputClass("expiry")}
                    maxLength={5}
                  />
                  {touched.expiry && errors.expiry && (
                    <p className="text-red-500 text-xs mt-1">{errors.expiry}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-[#666] mb-1.5">
                    <span className="flex items-center gap-1">
                      CVV
                      <HelpCircle className="w-3.5 h-3.5 text-[#999]" />
                    </span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    onBlur={() => handleBlur("cvv")}
                    placeholder="123"
                    className={inputClass("cvv")}
                    maxLength={4}
                  />
                  {touched.cvv && errors.cvv && (
                    <p className="text-red-500 text-xs mt-1">{errors.cvv}</p>
                  )}
                </div>
              </div>

              {/* Installments */}
              <div>
                <label className="block text-sm text-[#666] mb-1.5">
                  Parcelas
                </label>
                <div className="relative">
                  <select
                    value={installments}
                    onChange={(e) => setInstallments(e.target.value)}
                    className="w-full px-3 py-3 border border-[#E6E6E6] rounded-md text-[#333] text-base bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#3483FA]"
                  >
                    <option value="1">1x de R$ {totalPrice.toFixed(2).replace(".", ",")} sem juros</option>
                    <option value="2">2x de R$ {(totalPrice / 2).toFixed(2).replace(".", ",")} sem juros</option>
                    <option value="3">3x de R$ {(totalPrice / 3).toFixed(2).replace(".", ",")} sem juros</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666] pointer-events-none" />
                </div>
              </div>

              {/* Document */}
              <div>
                <label className="block text-sm text-[#666] mb-1.5">
                  CPF ou CNPJ do titular
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={document}
                  onChange={(e) => setDocument(maskDocument(e.target.value))}
                  onBlur={() => handleBlur("document")}
                  placeholder="000.000.000-00"
                  className={inputClass("document")}
                  maxLength={18}
                />
                {touched.document && errors.document && (
                  <p className="text-red-500 text-xs mt-1">{errors.document}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm text-[#666] mb-1.5">
                  E-mail
                </label>
                <input
                  type="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => handleBlur("email")}
                  placeholder="Para enviar o comprovante"
                  className={inputClass("email")}
                />
                {touched.email && errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              {/* Accepted cards */}
              <div className="flex items-center gap-2 pt-2">
                <span className="text-xs text-[#999]">Aceitamos:</span>
                <Image
                  src="/images/mercado-pago-logos.png"
                  alt="Mercado Pago - Visa, Mastercard, American Express, Diners Club"
                  width={200}
                  height={50}
                  className="h-5 w-auto"
                />
              </div>
              
              {/* Error message */}
              {cardError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{cardError}</p>
                </div>
              )}
              
              {/* Success message */}
              {cardSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-700">Pagamento aprovado com sucesso!</p>
                </div>
              )}
              
              {/* InfinityPay status */}
              {!infinityPayReady && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-yellow-600 animate-spin" />
                  <p className="text-sm text-yellow-700">Carregando sistema de pagamento...</p>
                </div>
              )}
            </form>
          </div>
        )}
      </main>

      {/* Mercado Pago Logos */}
      <div className="bg-white px-4 py-4 flex items-center justify-center">
        <Image
          src="/images/mercado-pago-logos.png"
          alt="Mercado Pago - Visa, Mastercard, American Express, Diners Club"
          width={400}
          height={100}
          className="w-64 h-auto opacity-80"
        />
      </div>

      {/* Fixed Bottom Button - Only show for card payment */}
      {paymentMethod === "card" && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E6E6E6] px-4 py-3 max-w-md mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#666]">Total a pagar</span>
            <span className="text-lg font-semibold text-[#333]">R$ {totalPrice.toFixed(2).replace(".", ",")}</span>
          </div>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full py-3.5 bg-[#3483FA] hover:bg-[#2968C8] disabled:bg-[#3483FA]/70 text-white font-medium rounded-md transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processando...
              </>
            ) : (
              "Pagar"
            )}
          </button>
          <div className="flex items-center justify-center gap-1.5 text-xs mt-2 animate-lock-secure">
            <svg 
              className="w-4 h-4 lock-icon" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path className="lock-shackle" d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span className="lock-text">Pagamento 100% seguro</span>
          </div>
        </div>
      )}

      {/* Lock animation styles */}
      <style jsx>{`
        @keyframes lockSecure {
          0% {
            color: #999;
          }
          40% {
            color: #999;
          }
          60% {
            color: #00A650;
          }
          100% {
            color: #00A650;
          }
        }
        @keyframes shackleClose {
          0% {
            d: path("M7 11V7a5 5 0 0 1 3-4.5");
            opacity: 0.6;
          }
          40% {
            d: path("M7 11V7a5 5 0 0 1 3-4.5");
            opacity: 0.6;
          }
          60% {
            d: path("M7 11V7a5 5 0 0 1 10 0v4");
            opacity: 1;
          }
          100% {
            d: path("M7 11V7a5 5 0 0 1 10 0v4");
            opacity: 1;
          }
        }
        @keyframes textGlow {
          0% {
            color: #999;
            font-weight: 400;
          }
          40% {
            color: #999;
            font-weight: 400;
          }
          60% {
            color: #00A650;
            font-weight: 600;
          }
          100% {
            color: #00A650;
            font-weight: 600;
          }
        }
        .animate-lock-secure {
          animation: lockSecure 2s ease-in-out forwards;
        }
        .animate-lock-secure .lock-shackle {
          animation: shackleClose 2s ease-in-out forwards;
        }
        .animate-lock-secure .lock-text {
          animation: textGlow 2s ease-in-out forwards;
        }
      `}</style>
    </div>
  )
}
