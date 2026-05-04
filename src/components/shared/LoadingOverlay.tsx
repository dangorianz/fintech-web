export function LoadingOverlay({ message }: { message: string }) {
  return (
    <div className="fixed inset-x-0 top-0 z-50 border-b border-[#acd9c6] bg-[#edf8f2] text-[#1f5f50] shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-5 py-3 text-sm font-medium">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#acd9c6] border-t-[#1f5f50]" />
        <span>{message}</span>
      </div>
    </div>
  );
}
