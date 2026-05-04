import { type NextRequest } from "next/server";

import { forwardJsonRequest } from "@/src/lib/fintech-api-proxy";

function toBackendTransactionType(type: string | null) {
  if (type === "disbursement") return "Disbursement";
  if (type === "payment") return "Payment";
  return "";
}

function toBackendTransactionStatus(status: string | null) {
  if (status === "processed") return "Completed";
  if (status === "failed") return "Failed";
  return "";
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const query = new URLSearchParams();
  const type = toBackendTransactionType(params.get("type"));
  const status = toBackendTransactionStatus(params.get("status"));

  if (type) query.set("type", type);
  if (status) query.set("status", status);

  return forwardJsonRequest({
    method: "GET",
    path: `/transactions${query.toString() ? `?${query.toString()}` : ""}`,
    request,
    hasBody: false,
  });
}
