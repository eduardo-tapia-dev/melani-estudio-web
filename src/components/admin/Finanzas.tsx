import Link from "next/link";
import { mesActual, nombreMes, sumarMeses } from "@/lib/tiempo";
import { btnSecundario } from "./estilos";

const TABS = [
  { href: "/admin/finanzas", texto: "Resumen" },
  { href: "/admin/finanzas/ingresos", texto: "Ingresos" },
  { href: "/admin/finanzas/gastos", texto: "Gastos" },
  { href: "/admin/finanzas/insumos", texto: "Insumos" },
];

/** Pestañas de la sección Finanzas (conserva el mes elegido). */
export function SubnavFinanzas({ actual, mes }: { actual: string; mes?: string }) {
  return (
    <nav className="-mx-1 flex gap-1 overflow-x-auto px-1" aria-label="Finanzas">
      {TABS.map((t) => (
        <Link
          key={t.href}
          href={mes && t.href !== "/admin/finanzas/insumos" ? `${t.href}?mes=${mes}` : t.href}
          aria-current={actual === t.href ? "page" : undefined}
          className={`shrink-0 rounded-full px-4 py-2.5 text-[15px] transition-colors ${actual === t.href ? "bg-carbon text-hueso" : "bg-white text-carbon ring-1 ring-salvia/60 hover:ring-carbon"}`}
        >
          {t.texto}
        </Link>
      ))}
    </nav>
  );
}

/** ‹ noviembre 2026 › — navega por la URL (?mes=YYYY-MM). */
export function SelectorMes({ base, mes }: { base: string; mes: string }) {
  const esActual = mes === mesActual();
  return (
    <div className="flex items-center gap-2">
      <Link href={`${base}?mes=${sumarMeses(mes, -1)}`} className={`${btnSecundario} px-3`} aria-label="Mes anterior">‹</Link>
      <span className="min-w-36 text-center font-serif text-xl capitalize text-carbon">{nombreMes(mes)}</span>
      <Link
        href={`${base}?mes=${sumarMeses(mes, 1)}`}
        aria-disabled={esActual}
        className={`${btnSecundario} px-3 ${esActual ? "pointer-events-none opacity-40" : ""}`}
        aria-label="Mes siguiente"
      >
        ›
      </Link>
    </div>
  );
}
