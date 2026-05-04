import Link from "next/link";
import { LoanApplication } from "@/src/lib/sgip-api";
import { StatusBadge } from "@/src/components/shared/badges";
import { currency } from "@/src/components/shared/formatters";

export function LoansTable({ loans }: { loans: LoanApplication[] }) {
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
                <Link
                  className="text-[#1f5f50] hover:underline"
                  href={`/loans/${loan.id}`}
                >
                  {loan.id}
                </Link>
              </td>
              <td>{currency.format(loan.amount)}</td>
              <td>{loan.termMonths} meses</td>
              <td>{currency.format(loan.monthlyPayment)}</td>
              <td>
                <StatusBadge status={loan.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
