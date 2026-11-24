import Link from "next/link";
import { requerirAdmin } from "@/lib/supabase/servidor";
import { formatoGs } from "@/lib/formato";
import { fechaCorta, hoy, mesActual, mesValido, rangoMes } from "@/lib/tiempo";
import { SelectorMes, SubnavFinanzas } from "@/components/admin/Finanzas";
import { tarjeta, tituloPagina } from "@/components/admin/estilos";
import NuevoIngreso, { BorrarIngreso } from "./NuevoIngreso";

type Fila = {
  id: string;
  fecha: string;
  monto: number;
  medio: "efectivo" | "transferencia";
  tipo: "servicio" | "curso";
  concepto: "sena" | "saldo" | "manual";
  nota: string | null;
  cita_id: string | null;
  clienta: { nombre: string } | null;
};

const CONCEPTO = { sena: "Seña", saldo: "Saldo de cita", manual: "Manual" };

export default async function Ingresos({ searchParams }: PageProps<"/admin/finanzas/ingresos">) {
  const { sb } = await requerirAdmin();
  const sp = await searchParams;
  const mes = mesValido(sp.mes) ? sp.mes : mesActual();
  const r = rangoMes(mes);
  const { data } = await sb
    .from("ingresos")
    .select("id, fecha, monto, medio, tipo, concepto, nota, cita_id, clienta:clientas(nombre)")
    .gte("fecha", r.desde)
    .lt("fecha", r.hasta)
    .order("fecha", { ascending: false })
    .order("creado_en", { ascending: false });
  const filas = (data ?? []) as unknown as Fila[];
  const total = filas.reduce((s, f) => s + f.monto, 0);
  const porMedio = (m: string) => filas.filter((f) => f.medio === m).reduce((s, f) => s + f.monto, 0);

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <h1 className={tituloPagina}>Dinero</h1>
        <SubnavFinanzas actual="/admin/finanzas/ingresos" mes={mes} />
      </header>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SelectorMes base="/admin/finanzas/ingresos" mes={mes} />
        <NuevoIngreso hoy={hoy()} />
      </div>

      <section className="grid grid-cols-3 gap-3">
        <Cifra titulo="Total" valor={total} fuerte />
        <Cifra titulo="Efectivo" valor={porMedio("efectivo")} />
        <Cifra titulo="Transferencia" valor={porMedio("transferencia")} />
      </section>

      {filas.length === 0 ? (
        <p className={`${tarjeta} text-gris`}>Sin ingresos este mes. Se cargan solos al registrar señas y al marcar citas como atendidas.</p>
      ) : (
        <ul className="divide-y divide-salvia/50 overflow-hidden rounded-2xl bg-white ring-1 ring-salvia/50">
          {filas.map((f) => (
            <li key={f.id} className="flex items-center gap-3 px-4 py-3">
              <div className="w-16 shrink-0 text-sm capitalize text-gris">{fechaCorta(f.fecha)}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-carbon">
                  {f.clienta?.nombre ?? f.nota ?? "Ingreso"}
                  {f.tipo === "curso" && <span className="ml-2 rounded-full bg-salvia-claro px-2 py-0.5 text-xs">Curso</span>}
                </p>
                <p className="text-xs text-gris">
                  {CONCEPTO[f.concepto]} · {f.medio}
                  {f.clienta && f.nota && f.concepto === "manual" ? ` · ${f.nota}` : ""}
                </p>
              </div>
              <p className="shrink-0 font-medium tabular-nums text-carbon">{formatoGs(f.monto)}</p>
              {f.cita_id ? (
                <Link href={`/admin/agenda/${f.cita_id}`} className="shrink-0 text-xs text-taupe-oscuro underline underline-offset-4">Cita</Link>
              ) : (
                <BorrarIngreso id={f.id} />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Cifra({ titulo, valor, fuerte }: { titulo: string; valor: number; fuerte?: boolean }) {
  return (
    <div className={tarjeta}>
      <p className="text-xs uppercase tracking-wider text-gris">{titulo}</p>
      <p className={`mt-1 font-serif tabular-nums text-carbon ${fuerte ? "text-2xl" : "text-xl"}`}>{formatoGs(valor)}</p>
    </div>
  );
}
