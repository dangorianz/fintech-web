"use client";

import { FormEvent, useRef, useState } from "react";
import {
  getLoanApplications,
  getLoanSchedule,
  payNextInstallment,
} from "@/src/services/loanService";
import {
  LoanApplication,
  PaymentScheduleItem,
} from "@/src/types/loan";
import { Notice } from "@/src/types/notice";
import { EmptyState } from "@/src/components/shared/EmptyState";
import { TextField } from "@/src/components/shared/fields";
import { Metric } from "@/src/components/shared/Metric";
import { NoticeBanner } from "@/src/components/shared/NoticeBanner";
import { PageShell } from "@/src/components/shared/PageShell";
import { PanelTitle } from "@/src/components/shared/PanelTitle";
import { ScheduleTable } from "@/src/components/shared/ScheduleTable";
import { currency } from "@/src/components/shared/formatters";

export function PaymentsPage() {
  const [userId, setUserId] = useState("user-1");
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [loanId, setLoanId] = useState("");
  const [schedule, setSchedule] = useState<PaymentScheduleItem[]>([]);
  const [paymentIdempotencyKey, setPaymentIdempotencyKey] = useState("");
  const [notice, setNotice] = useState<Notice>();
  const [isBusy, setIsBusy] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const isPayingRef = useRef(false);
  const payableLoans = loans.filter(
    (loan) => loan.status === "active" || loan.status === "approved",
  );
  const selectedLoan = payableLoans.find((loan) => loan.id === loanId);
  const nextPayment = schedule.find((payment) => payment.status === "pending");
  const pendingCount = schedule.filter(
    (payment) => payment.status === "pending",
  ).length;

  async function searchLoans(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);
    setLoadingMessage("Buscando prestamos para pagos...");
    const result = await getLoanApplications(userId);
    setIsBusy(false);
    setLoadingMessage("");

    if (result.error) {
      setNotice({ tone: "error", message: result.error });
      return;
    }

    setLoans(result.data ?? []);
    setLoanId("");
    setSchedule([]);
    setPaymentIdempotencyKey("");
    setNotice({
      tone: "success",
      message: `Prestamos cargados para ${userId}.`,
    });
  }

  async function selectLoan(nextLoanId: string) {
    setLoanId(nextLoanId);
    setSchedule([]);
    setPaymentIdempotencyKey("");

    if (!nextLoanId) return;

    setIsBusy(true);
    setLoadingMessage("Cargando cuotas del prestamo...");
    const result = await getLoanSchedule(nextLoanId);
    setIsBusy(false);
    setLoadingMessage("");

    if (result.error) {
      setNotice({ tone: "error", message: result.error });
      return;
    }

    const nextSchedule = result.data ?? [];
    const nextPendingPayment = findNextPendingPayment(nextSchedule);

    setSchedule(nextSchedule);
    setPaymentIdempotencyKey(
      nextPendingPayment
        ? createPaymentIdempotencyKey(nextLoanId, nextPendingPayment.installment)
        : "",
    );
  }

  async function pay() {
    if (!loanId || !nextPayment || !paymentIdempotencyKey || isPayingRef.current)
      return;

    isPayingRef.current = true;
    setIsBusy(true);
    setLoadingMessage("Registrando pago de cuota...");
    const result = await payNextInstallment(loanId, paymentIdempotencyKey);

    if (result.error) {
      isPayingRef.current = false;
      setIsBusy(false);
      setLoadingMessage("");
      setNotice({ tone: "error", message: result.error });
      return;
    }

    const scheduleResult = await getLoanSchedule(loanId);
    const nextSchedule = scheduleResult.data ?? schedule;
    const nextPendingPayment = findNextPendingPayment(nextSchedule);

    isPayingRef.current = false;
    setIsBusy(false);
    setLoadingMessage("");
    setSchedule(nextSchedule);
    setPaymentIdempotencyKey(
      nextPendingPayment
        ? createPaymentIdempotencyKey(loanId, nextPendingPayment.installment)
        : "",
    );
    setNotice({
      tone: "success",
      message: `Cuota #${result.data?.payment.installment} pagada. Quedan ${result.data?.remainingPendingPayments ?? 0} cuotas pendientes.`,
    });
  }

  return (
    <PageShell loadingMessage={loadingMessage}>
      <NoticeBanner notice={notice} />
      <section className="border border-[#d9dee5] bg-white p-5">
        <PanelTitle eyebrow="Pagos" title="Pago de cuotas" />
        <form
          className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]"
          onSubmit={searchLoans}
        >
          <TextField label="User ID" value={userId} onChange={setUserId} />
          <button
            className="h-11 self-end bg-[#2f6f5e] px-5 text-sm font-semibold text-white disabled:bg-[#93b8ac]"
            disabled={isBusy}
            type="submit"
          >
            {isBusy ? "Buscando..." : "Buscar prestamos"}
          </button>
        </form>

        <label className="mt-5 block text-sm font-medium text-[#394653]">
          Prestamo
          <select
            className="mt-2 h-11 w-full border border-[#c9d1da] bg-white px-3 outline-none"
            disabled={isBusy || payableLoans.length === 0}
            value={loanId}
            onChange={(event) => selectLoan(event.target.value)}
          >
            <option value="">Selecciona un prestamo</option>
            {payableLoans.map((loan) => (
              <option key={loan.id} value={loan.id}>
                {loan.id} - {currency.format(loan.amount)} - {loan.termMonths}{" "}
                meses
              </option>
            ))}
          </select>
        </label>

        {selectedLoan ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <Metric
              label="Monto"
              value={currency.format(selectedLoan.amount)}
            />
            <Metric label="Cuotas pendientes" value={`${pendingCount}`} />
            <Metric
              label="Proxima cuota"
              value={
                nextPayment ? `#${nextPayment.installment}` : "Sin pendientes"
              }
            />
            <Metric
              label="Monto a pagar"
              value={
                nextPayment
                  ? currency.format(nextPayment.payment)
                  : currency.format(0)
              }
            />
          </div>
        ) : null}

        {nextPayment ? (
          <div className="mt-5 border border-[#d9dee5] bg-[#fbfcfd] p-4">
            <h2 className="text-lg font-semibold">Cuota actual</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-5">
              <Metric label="Numero" value={`#${nextPayment.installment}`} />
              <Metric label="Vencimiento" value={nextPayment.dueDate} />
              <Metric
                label="Capital"
                value={currency.format(nextPayment.principal)}
              />
              <Metric
                label="Interes"
                value={currency.format(nextPayment.interest)}
              />
              <Metric
                label="Total"
                value={currency.format(nextPayment.payment)}
              />
            </div>
            <button
              className="mt-5 h-11 bg-[#2f6f5e] px-5 text-sm font-semibold text-white disabled:bg-[#93b8ac]"
              disabled={isBusy || !paymentIdempotencyKey}
              type="button"
              onClick={pay}
            >
              {isBusy ? "Pagando..." : "Pagar cuota actual"}
            </button>
          </div>
        ) : (
          <EmptyState text="Busca un prestamo para ver la cuota que toca pagar." />
        )}

        {schedule.length ? (
          <ScheduleTable schedule={schedule} title="Estado de cuotas" />
        ) : null}
      </section>
    </PageShell>
  );
}

function findNextPendingPayment(schedule: PaymentScheduleItem[]) {
  return schedule.find((payment) => payment.status === "pending");
}

function createPaymentIdempotencyKey(loanId: string, installment: number) {
  const randomId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `PAY-${loanId}-${installment}-${randomId}`;
}
