import { NextRequest, NextResponse } from "next/server"

// ============================================
// INTEGRACAO GATEWAY INPAGAMENTOS
// ============================================
// Dashboard: https://app.inpagamentos.com/dashboard
//
// Variaveis de ambiente OBRIGATORIAS:
// - INPAGAMENTOS_PUBLIC_KEY (chave publica)
// - INPAGAMENTOS_SECRET_KEY (chave secreta)
//
// Autenticacao: Basic Auth (PUBLIC_KEY:SECRET_KEY em base64)
// Endpoint: https://api.inpagamentos.com/v1/transactions
// ============================================

const INPAGAMENTOS_API_URL = "https://api.inpagamentos.com/v1/transactions"

// Funcao para gerar PIX local (fallback)
async function generateLocalPix(amount: number, description: string) {
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

  // Calcular CRC16 CCITT-FALSE
  let crc = 0xffff
  const polynomial = 0x1021

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ polynomial
      } else {
        crc <<= 1
      }
      crc &= 0xffff
    }
  }

  const crcStr = crc.toString(16).toUpperCase().padStart(4, "0")
  payload = payload.slice(0, -4) + buildTLV("63", crcStr)

  // Gerar QR Code via API externa (com timeout) - fallback: sem imagem
let qrBase64 = ""
try {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 6000)

  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payload)}`
  const qrResponse = await fetch(qrApiUrl, { signal: controller.signal })
  clearTimeout(timeout)

  if (qrResponse.ok) {
    const qrBuffer = await qrResponse.arrayBuffer()
    qrBase64 = Buffer.from(qrBuffer).toString("base64")
  }
} catch {
  // Sem imagem (mantem payload PIX)
}

return {
    success: true,
    qr_code: payload,
    qr_code_base64: qrBase64,
    transaction_id: txId,
    status: "pending",
    expiration_date: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Dados recebidos do front-end
    const { amount, description, name, cpf, email } = body

    // Validacao basica
    if (!amount || !description) {
      return NextResponse.json({ error: "Dados incompletos: amount e description obrigatorios" }, { status: 400 })
    }

    // Chaves do InPagamentos (Basic Auth)
    // Suporta ambos os formatos: INPAGAMENTOS_* e INP_*
    const publicKey = process.env.INPAGAMENTOS_PUBLIC_KEY || process.env.INP_PUBLIC_KEY
    const secretKey = process.env.INPAGAMENTOS_SECRET_KEY || process.env.INP_PRIVATE_KEY

    // Se nao ha chaves configuradas, usar fallback local
    if (!publicKey || !secretKey) {
      console.log("[PIX API] Chaves InPagamentos nao configuradas, usando fallback local")
      const localPix = await generateLocalPix(amount, description)
      return NextResponse.json(localPix)
    }

    // Montar Basic Auth conforme documentacao InPagamentos
    const authString = `${publicKey}:${secretKey}`
    const authBase64 = Buffer.from(authString).toString("base64")
    const authorization = `Basic ${authBase64}`

    // Payload conforme documentacao InPagamentos
    // IMPORTANTE: document deve ser objeto {type, number} e items e obrigatorio
    const cleanCpf = (cpf || "00000000000").replace(/\D/g, "")
    
    const gatewayPayload = {
      amount: Math.round(amount * 100), // Valor em centavos
      paymentMethod: "pix",
      description: description,
      customer: {
        name: name || "Cliente",
        email: email || "cliente@email.com",
        document: {
          type: "cpf",
          number: cleanCpf,
        },
      },
      items: [
        {
          title: description || "Produto",
          quantity: 1,
          unitPrice: Math.round(amount * 100), // Centavos
          tangible: true,
        },
      ],
    }

    console.log("[PIX API] Chamando InPagamentos...")
    console.log("[PIX API] URL:", INPAGAMENTOS_API_URL)
    console.log("[PIX API] Payload:", JSON.stringify(gatewayPayload))

    try {
      const gatewayResponse = await fetch(INPAGAMENTOS_API_URL, {
        method: "POST",
        headers: {
          Authorization: authorization,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(gatewayPayload),
      })

      // SEMPRE ler como texto primeiro
      const rawText = await gatewayResponse.text()
      const contentType = gatewayResponse.headers.get("content-type") || ""

      console.log("[PIX API] HTTP Status:", gatewayResponse.status)
      console.log("[PIX API] Content-Type:", contentType)
      console.log("[PIX API] Response:", rawText.substring(0, 500))

      // Se HTTP nao OK, usar fallback
      if (!gatewayResponse.ok) {
        console.log("[PIX API] Gateway retornou erro HTTP, usando fallback")
        const localPix = await generateLocalPix(amount, description)
        return NextResponse.json(localPix)
      }

      // Verificar se e JSON
      if (!contentType.includes("application/json")) {
        console.log("[PIX API] Resposta nao e JSON, usando fallback")
        const localPix = await generateLocalPix(amount, description)
        return NextResponse.json(localPix)
      }

      // Parsear JSON
      let data: Record<string, unknown>
      try {
        data = JSON.parse(rawText)
      } catch {
        console.log("[PIX API] Falha ao parsear JSON, usando fallback")
        const localPix = await generateLocalPix(amount, description)
        return NextResponse.json(localPix)
      }

      // InPagamentos retorna dados dentro de "data" quando envia webhook
      // mas na resposta direta pode estar na raiz ou em "data"
      const responseData = (data.data as Record<string, unknown>) || data
      const pixData = responseData.pix as Record<string, unknown> | undefined
      
      console.log("[PIX API] Response data keys:", Object.keys(responseData))
      console.log("[PIX API] PIX data:", JSON.stringify(pixData))

      // Extrair codigo PIX - InPagamentos usa "qrcode" (minusculo) dentro de "pix"
      const pixCode =
        (pixData?.qrcode as string) ||  // InPagamentos: pix.qrcode
        (pixData?.qrCode as string) ||  // Alternativa camelCase
        (pixData?.emv as string) ||
        (responseData.qr_code as string) ||
        (responseData.qrcode as string) ||
        (responseData.emv as string) ||
        (responseData.pix_code as string) ||
        (responseData.brcode as string) ||
        (responseData.pixCopiaECola as string)

      if (!pixCode) {
        console.log("[PIX API] Nenhum codigo PIX encontrado na resposta")
        console.log("[PIX API] Campos disponiveis:", Object.keys(responseData))
        console.log("[PIX API] PIX object:", pixData)
        const localPix = await generateLocalPix(amount, description)
        return NextResponse.json(localPix)
      }

      console.log("[PIX API] Codigo PIX extraido com sucesso:", pixCode.substring(0, 50) + "...")

      // Gerar QR Code - InPagamentos nao retorna base64, precisa gerar
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixCode)}`
      const qrResponse = await fetch(qrApiUrl)
      const qrBuffer = await qrResponse.arrayBuffer()
      const qrBase64 = Buffer.from(qrBuffer).toString("base64")

      // Extrair dados adicionais
      const transactionId = (responseData.id as number | string) || (responseData.transaction_id as string) || `PIX_${Date.now()}`
      const status = (responseData.status as string) || "waiting_payment"
      const expirationDate = (pixData?.expirationDate as string) || (responseData.expirationDate as string) || new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

      // Retornar resposta normalizada
      return NextResponse.json({
        success: true,
        qr_code: pixCode,
        qr_code_base64: qrBase64,
        transaction_id: String(transactionId),
        status: status,
        expiration_date: expirationDate,
      })
    } catch (fetchError) {
      console.log("[PIX API] Erro de rede:", fetchError)
      const localPix = await generateLocalPix(amount, description)
      return NextResponse.json(localPix)
    }
  } catch (error) {
    console.error("[PIX API] Erro interno:", error)
    return NextResponse.json({ error: "Erro interno ao processar requisicao" }, { status: 500 })
  }
}
