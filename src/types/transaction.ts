export type TransactionStatus = "processed" | "duplicate" | "failed";

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
