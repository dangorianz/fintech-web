"use client";

import { FormEvent, useState } from "react";
import {
  getLoanApplications,
  updateApplicationStatus,
} from "@/src/services/loanService";
import { LoanApplication } from "@/src/types/loan";
import { Notice } from "@/src/types/notice";
import { EmptyState } from "@/src/components/shared/EmptyState";
import { TextField } from "@/src/components/shared/fields";
import { Metric } from "@/src/components/shared/Metric";
import { NoticeBanner } from "@/src/components/shared/NoticeBanner";
import { PageShell } from "@/src/components/shared/PageShell";
import { PanelTitle } from "@/src/components/shared/PanelTitle";
import { StatusBadge } from "@/src/components/shared/badges";
import { currency } from "@/src/components/shared/formatters";

export function ApprovalsPage() {
  const [userId, setUserId] = useState("user-1");
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [notice, setNotice] = useState<Notice>();
  const [isBusy, setIsBusy] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  async function search(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (!userId.trim()) {
      setNotice({ tone: "error", message: "Ingresa un userId." });
      return;
    }

    setIsBusy(true);
    setLoadingMessage("Buscando prestamos para aprobacion...");
    const result = await getLoanApplications(userId);
    setIsBusy(false);
    setLoadingMessage("");

    if (result.error) {
      setNotice({ tone: "error", message: result.error });
      return;
    }

    setLoans(result.data ?? []);
    setNotice({
      tone: "success",
      message: `Prestamos cargados para ${userId}.`,
    });
  }

  async function changeStatus(
    loan: LoanApplication,
    status: "approved" | "rejected",
  ) {
    setIsBusy(true);
    setLoadingMessage(
      status === "approved"
        ? "Aprobando prestamo..."
        : "Rechazando prestamo...",
    );
    const result = await updateApplicationStatus(loan.id, status);
    setIsBusy(false);
    setLoadingMessage("");

    if (result.error) {
      setNotice({ tone: "error", message: result.error });
      return;
    }

    setLoans((current) =>
      current.map((item) =>
        item.id === loan.id
          ? { ...item, status: result.data?.status ?? status }
          : item,
      ),
    );
    setNotice({
      tone: "success",
      message: `Prestamo ${status === "approved" ? "aprobado" : "rechazado"}.`,
    });
  }

  return (
    <PageShell loadingMessage={loadingMessage}>
      <NoticeBanner notice={notice} />
      <section className="border border-[#d9dee5] bg-white p-5">
        <PanelTitle eyebrow="Aprobaciones" title="Aprobacion de prestamos" />
        <form
          className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]"
          onSubmit={search}
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

        {loans.length ? (
          <div className="mt-6 grid gap-4">
            {loans.map((loan) => {
              const canReview =
                loan.status === "pending" || loan.status === "draft";

              return (
                <article
                  className="grid gap-4 border border-[#d9dee5] p-4 lg:grid-cols-[1fr_auto]"
                  key={loan.id}
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold">{loan.id}</h2>
                      <StatusBadge status={loan.status} />
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-4">
                      <Metric label="Cliente" value={loan.customerDocument} />
                      <Metric
                        label="Monto"
                        value={currency.format(loan.amount)}
                      />
                      <Metric
                        label="Plazo"
                        value={`${loan.termMonths} meses`}
                      />
                      <Metric
                        label="Cuota"
                        value={currency.format(loan.monthlyPayment)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 self-start">
                    <button
                      className="h-10 border border-[#2f6f5e] px-4 text-sm font-semibold text-[#2f6f5e] hover:bg-[#e8f2ee] disabled:opacity-50"
                      disabled={isBusy || !canReview}
                      onClick={() => changeStatus(loan, "approved")}
                      type="button"
                    >
                      Aprobar
                    </button>
                    <button
                      className="h-10 border border-[#b84a42] px-4 text-sm font-semibold text-[#b84a42] hover:bg-[#fff0ef] disabled:opacity-50"
                      disabled={isBusy || !canReview}
                      onClick={() => changeStatus(loan, "rejected")}
                      type="button"
                    >
                      Rechazar
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState text="Ingresa un userId y busca para revisar sus prestamos." />
        )}
      </section>
    </PageShell>
  );
}
