import Link from "next/link";
import { notFound } from "next/navigation";
import { requerirAdmin } from "@/lib/supabase/servidor";
import { formatoGs } from "@/lib/formato";
import { fechaCorta, fechaLocal, hoy } from "@/lib/tiempo";
import { tarjeta, tituloPagina } from "@/components/admin/estilos";
import { cantidad, type InsumoEstado } from "@/lib/insumos";
import { AnularMovimiento, EditarInsumo, FormCompra, FormUso, UsoEnServicios } from "./ComponentesInsumo";

type Mov = { id: string; tipo: "compra" | "uso" | "ajuste"; cantidad: number; costo_total: number | null; fecha: string; nota: string | null; cita_id: string | null };

export default async function DetalleInsumo({ params }: PageProps<"/admin/finanzas/insumos/[id]">) {
  const { sb } = await requerirAdmin();
  const { id } = await params;
  const [{ data: ins }, { data: movs }, { data: servicios }, { data: usos }] = await Promise.all([
    sb.from("insumos_estado").select("*").eq("id", id).maybeSingle(),
    sb.from("movimientos_insumo").select("id, tipo, cantidad, costo_total, fecha, nota, cita_id").eq("insumo_id", id).order("fecha", { ascending: false }).limit(60),
    sb.from("servicios").select("id, nombre").order("orden"),
    sb.from("servicio_insumos").select("servicio_id, cantidad").eq("insumo_id", id),
  ]);
  if (!ins) notFound();
  const i = ins as InsumoEstado;
  const movimientos = (movs ?? []) as Mov[];

  return (
    <div className="space-y-5">
      <header>
        <Link href="/admin/finanzas/insumos" className="mb-1 inline-flex items-center gap-1.5 py-1 text-[15px] text-gris transition-colors hover:text-carbon">← Insumos</Link>
        <div className="mt-1 flex flex-wrap items-baseline justify-between gap-3">
          <h1 className={tituloPagina}>{i.nombre}</h1>
          <p>
            <span className={`font-serif text-4xl tabular-nums ${i.por_reponer ? "text-amber-800" : "text-carbon"}`}>{cantidad(i.stock_actual)}</span>
            <span className="ml-1.5 text-gris">{i.unidad} en stock</span>
          </p>
        </div>
        <p className="mt-1 text-sm text-gris">
          Mínimo {cantidad(i.stock_minimo)} {i.unidad}
          {i.costo_ultima_compra ? ` · última compra ${formatoGs(i.costo_ultima_compra)} por ${i.unidad}` : ""}
          {i.ultimo_uso ? ` · último uso ${fechaCorta(fechaLocal(i.ultimo_uso))}` : ""}
        </p>
        {i.por_reponer && <p className="mt-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-900">⚠ Por reponer</p>}
        {i.sobra && <p className="mt-2 inline-block rounded-full bg-sky-100 px-3 py-1 text-sm text-sky-900">◷ Sin uso en 60 días</p>}
      </header>

      <div className="grid gap-5 lg:grid-cols-2">
        <FormCompra insumoId={i.id} unidad={i.unidad} hoy={hoy()} />
        <FormUso insumoId={i.id} unidad={i.unidad} />
      </div>

      <UsoEnServicios
        insumoId={i.id}
        unidad={i.unidad}
        servicios={(servicios ?? []).map((s) => ({ id: s.id, nombre: s.nombre, cantidad: usos?.find((u) => u.servicio_id === s.id)?.cantidad ?? 0 }))}
      />

      <section className={tarjeta}>
        <h2 className="mb-3 font-medium text-carbon">Movimientos</h2>
        {movimientos.length === 0 ? (
          <p className="text-sm text-gris">Sin movimientos todavía.</p>
        ) : (
          <ul className="divide-y divide-salvia/50">
            {movimientos.map((m) => (
              <li key={m.id} className="flex items-center gap-3 py-2.5 text-sm">
                <span className="w-16 shrink-0 capitalize text-gris">{fechaCorta(fechaLocal(m.fecha))}</span>
                <span className="min-w-0 flex-1 truncate text-carbon">
                  {m.tipo === "compra" ? "Compra" : m.tipo === "uso" ? "Uso" : "Ajuste"}
                  {m.nota ? ` · ${m.nota}` : ""}
                  {m.costo_total ? ` · ${formatoGs(m.costo_total)}` : ""}
                  {m.cita_id && <Link href={`/admin/agenda/${m.cita_id}`} className="ml-1 text-taupe-oscuro underline">cita</Link>}
                </span>
                <span className={`shrink-0 tabular-nums ${m.cantidad > 0 ? "text-emerald-800" : "text-carbon"}`}>
                  {m.cantidad > 0 ? "+" : ""}
                  {cantidad(m.cantidad)}
                </span>
                {!m.cita_id && <AnularMovimiento id={m.id} esCompra={m.tipo === "compra" && Boolean(m.costo_total)} />}
              </li>
            ))}
          </ul>
        )}
      </section>

      <EditarInsumo insumo={{ id: i.id, nombre: i.nombre, unidad: i.unidad, stock_minimo: i.stock_minimo, activo: i.activo }} />
    </div>
  );
}
