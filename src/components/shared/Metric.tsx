export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#d9dee5] bg-[#fbfcfd] p-3">
      <p className="text-xs uppercase text-[#62707f]">{label}</p>
      <p className="mt-1 break-all text-base font-semibold text-[#172026]">
        {value}
      </p>
    </div>
  );
}
