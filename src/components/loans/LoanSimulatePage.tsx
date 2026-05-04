"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createLoanApplication,
  simulateLoan,
} from "@/src/services/loanService";
import {
  InstallmentType,
  LoanSimulation,
  LoanSimulationRequest,
} from "@/src/types/loan";
import { Notice } from "@/src/types/notice";
import { EmptyState } from "@/src/components/shared/EmptyState";
import { NumberField, TextField } from "@/src/components/shared/fields";
import { Metric } from "@/src/components/shared/Metric";
import { NoticeBanner } from "@/src/components/shared/NoticeBanner";
import { PageShell } from "@/src/components/shared/PageShell";
import { PanelTitle } from "@/src/components/shared/PanelTitle";
import { ScheduleTable } from "@/src/components/shared/ScheduleTable";
import { currency } from "@/src/components/shared/formatters";

export function LoanSimulatePage() {
  const router = useRouter();
  const [form, setForm] = useState<LoanSimulationRequest>({
    amount: 5000,
    termMonths: 12,
    annualRate: 24,
    installmentType: "fixed",
  });
  const [customer, setCustomer] = useState({
    customerName: "Daniel Gorianz",
    customerDocument: "user-1",
    monthlyIncome: 5000,
  });
  const [simulation, setSimulation] = useState<LoanSimulation>();
  const [notice, setNotice] = useState<Notice>();
  const [isBusy, setIsBusy] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  async function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);
    setLoadingMessage("Calculando simulacion con el backend...");
    const result = await simulateLoan(form);
    setIsBusy(false);
    setLoadingMessage("");

    if (result.error) {
      setNotice({ tone: "error", message: result.error });
      return;
    }

    setSimulation(result.data);
    setNotice({ tone: "success", message: "Simulacion calculada." });
  }

  async function requestLoan() {
    if (!simulation) return;

    setIsBusy(true);
    setLoadingMessage("Enviando solicitud de prestamo...");
    const result = await createLoanApplication({ ...simulation, ...customer });
    setIsBusy(false);
    setLoadingMessage("");

    if (result.error) {
      setNotice({ tone: "error", message: result.error });
      return;
    }

    router.push(`/loans/${result.data?.id}`);
  }

  return (
    <PageShell loadingMessage={loadingMessage}>
      <NoticeBanner notice={notice} />
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <form
          className="border border-[#d9dee5] bg-white p-5"
          onSubmit={calculate}
        >
          <PanelTitle eyebrow="Simulador" title="Simular prestamo" />
          <div className="mt-5 space-y-4">
            <NumberField
              label="Monto"
              min={500}
              max={50000}
              value={form.amount}
              onChange={(amount) => setForm({ ...form, amount })}
            />
            <NumberField
              label="Plazo en meses"
              min={6}
              max={60}
              value={form.termMonths}
              onChange={(termMonths) => setForm({ ...form, termMonths })}
            />
            <NumberField
              label="Tasa efectiva anual"
              min={0}
              value={form.annualRate}
              suffix="%"
              onChange={(annualRate) => setForm({ ...form, annualRate })}
            />
            <label className="block text-sm font-medium text-[#394653]">
              Tipo de prestamo
              <select
                className="mt-2 h-11 w-full border border-[#c9d1da] bg-white px-3"
                value={form.installmentType}
                onChange={(event) =>
                  setForm({
                    ...form,
                    installmentType: event.target.value as InstallmentType,
                  })
                }
              >
                <option value="fixed">Cuota Fija</option>
                <option value="declining">Cuota Decreciente</option>
              </select>
            </label>
          </div>
          <button
            className="mt-6 h-11 w-full bg-[#2f6f5e] text-sm font-semibold text-white"
            disabled={isBusy}
            type="submit"
          >
            {isBusy ? "Calculando..." : "Calcular"}
          </button>
        </form>

        <section className="border border-[#d9dee5] bg-white p-5">
          <PanelTitle eyebrow="Resultado" title="Cronograma" />
          {simulation ? (
            <>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <Metric
                  label="Cuota inicial"
                  value={currency.format(simulation.monthlyPayment)}
                />
                <Metric
                  label="Interes total"
                  value={currency.format(simulation.totalInterest)}
                />
                <Metric
                  label="Total"
                  value={currency.format(simulation.totalPayment)}
                />
              </div>
              <ScheduleTable schedule={simulation.schedule} />
              <div className="mt-6 border border-[#d9dee5] bg-[#fbfcfd] p-4">
                <PanelTitle eyebrow="Solicitud" title="Datos del cliente" />
                <div className="mt-4 grid gap-4 lg:grid-cols-4">
                  <TextField
                    label="Nombre"
                    value={customer.customerName}
                    onChange={(customerName) =>
                      setCustomer({ ...customer, customerName })
                    }
                  />
                  <TextField
                    label="User ID"
                    value={customer.customerDocument}
                    onChange={(customerDocument) =>
                      setCustomer({ ...customer, customerDocument })
                    }
                  />
                  <NumberField
                    label="Ingreso mensual"
                    min={0}
                    value={customer.monthlyIncome}
                    onChange={(monthlyIncome) =>
                      setCustomer({ ...customer, monthlyIncome })
                    }
                  />
                </div>
                <button
                  className="mt-5 h-11 bg-[#2f6f5e] px-5 text-sm font-semibold text-white disabled:bg-[#93b8ac]"
                  disabled={isBusy}
                  type="button"
                  onClick={requestLoan}
                >
                  {isBusy ? "Enviando..." : "Solicitar prestamo"}
                </button>
              </div>
            </>
          ) : (
            <EmptyState text="Ingresa monto, plazo y tipo de prestamo para calcular." />
          )}
        </section>
      </div>
    </PageShell>
  );
}
