import { NextResponse, type NextRequest } from "next/server";

type ForwardOptions = {
  method: "GET" | "POST" | "PATCH";
  path: string;
  request: NextRequest;
  body?: unknown;
  hasBody?: boolean;
  headers?: HeadersInit;
};

export async function forwardJsonRequest({
  method,
  path,
  request,
  body,
  hasBody = true,
  headers,
}: ForwardOptions) {
  const baseUrl = process.env.FINTECH_API_BASE_URL?.replace(/\/$/, "");

  if (!baseUrl) {
    return NextResponse.json(
      { error: "FINTECH_API_BASE_URL no esta configurado" },
      { status: 500 },
    );
  }

  try {
    const payload =
      method === "GET" || !hasBody ? undefined : body ?? (await request.json());
    const init: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    };

    if (payload !== undefined) {
      init.body = JSON.stringify(payload);
    }

    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
    });

    const text = await response.text();
    const data = text ? parseJson(text) : null;

    if (!response.ok) {
      return NextResponse.json(data ?? { error: text }, {
        status: response.status,
      });
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "No se pudo conectar con la API";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function parseJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}
