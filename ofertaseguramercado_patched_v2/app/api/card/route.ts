import { NextRequest, NextResponse } from "next/server"
import { generatePaymentToken, setPaymentStatus } from "@/lib/payment-store"

// ============================================
// INPAGAMENTOS - API DE CARTAO DE CREDITO
// ============================================
// Dashboard: https://app.inpagamentos.com/dashboard
// Autenticacao: Basic Auth (PUBLIC_KEY:SECRET_KEY)
// ============================================

const INPAGAMENTOS_API_URL = "https://api.inpagamentos.com/v1/transactions"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { 
      cardToken,      // Token gerado pelo InfinityPay.encrypt()
      amount,         // Valor em reais
      installments,   // Numero de parcelas
      description,    // Descricao do produto
      customer        // Dados do cliente
    } = body
    
    // Validacao basica
    if (!cardToken) {
      return NextResponse.json(
        { success: false, error: "Token do cartao nao informado" },
        { status: 400 }
      )
    }
    
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Valor invalido" },
        { status: 400 }
      )
    }
    
    // Chaves do InPagamentos (suporta ambos os formatos)
    const publicKey = process.env.INPAGAMENTOS_PUBLIC_KEY || process.env.INP_PUBLIC_KEY
    const secretKey = process.env.INPAGAMENTOS_SECRET_KEY || process.env.INP_PRIVATE_KEY
    
    if (!publicKey || !secretKey) {
      console.error("[CARD API] Chaves do InPagamentos nao configuradas")
      return NextResponse.json(
        { success: false, error: "Configuracao do gateway incompleta" },
        { status: 500 }
      )
    }
    
    // Basic Auth: base64(PUBLIC_KEY:SECRET_KEY)
    const credentials = Buffer.from(`${publicKey}:${secretKey}`).toString("base64")
    
    // Payload para o InPagamentos
    const gatewayPayload = {
      amount: Math.round(amount * 100), // Centavos
      paymentMethod: "credit_card",
      installments: parseInt(installments) || 1,
      cardToken: cardToken, // Token do cartao (gerado no frontend)
      description: description || "Compra online",
      customer: {
        name: customer?.name || "Cliente",
        email: customer?.email || "cliente@email.com",
        document: {
          type: customer?.document?.length === 14 ? "cnpj" : "cpf",
          number: (customer?.document || "00000000000").replace(/\D/g, ""),
        },
      },
      items: [
        {
          title: description || "Produto",
          quantity: 1,
          unitPrice: Math.round(amount * 100),
          tangible: true,
        },
      ],
    }
    
    console.log("[CARD API] Enviando para InPagamentos:", JSON.stringify(gatewayPayload, null, 2))
    
    // Chamar API do InPagamentos
    const gatewayResponse = await fetch(INPAGAMENTOS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${credentials}`,
      },
      body: JSON.stringify(gatewayPayload),
    })
    
    // Ler resposta como texto primeiro
    const rawText = await gatewayResponse.text()
    const contentType = gatewayResponse.headers.get("content-type") || ""
    
    console.log("[CARD API] Gateway HTTP Status:", gatewayResponse.status)
    console.log("[CARD API] Gateway Response:", rawText.substring(0, 500))
    
    // Tentar parsear JSON
    if (!contentType.includes("application/json")) {
      console.error("[CARD API] Resposta nao e JSON:", rawText)
      return NextResponse.json(
        { success: false, error: "Erro na comunicacao com o gateway" },
        { status: 502 }
      )
    }
    
    let data: Record<string, unknown>
    try {
      data = JSON.parse(rawText)
    } catch {
      console.error("[CARD API] Erro ao parsear JSON:", rawText)
      return NextResponse.json(
        { success: false, error: "Resposta invalida do gateway" },
        { status: 502 }
      )
    }
    
    // Verificar erro do gateway
    if (!gatewayResponse.ok) {
      const errorMessage = (data.message as string) || (data.error as string) || "Erro ao processar pagamento"
      console.error("[CARD API] Erro do gateway:", data)
      return NextResponse.json(
        { success: false, error: errorMessage, details: data },
        { status: gatewayResponse.status }
      )
    }
    
    // Extrair dados da resposta
    const responseData = (data.data as Record<string, unknown>) || data
    const status = responseData.status as string
    const transactionId = responseData.id as number | string
    
    // Verificar se precisa de 3D Secure
    const threeDS = responseData.threeDS as Record<string, unknown> | undefined
    if (threeDS?.redirectUrl) {
      return NextResponse.json({
        success: true,
        status: "requires_action",
        transaction_id: String(transactionId),
        redirect_url: threeDS.redirectUrl,
        return_url: threeDS.returnUrl,
      })
    }
    
    // Verificar status do pagamento
    const isPaid = status === "paid" || status === "authorized"
    const isPending = status === "pending" || status === "processing" || status === "waiting_payment"
    const isRefused = status === "refused" || status === "failed" || status === "cancelled"
    
    if (isRefused) {
      const refusedReason = (responseData.refusedReason as string) || "Pagamento recusado"
      return NextResponse.json({
        success: false,
        status: status,
        error: refusedReason,
        transaction_id: String(transactionId),
      })
    }
    
    // Gerar token anti-fraude para redirecionamento seguro (stateless)
const txId = String(transactionId)
const amountInReais = amount

// Persistir status (serverless-safe)
if (isPaid) {
  await setPaymentStatus(txId, {
    status: "approved",
    method: "card",
    amount: amountInReais,
    updatedAt: new Date().toISOString(),
    rawStatus: status,
  })
} else if (isPending) {
  await setPaymentStatus(txId, {
    status: "pending",
    method: "card",
    amount: amountInReais,
    updatedAt: new Date().toISOString(),
    rawStatus: status,
  })
} else {
  await setPaymentStatus(txId, {
    status: "unknown",
    method: "card",
    amount: amountInReais,
    updatedAt: new Date().toISOString(),
    rawStatus: status,
  })
}

const paymentToken = generatePaymentToken(txId, amountInReais)
    
    // Retornar sucesso com token
    return NextResponse.json({
      success: isPaid || isPending,
      status: status,
      transaction_id: txId,
      token: paymentToken,
      paid_at: responseData.paidAt as string | undefined,
      card: responseData.card as Record<string, unknown> | undefined,
    })
    
  } catch (error) {
    console.error("[CARD API] Erro interno:", error)
    return NextResponse.json(
      { success: false, error: "Erro interno ao processar pagamento" },
      { status: 500 }
    )
  }
}
