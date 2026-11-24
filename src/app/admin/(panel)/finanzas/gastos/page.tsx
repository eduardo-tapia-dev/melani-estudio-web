import { requerirAdmin } from "@/lib/supabase/servidor";
import { formatoGs } from "@/lib/formato";
import { fechaCorta, hoy, mesActual, mesValido, rangoMes } from "@/lib/tiempo";
import { SelectorMes, SubnavFinanzas } from "@/components/admin/Finanzas";
import { tarjeta, tituloPagina } from "@/components/admin/estilos";
import { BorrarGasto, Categorias, NuevoGasto } from "./ComponentesGastos";

type Fila = {
  id: string;
  fecha: string;
  monto: number;
  medio: "efectivo" | "transferencia";
  nota: string | null;
  categoria: { id: string; nombre: string; es_insumos: boolean } | null;
};

export default async function Gastos({ searchParams }: PageProps<"/admin/finanzas/gastos">) {
  const { sb } = await requerirAdmin();
  const sp = await searchParams;
  const mes = mesValido(sp.mes) ? sp.mes : mesActual();
  const r = rangoMes(mes);
  const [{ data }, { data: cats }] = await Promise.all([
    sb.from("gastos").select("id, fecha, monto, medio, nota, categoria:categorias_gasto(id, nombre, es_insumos)").gte("fecha", r.desde).lt("fecha", r.hasta).order("fecha", { ascending: false }).order("creado_en", { ascending: false }),
    sb.from("categorias_gasto").select("id, nombre, es_insumos").order("orden"),
  ]);
  const filas = (data ?? []) as unknown as Fila[];
  const categorias = cats ?? [];
  const total = filas.reduce((s, f) => s + f.monto, 0);
  const porCategoria = new Map<string, number>();
  filas.forEach((f) => porCategoria.set(f.categoria?.nombre ?? "—", (porCategoria.get(f.categoria?.nombre ?? "—") ?? 0) + f.monto));

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <h1 className={tituloPagina}>Dinero</h1>
        <SubnavFinanzas actual="/admin/finanzas/gastos" mes={mes} />
      </header>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SelectorMes base="/admin/finanzas/gastos" mes={mes} />
        <NuevoGasto hoy={hoy()} categorias={categorias} />
      </div>

      <section className={`${tarjeta} flex flex-wrap items-baseline justify-between gap-3`}>
        <div>
          <p className="text-xs uppercase tracking-wider text-gris">Total del mes</p>
          <p className="font-serif text-2xl tabular-nums text-carbon">{formatoGs(total)}</p>
        </div>
        <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
          {[...porCategoria.entries()].sort((a, b) => b[1] - a[1]).map(([c, v]) => (
            <li key={c} className="text-gris">{c}: <span className="tabular-nums text-carbon">{formatoGs(v)}</span></li>
          ))}
        </ul>
      </section>

      {filas.length === 0 ? (
        <p className={`${tarjeta} text-gris`}>Sin gastos este mes.</p>
      ) : (
        <ul className="divide-y divide-salvia/50 overflow-hidden rounded-2xl bg-white ring-1 ring-salvia/50">
          {filas.map((f) => (
            <li key={f.id} className="flex items-center gap-3 px-4 py-3">
              <div className="w-16 shrink-0 text-sm capitalize text-gris">{fechaCorta(f.fecha)}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-carbon">{f.nota || f.categoria?.nombre}</p>
                <p className="text-xs text-gris">{f.categoria?.nombre} · {f.medio}</p>
              </div>
              <p className="shrink-0 font-medium tabular-nums text-carbon">{formatoGs(f.monto)}</p>
              <BorrarGasto id={f.id} esCompra={Boolean(f.categoria?.es_insumos && f.nota?.startsWith("Compra:"))} />
            </li>
          ))}
        </ul>
      )}

      <Categorias categorias={categorias} />
    </div>
  );
}
