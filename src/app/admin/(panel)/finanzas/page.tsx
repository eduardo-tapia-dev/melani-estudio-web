import Link from "next/link";
import { requerirAdmin } from "@/lib/supabase/servidor";
import { resumenMes } from "@/lib/resumen";
import { formatoGs } from "@/lib/formato";
import { mesActual, mesValido, nombreMes } from "@/lib/tiempo";
import { SelectorMes, SubnavFinanzas } from "@/components/admin/Finanzas";
import { BarrasHorizontales, COLOR, GraficoMeses } from "@/components/admin/GraficosFinanzas";
import { btnSecundario, tarjeta, tituloPagina } from "@/components/admin/estilos";
import ConfigReserva from "./ConfigReserva";

export default async function Finanzas({ searchParams }: PageProps<"/admin/finanzas">) {
  const { sb } = await requerirAdmin();
  const sp = await searchParams;
  const mes = mesValido(sp.mes) ? sp.mes : mesActual();
  const r = await resumenMes(sb, mes);

  const atendidas = r.citas_por_estado.atendida ?? 0;
  const totalCitas = Object.values(r.citas_por_estado).reduce<number>((s, n) => s + (n ?? 0), 0);
  const serie = r.serie.map((p) => ({ etiqueta: nombreMes(p.mes.slice(0, 7), true), ingresos: p.ingresos, gastos: p.gastos, ganancia: p.ingresos - p.gastos }));
  const hayDatos = r.ingresos > 0 || r.gastos > 0 || totalCitas > 0;

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <h1 className={tituloPagina}>Dinero</h1>
        <SubnavFinanzas actual="/admin/finanzas" mes={mes} />
      </header>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SelectorMes base="/admin/finanzas" mes={mes} />
        <a href={`/admin/exportar?mes=${mes}`} download className={btnSecundario}>⬇ Exportar mes (CSV)</a>
      </div>

      {/* Lo más importante */}
      <section className="grid gap-3 sm:grid-cols-3" aria-label="Resultado del mes">
        <div className={`${tarjeta} sm:col-span-1`}>
          <p className="text-xs uppercase tracking-wider text-gris">Ganancia del mes</p>
          <p className={`mt-1 font-serif text-4xl tabular-nums ${r.ganancia < 0 ? "text-red-700" : "text-carbon"}`}>{formatoGs(r.ganancia)}</p>
          <p className="mt-1 text-xs text-gris">Ingresos − gastos</p>
        </div>
        <div className={tarjeta}>
          <p className="text-xs uppercase tracking-wider text-gris">Guardar para productos</p>
          <p className="mt-1 font-serif text-3xl tabular-nums text-carbon">{formatoGs(r.reserva)}</p>
          <p className="mt-1 text-xs text-gris">
            {r.reserva_modo === "porcentaje"
              ? `${r.reserva_porcentaje}% de los ingresos`
              : r.promedio_insumos_3m > 0
                ? "Promedio de compras de insumos de los 3 meses anteriores"
                : "Sin compras de insumos en los 3 meses anteriores"}
          </p>
        </div>
        <div className="rounded-3xl bg-carbon p-5 text-hueso shadow-lg shadow-carbon/15 sm:p-6">
          <p className="text-xs uppercase tracking-wider text-hueso/80">Para tu bolsillo</p>
          <p className="mt-1 font-serif text-4xl tabular-nums">{formatoGs(r.bolsillo)}</p>
          <p className="mt-1 text-xs text-hueso/80">Ganancia − reserva para productos</p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Totales">
        <Cifra titulo="Ingresos" valor={formatoGs(r.ingresos)} href={`/admin/finanzas/ingresos?mes=${mes}`} />
        <Cifra titulo="Gastos" valor={formatoGs(r.gastos)} href={`/admin/finanzas/gastos?mes=${mes}`} />
        <Cifra titulo="Citas atendidas" valor={`${atendidas}`} detalle={`${r.clientas_atendidas} clienta${r.clientas_atendidas === 1 ? "" : "s"} · ${totalCitas} agendadas`} />
        <Cifra titulo="Más vendido" valor={r.top_servicios[0]?.nombre ?? "—"} detalle={r.top_servicios[0] ? `${r.top_servicios[0].cantidad} ${r.top_servicios[0].cantidad === 1 ? "vez" : "veces"}` : undefined} chico />
      </section>

      <section className="grid gap-3 sm:grid-cols-2" aria-label="Separaciones de ingresos">
        <Reparto
          titulo="Efectivo vs. transferencia"
          a={{ nombre: "Efectivo", valor: r.ingresos_por_medio.efectivo ?? 0 }}
          b={{ nombre: "Transferencia", valor: r.ingresos_por_medio.transferencia ?? 0 }}
        />
        <Reparto
          titulo="Servicios vs. cursos"
          a={{ nombre: "Servicios", valor: r.ingresos_por_tipo.servicio ?? 0 }}
          b={{ nombre: "Cursos", valor: r.ingresos_por_tipo.curso ?? 0 }}
        />
      </section>

      <section className={tarjeta}>
        <h2 className="mb-1 font-medium text-carbon">Últimos 12 meses</h2>
        <p className="mb-3 text-xs text-gris">Ingresos, gastos y ganancia por mes</p>
        <GraficoMeses datos={serie} />
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-gris">Ver como tabla</summary>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-right tabular-nums">
              <thead className="text-xs text-gris"><tr><th className="py-1 text-left font-normal">Mes</th><th className="font-normal">Ingresos</th><th className="font-normal">Gastos</th><th className="font-normal">Ganancia</th></tr></thead>
              <tbody>
                {serie.map((p) => (
                  <tr key={p.etiqueta} className="border-t border-salvia/40">
                    <td className="py-1 text-left capitalize">{p.etiqueta}</td>
                    <td>{formatoGs(p.ingresos)}</td>
                    <td>{formatoGs(p.gastos)}</td>
                    <td className={p.ganancia < 0 ? "text-red-700" : ""}>{formatoGs(p.ganancia)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>

      {hayDatos ? (
        <section className="grid gap-3 lg:grid-cols-2">
          <div className={tarjeta}>
            <h2 className="mb-3 font-medium text-carbon">Ingresos por categoría</h2>
            {r.ingresos_por_categoria.length ? (
              <BarrasHorizontales datos={r.ingresos_por_categoria.map((c) => ({ nombre: c.categoria, valor: c.total }))} />
            ) : (
              <p className="text-sm text-gris">Sin ingresos este mes.</p>
            )}
          </div>
          <div className={tarjeta}>
            <h2 className="mb-3 font-medium text-carbon">Servicios más vendidos</h2>
            {r.top_servicios.length ? (
              <BarrasHorizontales formato="cantidad" datos={r.top_servicios.map((s) => ({ nombre: s.nombre, valor: s.cantidad }))} />
            ) : (
              <p className="text-sm text-gris">Todavía no hay citas atendidas este mes.</p>
            )}
          </div>
          {r.gastos_por_categoria.length > 0 && (
            <div className={`${tarjeta} lg:col-span-2`}>
              <h2 className="mb-3 font-medium text-carbon">Gastos por categoría</h2>
              <ul className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                {r.gastos_por_categoria.map((g) => (
                  <li key={g.categoria} className="flex justify-between border-b border-salvia/30 py-1.5">
                    <span className="text-carbon">{g.categoria}</span>
                    <span className="tabular-nums text-gris">{formatoGs(g.total)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      ) : (
        <p className={`${tarjeta} text-gris`}>
          Todavía no hay movimientos en {nombreMes(mes)}. Los ingresos se cargan solos al registrar señas y al marcar citas como atendidas; los gastos, desde{" "}
          <Link href="/admin/finanzas/gastos" className="text-taupe-oscuro underline">Gastos</Link> o al comprar <Link href="/admin/finanzas/insumos" className="text-taupe-oscuro underline">insumos</Link>.
        </p>
      )}

      <ConfigReserva modo={r.reserva_modo} porcentaje={Number(r.reserva_porcentaje)} />
    </div>
  );
}

function Cifra({ titulo, valor, detalle, href, chico }: { titulo: string; valor: string; detalle?: string; href?: string; chico?: boolean }) {
  const cuerpo = (
    <>
      <p className="text-xs uppercase tracking-wider text-gris">{titulo}</p>
      <p className={`mt-1 font-serif tabular-nums text-carbon ${chico ? "text-lg leading-snug" : "text-2xl"}`}>{valor}</p>
      {detalle && <p className="mt-0.5 text-xs text-gris">{detalle}</p>}
    </>
  );
  return href ? <Link href={href} className={`${tarjeta} block hover:ring-taupe-oscuro`}>{cuerpo}</Link> : <div className={tarjeta}>{cuerpo}</div>;
}

/** Barra 100% con dos partes, etiquetadas con nombre, monto y %. */
function Reparto({ titulo, a, b }: { titulo: string; a: { nombre: string; valor: number }; b: { nombre: string; valor: number } }) {
  const total = a.valor + b.valor;
  const pa = total ? Math.round((a.valor / total) * 100) : 0;
  return (
    <div className={tarjeta}>
      <h2 className="mb-3 text-sm font-medium text-carbon">{titulo}</h2>
      {total === 0 ? (
        <p className="text-sm text-gris">Sin ingresos este mes.</p>
      ) : (
        <>
          <div className="flex h-3 gap-0.5 overflow-hidden rounded-full" role="img" aria-label={`${a.nombre} ${pa}%, ${b.nombre} ${100 - pa}%`}>
            {a.valor > 0 && <div style={{ width: `${pa}%`, background: COLOR.ingresos }} />}
            {b.valor > 0 && <div style={{ width: `${100 - pa}%`, background: COLOR.ganancia }} />}
          </div>
          <div className="mt-3 flex justify-between gap-3 text-sm">
            <p><span className="mr-1.5 inline-block size-2.5 rounded-sm" style={{ background: COLOR.ingresos }} aria-hidden="true" />{a.nombre}: <span className="tabular-nums text-carbon">{formatoGs(a.valor)}</span> <span className="text-gris">({pa}%)</span></p>
            <p className="text-right"><span className="mr-1.5 inline-block size-2.5 rounded-sm" style={{ background: COLOR.ganancia }} aria-hidden="true" />{b.nombre}: <span className="tabular-nums text-carbon">{formatoGs(b.valor)}</span> <span className="text-gris">({100 - pa}%)</span></p>
          </div>
        </>
      )}
    </div>
  );
}
