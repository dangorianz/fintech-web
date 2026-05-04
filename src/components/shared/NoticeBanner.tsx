import { Notice } from "@/src/types/notice";

export function NoticeBanner({ notice }: { notice?: Notice }) {
  if (!notice) return null;

  const classes = {
    success: "border-[#acd9c6] bg-[#edf8f2] text-[#1f5f50]",
    warning: "border-[#ead28d] bg-[#fff8df] text-[#755b12]",
    error: "border-[#efb0aa] bg-[#fff0ef] text-[#9d2d24]",
  };

  return (
    <div className={`mb-6 border px-4 py-3 text-sm ${classes[notice.tone]}`}>
      {notice.message}
    </div>
  );
}
