export function EmptyState({ text }: { text: string }) {
  return (
    <div className="mt-5 border border-dashed border-[#c9d1da] bg-[#fbfcfd] px-4 py-10 text-center text-sm text-[#62707f]">
      {text}
    </div>
  );
}
