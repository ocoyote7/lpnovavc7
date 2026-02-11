"use client"

import { useEffect, useState, Suspense, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { MapPin, X, ChevronRight, Ticket, Package, Zap, ShieldAlert } from "lucide-react"

// ============================================
// INTERFACES
// ============================================

interface AddressData {
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  cep: string
}

// ============================================
// ANIMATED CHECKMARK (cab 01 - com animacao no caractere)
// ============================================

function AnimatedCheckmark() {
  const [phase, setPhase] = useState(0)
  
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 200)   // circle draws
    const t2 = setTimeout(() => setPhase(2), 700)   // check appears
    const t3 = setTimeout(() => setPhase(3), 1200)  // pulse
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])
  
  return (
    <div className={`relative w-14 h-14 transition-transform duration-500 ${phase >= 3 ? "animate-bounce-once" : ""}`}>
      <svg viewBox="0 0 52 52" className="w-full h-full">
        {/* Circle */}
        <circle
          cx="26" cy="26" r="23"
          fill="none"
          stroke="#39B54A"
          strokeWidth="2.5"
          strokeDasharray="144"
          strokeDashoffset={phase >= 1 ? 0 : 144}
          className="transition-all duration-700 ease-out"
          style={{ transformOrigin: "center", transform: "rotate(-90deg)" }}
        />
        {/* Checkmark */}
        <path
          d="M16 27l6 6 14-14"
          fill="none"
          stroke="#39B54A"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="40"
          strokeDashoffset={phase >= 2 ? 0 : 40}
          className="transition-all duration-500 ease-out"
        />
      </svg>
    </div>
  )
}

// ============================================
// FRETE FULL BADGE (cab 02 - com animacao)
// ============================================

function FreteFullBadge() {
  const [shimmer, setShimmer] = useState(false)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setShimmer(true)
      setTimeout(() => setShimmer(false), 800)
    }, 3000)
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className={`relative inline-flex items-center gap-1 bg-[#00A650] text-white text-[10px] font-bold px-2 py-0.5 rounded overflow-hidden ${shimmer ? "after:animate-shimmer" : ""}`}>
      <Zap className="w-2.5 h-2.5" />
      <span>FRETE FULL</span>
      {shimmer && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer-slide" />
      )}
    </div>
  )
}

// ============================================
// COUPON POPUP (cab 03)
// ============================================

