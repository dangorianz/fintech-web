import Link from "next/link";
import { LoadingOverlay } from "./LoadingOverlay";

const navItems = [
  ["/", "Home"],
  ["/loans/simulate", "Simulador"],
  ["/loans", "Mis Prestamos"],
  ["/approvals", "Aprobaciones"],
  ["/payments", "Pagos"],
  ["/transactions", "Transacciones"],
];

export function PageShell({
  children,
  loadingMessage,
}: {
  children: React.ReactNode;
  loadingMessage?: string;
}) {
  return (
    <div className="min-h-screen bg-[#f6f7f9] text-[#172026]">
      {loadingMessage ? <LoadingOverlay message={loadingMessage} /> : null}
      <header className="border-b border-[#d9dee5] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <Link href="/" className="text-2xl font-semibold text-[#172026]">
            SGIP
          </Link>
          <nav className="flex flex-wrap gap-2">
            {navItems.map(([href, label]) => (
              <Link
                className="border border-[#c9d1da] px-3 py-2 text-sm font-medium text-[#394653] hover:border-[#2f6f5e] hover:text-[#1f5f50]"
                href={href}
                key={href}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-6">{children}</main>
    </div>
  );
}
