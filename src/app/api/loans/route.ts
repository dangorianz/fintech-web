import { type NextRequest } from "next/server";

import { forwardJsonRequest } from "@/src/lib/fintech-api-proxy";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId")?.trim();
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : "";

  return forwardJsonRequest({
    method: "GET",
    path: `/loans${query}`,
    request,
    hasBody: false,
  });
}

export async function POST(request: NextRequest) {
  const payload = await request.json();

  return forwardJsonRequest({
    method: "POST",
    path: "/loans",
    request,
    body: {
      userId: payload.customerDocument,
      amount: payload.amount,
      term: payload.termMonths,
      loanType: payload.installmentType === "declining" ? 2 : 1,
      monthlyIncome: payload.monthlyIncome ?? 0,
      interestRate: payload.annualRate,
    },
  });
}
