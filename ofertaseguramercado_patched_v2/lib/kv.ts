// ============================================
// KV / STORAGE LAYER (Upstash Redis REST + in-memory fallback)
// ============================================
// - Production-ready on Vercel serverless
// - If UPSTASH_* env vars are missing, falls back to in-memory Map
// ============================================

type JsonValue = unknown

const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

const mem = new Map<string, { value: string; expiresAt?: number }>()

function nowMs() {
  return Date.now()
}

function isExpired(expiresAt?: number) {
  return typeof expiresAt === "number" && expiresAt > 0 && expiresAt < nowMs()
}

async function upstashFetch<T>(path: string): Promise<T> {
  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
    throw new Error("Upstash env vars missing")
  }
  const url = `${UPSTASH_REDIS_REST_URL}${path}`
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
    },
    // Upstash REST is GET by default for commands
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Upstash error (${res.status}): ${text}`)
  }
  return (await res.json()) as T
}

export async function kvGet<T = JsonValue>(key: string): Promise<T | null> {
  // Prefer Upstash when configured
  if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
    try {
      const data = await upstashFetch<{ result: string | null }>(`/get/${encodeURIComponent(key)}`)
      if (!data?.result) return null
      return JSON.parse(data.result) as T
    } catch (err) {
      console.error("[kvGet] Upstash failed, falling back to memory:", err)
      // fall through to memory
    }
  }

  const entry = mem.get(key)
  if (!entry) return null
  if (isExpired(entry.expiresAt)) {
    mem.delete(key)
    return null
  }
  try {
    return JSON.parse(entry.value) as T
  } catch {
    return null
  }
}

export async function kvSet(key: string, value: JsonValue, ttlSeconds?: number): Promise<void> {
  const payload = JSON.stringify(value)

  if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
    try {
      const ex = ttlSeconds && ttlSeconds > 0 ? `?EX=${ttlSeconds}` : ""
      // Upstash REST supports /set/<key>/<value>?EX=ttl
      await upstashFetch(`/set/${encodeURIComponent(key)}/${encodeURIComponent(payload)}${ex}`)
      return
    } catch (err) {
      console.error("[kvSet] Upstash failed, falling back to memory:", err)
      // fall through to memory
    }
  }

  const expiresAt = ttlSeconds && ttlSeconds > 0 ? nowMs() + ttlSeconds * 1000 : undefined
  mem.set(key, { value: payload, expiresAt })
}

export async function kvDel(key: string): Promise<void> {
  if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
    try {
      await upstashFetch(`/del/${encodeURIComponent(key)}`)
      return
    } catch (err) {
      console.error("[kvDel] Upstash failed, falling back to memory:", err)
      // fall through
    }
  }
  mem.delete(key)
}
