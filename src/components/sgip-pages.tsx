"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createLoanApplication,
  getLoanApplications,
  getLoanById,
  getLoanSchedule,
  getTransactions,
  InstallmentType,
  LoanApplication,
  LoanSimulation,
  LoanSimulationRequest,
  PaymentScheduleItem,
  payNextInstallment,
  simulateLoan,
  TransactionResult,
  updateApplicationStatus,
} from "@/src/lib/sgip-api";

const currency = new Intl.NumberFormat("es-BO", {
  style: "currency",
  currency: "BOB",
  maximumFractionDigits: 2,
});

type Notice = {
  tone: "success" | "warning" | "error";
  message: string;
};

const navItems = [
  ["/", "Home"],
  ["/loans/simulate", "Simulador"],
  ["/loans", "Mis Prestamos"],
  ["/approvals", "Aprobaciones"],
  ["/payments", "Pagos"],
  ["/transactions", "Transacciones"],
];

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f6f7f9] text-[#172026]">
      <header className="border-b border-[#d9dee5] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <Link href="/" className="text-2xl font-semibold text-[#172026]">
            SGIP
          </Link>
          <nav className="flex flex-wrap gap-2">
            {navItems.map(([href, label]) => (
              <Link
                className="border border-[#c9d1da] px-3 py-2 text-sm font-medium text-[#394653] hover:border-[#2f6f5e] hover:text-[#1f5f50]"
                href={href}
                key={href}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-6">{children}</main>
    </div>
  );
}

export function HomePage() {
  return (
    <PageShell>
      <section className="border border-[#d9dee5] bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#2f6f5e]">
          Sistema de Gestion de Inversiones y Prestamos
        </p>
        <h1 className="mt-2 text-3xl font-semibold">SGIP</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#62707f]">
          Frontend para simular prestamos, solicitar credito, consultar mis
          prestamos, revisar cronogramas y listar transacciones.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="bg-[#2f6f5e] px-5 py-3 text-sm font-semibold text-white" href="/loans/simulate">
            Ir al simulador
          </Link>
          <Link className="border border-[#2f6f5e] px-5 py-3 text-sm font-semibold text-[#2f6f5e]" href="/loans">
            Ver prestamos
          </Link>
        </div>
      </section>
    </PageShell>
  );
}

export function LoanSimulatePage() {
  const router = useRouter();
  const [form, setForm] = useState<LoanSimulationRequest>({
    amount: 5000,
    termMonths: 12,
    annualRate: 24,
    installmentType: "fixed",
  });
  const [customer, setCustomer] = useState({
    customerName: "Maria Alvarez",
    customerDocument: "user-1",
    purpose: "Capital operativo",
    monthlyIncome: 5000,
  });
  const [simulation, setSimulation] = useState<LoanSimulation>();
  const [notice, setNotice] = useState<Notice>();
  const [isBusy, setIsBusy] = useState(false);

  async function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);
    const result = await simulateLoan(form);
    setIsBusy(false);

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
    const result = await createLoanApplication({ ...simulation, ...customer });
    setIsBusy(false);

    if (result.error) {
      setNotice({ tone: "error", message: result.error });
      return;
    }

    router.push(`/loans/${result.data?.id}`);
  }

  return (
    <PageShell>
      <NoticeBanner notice={notice} />
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <form className="border border-[#d9dee5] bg-white p-5" onSubmit={calculate}>
          <PanelTitle eyebrow="Simulador" title="Simular prestamo" />
          <div className="mt-5 space-y-4">
            <NumberField label="Monto" min={500} max={50000} value={form.amount} onChange={(amount) => setForm({ ...form, amount })} />
            <NumberField label="Plazo en meses" min={6} max={60} value={form.termMonths} onChange={(termMonths) => setForm({ ...form, termMonths })} />
            <NumberField label="Tasa efectiva anual" min={0} value={form.annualRate} suffix="%" onChange={(annualRate) => setForm({ ...form, annualRate })} />
            <label className="block text-sm font-medium text-[#394653]">
              Tipo de prestamo
              <select className="mt-2 h-11 w-full border border-[#c9d1da] bg-white px-3" value={form.installmentType} onChange={(event) => setForm({ ...form, installmentType: event.target.value as InstallmentType })}>
                <option value="fixed">Cuota Fija</option>
                <option value="declining">Cuota Decreciente</option>
              </select>
            </label>
          </div>
          <button className="mt-6 h-11 w-full bg-[#2f6f5e] text-sm font-semibold text-white" disabled={isBusy} type="submit">
            {isBusy ? "Calculando..." : "Calcular"}
          </button>
        </form>

        <section className="border border-[#d9dee5] bg-white p-5">
          <PanelTitle eyebrow="Resultado" title="Cronograma" />
          {simulation ? (
            <>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <Metric label="Cuota inicial" value={currency.format(simulation.monthlyPayment)} />
                <Metric label="Interes total" value={currency.format(simulation.totalInterest)} />
                <Metric label="Total" value={currency.format(simulation.totalPayment)} />
              </div>
              <ScheduleTable schedule={simulation.schedule} />
              <div className="mt-6 border border-[#d9dee5] bg-[#fbfcfd] p-4">
                <PanelTitle eyebrow="Solicitud" title="Datos del cliente" />
                <div className="mt-4 grid gap-4 lg:grid-cols-4">
                  <TextField label="Nombre" value={customer.customerName} onChange={(customerName) => setCustomer({ ...customer, customerName })} />
                  <TextField label="User ID" value={customer.customerDocument} onChange={(customerDocument) => setCustomer({ ...customer, customerDocument })} />
                  <TextField label="Destino" value={customer.purpose} onChange={(purpose) => setCustomer({ ...customer, purpose })} />
                  <NumberField label="Ingreso mensual" min={0} value={customer.monthlyIncome} onChange={(monthlyIncome) => setCustomer({ ...customer, monthlyIncome })} />
                </div>
                <button className="mt-5 h-11 bg-[#2f6f5e] px-5 text-sm font-semibold text-white" disabled={isBusy} type="button" onClick={requestLoan}>
                  Solicitar prestamo
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

export function LoansPage() {
  const [userId, setUserId] = useState("user-1");
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [notice, setNotice] = useState<Notice>();
  const [isBusy, setIsBusy] = useState(false);

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);
    const result = await getLoanApplications(userId);
    setIsBusy(false);

    if (result.error) {
      setNotice({ tone: "error", message: result.error });
      return;
    }

    setLoans(result.data ?? []);
    setNotice({ tone: "success", message: `Prestamos cargados para ${userId}.` });
  }

  return (
    <PageShell>
      <NoticeBanner notice={notice} />
      <section className="border border-[#d9dee5] bg-white p-5">
        <PanelTitle eyebrow="Mis Prestamos" title="Prestamos del cliente" />
        <form className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]" onSubmit={search}>
          <TextField label="User ID" value={userId} onChange={setUserId} />
          <button className="h-11 self-end bg-[#2f6f5e] px-5 text-sm font-semibold text-white" disabled={isBusy} type="submit">
            Buscar prestamos
          </button>
        </form>
        {loans.length ? <LoansTable loans={loans} /> : <EmptyState text="Busca un userId para listar sus prestamos." />}
      </section>
    </PageShell>
  );
}

export function LoanDetailPage() {
  const params = useParams<{ id: string }>();
  const loanId = params.id;
  const [loan, setLoan] = useState<LoanApplication>();
  const [schedule, setSchedule] = useState<PaymentScheduleItem[]>([]);
  const [notice, setNotice] = useState<Notice>();

  useEffect(() => {
    async function load() {
      const [loanResult, scheduleResult] = await Promise.all([
        getLoanById(loanId),
        getLoanSchedule(loanId),
      ]);

      if (loanResult.error || scheduleResult.error) {
        setNotice({
          tone: "error",
          message: loanResult.error ?? scheduleResult.error ?? "No se pudo cargar el prestamo.",
        });
        return;
      }

      setLoan(loanResult.data);
      setSchedule(scheduleResult.data ?? []);
    }

    load();
  }, [loanId]);

  return (
    <PageShell>
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
                <p className="text-xs uppercase text-[#62707f]">Estado actual</p>
                <div className="mt-2"><StatusBadge status={loan.status} /></div>
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

export function TransactionsPage() {
  const [type, setType] = useState<"" | "disbursement" | "payment">("");
  const [status, setStatus] = useState<"" | "processed" | "failed">("");
  const [transactions, setTransactions] = useState<TransactionResult[]>([]);
  const [notice, setNotice] = useState<Notice>();
  const filtered = useMemo(() => transactions, [transactions]);

  async function load(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const result = await getTransactions({ type, status });

    if (result.error) {
      setNotice({ tone: "error", message: result.error });
      return;
    }

    setTransactions(result.data ?? []);
    setNotice({ tone: "success", message: "Transacciones cargadas." });
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <PageShell>
      <NoticeBanner notice={notice} />
      <section className="border border-[#d9dee5] bg-white p-5">
        <PanelTitle eyebrow="Transacciones" title="Lista de transacciones" />
        <form className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto]" onSubmit={load}>
          <SelectField label="Tipo" value={type} onChange={(value) => setType(value as typeof type)} options={[["", "Todos"], ["payment", "Pago"], ["disbursement", "Desembolso"]]} />
          <SelectField label="Estado" value={status} onChange={(value) => setStatus(value as typeof status)} options={[["", "Todos"], ["processed", "Procesada"], ["failed", "Fallida"]]} />
          <button className="h-11 self-end bg-[#2f6f5e] px-5 text-sm font-semibold text-white" type="submit">
            Filtrar
          </button>
        </form>
        {filtered.length ? <TransactionsTable transactions={filtered} /> : <EmptyState text="No hay transacciones con esos filtros." />}
      </section>
    </PageShell>
  );
}

export function PaymentsPage() {
  const [userId, setUserId] = useState("user-1");
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [loanId, setLoanId] = useState("");
  const [schedule, setSchedule] = useState<PaymentScheduleItem[]>([]);
  const [notice, setNotice] = useState<Notice>();
  const [isBusy, setIsBusy] = useState(false);
  const selectedLoan = loans.find((loan) => loan.id === loanId);
  const nextPayment = schedule.find((payment) => payment.status === "pending");
  const pendingCount = schedule.filter(
    (payment) => payment.status === "pending",
  ).length;

  async function searchLoans(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);
    const result = await getLoanApplications(userId);
    setIsBusy(false);

    if (result.error) {
      setNotice({ tone: "error", message: result.error });
      return;
    }

    setLoans(result.data ?? []);
    setLoanId("");
    setSchedule([]);
    setNotice({ tone: "success", message: `Prestamos cargados para ${userId}.` });
  }

  async function selectLoan(nextLoanId: string) {
    setLoanId(nextLoanId);
    setSchedule([]);

    if (!nextLoanId) return;

    setIsBusy(true);
    const result = await getLoanSchedule(nextLoanId);
    setIsBusy(false);

    if (result.error) {
      setNotice({ tone: "error", message: result.error });
      return;
    }

    setSchedule(result.data ?? []);
  }

  async function pay() {
    if (!loanId || !nextPayment) return;

    setIsBusy(true);
    const result = await payNextInstallment(loanId);

    if (result.error) {
      setIsBusy(false);
      setNotice({ tone: "error", message: result.error });
      return;
    }

    const scheduleResult = await getLoanSchedule(loanId);
    setIsBusy(false);
    setSchedule(scheduleResult.data ?? schedule);
    setNotice({
      tone: "success",
      message: `Cuota #${result.data?.payment.installment} pagada. Quedan ${result.data?.remainingPendingPayments ?? 0} cuotas pendientes.`,
    });
  }

  return (
    <PageShell>
      <NoticeBanner notice={notice} />
      <section className="border border-[#d9dee5] bg-white p-5">
        <PanelTitle eyebrow="Pagos" title="Pago de cuotas" />
        <form className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]" onSubmit={searchLoans}>
          <TextField label="User ID" value={userId} onChange={setUserId} />
          <button className="h-11 self-end bg-[#2f6f5e] px-5 text-sm font-semibold text-white" disabled={isBusy} type="submit">
            Buscar prestamos
          </button>
        </form>

        <label className="mt-5 block text-sm font-medium text-[#394653]">
          Prestamo
          <select className="mt-2 h-11 w-full border border-[#c9d1da] bg-white px-3 outline-none" disabled={isBusy || loans.length === 0} value={loanId} onChange={(event) => selectLoan(event.target.value)}>
            <option value="">Selecciona un prestamo</option>
            {loans.map((loan) => (
              <option key={loan.id} value={loan.id}>
                {loan.id} - {currency.format(loan.amount)} - {loan.termMonths} meses
              </option>
            ))}
          </select>
        </label>

        {selectedLoan ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <Metric label="Monto" value={currency.format(selectedLoan.amount)} />
            <Metric label="Cuotas pendientes" value={`${pendingCount}`} />
            <Metric label="Proxima cuota" value={nextPayment ? `#${nextPayment.installment}` : "Sin pendientes"} />
            <Metric label="Monto a pagar" value={nextPayment ? currency.format(nextPayment.payment) : currency.format(0)} />
          </div>
        ) : null}

        {nextPayment ? (
          <div className="mt-5 border border-[#d9dee5] bg-[#fbfcfd] p-4">
            <h2 className="text-lg font-semibold">Cuota actual</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-5">
              <Metric label="Numero" value={`#${nextPayment.installment}`} />
              <Metric label="Vencimiento" value={nextPayment.dueDate} />
              <Metric label="Capital" value={currency.format(nextPayment.principal)} />
              <Metric label="Interes" value={currency.format(nextPayment.interest)} />
              <Metric label="Total" value={currency.format(nextPayment.payment)} />
            </div>
            <button className="mt-5 h-11 bg-[#2f6f5e] px-5 text-sm font-semibold text-white disabled:bg-[#93b8ac]" disabled={isBusy} type="button" onClick={pay}>
              {isBusy ? "Pagando..." : "Pagar cuota actual"}
            </button>
          </div>
        ) : (
          <EmptyState text="Busca un prestamo para ver la cuota que toca pagar." />
        )}

        {schedule.length ? <ScheduleTable schedule={schedule} title="Estado de cuotas" /> : null}
      </section>
    </PageShell>
  );
}

