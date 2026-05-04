import { PaymentScheduleItem } from "@/src/lib/sgip-api";
import { EmptyState } from "./EmptyState";
import { PaymentStatusBadge } from "./badges";
import { currency } from "./formatters";

export function ScheduleTable({
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
              <td>
                <PaymentStatusBadge status={item.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
