import { type NextRequest } from "next/server";

import { forwardJsonRequest } from "@/src/lib/fintech-api-proxy";

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
      loanType: toBackendLoanTypeValue(payload.installmentType),
      monthlyIncome: payload.monthlyIncome ?? 0,
      // optional: include interest hint
      interestRate: payload.annualRate,
    },
  });
}

function toBackendLoanTypeValue(installmentType: string) {
  // Backend enum: Fixed = 1, Decreasing = 2
  return installmentType === "declining" ? 2 : 1;
}
