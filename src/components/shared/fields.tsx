export function NumberField({
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
        <input
          className="min-w-0 flex-1 px-3 outline-none"
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

export function TextField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="block text-sm font-medium text-[#394653]">
      {label}
      <input
        className="mt-2 h-11 w-full border border-[#c9d1da] px-3 outline-none"
        onChange={(event) => onChange(event.target.value)}
        required
        type="text"
        value={value}
      />
    </label>
  );
}

export function SelectField({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: string[][];
  value: string;
}) {
  return (
    <label className="block text-sm font-medium text-[#394653]">
      {label}
      <select
        className="mt-2 h-11 w-full border border-[#c9d1da] bg-white px-3 outline-none"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map(([optionValue, label]) => (
          <option key={optionValue} value={optionValue}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}
