import Link from "next/link";
import { requerirAdmin } from "@/lib/supabase/servidor";
import { formatoGs } from "@/lib/formato";
import { SubnavFinanzas } from "@/components/admin/Finanzas";
import { tarjeta, tituloPagina } from "@/components/admin/estilos";
import NuevoInsumo from "./NuevoInsumo";

import { cantidad, type InsumoEstado } from "@/lib/insumos";

export default async function Insumos() {
  const { sb } = await requerirAdmin();
  const { data } = await sb.from("insumos_estado").select("*").order("activo", { ascending: false }).order("nombre");
  const insumos = (data ?? []) as InsumoEstado[];
  const reponer = insumos.filter((i) => i.por_reponer);
  const sobran = insumos.filter((i) => i.sobra);

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <h1 className={tituloPagina}>Dinero</h1>
        <SubnavFinanzas actual="/admin/finanzas/insumos" />
      </header>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-2xl text-carbon">Insumos y stock</h2>
        <NuevoInsumo />
      </div>

      {(reponer.length > 0 || sobran.length > 0) && (
        <section className="grid gap-3 sm:grid-cols-2">
          {reponer.length > 0 && (
            <div className={`${tarjeta} border-l-4 border-amber-500`}>
              <p className="font-medium text-carbon">⚠ Por reponer ({reponer.length})</p>
              <p className="mt-1 text-sm text-gris">{reponer.map((i) => `${i.nombre} (${cantidad(i.stock_actual)} ${i.unidad})`).join(", ")}</p>
            </div>
          )}
          {sobran.length > 0 && (
            <div className={`${tarjeta} border-l-4 border-sky-600`}>
              <p className="font-medium text-carbon">◷ Sobra: sin uso en 60 días ({sobran.length})</p>
              <p className="mt-1 text-sm text-gris">{sobran.map((i) => i.nombre).join(", ")}</p>
            </div>
          )}
        </section>
      )}

      {insumos.length === 0 ? (
        <div className={`${tarjeta} text-gris`}>
          <p>Todavía no cargaste insumos.</p>
          <p className="mt-1 text-sm">Agregá los productos que usás (pegamento, pestañas, henna, hilo…). Al registrar una compra se suma el stock y se crea el gasto solo.</p>
        </div>
      ) : (
        <ul className="divide-y divide-salvia/50 overflow-hidden rounded-2xl bg-white ring-1 ring-salvia/50">
          {insumos.map((i) => (
            <li key={i.id}>
              <Link href={`/admin/finanzas/insumos/${i.id}`} className={`flex items-center gap-3 px-4 py-3 hover:bg-salvia-claro/50 ${i.activo ? "" : "opacity-50"}`}>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-carbon">
                    {i.nombre}
                    {i.por_reponer && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900">⚠ Reponer</span>}
                    {i.sobra && <span className="ml-2 rounded-full bg-sky-100 px-2 py-0.5 text-xs text-sky-900">◷ Sobra</span>}
                    {!i.activo && <span className="ml-2 text-xs text-gris">(inactivo)</span>}
                  </p>
                  <p className="text-xs text-gris">
                    Mínimo {cantidad(i.stock_minimo)} {i.unidad}
                    {i.costo_ultima_compra ? ` · ${formatoGs(i.costo_ultima_compra)} por ${i.unidad}` : ""}
                  </p>
                </div>
                <p className="shrink-0 text-right">
                  <span className="font-serif text-xl tabular-nums text-carbon">{cantidad(i.stock_actual)}</span>
                  <span className="ml-1 text-sm text-gris">{i.unidad}</span>
                </p>
                <span className="text-gris" aria-hidden="true">›</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
