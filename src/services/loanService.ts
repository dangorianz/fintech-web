import { ApiResult, requestApi } from "@/src/lib/api";
import {
  InstallmentType,
  LoanApplication,
  LoanSimulation,
  LoanSimulationRequest,
  LoanStatus,
  PaymentScheduleItem,
  PayNextInstallmentResult,
} from "@/src/types/loan";
import { BackendTransaction, toTransaction } from "@/src/services/transactions";

type BackendLoanType = "Fixed" | "Decreasing" | "Declining" | string;
type BackendLoanStatus =
  | "Draft"
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Active"
  | number
  | string;

type BackendPaymentScheduleItem = {
  paymentNumber: number;
  dueDate: string;
  totalPayment: number;
  principal: number;
  interest: number;
  remainingBalance: number;
  status: number | string;
};

type BackendLoanSimulation = {
  amount: number;
  term: number;
  interestRate: number;
  monthlyPayment: number;
  loanType: BackendLoanType;
  schedule: BackendPaymentScheduleItem[];
};

type BackendLoan = {
  id: string;
  userId: string;
  amount: number;
  term: number;
  interestRate: number;
  loanType: BackendLoanType;
  status: BackendLoanStatus;
  monthlyPayment: number;
  createdAt: string;
};

type BackendPayNextInstallmentResponse = {
  transaction: BackendTransaction;
  payment: BackendPaymentScheduleItem;
  remainingPendingPayments: number;
};

