import { LoanApplication } from "@/src/types/loan";

export function StatusBadge({ status }: { status: LoanApplication["status"] }) {
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

export function PaymentStatusBadge({ status }: { status: string }) {
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
