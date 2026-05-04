"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  createLoanApplication,
  getApiBaseUrl,
  getLoanApplications,
  getLoanSchedule,
  LoanApplication,
  LoanSimulation,
  LoanSimulationRequest,
  PaymentScheduleItem,
  processTransaction,
  simulateLoan,
  TransactionRequest,
  TransactionResult,
  updateApplicationStatus,
} from "@/src/lib/sgip-api";

const currency = new Intl.NumberFormat("es-BO", {
  style: "currency",
  currency: "BOB",
  maximumFractionDigits: 2,
});

const percent = new Intl.NumberFormat("es-BO", {
  maximumFractionDigits: 2,
});

const initialSimulation: LoanSimulationRequest = {
  amount: 50000,
  termMonths: 24,
  annualRate: 12,
  installmentType: "fixed",
};

type Notice = {
  tone: "success" | "warning" | "error";
  message: string;
};

export function SgipDashboard() {
  const [activeTab, setActiveTab] = useState("simulator");
  const [simulationForm, setSimulationForm] =
    useState<LoanSimulationRequest>(initialSimulation);
  const [simulation, setSimulation] = useState<LoanSimulation>();
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [approvalUserId, setApprovalUserId] = useState("user-1");
  const [detailUserId, setDetailUserId] = useState("user-1");
  const [detailLoans, setDetailLoans] = useState<LoanApplication[]>([]);
  const [detailLoanId, setDetailLoanId] = useState("");
  const [detailSchedule, setDetailSchedule] = useState<PaymentScheduleItem[]>(
    [],
  );
  const [transactions, setTransactions] = useState<TransactionResult[]>([]);
  const [notice, setNotice] = useState<Notice>();
  const [isBusy, setIsBusy] = useState(false);
  const [customer, setCustomer] = useState({
    customerName: "Maria Alvarez",
    customerDocument: "user-1",
    purpose: "Capital operativo",
    monthlyIncome: 5000,
  });
  const [transactionForm, setTransactionForm] = useState<TransactionRequest>({
    loanId: "",
    amount: 1500,
    type: "payment",
    idempotencyKey: "idem-demo-001",
  });

  const pendingApplications = useMemo(
    () =>
      applications.filter(
        (item) => item.status === "pending" || item.status === "draft",
      ),
    [applications],
  );

  async function handleSimulation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);
    const result = await simulateLoan(simulationForm);
    setIsBusy(false);
    if (result.error) {
      setNotice({ tone: "error", message: result.error ?? "Error en backend" });
      return;
    }

    if (result.data) {
      setSimulation(result.data);
      setNotice({
        tone: "success",
        message: "Simulacion calculada desde el backend.",
      });
    }
  }

  async function handleApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!simulation) {
      setNotice({
        tone: "error",
        message: "Primero calcula una simulacion antes de enviar la solicitud.",
      });
      return;
    }

    setIsBusy(true);
    const result = await createLoanApplication({
      ...simulation,
      ...customer,
    });
    setIsBusy(false);
    if (result.error) {
      setNotice({
        tone: "error",
        message: result.error ?? "No se pudo crear la solicitud",
      });
      return;
    }

    if (result.data) {
      setTransactionForm((current) => ({
        ...current,
        loanId: result.data!.id,
      }));
      setApprovalUserId(customer.customerDocument);
      setApplications([]);
      setNotice({
        tone: "success",
        message:
          "Solicitud enviada. Busca el userId para cargar sus prestamos.",
      });
      setActiveTab("approval");
    }
  }

  async function handleApprovalSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!approvalUserId.trim()) {
      setNotice({
        tone: "error",
        message: "Ingresa un userId para buscar prestamos.",
      });
      return;
    }

    setIsBusy(true);
    const result = await getLoanApplications(approvalUserId);
    setIsBusy(false);

    if (result.error) {
      setNotice({
        tone: "error",
        message: result.error ?? "No se pudo obtener la lista de prestamos",
      });
      return;
    }

    setApplications(result.data ?? []);
    setNotice({
      tone: "success",
      message: `Prestamos cargados para ${approvalUserId}.`,
    });
  }

  async function handleDetailSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!detailUserId.trim()) {
      setNotice({
        tone: "error",
        message: "Ingresa un userId para buscar prestamos.",
      });
      return;
    }

    setIsBusy(true);
    const result = await getLoanApplications(detailUserId);
    setIsBusy(false);

    if (result.error) {
      setNotice({
        tone: "error",
        message: result.error ?? "No se pudo obtener la lista de prestamos",
      });
      return;
    }

    const loans = result.data ?? [];
    setDetailLoans(loans);
    setDetailLoanId("");
    setDetailSchedule([]);
    setNotice({
      tone: loans.length ? "success" : "warning",
      message: loans.length
        ? `Prestamos cargados para ${detailUserId}.`
        : `No se encontraron prestamos para ${detailUserId}.`,
    });
  }

  async function handleDetailLoanChange(loanId: string) {
    setDetailLoanId(loanId);
    setDetailSchedule([]);

    if (!loanId) return;

    setIsBusy(true);
    const result = await getLoanSchedule(loanId);
    setIsBusy(false);

    if (result.error) {
      setNotice({
        tone: "error",
        message: result.error ?? "No se pudo obtener el detalle del prestamo",
      });
      return;
    }

    setDetailSchedule(result.data ?? []);
    setNotice({
      tone: "success",
      message: "Detalle del prestamo cargado.",
    });
  }

  async function handleTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);
    const result = await processTransaction(transactionForm);
    setIsBusy(false);
    if (result.error) {
      setNotice({
        tone: "error",
        message: result.error ?? "No se pudo procesar la transaccion",
      });
      return;
    }

    if (result.data) {
      setTransactions((current) => [result.data!, ...current]);
      setNotice({
        tone: "success",
        message: "Transaccion procesada por el backend.",
      });
    }
  }

  async function changeStatus(
    application: LoanApplication,
    status: "approved" | "rejected",
  ) {
    setIsBusy(true);
    const result = await updateApplicationStatus(application.id, status);
    setIsBusy(false);
    if (result.error) {
      setNotice({
        tone: "error",
        message: result.error ?? "No se pudo actualizar el estado",
      });
      return;
    }

    if (result.data) {
      setApplications((current) =>
        current.map((item) =>
          item.id === application.id ? { ...item, status } : item,
        ),
      );
      setNotice({
        tone: "success",
        message: `Solicitud ${status === "approved" ? "aprobada" : "rechazada"}.`,
      });
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-[#172026]">
      <header className="border-b border-[#d9dee5] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-[#2f6f5e]">
              SGIP
            </p>
            <h1 className="mt-1 text-3xl font-semibold">
              Gestion de inversiones y prestamos
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#62707f]">
              Frontend para simulacion, solicitud, transacciones idempotentes y
              aprobacion de prestamos.
            </p>
          </div>
          <div className="rounded-md border border-[#d9dee5] bg-[#fbfcfd] px-4 py-3 text-sm">
            <p className="font-medium text-[#394653]">Backend .NET</p>
            <p className="mt-1 break-all text-[#62707f]">{getApiBaseUrl()}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[240px_1fr]">
        <aside className="h-fit border border-[#d9dee5] bg-white p-2">
          {[
            ["simulator", "Simulador"],
            ["application", "Solicitud"],
            ["transactions", "Transacciones"],
            ["approval", "Aprobacion"],
            ["detail", "Detalle"],
          ].map(([id, label]) => (
            <button
              className={`mb-1 flex h-11 w-full items-center justify-between px-3 text-left text-sm font-medium ${
                activeTab === id
                  ? "bg-[#e8f2ee] text-[#1f5f50]"
                  : "text-[#4d5b68] hover:bg-[#f2f4f7]"
              }`}
              key={id}
              onClick={() => setActiveTab(id)}
              type="button"
            >
              <span>{label}</span>
              {id === "approval" && pendingApplications.length > 0 ? (
                <span className="rounded bg-[#2f6f5e] px-2 py-0.5 text-xs text-white">
                  {pendingApplications.length}
                </span>
              ) : null}
            </button>
          ))}
        </aside>

        <section className="space-y-6">
          {notice ? <NoticeBanner notice={notice} /> : null}

          {activeTab === "simulator" ? (
            <SimulatorPanel
              form={simulationForm}
              isBusy={isBusy}
              onChange={setSimulationForm}
              onSubmit={handleSimulation}
              simulation={simulation}
            />
          ) : null}

          {activeTab === "application" ? (
            <ApplicationPanel
              customer={customer}
              isBusy={isBusy}
              onChange={setCustomer}
              onSubmit={handleApplication}
              simulation={simulation}
            />
          ) : null}

          {activeTab === "transactions" ? (
            <TransactionsPanel
              applications={applications}
              form={transactionForm}
              isBusy={isBusy}
              onChange={setTransactionForm}
              onSubmit={handleTransaction}
              transactions={transactions}
            />
          ) : null}

          {activeTab === "approval" ? (
            <ApprovalPanel
              applications={applications}
              approvalUserId={approvalUserId}
              isBusy={isBusy}
              onApprovalUserIdChange={setApprovalUserId}
              onChangeStatus={changeStatus}
              onSearch={handleApprovalSearch}
            />
          ) : null}

          {activeTab === "detail" ? (
            <LoanDetailPanel
              detailLoans={detailLoans}
              detailLoanId={detailLoanId}
              detailSchedule={detailSchedule}
              detailUserId={detailUserId}
              isBusy={isBusy}
              onLoanChange={handleDetailLoanChange}
              onSearch={handleDetailSearch}
              onUserIdChange={setDetailUserId}
            />
          ) : null}
        </section>
      </main>
    </div>
  );
}

function NoticeBanner({ notice }: { notice: Notice }) {
  const classes = {
    success: "border-[#acd9c6] bg-[#edf8f2] text-[#1f5f50]",
    warning: "border-[#ead28d] bg-[#fff8df] text-[#755b12]",
    error: "border-[#efb0aa] bg-[#fff0ef] text-[#9d2d24]",
  };

  return (
    <div className={`border px-4 py-3 text-sm ${classes[notice.tone]}`}>
      {notice.message}
    </div>
  );
}

function SimulatorPanel({
  form,
  isBusy,
  onChange,
  onSubmit,
  simulation,
}: {
  form: LoanSimulationRequest;
  isBusy: boolean;
  onChange: (value: LoanSimulationRequest) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  simulation?: LoanSimulation;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <form
        className="border border-[#d9dee5] bg-white p-5"
        onSubmit={onSubmit}
      >
        <PanelTitle eyebrow="Caso de uso 1" title="Simulacion de prestamo" />
        <div className="mt-5 space-y-4">
          <NumberField
            label="Monto solicitado"
            max={50000}
            min={500}
            onChange={(amount) => onChange({ ...form, amount })}
            value={form.amount}
          />
          <NumberField
            label="Plazo en meses"
            max={60}
            min={6}
            onChange={(termMonths) => onChange({ ...form, termMonths })}
            value={form.termMonths}
          />
          <NumberField
            label="Tasa efectiva anual"
            min={0}
            onChange={(annualRate) => onChange({ ...form, annualRate })}
            suffix="%"
            value={form.annualRate}
          />
          <label className="block text-sm font-medium text-[#394653]">
            Tipo de cuota
            <select
              className="mt-2 h-11 w-full border border-[#c9d1da] bg-white px-3 text-[#172026] outline-none focus:border-[#2f6f5e]"
              onChange={(event) =>
                onChange({
                  ...form,
                  installmentType: event.target.value as "fixed" | "declining",
                })
              }
              value={form.installmentType}
            >
              <option value="fixed">Cuota Fija</option>
              <option value="declining">Cuota Decreciente</option>
            </select>
          </label>
        </div>
        <button
          className="mt-6 h-11 w-full bg-[#2f6f5e] px-4 text-sm font-semibold text-white hover:bg-[#275d50] disabled:cursor-not-allowed disabled:bg-[#93b8ac]"
          disabled={isBusy}
          type="submit"
        >
          {isBusy ? "Calculando..." : "Calcular prestamo"}
        </button>
      </form>

      <div className="border border-[#d9dee5] bg-white p-5">
        <PanelTitle eyebrow="Resultado" title="Resumen financiero" />
        {simulation ? (
          <>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric
                label="Cuota inicial"
                value={currency.format(simulation.monthlyPayment)}
              />
              <Metric
                label="TEA"
                value={`${percent.format(simulation.effectiveAnnualRate)}%`}
              />
              <Metric
                label="Interes total"
                value={currency.format(simulation.totalInterest)}
              />
              <Metric
                label="Total a pagar"
                value={currency.format(simulation.totalPayment)}
              />
            </div>
            <ScheduleTable simulation={simulation} />
          </>
        ) : (
          <EmptyState text="Ingresa monto, plazo y tipo de cuota para ver el cronograma." />
        )}
      </div>
    </div>
  );
}

function ApplicationPanel({
  customer,
  isBusy,
  onChange,
  onSubmit,
  simulation,
}: {
  customer: {
    customerName: string;
    customerDocument: string;
    purpose: string;
    monthlyIncome: number;
  };
  isBusy: boolean;
  onChange: (value: {
    customerName: string;
    customerDocument: string;
    purpose: string;
    monthlyIncome: number;
  }) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  simulation?: LoanSimulation;
}) {
  return (
    <form className="border border-[#d9dee5] bg-white p-5" onSubmit={onSubmit}>
      <PanelTitle eyebrow="Solicitud" title="Datos del cliente" />
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <TextField
          label="Nombre completo"
          onChange={(customerName) => onChange({ ...customer, customerName })}
          value={customer.customerName}
        />
        <TextField
          label="Documento"
          onChange={(customerDocument) =>
            onChange({ ...customer, customerDocument })
          }
          value={customer.customerDocument}
        />
        <TextField
          label="Destino del credito"
          onChange={(purpose) => onChange({ ...customer, purpose })}
          value={customer.purpose}
        />
        <NumberField
          label="Ingreso mensual"
          min={0}
          onChange={(monthlyIncome) => onChange({ ...customer, monthlyIncome })}
          value={customer.monthlyIncome}
        />
      </div>
      <div className="mt-5 border border-[#d9dee5] bg-[#fbfcfd] p-4 text-sm text-[#4d5b68]">
        {simulation ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Monto" value={currency.format(simulation.amount)} />
            <Metric label="Plazo" value={`${simulation.termMonths} meses`} />
            <Metric
              label="Cuota inicial"
              value={currency.format(simulation.monthlyPayment)}
            />
          </div>
        ) : (
          "Aun no hay una simulacion calculada para adjuntar."
        )}
      </div>
      <button
        className="mt-6 h-11 bg-[#2f6f5e] px-5 text-sm font-semibold text-white hover:bg-[#275d50] disabled:cursor-not-allowed disabled:bg-[#93b8ac]"
        disabled={isBusy}
        type="submit"
      >
        {isBusy ? "Enviando..." : "Enviar solicitud"}
      </button>
    </form>
  );
}

