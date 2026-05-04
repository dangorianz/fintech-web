import { TransactionResult } from "@/src/types/transaction";
import { currency } from "@/src/components/shared/formatters";

export function TransactionsTable({
  transactions,
}: {
  transactions: TransactionResult[];
}) {
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
