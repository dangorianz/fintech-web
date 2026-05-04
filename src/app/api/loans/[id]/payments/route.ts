import { type NextRequest } from "next/server";

import { forwardJsonRequest } from "@/src/lib/fintech-api-proxy";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  return forwardJsonRequest({
    method: "POST",
    path: `/loans/${encodeURIComponent(id)}/payments`,
    request,
  });
}