function TransactionsPanel({
  applications,
  form,
  isBusy,
  onChange,
  onSubmit,
  transactions,
}: {
  applications: LoanApplication[];
  form: {
    loanId: string;
    amount: number;
    type: "disbursement" | "payment";
    idempotencyKey: string;
  };
  isBusy: boolean;
  onChange: (value: {
    loanId: string;
    amount: number;
    type: "disbursement" | "payment";
    idempotencyKey: string;
  }) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  transactions: TransactionResult[];
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <form
        className="border border-[#d9dee5] bg-white p-5"
        onSubmit={onSubmit}
      >
        <PanelTitle eyebrow="Caso de uso 2" title="Transaccion idempotente" />
        <div className="mt-5 space-y-4">
          <label className="block text-sm font-medium text-[#394653]">
            Solicitud o prestamo
            <select
              className="mt-2 h-11 w-full border border-[#c9d1da] bg-white px-3 outline-none focus:border-[#2f6f5e]"
              onChange={(event) =>
                onChange({ ...form, loanId: event.target.value })
              }
              value={form.loanId}
            >
              <option value="">Selecciona una solicitud</option>
              {applications.map((application) => (
                <option key={application.id} value={application.id}>
                  {application.id} - {application.customerName}
                </option>
              ))}
            </select>
          </label>
          <NumberField
            label="Monto"
            min={1}
            onChange={(amount) => onChange({ ...form, amount })}
            value={form.amount}
          />
          <label className="block text-sm font-medium text-[#394653]">
            Tipo
            <select
              className="mt-2 h-11 w-full border border-[#c9d1da] bg-white px-3 outline-none focus:border-[#2f6f5e]"
              onChange={(event) =>
                onChange({
                  ...form,
                  type: event.target.value as "disbursement" | "payment",
                })
              }
              value={form.type}
            >
              <option value="payment">Pago</option>
              <option value="disbursement">Desembolso</option>
            </select>
          </label>
          <TextField
            label="Idempotency key"
            onChange={(idempotencyKey) => onChange({ ...form, idempotencyKey })}
            value={form.idempotencyKey}
          />
        </div>
        <button
          className="mt-6 h-11 w-full bg-[#2f6f5e] px-4 text-sm font-semibold text-white hover:bg-[#275d50] disabled:cursor-not-allowed disabled:bg-[#93b8ac]"
          disabled={isBusy || !form.loanId}
          type="submit"
        >
          {isBusy ? "Procesando..." : "Procesar transaccion"}
        </button>
      </form>

      <div className="border border-[#d9dee5] bg-white p-5">
        <PanelTitle eyebrow="Historial" title="Movimientos" />
        {transactions.length ? (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-[#d9dee5] text-xs uppercase text-[#62707f]">
                <tr>
                  <th className="py-3">ID</th>
                  <th>Prestamo</th>
                  <th>Tipo</th>
                  <th>Monto</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr
                    className="border-b border-[#edf0f3]"
                    key={transaction.id}
                  >
                    <td className="py-3 font-medium">{transaction.id}</td>
                    <td>{transaction.loanId}</td>
                    <td>{transaction.type}</td>
                    <td>{currency.format(transaction.amount)}</td>
                    <td>{transaction.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState text="Las transacciones procesadas apareceran aqui." />
        )}
      </div>
    </div>
  );
}

function ApprovalPanel({
  applications,
  approvalUserId,
  isBusy,
  onApprovalUserIdChange,
  onChangeStatus,
  onSearch,
}: {
  applications: LoanApplication[];
  approvalUserId: string;
  isBusy: boolean;
  onApprovalUserIdChange: (value: string) => void;
  onChangeStatus: (
    application: LoanApplication,
    status: "approved" | "rejected",
  ) => void;
  onSearch: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="border border-[#d9dee5] bg-white p-5">
      <PanelTitle eyebrow="Caso de uso 3" title="Flujo de aprobacion" />
      <form
        className="mt-5 grid gap-3 border border-[#d9dee5] bg-[#fbfcfd] p-4 md:grid-cols-[1fr_auto]"
        onSubmit={onSearch}
      >
        <TextField
          label="User ID"
          onChange={onApprovalUserIdChange}
          value={approvalUserId}
        />
        <button
          className="h-11 self-end bg-[#2f6f5e] px-5 text-sm font-semibold text-white hover:bg-[#275d50] disabled:cursor-not-allowed disabled:bg-[#93b8ac]"
          disabled={isBusy || !approvalUserId.trim()}
          type="submit"
        >
          {isBusy ? "Buscando..." : "Buscar prestamos"}
        </button>
      </form>
      {applications.length ? (
        <div className="mt-5 grid gap-4">
          {applications.map((application) => (
            <article
              className="grid gap-4 border border-[#d9dee5] p-4 lg:grid-cols-[1fr_auto]"
              key={application.id}
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold">{application.id}</h3>
                  <StatusBadge status={application.status} />
                </div>
                <p className="mt-2 text-sm text-[#62707f]">
                  {application.customerName} · {application.customerDocument} ·{" "}
                  {application.purpose}
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <Metric
                    label="Monto"
                    value={currency.format(application.amount)}
                  />
                  <Metric
                    label="Plazo"
                    value={`${application.termMonths} meses`}
                  />
                  <Metric
                    label="Total"
                    value={currency.format(application.totalPayment)}
                  />
                </div>
              </div>
              <div className="flex gap-2 self-start">
                <button
                  className="h-10 border border-[#2f6f5e] px-4 text-sm font-semibold text-[#2f6f5e] hover:bg-[#e8f2ee] disabled:opacity-50"
                  disabled={
                    isBusy || !["draft", "pending"].includes(application.status)
                  }
                  onClick={() => onChangeStatus(application, "approved")}
                  type="button"
                >
                  Aprobar
                </button>
                <button
                  className="h-10 border border-[#b84a42] px-4 text-sm font-semibold text-[#b84a42] hover:bg-[#fff0ef] disabled:opacity-50"
                  disabled={
                    isBusy || !["draft", "pending"].includes(application.status)
                  }
                  onClick={() => onChangeStatus(application, "rejected")}
                  type="button"
                >
                  Rechazar
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState text="Ingresa un userId y busca para cargar sus prestamos." />
      )}
    </div>
  );
}

function LoanDetailPanel({
  detailLoans,
  detailLoanId,
  detailSchedule,
  detailUserId,
  isBusy,
  onLoanChange,
  onSearch,
  onUserIdChange,
}: {
  detailLoans: LoanApplication[];
  detailLoanId: string;
  detailSchedule: PaymentScheduleItem[];
  detailUserId: string;
  isBusy: boolean;
  onLoanChange: (loanId: string) => void;
  onSearch: (event: FormEvent<HTMLFormElement>) => void;
  onUserIdChange: (value: string) => void;
}) {
  const selectedLoan = detailLoans.find((loan) => loan.id === detailLoanId);

  return (
    <div className="border border-[#d9dee5] bg-white p-5">
      <PanelTitle eyebrow="Detalle" title="Detalle de prestamo" />
      <form
        className="mt-5 grid gap-3 border border-[#d9dee5] bg-[#fbfcfd] p-4 md:grid-cols-[1fr_auto]"
        onSubmit={onSearch}
      >
        <TextField
          label="User ID"
          onChange={onUserIdChange}
          value={detailUserId}
        />
        <button
          className="h-11 self-end bg-[#2f6f5e] px-5 text-sm font-semibold text-white hover:bg-[#275d50] disabled:cursor-not-allowed disabled:bg-[#93b8ac]"
          disabled={isBusy || !detailUserId.trim()}
          type="submit"
        >
          {isBusy ? "Buscando..." : "Buscar prestamos"}
        </button>
      </form>

      <label className="mt-5 block text-sm font-medium text-[#394653]">
        Prestamo
        <select
          className="mt-2 h-11 w-full border border-[#c9d1da] bg-white px-3 text-[#172026] outline-none focus:border-[#2f6f5e]"
          disabled={isBusy || detailLoans.length === 0}
          onChange={(event) => onLoanChange(event.target.value)}
          value={detailLoanId}
        >
          <option value="">Selecciona un prestamo</option>
          {detailLoans.map((loan) => (
            <option key={loan.id} value={loan.id}>
              {loan.id} - {currency.format(loan.amount)} -{" "}
              {loan.termMonths} meses
            </option>
          ))}
        </select>
      </label>

      {selectedLoan ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <Metric label="Monto" value={currency.format(selectedLoan.amount)} />
          <Metric label="Plazo" value={`${selectedLoan.termMonths} meses`} />
          <Metric
            label="Cuota inicial"
            value={currency.format(selectedLoan.monthlyPayment)}
          />
          <div className="border border-[#d9dee5] bg-[#fbfcfd] p-3">
            <p className="text-xs uppercase text-[#62707f]">Estado</p>
            <div className="mt-2">
              <StatusBadge status={selectedLoan.status} />
            </div>
          </div>
        </div>
      ) : null}

      {detailSchedule.length ? (
        <PaymentScheduleDetailTable schedule={detailSchedule} />
      ) : (
        <EmptyState text="Busca un userId y selecciona un prestamo para ver su cronograma." />
      )}
    </div>
  );
}

function PaymentScheduleDetailTable({
  schedule,
}: {
  schedule: PaymentScheduleItem[];
}) {
  return (
    <div className="mt-6 overflow-x-auto">
      <h3 className="mb-3 text-base font-semibold text-[#172026]">
        Lista de pagos
      </h3>
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-[#d9dee5] text-xs uppercase text-[#62707f]">
          <tr>
            <th className="py-3">#</th>
            <th>Vencimiento</th>
            <th>Capital</th>
            <th>Interes</th>
            <th>Cuota</th>
            <th>Saldo</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {schedule.map((item) => (
            <tr className="border-b border-[#edf0f3]" key={item.installment}>
              <td className="py-3 font-medium">{item.installment}</td>
              <td>{item.dueDate}</td>
              <td>{currency.format(item.principal)}</td>
              <td>{currency.format(item.interest)}</td>
              <td>{currency.format(item.payment)}</td>
              <td>{currency.format(item.balance)}</td>
              <td>
                <PaymentScheduleStatusBadge status={item.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ScheduleTable({ simulation }: { simulation: LoanSimulation }) {
  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-[#d9dee5] text-xs uppercase text-[#62707f]">
          <tr>
            <th className="py-3">#</th>
            <th>Vencimiento</th>
            <th>Capital</th>
            <th>Interes</th>
            <th>Cuota</th>
            <th>Saldo</th>
          </tr>
        </thead>
        <tbody>
          {simulation.schedule.slice(0, 12).map((item) => (
            <tr className="border-b border-[#edf0f3]" key={item.installment}>
              <td className="py-3 font-medium">{item.installment}</td>
              <td>{item.dueDate}</td>
              <td>{currency.format(item.principal)}</td>
              <td>{currency.format(item.interest)}</td>
              <td>{currency.format(item.payment)}</td>
              <td>{currency.format(item.balance)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {simulation.schedule.length > 12 ? (
        <p className="mt-3 text-xs text-[#62707f]">
          Mostrando las primeras 12 cuotas de {simulation.schedule.length}.
        </p>
      ) : null}
    </div>
  );
}

function PanelTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#2f6f5e]">
        {eyebrow}
      </p>
      <h2 className="mt-1 text-xl font-semibold">{title}</h2>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#d9dee5] bg-[#fbfcfd] p-3">
      <p className="text-xs uppercase text-[#62707f]">{label}</p>
      <p className="mt-1 text-base font-semibold text-[#172026]">{value}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="mt-5 border border-dashed border-[#c9d1da] bg-[#fbfcfd] px-4 py-10 text-center text-sm text-[#62707f]">
      {text}
    </div>
  );
}

function NumberField({
  label,
  max,
  min,
  onChange,
  suffix,
  value,
}: {
  label: string;
  max?: number;
  min: number;
  onChange: (value: number) => void;
  suffix?: string;
  value: number;
}) {
  return (
    <label className="block text-sm font-medium text-[#394653]">
      {label}
      <div className="mt-2 flex h-11 border border-[#c9d1da] bg-white focus-within:border-[#2f6f5e]">
        <input
          className="min-w-0 flex-1 px-3 text-[#172026] outline-none"
          max={max}
          min={min}
          onChange={(event) => onChange(Number(event.target.value))}
          required
          type="number"
          value={value}
        />
        {suffix ? (
          <span className="flex items-center border-l border-[#c9d1da] px-3 text-[#62707f]">
            {suffix}
          </span>
        ) : null}
      </div>
    </label>
  );
}

function TextField({
  label,
  onChange,
  value,
  readOnly = false,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
  readOnly?: boolean;
}) {
  return (
    <label className="block text-sm font-medium text-[#394653]">
      {label}
      <input
        readOnly={readOnly}
        className="mt-2 h-11 w-full border border-[#c9d1da] px-3 text-[#172026] outline-none focus:border-[#2f6f5e]"
        onChange={(event) => onChange(event.target.value)}
        required
        type="text"
        value={value}
      />
    </label>
  );
}

function StatusBadge({ status }: { status: LoanApplication["status"] }) {
  const label = {
    active: "Activo",
    approved: "Aprobada",
    draft: "Borrador",
    pending: "Pendiente",
    rejected: "Rechazada",
  };
  const classes = {
    active: "bg-[#e7f0ff] text-[#2254a3]",
    approved: "bg-[#e8f2ee] text-[#1f5f50]",
    draft: "bg-[#eef1f5] text-[#4d5b68]",
    pending: "bg-[#fff8df] text-[#755b12]",
    rejected: "bg-[#fff0ef] text-[#9d2d24]",
  };

  return (
    <span className={`px-2 py-1 text-xs font-semibold ${classes[status]}`}>
      {label[status]}
    </span>
  );
}

function PaymentScheduleStatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const label =
    normalized === "paid"
      ? "Pagada"
      : normalized === "pending"
        ? "Pendiente"
        : status;
  const classes =
    normalized === "paid"
      ? "bg-[#e8f2ee] text-[#1f5f50]"
      : "bg-[#fff8df] text-[#755b12]";

  return (
    <span className={`px-2 py-1 text-xs font-semibold ${classes}`}>
      {label}
    </span>
  );
}
