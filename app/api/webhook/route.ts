import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    console.log("Webhook recebido:", payload?.data?.id, payload?.data?.status);

    if (payload?.data?.status === "paid") {
      // Pagamento confirmado
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Erro no webhook:", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
