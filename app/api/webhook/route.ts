
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const payload = await req.json();

  if (payload?.data?.status === "paid") {
    console.log("Pagamento confirmado:", payload.data.id);
  }

  return NextResponse.json({ received: true });
}
