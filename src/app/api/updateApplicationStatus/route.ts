import { NextResponse, type NextRequest } from "next/server";

import { forwardJsonRequest } from "@/src/lib/fintech-api-proxy";

export async function PATCH(request: NextRequest) {
  try {
    const payload = await request.json();

    if (!payload.id) {
      return NextResponse.json(
        { error: "El id de la solicitud es requerido" },
        { status: 400 },
      );
    }

    return forwardJsonRequest({
      method: "PATCH",
      path: `/loans/${payload.id}/${payload.status === "approved" ? "approve" : "reject"}`,
      request,
      hasBody: false,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "No se pudo procesar la solicitud";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
