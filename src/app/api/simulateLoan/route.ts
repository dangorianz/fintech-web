import { type NextRequest } from "next/server";

import { forwardJsonRequest } from "@/src/lib/fintech-api-proxy";

export async function POST(request: NextRequest) {
  const payload = await request.json();

  return forwardJsonRequest({
    method: "POST",
    path: "/loans/simulate",
    request,
    body: {
      amount: payload.amount,
      term: payload.termMonths,
      loanType: toBackendLoanTypeValue(payload.installmentType),
      interestRate: payload.annualRate,
    },
  });
}

function toBackendLoanTypeValue(installmentType: string) {
  return installmentType === "declining" ? 2 : 1;
}
