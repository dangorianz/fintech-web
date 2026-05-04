import { ApiResult, requestApi } from "@/src/lib/api";
import {
  TransactionRequest,
  TransactionResult,
  TransactionStatus,
} from "@/src/types/transaction";

export type BackendTransactionType = "Disbursement" | "Payment" | string;
export type BackendTransactionStatus =
  | "Processed"
  | "Completed"
  | "Duplicate"
  | "Failed"
  | number
  | string;

export type BackendTransaction = {
  id: string;
  idempotencyKey: string;
  type: BackendTransactionType;
  amount: number;
  status: BackendTransactionStatus;
  loanId: string | null;
  description: string | null;
  createdAt: string;
};

export function toTransaction(data: BackendTransaction): TransactionResult {
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
