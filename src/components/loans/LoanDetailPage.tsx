"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getLoanById,
  getLoanSchedule,
  LoanApplication,
  PaymentScheduleItem,
} from "@/src/lib/sgip-api";
import { Notice } from "@/src/types/notice";
import { EmptyState } from "@/src/components/shared/EmptyState";
import { Metric } from "@/src/components/shared/Metric";
import { NoticeBanner } from "@/src/components/shared/NoticeBanner";
import { PageShell } from "@/src/components/shared/PageShell";
import { PanelTitle } from "@/src/components/shared/PanelTitle";
import { ScheduleTable } from "@/src/components/shared/ScheduleTable";
import { StatusBadge } from "@/src/components/shared/badges";
import { currency } from "@/src/components/shared/formatters";

export function LoanDetailPage() {
  const params = useParams<{ id: string }>();
  const loanId = params.id;
  const [loan, setLoan] = useState<LoanApplication>();
  const [schedule, setSchedule] = useState<PaymentScheduleItem[]>([]);
  const [notice, setNotice] = useState<Notice>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const [loanResult, scheduleResult] = await Promise.all([
        getLoanById(loanId),
        getLoanSchedule(loanId),
      ]);

      if (loanResult.error || scheduleResult.error) {
        setNotice({
          tone: "error",
          message:
            loanResult.error ??
            scheduleResult.error ??
            "No se pudo cargar el prestamo.",
        });
        setIsLoading(false);
        return;
      }

      setLoan(loanResult.data);
      setSchedule(scheduleResult.data ?? []);
      setIsLoading(false);
    }

    load();
  }, [loanId]);

  return (
    <PageShell
      loadingMessage={isLoading ? "Cargando detalle del prestamo..." : ""}
    >
      <NoticeBanner notice={notice} />
      <section className="border border-[#d9dee5] bg-white p-5">
        <PanelTitle eyebrow="Detalle" title="Detalle de Prestamo" />
        {loan ? (
          <>
            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              <Metric label="ID" value={loan.id} />
              <Metric label="Monto" value={currency.format(loan.amount)} />
              <Metric label="Plazo" value={`${loan.termMonths} meses`} />
              <div className="border border-[#d9dee5] bg-[#fbfcfd] p-3">
                <p className="text-xs uppercase text-[#62707f]">
                  Estado actual
                </p>
                <div className="mt-2">
                  <StatusBadge status={loan.status} />
                </div>
              </div>
            </div>
            <ScheduleTable schedule={schedule} title="Cronograma completo" />
          </>
        ) : (
          <EmptyState text="Cargando detalle del prestamo." />
        )}
      </section>
    </PageShell>
  );
}
