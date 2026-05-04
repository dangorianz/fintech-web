export type InstallmentType = "fixed" | "declining";
export type LoanStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "active";
export type TransactionStatus = "processed" | "duplicate" | "failed";

export type LoanSimulationRequest = {
  amount: number;
  termMonths: number;
  annualRate: number;
  installmentType: InstallmentType;
};

export type PaymentScheduleItem = {
  installment: number;
  dueDate: string;
  principal: number;
  interest: number;
  payment: number;
  balance: number;
  status: "pending" | "paid" | string;
};

export type LoanSimulation = LoanSimulationRequest & {
  monthlyPayment: number;
  effectiveAnnualRate: number;
  totalInterest: number;
  totalPayment: number;
  schedule: PaymentScheduleItem[];
};

export type LoanApplication = LoanSimulation & {
  id: string;
  customerName: string;
  customerDocument: string;
  purpose: string;
  status: LoanStatus;
  requestedAt: string;
};

export type TransactionRequest = {
  loanId: string;
  amount: number;
  type: "disbursement" | "payment";
  idempotencyKey: string;
};

export type TransactionResult = TransactionRequest & {
  id: string;
  status: TransactionStatus;
  processedAt: string;
  message: string;
};

export type PayNextInstallmentResult = {
  transaction: TransactionResult;
  payment: PaymentScheduleItem;
  remainingPendingPayments: number;
};

type ApiResult<T> = {
  data?: T;
  error?: string;
  fromMock?: boolean;
};

type BackendLoanType = "Fixed" | "Decreasing" | "Declining" | string;
type BackendLoanStatus =
  | "Draft"
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Active"
  | number
  | string;
type BackendTransactionType = "Disbursement" | "Payment" | string;
type BackendTransactionStatus =
  | "Processed"
  | "Completed"
  | "Duplicate"
  | "Failed"
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
  interestRate: number; // annual interest
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

type BackendTransaction = {
  id: string;
  idempotencyKey: string;
  type: BackendTransactionType;
  amount: number;
  status: BackendTransactionStatus;
  loanId: string | null;
  description: string | null;
  createdAt: string;
};

type BackendPayNextInstallmentResponse = {
  transaction: BackendTransaction;
  payment: BackendPaymentScheduleItem;
  remainingPendingPayments: number;
};

const API_BASE_URL = "/api";

function money(value: number) {
  return Number.isFinite(value) ? value : 0;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next.toISOString().slice(0, 10);
}

export function simulateLocally(
  request: LoanSimulationRequest,
): LoanSimulation {
  const monthlyRate = Math.pow(1 + request.annualRate / 100, 1 / 12) - 1;
  const amount = money(request.amount);
  const termMonths = Math.max(1, Math.floor(request.termMonths));
  const fixedPrincipal = amount / termMonths;
  const fixedPayment =
    monthlyRate === 0
      ? fixedPrincipal
      : (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -termMonths));

  let balance = amount;
  let totalInterest = 0;

  const schedule = Array.from({ length: termMonths }, (_, index) => {
    const interest = balance * monthlyRate;
    const principal =
      request.installmentType === "fixed"
        ? Math.min(fixedPayment - interest, balance)
        : Math.min(fixedPrincipal, balance);
    const payment = principal + interest;
    balance = Math.max(0, balance - principal);
    totalInterest += interest;

    return {
      installment: index + 1,
      dueDate: addMonths(new Date(), index + 1),
      principal,
      interest,
      payment,
      balance,
      status: "pending",
    };
  });

  return {
    ...request,
    amount,
    termMonths,
    monthlyPayment: schedule[0]?.payment ?? 0,
    effectiveAnnualRate: (Math.pow(1 + monthlyRate, 12) - 1) * 100,
    totalInterest,
    totalPayment: amount + totalInterest,
    schedule,
  };
}

async function requestApi<T>(
  path: string,
  options?: RequestInit,
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const message = await readErrorMessage(response);
      return {
        error: message || `HTTP ${response.status}`,
      };
    }

    return { data: (await response.json()) as T };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "No se pudo conectar con el backend",
    };
  }
}

async function readErrorMessage(response: Response) {
  const text = await response.text();

  try {
    const data = JSON.parse(text);
    return typeof data.error === "string" ? data.error : text;
  } catch {
    return text;
  }
}

export function getApiBaseUrl() {
  return "Next.js API routes (/api)";
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
  const schedule = data.schedule.map((item) => ({
    installment: item.paymentNumber,
    dueDate: item.dueDate.slice(0, 10),
    principal: item.principal,
    interest: item.interest,
    payment: item.totalPayment,
    balance: item.remainingBalance,
    status: fromBackendPaymentScheduleStatus(item.status),
  }));
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
    purpose: "Prestamo registrado",
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

function fromBackendTransactionType(
  type: BackendTransactionType | null | undefined,
): TransactionRequest["type"] {
  if (!type) return "payment";
  try {
    return String(type).toLowerCase() === "disbursement"
      ? "disbursement"
      : "payment";
  } catch {
    return "payment";
  }
}

function fromBackendTransactionStatus(
  status: BackendTransactionStatus | null | undefined,
): TransactionStatus {
  const normalized = String(status ?? "processed").toLowerCase();

  if (normalized === "1") return "processed";
  if (normalized === "2") return "processed";
  if (normalized === "3") return "failed";

  if (normalized === "duplicate" || normalized === "failed") {
    return normalized as TransactionStatus;
  }

  return "processed";
}

function toTransaction(data: BackendTransaction): TransactionResult {
  return {
    id: data.id,
    idempotencyKey: data.idempotencyKey,
    type: fromBackendTransactionType(data.type),
    amount: data.amount,
    status: fromBackendTransactionStatus(data.status),
    loanId: data.loanId ?? "",
    processedAt: data.createdAt,
    message: data.description ?? "Transaccion registrada.",
  };
}

function toPaymentSchedule(
  data: BackendPaymentScheduleItem[],
): PaymentScheduleItem[] {
  return data.map((item) => ({
    installment: item.paymentNumber,
    dueDate: item.dueDate.slice(0, 10),
    principal: item.principal,
    interest: item.interest,
    payment: item.totalPayment,
    balance: item.remainingBalance,
    status: fromBackendPaymentScheduleStatus(item.status),
  }));
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
): Promise<ApiResult<PayNextInstallmentResult>> {
  const result = await requestApi<BackendPayNextInstallmentResponse>(
    `/loans/${encodeURIComponent(loanId)}/payments`,
    {
      method: "POST",
      body: JSON.stringify({
        idempotencyKey: `PAY-${loanId}-${Date.now()}`,
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

export async function processTransaction(
  payload: TransactionRequest,
): Promise<ApiResult<TransactionResult>> {
  const result = await requestApi<BackendTransaction>("/processTransaction", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (result.data) {
    return { data: toTransaction(result.data) };
  }

  return { error: result.error };
}

export async function getTransactions(filters?: {
  type?: "disbursement" | "payment" | "";
  status?: "processed" | "failed" | "";
}): Promise<ApiResult<TransactionResult[]>> {
  const params = new URLSearchParams();

  if (filters?.type) params.set("type", filters.type);
  if (filters?.status) params.set("status", filters.status);

  const query = params.toString() ? `?${params.toString()}` : "";
  const result = await requestApi<BackendTransaction[]>(
    `/transactions${query}`,
    {
      method: "GET",
    },
  );

  if (result.data) {
    return { data: result.data.map(toTransaction) };
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
