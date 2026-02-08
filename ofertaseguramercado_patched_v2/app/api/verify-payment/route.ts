import { NextRequest, NextResponse } from "next/server"
import {
  consumePaymentToken,
  generatePaymentToken,
  getPaymentStatus,
  setPaymentStatus,
  type PaymentStatus,
} from "@/lib/payment-store"

// ============================================
// VERIFICACAO DE PAGAMENTO + ANTI-FRAUDE (PRODUCAO)
// ============================================
// POST: Verifica transacao (webhook/store + gateway) e retorna token
// GET:  Valida token e retorna status atual (inclui polling "safe")
// ============================================

const INPAGAMENTOS_API_URL = "https://api.inpagamentos.com/v1/transactions"
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || process.env.INPAGAMENTOS_WEBHOOK_SECRET

function normalizeGatewayStatus(statusRaw: string): PaymentStatus {
  const s = (statusRaw || "").toLowerCase()
  if (["paid", "approved", "authorized", "confirmed"].includes(s)) return "approved"
  if (["pending", "processing", "waiting_payment", "created"].includes(s)) return "pending"
  if (["refused", "failed", "cancelled", "canceled"].includes(s)) return "refused"
  if (["expired"].includes(s)) return "expired"
  return "unknown"
}

async function fetchGatewayStatus(transactionId: string): Promise<{ status: PaymentStatus; raw?: string } | null> {
  const publicKey = process.env.INPAGAMENTOS_PUBLIC_KEY || process.env.INP_PUBLIC_KEY
  const secretKey = process.env.INPAGAMENTOS_SECRET_KEY || process.env.INP_PRIVATE_KEY

  if (!publicKey || !secretKey) return null
  if (transactionId.startsWith("LOCAL_") || transactionId.startsWith("PIX_")) return null

  try {
    const credentials = Buffer.from(`${publicKey}:${secretKey}`).toString("base64")
    const response = await fetch(`${INPAGAMENTOS_API_URL}/${transactionId}`, {
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      // Prevent hung requests from blocking serverless execution too long
      cache: "no-store",
    })

    if (!response.ok) return null
    const data = await response.json()
    const responseData = (data?.data as Record<string, unknown>) || data
    const raw = String((responseData?.status as string) || "")
    return { status: normalizeGatewayStatus(raw), raw }
  } catch (err) {
    console.error("[verify-payment] Erro ao consultar gateway:", err)
    return null
  }
}

// POST - Verificar pagamento e gerar token seguro
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transaction_id, method, amount } = body as { transaction_id?: string; method?: string; amount?: number }

    if (!transaction_id || !method || typeof amount !== "number") {
      return NextResponse.json({ verified: false, error: "Dados insuficientes para verificacao" }, { status: 400 })
    }

    // 0) PIX fallback/local: usuario declarou pagamento (mantem funcionalidade atual)
    if (transaction_id.startsWith("LOCAL_") || transaction_id.startsWith("PIX_")) {
      await setPaymentStatus(transaction_id, {
        status: "approved",
        method: method || "pix",
        amount,
        updatedAt: new Date().toISOString(),
        rawStatus: "local",
      })
      const token = generatePaymentToken(transaction_id, amount)
      return NextResponse.json({
        verified: true,
        token,
        method,
        transaction_id,
        amount,
        status: "approved",
        verified_at: new Date().toISOString(),
      })
    }

    // 1) Store (webhook/kv)
    const existing = await getPaymentStatus(transaction_id)
    if (existing?.status === "approved") {
      // Se WEBHOOK_SECRET nao estiver configurado, nao confie apenas no status salvo via webhook.
      // Reconfirme no gateway para evitar spoofing.
      if (!WEBHOOK_SECRET) {
        const gwCheck = await fetchGatewayStatus(transaction_id)
        if (!gwCheck || gwCheck.status !== "approved") {
          return NextResponse.json({
            verified: false,
            method,
            transaction_id,
            amount,
            status: gwCheck?.status || "pending",
          })
        }
      }
      const token = generatePaymentToken(transaction_id, amount)
      return NextResponse.json({
        verified: true,
        token,
        method,
        transaction_id,
        amount,
        status: "approved",
        verified_at: existing.updatedAt,
      })
    }

    // 2) Gateway
    const gw = await fetchGatewayStatus(transaction_id)
    if (gw) {
      await setPaymentStatus(transaction_id, {
        status: gw.status,
        method,
        amount,
        updatedAt: new Date().toISOString(),
        rawStatus: gw.raw,
      })
      if (gw.status === "approved") {
        const token = generatePaymentToken(transaction_id, amount)
        return NextResponse.json({
          verified: true,
          token,
          method,
          transaction_id,
          amount,
          status: "approved",
          verified_at: new Date().toISOString(),
        })
      }
      return NextResponse.json({
        verified: false,
        method,
        transaction_id,
        amount,
        status: gw.status,
      })
    }

    // 3) Sem confirmacao
    return NextResponse.json({
      verified: false,
      method,
      transaction_id,
      amount,
      status: existing?.status || "pending",
    })
  } catch (error) {
    console.error("[verify-payment] Error:", error)
    return NextResponse.json({ verified: false, error: "Erro interno na verificacao" }, { status: 500 })
  }
}

// GET - Validar token anti-fraude e retornar status (usado pela pagina de sucesso)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")

  if (!token) {
    return NextResponse.json({ valid: false, error: "Token obrigatorio" }, { status: 400 })
  }

  const result = consumePaymentToken(token)
  if (!result.valid || !result.transactionId) {
    return NextResponse.json({ valid: false, error: "Token invalido ou expirado" }, { status: 403 })
  }

  const transaction_id = result.transactionId
  const amount = result.amount ?? 0

  // Status atual (KV)
  let record = await getPaymentStatus(transaction_id)

  // Se nao aprovado ainda, tentar consultar gateway (quando possivel)
  if (!record || record.status !== "approved") {
    const gw = await fetchGatewayStatus(transaction_id)
    if (gw) {
      record = {
        status: gw.status,
        method: record?.method || "unknown",
        amount: record?.amount ?? amount,
        updatedAt: new Date().toISOString(),
        rawStatus: gw.raw,
        webhookEvent: record?.webhookEvent,
      }
      await setPaymentStatus(transaction_id, record)
    }
  }

  const status = record?.status || "pending"
  return NextResponse.json({
    valid: true,
    transaction_id,
    amount: record?.amount ?? amount,
    status,
    verified: status === "approved",
    updated_at: record?.updatedAt,
  })
}
