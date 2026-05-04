import { TransactionResult } from "./transaction";

export type InstallmentType = "fixed" | "declining";

export type LoanStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "active";

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
  status: LoanStatus;
  requestedAt: string;
};

export type PayNextInstallmentResult = {
  transaction: TransactionResult;
  payment: PaymentScheduleItem;
  remainingPendingPayments: number;
};
