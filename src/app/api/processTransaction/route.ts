import { NextResponse, type NextRequest } from "next/server";

import { forwardJsonRequest } from "@/src/lib/fintech-api-proxy";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    return forwardJsonRequest({
      method: "POST",
      path: "/transactions",
      request,
      body: {
        idempotencyKey: payload.idempotencyKey,
        type: toBackendTransactionType(payload.type),
        amount: payload.amount,
        loanId: payload.loanId || null,
        description:
          payload.type === "disbursement"
            ? "Desembolso registrado desde SGIP web"
            : "Pago registrado desde SGIP web",
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "No se pudo procesar la transaccion";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function toBackendTransactionType(type: string) {
  return type === "disbursement" ? "Disbursement" : "Payment";
}
