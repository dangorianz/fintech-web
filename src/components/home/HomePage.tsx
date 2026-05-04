import Link from "next/link";
import { PageShell } from "@/src/components/shared/PageShell";

export function HomePage() {
  return (
    <PageShell>
      <section className="border border-[#d9dee5] bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#2f6f5e]">
          Sistema de Gestion de Inversiones y Prestamos
        </p>
        <h1 className="mt-2 text-3xl font-semibold">SGIP</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#62707f]">
          Frontend para simular prestamos, solicitar credito, consultar mis
          prestamos, revisar cronogramas y listar transacciones.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            className="bg-[#2f6f5e] px-5 py-3 text-sm font-semibold text-white"
            href="/loans/simulate"
          >
            Ir al simulador
          </Link>
          <Link
            className="border border-[#2f6f5e] px-5 py-3 text-sm font-semibold text-[#2f6f5e]"
            href="/loans"
          >
            Ver prestamos
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