function CouponPopup({ onClose, savingsAmount }: { onClose: () => void; savingsAmount: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div 
        className="relative bg-white rounded-t-2xl w-full max-w-md p-5 pb-8 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 text-[#999]">
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-[#FFF3CD] rounded-full flex items-center justify-center">
            <Ticket className="w-5 h-5 text-[#F5A623]" />
          </div>
          <h3 className="text-base font-semibold text-[#333]">Sobre seus cupons</h3>
        </div>
        
        <div className="space-y-3">
          <div className="p-3 bg-[#F0FFF4] rounded-lg border border-[#C6F6D5]">
            <p className="text-sm text-[#333]">
              Voce economizou <span className="font-bold text-[#00A650]">R$ {savingsAmount}</span> nesta compra!
            </p>
          </div>
          
          <div className="p-3 bg-[#FFFBEA] rounded-lg border border-[#FEFCBF]">
            <p className="text-sm text-[#856404]">
              O desconto de cupom so pode ser aplicado <span className="font-semibold">uma unica vez</span> por compra.
            </p>
          </div>
        </div>
        
        <button 
          onClick={onClose}
          className="w-full mt-4 py-3 bg-[#3483FA] text-white font-medium rounded-md hover:bg-[#2968C8] transition-colors"
        >
          Entendi
        </button>
      </div>
    </div>
  )
}

// ============================================
// SUCCESS CONTENT
// ============================================

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [address, setAddress] = useState<AddressData | null>(null)
  const [showMercadoPago, setShowMercadoPago] = useState(true)
  const [slideIn, setSlideIn] = useState(false)
  const [showCouponPopup, setShowCouponPopup] = useState(false)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null) // null = loading
  const [accessDenied, setAccessDenied] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<string>("pending")
  const [paymentVerified, setPaymentVerified] = useState<boolean>(false)
  
  // Ler dados da URL
  const transactionId = searchParams.get("id") || `${Date.now().toString().slice(-8)}`
  const paymentMethod = searchParams.get("method") || "pix"
  const amount = Number.parseFloat(searchParams.get("amount") || "82.90")
  const token = searchParams.get("token")
  const hasUpsell = amount > 83 // se o total e maior que o preco base, tem upsell
  
  // Calcular economia real baseado nos precos originais vs promocionais
  // Kit Whey 900g + Creatina 300g: original R$ 179,90 -> promo R$ 49,87 = economia R$ 97,00
  const baseSavings = 179.90 - 82.90 // R$ 97,00
  // Power Protein Bar (8un): original R$ 61,99 -> promo R$ 17,99 = economia R$ 29,22
  const upsellSavings = hasUpsell ? (61.99 - 32.77) : 0 // R$ 29,22
  const totalSavings = (baseSavings + upsellSavings).toFixed(2).replace(".", ",")
  
  // Calcular datas de entrega - 14 dias maximo a partir da compra, mas pode chegar em 7
  const getDeliveryDates = useCallback(() => {
    const now = new Date()
    const days = ["domingo", "segunda-feira", "terca-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sabado"]
    const months = ["janeiro", "fevereiro", "marco", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"]
    
    // Envio 1: estimativa de 7 dias (pode chegar antes)
    const delivery1Min = new Date(now)
    delivery1Min.setDate(delivery1Min.getDate() + 7)
    const delivery1Max = new Date(now)
    delivery1Max.setDate(delivery1Max.getDate() + 14)
    
    // Envio 2 (upsell): mesmo prazo
    const delivery2Min = new Date(now)
    delivery2Min.setDate(delivery2Min.getDate() + 10)
    const delivery2Max = new Date(now)
    delivery2Max.setDate(delivery2Max.getDate() + 14)
    
    const formatDate = (d: Date) => `${days[d.getDay()]}, ${d.getDate()} de ${months[d.getMonth()]}`
    
    return {
      envio1Text: `Chegara entre ${days[delivery1Min.getDay()]} e ${days[delivery1Max.getDay()]}`,
      envio1Detail: `${delivery1Min.getDate()}/${(delivery1Min.getMonth()+1).toString().padStart(2,"0")} - ${delivery1Max.getDate()}/${(delivery1Max.getMonth()+1).toString().padStart(2,"0")}`,
      envio1Full: formatDate(delivery1Min),
      envio2Text: `Chegara entre ${days[delivery2Min.getDay()]} e ${days[delivery2Max.getDay()]}`,
      envio2Detail: `${delivery2Min.getDate()}/${(delivery2Min.getMonth()+1).toString().padStart(2,"0")} - ${delivery2Max.getDate()}/${(delivery2Max.getMonth()+1).toString().padStart(2,"0")}`,
    }
  }, [])
  
  const deliveryDates = getDeliveryDates()
  
  // Validar token anti-fraude ao carregar a pagina
  useEffect(() => {
    if (!token) {
      // Sem token = acesso direto nao autorizado
      setAccessDenied(true)
      setTokenValid(false)
      return
    }
    
    const validateToken = async () => {
      try {
        const response = await fetch(`/api/verify-payment?token=${encodeURIComponent(token)}`)
        const data = await response.json()
        
        if (data.valid) {
          setTokenValid(true)
          setAccessDenied(false)
          setPaymentStatus(data.status || "pending")
          setPaymentVerified(Boolean(data.verified))
        } else {
          setTokenValid(false)
          setAccessDenied(true)
        }
      } catch {
        // Erro de rede - negar acesso por seguranca
        setTokenValid(false)
        setAccessDenied(true)
      }
    }
    
    validateToken()
  }, [token])

  // Disparar Purchase uma única vez quando o pagamento estiver aprovado
  useEffect(() => {
    const approvedStatuses = ["aprovado", "approved", "paid", "pago", "completed", "success"]
    const isApproved = approvedStatuses.includes((paymentStatus || "").toLowerCase())
    if (!paymentVerified || !isApproved) return

    try {
      const key = `meta_purchase_${transactionId}`
      if (typeof window !== "undefined" && sessionStorage.getItem(key)) return

      if (typeof window !== "undefined" && typeof (window as any).fbq === "function") {
        ;(window as any).fbq("track", "Purchase", {
          value: Number.isFinite(amount) ? amount : 0,
          currency: "BRL",
        })
      }

      if (typeof window !== "undefined") sessionStorage.setItem(key, "1")
    } catch {
      // silencioso
    }
  }, [paymentVerified, paymentStatus, transactionId, amount])


// Polling do status de pagamento (card pode ficar "pending"/"processing")
useEffect(() => {
  if (!token || tokenValid !== true) return
  if (paymentVerified) return

  let cancelled = false
  const poll = async () => {
    try {
      const response = await fetch(`/api/verify-payment?token=${encodeURIComponent(token)}`, { cache: "no-store" })
      const data = await response.json()
      if (cancelled) return
      if (data.valid) {
        setPaymentStatus(data.status || "pending")
        setPaymentVerified(Boolean(data.verified))
      }
    } catch {
      // silencioso (rede)
    }
  }

  // roda imediatamente e depois a cada 5s
  poll()
  const id = setInterval(poll, 5000)
  return () => {
    cancelled = true
    clearInterval(id)
  }
}, [token, tokenValid, paymentVerified])

  
  useEffect(() => {
    // Ler endereco salvo
    try {
      const savedAddress = localStorage.getItem("deliveryAddress")
      if (savedAddress) {
        setAddress(JSON.parse(savedAddress))
      }
    } catch {
      // Sem endereco salvo
    }
    
    // Animacao de entrada
    const timer = setTimeout(() => setSlideIn(true), 100)
    return () => clearTimeout(timer)
  }, [])
  
  const formatAddress = (addr: AddressData) => {
    const complement = addr.complement ? `, ${addr.complement}` : ""
    return `${addr.street}, ${addr.number}${complement} - ${addr.neighborhood}, ${addr.city} - ${addr.state}`
  }

  // Tela de carregamento enquanto valida token
  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-[#39B54A] max-w-md mx-auto flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-white/30 border-t-white rounded-full" />
      </div>
    )
  }
  
  // Tela de acesso negado - pagamento nao verificado
  if (accessDenied) {
    return (
      <div className="min-h-screen bg-[#EBEBEB] max-w-md mx-auto flex flex-col items-center justify-center px-6">
        <div className="bg-white rounded-lg p-8 shadow-sm text-center max-w-sm w-full">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-semibold text-[#333] mb-2">Acesso nao autorizado</h1>
          <p className="text-sm text-[#666] mb-6 leading-relaxed">
            Nao foi possivel verificar seu pagamento. Para acessar esta pagina, e necessario realizar o pagamento primeiro.
          </p>
          <Link
            href="/checkout"
            className="block w-full py-3 bg-[#3483FA] text-white font-medium rounded-md hover:bg-[#2968C8] transition-colors text-center"
          >
            Ir para pagamento
          </Link>
          <Link
            href="/"
            className="block w-full py-3 mt-2 text-[#3483FA] font-medium hover:underline text-center"
          >
            Voltar para a loja
          </Link>
        </div>
      </div>
    )
  }

if (tokenValid === true && !paymentVerified) {
  const isFinalFail = paymentStatus === "refused" || paymentStatus === "expired"
  return (
    <div className="min-h-screen bg-[#EBEBEB] max-w-md mx-auto flex flex-col items-center justify-center px-6">
      <div className="bg-white rounded-lg p-8 shadow-sm text-center max-w-sm w-full">
        {!isFinalFail ? (
          <>
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="animate-spin w-8 h-8 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Pagamento em processamento</h2>
            <p className="text-gray-600 mb-6">
              Estamos confirmando seu pagamento com o gateway. Assim que for aprovado, esta página será liberada automaticamente.
            </p>
            <div className="text-sm text-gray-500">
              Status atual: <span className="font-medium">{paymentStatus}</span>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Pagamento não aprovado</h2>
            <p className="text-gray-600 mb-6">
              Seu pagamento foi marcado como <span className="font-medium">{paymentStatus}</span>. Se isso parecer incorreto, tente novamente no checkout.
            </p>
            <Link href="/checkout" className="inline-flex items-center justify-center w-full bg-[#39B54A] text-white font-semibold py-3 rounded-lg">
              Voltar para o checkout
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

  return (
    <div className="min-h-screen bg-[#39B54A] max-w-md mx-auto">
      {/* Header */}
      <header className="px-4 py-3 flex justify-end">
        <Link href="/" className="text-white/80 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </Link>
      </header>

      {/* Main Content */}
      <div className={`px-4 pb-6 space-y-4 transition-all duration-700 ${slideIn ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
        
        {/* ========= CAB 01 - Pronto, compra feita! ========= */}
        <div className="bg-white rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-medium text-[#333] text-balance">
                Pronto, compra feita!
              </h1>
            </div>
            <AnimatedCheckmark />
          </div>
        </div>

        {/* ========= CAB 02 - Envios ========= */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Envio 1 - Kit principal */}
          <div className="p-4 border-b border-[#E6E6E6]">
            <div className="flex items-start gap-3">
              <Image
                src="/images/foto-suplemento-1.webp"
                alt="Kit Whey + Creatina"
                width={40}
                height={40}
                className="w-10 h-10 object-contain rounded"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-[#666]">Envio 1</span>
                  <span className="text-[#CCC]">|</span>
                  <FreteFullBadge />
                </div>
                <p className="text-base font-medium text-[#333] mt-1">
                  {deliveryDates.envio1Text}
                </p>
                <p className="text-xs text-[#999] mt-0.5">
                  Prazo: {deliveryDates.envio1Detail} (pode chegar em ate 7 dias)
                </p>
              </div>
            </div>
          </div>

          {/* Envio 2 - Upsell (Power Protein Bar) */}
          {hasUpsell && (
            <div className="p-4 border-b border-[#E6E6E6]">
              <div className="flex items-start gap-3">
                <Image
                  src="/images/power-protein-bar.jpg"
                  alt="Power Protein Bar"
                  width={40}
                  height={40}
                  className="w-10 h-10 object-contain rounded"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#666]">Envio 2</span>
                  </div>
                  <p className="text-base font-medium text-[#333] mt-1">
                    {deliveryDates.envio2Text}
                  </p>
                  <p className="text-xs text-[#999] mt-0.5">
                    Prazo: {deliveryDates.envio2Detail}
                  </p>
                  <p className="text-xs text-[#00A650] font-medium mt-1">
                    Power Protein Bar (8un) incluso
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Address */}
          {address && (
            <div className="p-4 border-b border-[#E6E6E6]">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#666] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[#333] leading-relaxed">
                  {formatAddress(address)}
                </p>
              </div>
            </div>
          )}

          {/* Go to My Purchases */}
          <Link 
            href="/" 
            className="block p-4 bg-[#E8F4FD] text-center text-[#3483FA] font-medium hover:bg-[#D4EBFC] transition-colors"
          >
            Ir para Minhas compras
          </Link>
        </div>

        {/* Mercado Pago Banner */}
        {showMercadoPago && (
          <div className="bg-[#1A1A2E] rounded-lg p-4 relative overflow-hidden">
            <button 
              onClick={() => setShowMercadoPago(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-white z-10"
              aria-label="Fechar banner"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 bg-[#00BCFF] rounded-sm flex items-center justify-center">
                    <span className="text-white text-xs font-bold">MP</span>
                  </div>
                  <span className="text-[#00BCFF] text-xs font-bold">MERCADO PAGO</span>
                </div>
                <p className="text-white text-sm font-medium leading-tight">
                  Aproveite a conta que<br />
                  mais rende do Brasil
                </p>
              </div>
              
              <button className="bg-[#3483FA] text-white text-sm font-semibold px-4 py-2 rounded-md hover:bg-[#2968C8] transition-colors">
                Baixar app
              </button>
            </div>
            
            {/* Decorative coins */}
            <div className="absolute right-20 -top-1 opacity-30">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600" />
            </div>
            <div className="absolute right-14 top-6 opacity-20">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600" />
            </div>
          </div>
        )}

        {/* ========= CAB 03 - Cupom ========= */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#F0FFF4] rounded-full flex items-center justify-center">
              <Ticket className="w-5 h-5 text-[#00A650]" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-[#333]">
                Voce economizou <span className="font-bold text-[#00A650]">R$ {totalSavings}</span> com seu cupom!
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setShowCouponPopup(true)} 
            className="flex items-center gap-1 text-[#3483FA] text-sm font-medium mt-3 hover:underline"
          >
            Ver mais Cupons
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* ========= Resumo do pedido ========= */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-medium text-[#333] mb-3">Resumo do pedido</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#666]">Kit Whey 900g + Creatina 300g</span>
              <span className="text-[#333]">R$ 49,87</span>
            </div>
            {hasUpsell && (
              <div className="flex justify-between text-sm">
                <span className="text-[#666]">Power Protein Bar (8un)</span>
                <span className="text-[#333]">R$ {(amount - 82.90).toFixed(2).replace(".", ",")}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-[#666]">Frete</span>
              <span className="text-[#00A650] font-medium">Gratis</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#666]">Desconto cupom</span>
              <span className="text-[#00A650] font-medium">- R$ {totalSavings}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#666]">Pagamento</span>
              <span className="text-[#333] capitalize">{paymentMethod === "pix" ? "Pix" : "Cartao de credito"}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-[#E6E6E6]">
              <span className="font-medium text-[#333]">Total</span>
              <span className="font-bold text-[#333]">R$ {amount.toFixed(2).replace(".", ",")}</span>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-[#E6E6E6]">
            <p className="text-xs text-[#999]">
              Pedido #{transactionId}
            </p>
          </div>
        </div>

        {/* Continue Shopping */}
        <Link 
          href="/" 
          className="block w-full bg-white text-[#3483FA] text-center py-3.5 rounded-md font-medium hover:bg-[#F5F5F5] transition-colors"
        >
          Continuar comprando
        </Link>
      </div>
      
      {/* Coupon Popup */}
      {showCouponPopup && (
        <CouponPopup 
          onClose={() => setShowCouponPopup(false)}
          savingsAmount={totalSavings}
        />
      )}

      {/* Animations */}
      <style jsx>{`
        @keyframes bounce-once {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .animate-bounce-once {
          animation: bounce-once 0.4s ease-in-out;
        }
        @keyframes shimmer-slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer-slide {
          animation: shimmer-slide 0.8s ease-in-out;
        }
        @keyframes slide-up {
          0% { transform: translateY(100%); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

// ============================================
// MAIN COMPONENT WITH SUSPENSE
// ============================================

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#39B54A] max-w-md mx-auto flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-white/30 border-t-white rounded-full" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
