"use server"

export async function getInPagamentosPublicKey(): Promise<string> {
  return process.env.INPAGAMENTOS_PUBLIC_KEY || process.env.INP_PUBLIC_KEY || ""
}
