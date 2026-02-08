// ============================================
// PAYMENT STORE (Production-safe for Vercel serverless)
// ============================================
// - Persists payment status in Upstash Redis (REST) when configured
// - Falls back to in-memory storage if Upstash is not set
// - Uses stateless, signed tokens (HMAC) to avoid instance issues
// ============================================

import { createHmac, timingSafeEqual, randomBytes } from "crypto"
import { kvGet, kvSet } from "@/lib/kv"

export type PaymentStatus = "approved" | "pending" | "refused" | "expired" | "unknown"

export interface PaymentRecord {
  status: PaymentStatus
  method: string
  amount: number
  updatedAt: string
  webhookEvent?: string
  rawStatus?: string
}

const PAYMENT_RECORD_TTL_SECONDS = 48 * 60 * 60 // 48h

function keyPayment(transactionId: string) {
  return `pay:tx:${transactionId}`
}

// ============================================
// PAYMENT STATUS (KV)
// ============================================

export async function setPaymentStatus(transactionId: string, record: PaymentRecord) {
  await kvSet(keyPayment(transactionId), record, PAYMENT_RECORD_TTL_SECONDS)
}

export async function getPaymentStatus(transactionId: string): Promise<PaymentRecord | null> {
  return await kvGet<PaymentRecord>(keyPayment(transactionId))
}

export async function isPaymentApproved(transactionId: string): Promise<boolean> {
  const rec = await getPaymentStatus(transactionId)
  return rec?.status === "approved"
}

// Backwards-compatible alias
export async function markPaymentVerified(transactionId: string, data: { status: string; method: string; amount: number; verifiedAt?: string; webhookEvent?: string }) {
  const status: PaymentStatus = data.status === "approved" ? "approved" : "unknown"
  await setPaymentStatus(transactionId, {
    status,
    method: data.method,
    amount: data.amount,
    updatedAt: data.verifiedAt || new Date().toISOString(),
    webhookEvent: data.webhookEvent,
  })
}

// ============================================
// STATELESS ACCESS TOKEN (HMAC)
// ============================================
// Token format: base64url(payload).hexSignature
// payload: { tid, amt, exp, nonce }
// - No server storage required
// - Safe in serverless / multi-instance environments
// ============================================

const TOKEN_SECRET =
  process.env.PAYMENT_TOKEN_SECRET ||
  process.env.WEBHOOK_SECRET ||
  process.env.INPAGAMENTOS_WEBHOOK_SECRET ||
  "CHANGE_ME_IN_PROD"

function b64url(buf: Buffer) {
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
}

function b64urlDecode(input: string) {
  const padLen = (4 - (input.length % 4)) % 4
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(padLen)
  return Buffer.from(base64, "base64")
}

export function generatePaymentToken(transactionId: string, amount: number): string {
  const payload = {
    tid: transactionId,
    amt: amount,
    exp: Date.now() + 60 * 60 * 1000, // 1h
    nonce: b64url(randomBytes(12)),
  }
  const payloadStr = JSON.stringify(payload)
  const payloadB64 = b64url(Buffer.from(payloadStr, "utf8"))
  const sig = createHmac("sha256", TOKEN_SECRET).update(payloadB64).digest("hex")
  return `${payloadB64}.${sig}`
}

export function validatePaymentToken(token: string): { valid: boolean; transactionId?: string; amount?: number } {
  try {
    const [payloadB64, sig] = token.split(".")
    if (!payloadB64 || !sig) return { valid: false }

    const expected = createHmac("sha256", TOKEN_SECRET).update(payloadB64).digest("hex")
    const a = Buffer.from(sig, "utf8")
    const b = Buffer.from(expected, "utf8")
    if (a.length !== b.length) return { valid: false }
    if (!timingSafeEqual(a, b)) return { valid: false }

    const payload = JSON.parse(b64urlDecode(payloadB64).toString("utf8")) as { tid: string; amt: number; exp: number }
    if (!payload?.tid || typeof payload.exp !== "number") return { valid: false }
    if (Date.now() > payload.exp) return { valid: false }

    return { valid: true, transactionId: payload.tid, amount: payload.amt }
  } catch {
    return { valid: false }
  }
}

// For compatibility with old name
export function consumePaymentToken(token: string) {
  return validatePaymentToken(token)
}
