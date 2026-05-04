export function PanelTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#2f6f5e]">
        {eyebrow}
      </p>
      <h1 className="mt-1 text-2xl font-semibold">{title}</h1>
    </div>
  );
}
