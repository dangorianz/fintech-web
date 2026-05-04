"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { getTransactions, TransactionResult } from "@/src/lib/sgip-api";
import { Notice } from "@/src/types/notice";
import { EmptyState } from "@/src/components/shared/EmptyState";
import { SelectField } from "@/src/components/shared/fields";
import { NoticeBanner } from "@/src/components/shared/NoticeBanner";
import { PageShell } from "@/src/components/shared/PageShell";
import { PanelTitle } from "@/src/components/shared/PanelTitle";
import { TransactionsTable } from "./TransactionsTable";

export const TransactionPage = () => {
  const [type, setType] = useState<"" | "disbursement" | "payment">("");
  const [status, setStatus] = useState<"" | "processed" | "failed">("");
  const [transactions, setTransactions] = useState<TransactionResult[]>([]);
  const [notice, setNotice] = useState<Notice>();
  const [isLoading, setIsLoading] = useState(false);
  const filtered = useMemo(() => transactions, [transactions]);

  async function load(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setIsLoading(true);
    const result = await getTransactions({ type, status });
    setIsLoading(false);

    if (result.error) {
      setNotice({ tone: "error", message: result.error });
      return;
    }

    setTransactions(result.data ?? []);
    setNotice({ tone: "success", message: "Transacciones cargadas." });
  }

  useEffect(() => {
    let isMounted = true;

    async function loadInitialTransactions() {
      await Promise.resolve();
      if (!isMounted) return;

      setIsLoading(true);
      const result = await getTransactions({ type: "", status: "" });

      if (!isMounted) return;
      setIsLoading(false);

      if (result.error) {
        setNotice({ tone: "error", message: result.error });
        return;
      }

      setTransactions(result.data ?? []);
      setNotice({ tone: "success", message: "Transacciones cargadas." });
    }

    loadInitialTransactions();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <PageShell loadingMessage={isLoading ? "Cargando transacciones..." : ""}>
      <NoticeBanner notice={notice} />
      <section className="border border-[#d9dee5] bg-white p-5">
        <PanelTitle eyebrow="Transacciones" title="Lista de transacciones" />
        <form
          className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto]"
          onSubmit={load}
        >
          <SelectField
            label="Tipo"
            value={type}
            onChange={(value) => setType(value as typeof type)}
            options={[
              ["", "Todos"],
              ["payment", "Pago"],
              ["disbursement", "Desembolso"],
            ]}
          />
          <SelectField
            label="Estado"
            value={status}
            onChange={(value) => setStatus(value as typeof status)}
            options={[
              ["", "Todos"],
              ["processed", "Procesada"],
              ["failed", "Fallida"],
            ]}
          />
          <button
            className="h-11 self-end bg-[#2f6f5e] px-5 text-sm font-semibold text-white disabled:bg-[#93b8ac]"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? "Filtrando..." : "Filtrar"}
          </button>
        </form>
        {filtered.length ? (
          <TransactionsTable transactions={filtered} />
        ) : (
          <EmptyState text="No hay transacciones con esos filtros." />
        )}
      </section>
    </PageShell>
  );
};
