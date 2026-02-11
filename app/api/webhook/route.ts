import { NextRequest, NextResponse } from "next/server"
import { createHmac, timingSafeEqual } from "crypto"
import { setPaymentStatus, getPaymentStatus } from "@/lib/payment-store"

// ============================================
// WEBHOOK INPAGAMENTOS - PRODUCAO
// ============================================
// Recebe notificacoes do InPagamentos (PIX e Cartao)
// Dominio: ofertaseguramercado.com.br
// URL configurada no painel: https://ofertaseguramercado.com.br/api/webhook
//
// Eventos tratados:
// - pagamento_criado / payment.created
// - pagamento_aprovado / payment.approved / paid
// - pagamento_recusado / payment.refused
// - pagamento_expirado / payment.expired
// ============================================

const ALLOWED_ORIGINS = [
  "https://ofertaseguramercado.com.br",
  "https://www.ofertaseguramercado.com.br",
  // Preview / staging (Vercel) + dev
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]
// Segredo compartilhado para validar assinatura do webhook
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || process.env.INPAGAMENTOS_WEBHOOK_SECRET

// Headers CORS para dominio proprio
function corsHeaders(origin?: string | null) {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-webhook-signature, x-signature",
  }
}

// Verificar assinatura HMAC-SHA256 do webhook (producao)
function normalizeSignature(sig: string): string {
  return sig.trim().replace(/^sha256=|^hmac-sha256=|^sig=/i, "")
}

function verifyWebhookSignature(body: string, signature: string | null): boolean {
  if (!WEBHOOK_SECRET) {
    // Em dev sem segredo, aceitar todas as chamadas
    console.log("[Webhook] WEBHOOK_SECRET nao configurado, aceitando sem verificacao")
    return true
  }
  
  if (!signature) {
    console.log("[Webhook] Assinatura ausente no header")
    return false
  }

  try {
    const expected = createHmac("sha256", WEBHOOK_SECRET)
      .update(body)
      .digest("hex")
    
    // timingSafeEqual previne timing attacks
    const normalized = normalizeSignature(signature)

    const sigBuf = Buffer.from(normalized, "utf8")
    const expBuf = Buffer.from(expected, "utf8")
    
    if (sigBuf.length !== expBuf.length) return false
    return timingSafeEqual(sigBuf, expBuf)
  } catch (err) {
    console.error("[Webhook] Erro ao verificar assinatura:", err)
    return false
  }
}

// Normalizar nome do evento para status padrao
function normalizeStatus(event: string, status: string): string {
  const lower = (event + " " + status).toLowerCase()
  if (lower.includes("aprovado") || lower.includes("approved") || lower.includes("paid") || lower.includes("authorized") || lower.includes("confirmed")) {
    return "approved"
  }
  if (lower.includes("recusado") || lower.includes("refused") || lower.includes("failed") || lower.includes("cancelled")) {
    return "refused"
  }
  if (lower.includes("expirado") || lower.includes("expired")) {
    return "expired"
  }
  if (lower.includes("criado") || lower.includes("created") || lower.includes("pending") || lower.includes("waiting")) {
    return "pending"
  }
  return status.toLowerCase() || "unknown"
}

// OPTIONS - Preflight CORS (necessario para dominio proprio)
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin")
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  })
}

// POST - Recebe notificacoes do gateway InPagamentos
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin")
  const startTime = Date.now()
  
  try {
    // Ler body como texto para verificar assinatura
    const rawBody = await request.text()
    const signature = request.headers.get("x-webhook-signature") || 
                      request.headers.get("x-signature") ||
                      request.headers.get("x-hub-signature-256")
    
    // Verificar assinatura
    if (!verifyWebhookSignature(rawBody, signature)) {
      console.log("[Webhook] Assinatura invalida - rejeitando")
      return NextResponse.json(
        { error: "Assinatura invalida" },
        { status: 401, headers: corsHeaders(origin) }
      )
    }

    // Parsear JSON
    let payload: Record<string, unknown>
    try {
      payload = JSON.parse(rawBody)
    } catch {
      console.log("[Webhook] JSON invalido")
      return NextResponse.json(
        { error: "JSON invalido" },
        { status: 400, headers: corsHeaders(origin) }
      )
    }

    console.log("[Webhook] Payload recebido:", JSON.stringify(payload).substring(0, 500))

    // InPagamentos pode enviar dados na raiz ou dentro de "data"
    const data = (payload.data as Record<string, unknown>) || payload
    
    const event = (payload.event as string) || (payload.type as string) || ""
    const transactionId = String(data.id || data.transaction_id || data._id || payload.id || "")
    const rawStatus = (data.status as string) || ""
    const paymentMethod = (data.paymentMethod as string) || (data.payment_method as string) || ""
    const amount = Number(data.amount || 0)
    
    const normalizedStatus = normalizeStatus(event, rawStatus)
    
    console.log(`[Webhook] Evento: ${event} | TX: ${transactionId} | Status: ${rawStatus} -> ${normalizedStatus} | Method: ${paymentMethod} | Amount: ${amount}`)

    // Processar por status normalizado
    if (transactionId) {
      await setPaymentStatus(transactionId, {
        status: (normalizedStatus as any) || "unknown",
        method: paymentMethod || "unknown",
        amount: amount > 100 ? amount / 100 : amount, // Converter centavos para reais se necessario
        updatedAt: new Date().toISOString(),
        webhookEvent: event,
        rawStatus: status,
      })

      if (normalizedStatus === "approved") {
        console.log(`[Webhook] Pagamento ${transactionId} APROVADO`)
      } else if (normalizedStatus === "refused") {
        console.log(`[Webhook] Pagamento ${transactionId} RECUSADO`)
      } else if (normalizedStatus === "expired") {
        console.log(`[Webhook] Pagamento ${transactionId} EXPIRADO`)
      } else {
        console.log(`[Webhook] Pagamento ${transactionId} atualizado para ${normalizedStatus}`)
      }
    } else if (normalizedStatus === "pending" && transactionId) {
      console.log(`[Webhook] Pagamento ${transactionId} CRIADO/PENDENTE`)
    }

    const elapsed = Date.now() - startTime
    console.log(`[Webhook] Processado em ${elapsed}ms`)

    // SEMPRE retornar 200 para o gateway nao reenviar
    return NextResponse.json({
      received: true,
      transaction_id: transactionId,
      status: normalizedStatus,
      processed_at: new Date().toISOString(),
    }, { headers: corsHeaders(origin) })

  } catch (error) {
    console.error("[Webhook] Erro interno:", error)
    return NextResponse.json(
      { received: true, error: "Erro interno processado" },
      { status: 200, headers: corsHeaders(origin) }
    )
  }
}

// GET - Polling de status do frontend
export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin")
  const { searchParams } = new URL(request.url)
  const transactionId = searchParams.get("transaction_id") || searchParams.get("id")
  
  if (!transactionId) {
    return NextResponse.json(
      { error: "transaction_id obrigatorio" },
      { status: 400, headers: corsHeaders(origin) }
    )
  }

  const paymentData = await getPaymentStatus(transactionId)
  
  if (paymentData) {
    return NextResponse.json({
      verified: true,
      ...paymentData,
    }, { headers: corsHeaders(origin) })
  }

  return NextResponse.json({
    verified: false,
    status: "pending",
    transaction_id: transactionId,
  }, { headers: corsHeaders(origin) })
}