export async function simulateLoan(
  payload: LoanSimulationRequest,
): Promise<ApiResult<LoanSimulation>> {
  const result = await requestApi<BackendLoanSimulation>("/simulateLoan", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (result.data) {
    return { data: toSimulation(result.data) };
  }

  return { error: result.error };
}

export async function createLoanApplication(
  payload: Omit<LoanApplication, "id" | "status" | "requestedAt">,
): Promise<ApiResult<LoanApplication>> {
  const result = await requestApi<BackendLoan>("/loans", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (result.data) {
    return { data: toApplication(result.data, payload) };
  }

  return { error: result.error };
}

export async function getLoanApplications(
  userId: string,
): Promise<ApiResult<LoanApplication[]>> {
  const query = userId.trim()
    ? `?userId=${encodeURIComponent(userId.trim())}`
    : "";
  const result = await requestApi<BackendLoan[]>(`/loans${query}`, {
    method: "GET",
  });

  if (result.data) {
    return { data: result.data.map(toApplicationFromBackendLoan) };
  }

  return { error: result.error };
}

export async function getLoanById(
  loanId: string,
): Promise<ApiResult<LoanApplication>> {
  const result = await requestApi<BackendLoan>(
    `/loans/${encodeURIComponent(loanId)}`,
    {
      method: "GET",
    },
  );

  if (result.data) {
    return { data: toApplicationFromBackendLoan(result.data) };
  }

  return { error: result.error };
}

export async function getLoanSchedule(
  loanId: string,
): Promise<ApiResult<PaymentScheduleItem[]>> {
  const result = await requestApi<BackendPaymentScheduleItem[]>(
    `/loans/${encodeURIComponent(loanId)}/schedule`,
    {
      method: "GET",
    },
  );

  if (result.data) {
    return { data: toPaymentSchedule(result.data) };
  }

  return { error: result.error };
}

export async function payNextInstallment(
  loanId: string,
  idempotencyKey: string,
): Promise<ApiResult<PayNextInstallmentResult>> {
  const result = await requestApi<BackendPayNextInstallmentResponse>(
    `/loans/${encodeURIComponent(loanId)}/payments`,
    {
      method: "POST",
      body: JSON.stringify({
        idempotencyKey,
      }),
    },
  );

  if (result.data) {
    return {
      data: {
        transaction: toTransaction(result.data.transaction),
        payment: toPaymentScheduleItem(result.data.payment),
        remainingPendingPayments: result.data.remainingPendingPayments,
      },
    };
  }

  return { error: result.error };
}

export async function updateApplicationStatus(
  id: string,
  status: Extract<LoanStatus, "approved" | "rejected">,
): Promise<ApiResult<{ id: string; status: LoanStatus }>> {
  const result = await requestApi<BackendLoan>("/updateApplicationStatus", {
    method: "PATCH",
    body: JSON.stringify({ id, status }),
  });

  if (result.data) {
    return {
      data: {
        id: result.data.id,
        status: fromBackendLoanStatus(result.data.status),
      },
    };
  }

  return { error: result.error };
}

function fromBackendLoanType(
  loanType: BackendLoanType | null | undefined,
): InstallmentType {
  if (!loanType) return "fixed";

  try {
    const normalized = String(loanType).toLowerCase();

    return normalized === "declining" || normalized === "decreasing"
      ? "declining"
      : "fixed";
  } catch {
    return "fixed";
  }
}

function fromBackendLoanStatus(
  status: BackendLoanStatus | null | undefined,
): LoanStatus {
  const normalized = String(status ?? "pending").toLowerCase();

  if (normalized === "1") return "pending";
  if (normalized === "2") return "approved";
  if (normalized === "3") return "rejected";
  if (normalized === "4") return "active";

  if (
    normalized === "draft" ||
    normalized === "approved" ||
    normalized === "rejected" ||
    normalized === "active"
  ) {
    return normalized as LoanStatus;
  }

  return "pending";
}

function fromBackendPaymentScheduleStatus(
  status: number | string | null | undefined,
) {
  const normalized = String(status ?? "pending").toLowerCase();

  if (normalized === "1") return "pending";
  if (normalized === "2") return "paid";
  if (normalized === "pending" || normalized === "paid") return normalized;

  return normalized;
}

function toSimulation(data: BackendLoanSimulation): LoanSimulation {
  const schedule = data.schedule.map(toPaymentScheduleItem);
  const totalInterest = schedule.reduce((sum, item) => sum + item.interest, 0);
  const totalPayment = schedule.reduce((sum, item) => sum + item.payment, 0);

  return {
    amount: data.amount,
    termMonths: data.term,
    annualRate: data.interestRate,
    installmentType: fromBackendLoanType(data.loanType),
    monthlyPayment: data.monthlyPayment,
    effectiveAnnualRate: data.interestRate,
    totalInterest,
    totalPayment,
    schedule,
  };
}

function toApplication(
  data: BackendLoan,
  payload: Omit<LoanApplication, "id" | "status" | "requestedAt">,
): LoanApplication {
  const totalPayment = data.monthlyPayment * data.term;

  return {
    ...payload,
    id: data.id,
    amount: data.amount,
    termMonths: data.term,
    annualRate: data.interestRate,
    installmentType: fromBackendLoanType(data.loanType),
    monthlyPayment: data.monthlyPayment,
    effectiveAnnualRate: data.interestRate,
    totalInterest: Math.max(0, totalPayment - data.amount),
    totalPayment,
    status: fromBackendLoanStatus(data.status),
    requestedAt: data.createdAt,
  };
}

function toApplicationFromBackendLoan(data: BackendLoan): LoanApplication {
  const totalPayment = data.monthlyPayment * data.term;

  return {
    id: data.id,
    customerName: data.userId,
    customerDocument: data.userId,
    amount: data.amount,
    termMonths: data.term,
    annualRate: data.interestRate,
    installmentType: fromBackendLoanType(data.loanType),
    monthlyPayment: data.monthlyPayment,
    effectiveAnnualRate: data.interestRate,
    totalInterest: Math.max(0, totalPayment - data.amount),
    totalPayment,
    status: fromBackendLoanStatus(data.status),
    requestedAt: data.createdAt,
    schedule: [],
  };
}

function toPaymentSchedule(
  data: BackendPaymentScheduleItem[],
): PaymentScheduleItem[] {
  return data.map(toPaymentScheduleItem);
}

function toPaymentScheduleItem(
  item: BackendPaymentScheduleItem,
): PaymentScheduleItem {
  return {
    installment: item.paymentNumber,
    dueDate: item.dueDate.slice(0, 10),
    principal: item.principal,
    interest: item.interest,
    payment: item.totalPayment,
    balance: item.remainingBalance,
    status: fromBackendPaymentScheduleStatus(item.status),
  };
}