export function ApprovalsPage() {
  const [userId, setUserId] = useState("user-1");
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [notice, setNotice] = useState<Notice>();
  const [isBusy, setIsBusy] = useState(false);

  async function search(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (!userId.trim()) {
      setNotice({ tone: "error", message: "Ingresa un userId." });
      return;
    }

    setIsBusy(true);
    const result = await getLoanApplications(userId);
    setIsBusy(false);

    if (result.error) {
      setNotice({ tone: "error", message: result.error });
      return;
    }

    setLoans(result.data ?? []);
    setNotice({ tone: "success", message: `Prestamos cargados para ${userId}.` });
  }

  async function changeStatus(loan: LoanApplication, status: "approved" | "rejected") {
    setIsBusy(true);
    const result = await updateApplicationStatus(loan.id, status);
    setIsBusy(false);

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
    <PageShell>
      <NoticeBanner notice={notice} />
      <section className="border border-[#d9dee5] bg-white p-5">
        <PanelTitle eyebrow="Aprobaciones" title="Aprobacion de prestamos" />
        <form className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]" onSubmit={search}>
          <TextField label="User ID" value={userId} onChange={setUserId} />
          <button className="h-11 self-end bg-[#2f6f5e] px-5 text-sm font-semibold text-white disabled:bg-[#93b8ac]" disabled={isBusy} type="submit">
            Buscar prestamos
          </button>
        </form>

        {loans.length ? (
          <div className="mt-6 grid gap-4">
            {loans.map((loan) => {
              const canReview = loan.status === "pending" || loan.status === "draft";

              return (
                <article className="grid gap-4 border border-[#d9dee5] p-4 lg:grid-cols-[1fr_auto]" key={loan.id}>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold">{loan.id}</h2>
                      <StatusBadge status={loan.status} />
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-4">
                      <Metric label="Cliente" value={loan.customerDocument} />
                      <Metric label="Monto" value={currency.format(loan.amount)} />
                      <Metric label="Plazo" value={`${loan.termMonths} meses`} />
                      <Metric label="Cuota" value={currency.format(loan.monthlyPayment)} />
                    </div>
                  </div>
                  <div className="flex gap-2 self-start">
                    <button className="h-10 border border-[#2f6f5e] px-4 text-sm font-semibold text-[#2f6f5e] hover:bg-[#e8f2ee] disabled:opacity-50" disabled={isBusy || !canReview} onClick={() => changeStatus(loan, "approved")} type="button">
                      Aprobar
                    </button>
                    <button className="h-10 border border-[#b84a42] px-4 text-sm font-semibold text-[#b84a42] hover:bg-[#fff0ef] disabled:opacity-50" disabled={isBusy || !canReview} onClick={() => changeStatus(loan, "rejected")} type="button">
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

function LoansTable({ loans }: { loans: LoanApplication[] }) {
  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-[#d9dee5] text-xs uppercase text-[#62707f]">
          <tr>
            <th className="py-3">ID</th>
            <th>Monto</th>
            <th>Plazo</th>
            <th>Cuota</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {loans.map((loan) => (
            <tr className="border-b border-[#edf0f3]" key={loan.id}>
              <td className="py-3 font-medium">
                <Link className="text-[#1f5f50] hover:underline" href={`/loans/${loan.id}`}>
                  {loan.id}
                </Link>
              </td>
              <td>{currency.format(loan.amount)}</td>
              <td>{loan.termMonths} meses</td>
              <td>{currency.format(loan.monthlyPayment)}</td>
              <td><StatusBadge status={loan.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TransactionsTable({ transactions }: { transactions: TransactionResult[] }) {
  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
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
            <tr className="border-b border-[#edf0f3]" key={transaction.id}>
              <td className="py-3 font-medium">{transaction.id}</td>
              <td>{transaction.loanId || "-"}</td>
              <td>{transaction.type}</td>
              <td>{currency.format(transaction.amount)}</td>
              <td>{transaction.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ScheduleTable({
  schedule,
  title = "Cronograma",
}: {
  schedule: PaymentScheduleItem[];
  title?: string;
}) {
  if (!schedule.length) return <EmptyState text="No hay pagos para mostrar." />;

  return (
    <div className="mt-6 overflow-x-auto">
      <h3 className="mb-3 text-base font-semibold text-[#172026]">{title}</h3>
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
              <td><PaymentStatusBadge status={item.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NoticeBanner({ notice }: { notice?: Notice }) {
  if (!notice) return null;

  const classes = {
    success: "border-[#acd9c6] bg-[#edf8f2] text-[#1f5f50]",
    warning: "border-[#ead28d] bg-[#fff8df] text-[#755b12]",
    error: "border-[#efb0aa] bg-[#fff0ef] text-[#9d2d24]",
  };

  return <div className={`mb-6 border px-4 py-3 text-sm ${classes[notice.tone]}`}>{notice.message}</div>;
}

function PanelTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#2f6f5e]">{eyebrow}</p>
      <h1 className="mt-1 text-2xl font-semibold">{title}</h1>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#d9dee5] bg-[#fbfcfd] p-3">
      <p className="text-xs uppercase text-[#62707f]">{label}</p>
      <p className="mt-1 break-all text-base font-semibold text-[#172026]">{value}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="mt-5 border border-dashed border-[#c9d1da] bg-[#fbfcfd] px-4 py-10 text-center text-sm text-[#62707f]">{text}</div>;
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
      <div className="mt-2 flex h-11 border border-[#c9d1da] bg-white">
        <input className="min-w-0 flex-1 px-3 outline-none" max={max} min={min} onChange={(event) => onChange(Number(event.target.value))} required type="number" value={value} />
        {suffix ? <span className="flex items-center border-l border-[#c9d1da] px-3 text-[#62707f]">{suffix}</span> : null}
      </div>
    </label>
  );
}

function TextField({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) {
  return (
    <label className="block text-sm font-medium text-[#394653]">
      {label}
      <input className="mt-2 h-11 w-full border border-[#c9d1da] px-3 outline-none" onChange={(event) => onChange(event.target.value)} required type="text" value={value} />
    </label>
  );
}

function SelectField({ label, onChange, options, value }: { label: string; onChange: (value: string) => void; options: string[][]; value: string }) {
  return (
    <label className="block text-sm font-medium text-[#394653]">
      {label}
      <select className="mt-2 h-11 w-full border border-[#c9d1da] bg-white px-3 outline-none" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map(([optionValue, label]) => <option key={optionValue} value={optionValue}>{label}</option>)}
      </select>
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

  return <span className={`px-2 py-1 text-xs font-semibold ${classes[status]}`}>{label[status]}</span>;
}

function PaymentStatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const label = normalized === "paid" ? "Pagada" : normalized === "pending" ? "Pendiente" : status;
  const classes = normalized === "paid" ? "bg-[#e8f2ee] text-[#1f5f50]" : "bg-[#fff8df] text-[#755b12]";

  return <span className={`px-2 py-1 text-xs font-semibold ${classes}`}>{label}</span>;
}
