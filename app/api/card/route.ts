
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const auth = Buffer.from(
      `${process.env.INPAGAMENTOS_PUBLIC_KEY}:${process.env.INPAGAMENTOS_SECRET_KEY}`
    ).toString("base64");

    const payload = {
      amount: body.amount,
      paymentMethod: "credit_card",
      cardToken: body.token,
      installments: body.installments || 1,
      customer: {
        name: body.customer.name,
        email: body.customer.email,
        document: {
          type: "cpf",
          number: body.customer.cpf.replace(/\D/g, ""),
        },
        phone: body.customer.phone,
      },
      postbackUrl: `${process.env.NEXT_PUBLIC_WEBHOOK_URL}/api/webhook`,
    };

    const res = await fetch("https://api.inpagamentos.com/v1/transactions", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: "Erro cartão" }, { status: 500 });
  }
}
