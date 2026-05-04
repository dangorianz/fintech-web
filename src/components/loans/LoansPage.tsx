"use client";

import { FormEvent, useState } from "react";
import { getLoanApplications, LoanApplication } from "@/src/lib/sgip-api";
import { Notice } from "@/src/types/notice";
import { EmptyState } from "@/src/components/shared/EmptyState";
import { TextField } from "@/src/components/shared/fields";
import { NoticeBanner } from "@/src/components/shared/NoticeBanner";
import { PageShell } from "@/src/components/shared/PageShell";
import { PanelTitle } from "@/src/components/shared/PanelTitle";
import { LoansTable } from "./LoansTable";

export function LoansPage() {
  const [userId, setUserId] = useState("user-1");
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [notice, setNotice] = useState<Notice>();
  const [isBusy, setIsBusy] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);
    setLoadingMessage("Buscando prestamos del cliente...");
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

  return (
    <PageShell loadingMessage={loadingMessage}>
      <NoticeBanner notice={notice} />
      <section className="border border-[#d9dee5] bg-white p-5">
        <PanelTitle eyebrow="Mis Prestamos" title="Prestamos del cliente" />
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
          <LoansTable loans={loans} />
        ) : (
          <EmptyState text="Busca un userId para listar sus prestamos." />
        )}
      </section>
    </PageShell>
  );
}
