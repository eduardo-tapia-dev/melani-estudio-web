import Link from "next/link";
import { requerirAdmin } from "@/lib/supabase/servidor";
import { citasEntre, nombreItem, type CitaFila } from "@/lib/admin-datos";
import { desdeAhora, fechaCorta, fechaLarga, fechaLocal, horaLocal, hoy, lunesDe, rangoDias, sumarDias } from "@/lib/tiempo";
import Estado from "@/components/admin/Estado";
import { btnPrimario, btnSecundario, tarjeta, tituloPagina } from "@/components/admin/estilos";

type Vista = "dia" | "semana" | "proximas";

export default async function Agenda({ searchParams }: PageProps<"/admin/agenda">) {
  const { sb } = await requerirAdmin();
  const sp = await searchParams;
  const vista: Vista = sp.vista === "semana" || sp.vista === "proximas" ? sp.vista : "dia";
  const fecha = typeof sp.fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.fecha) ? sp.fecha : hoy();

  const url = (v: Vista, f = fecha) => `/admin/agenda?vista=${v}&fecha=${f}`;
  const paso = vista === "semana" ? 7 : 1;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className={tituloPagina}>Agenda</h1>
        <Link href={`/admin/agenda/nueva?fecha=${fecha}`} className={btnPrimario}>+ Nueva cita</Link>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full bg-white p-1 ring-1 ring-salvia/60" role="tablist">
          {(["dia", "semana", "proximas"] as Vista[]).map((v) => (
            <Link
              key={v}
              href={url(v)}
              role="tab"
              aria-selected={vista === v}
              className={`rounded-full px-4 py-2.5 text-[15px] transition-colors ${vista === v ? "bg-carbon text-hueso" : "text-carbon hover:bg-salvia-claro"}`}
            >
              {v === "dia" ? "Día" : v === "semana" ? "Semana" : "Próximas"}
            </Link>
          ))}
        </div>
        {vista !== "proximas" && (
          <div className="flex items-center gap-2">
            <Link href={url(vista, sumarDias(fecha, -paso))} className={`${btnSecundario} px-3`} aria-label="Anterior">‹</Link>
            <Link href={url(vista, hoy())} className={btnSecundario}>Hoy</Link>
            <Link href={url(vista, sumarDias(fecha, paso))} className={`${btnSecundario} px-3`} aria-label="Siguiente">›</Link>
            <form action="/admin/agenda" className="hidden sm:block">
              <input type="hidden" name="vista" value={vista} />
              <input type="date" name="fecha" defaultValue={fecha} className="rounded-xl border border-salvia bg-white px-3 py-2.5 text-sm" />
              <button className="sr-only">Ir</button>
            </form>
          </div>
        )}
      </div>

      {vista === "dia" && <VistaDia sb={sb} fecha={fecha} />}
      {vista === "semana" && <VistaSemana sb={sb} fecha={fecha} />}
      {vista === "proximas" && <VistaProximas sb={sb} />}
    </div>
  );
}

type SB = Awaited<ReturnType<typeof requerirAdmin>>["sb"];

async function VistaDia({ sb, fecha }: { sb: SB; fecha: string }) {
  const r = rangoDias(fecha);
  const citas = await citasEntre(sb, r.desde, r.hasta);
  return (
    <section>
      <h2 className="mb-3 font-serif text-3xl text-carbon first-letter:uppercase">{fechaLarga(fecha)}</h2>
      {citas.length === 0 ? (
        <div className={`${tarjeta} text-center text-gris`}>
          <p>Sin citas este día.</p>
          <Link href={`/admin/agenda/nueva?fecha=${fecha}`} className="mt-2 inline-block text-taupe-oscuro underline underline-offset-4">Agendar una cita</Link>
        </div>
      ) : (
        <ul className="space-y-3">{citas.map((c) => <TarjetaCita key={c.id} c={c} />)}</ul>
      )}
    </section>
  );
}

async function VistaSemana({ sb, fecha }: { sb: SB; fecha: string }) {
  const lunes = lunesDe(fecha);
  const r = rangoDias(lunes, 7);
  const citas = await citasEntre(sb, r.desde, r.hasta);
  const dias = Array.from({ length: 6 }, (_, i) => sumarDias(lunes, i)); // lunes a sábado
  const domingo = citas.filter((c) => fechaLocal(c.inicio) === sumarDias(lunes, 6));
  const fHoy = hoy();

  return (
    <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
      {dias.map((d) => {
        const delDia = citas.filter((c) => fechaLocal(c.inicio) === d);
        return (
          <div key={d} className={`rounded-2xl bg-white p-3 ring-1 ${d === fHoy ? "ring-2 ring-taupe-oscuro" : "ring-salvia/50"}`}>
            <Link href={`/admin/agenda?vista=dia&fecha=${d}`} className="mb-2 flex items-baseline justify-between">
              <span className="font-medium capitalize text-carbon">{fechaCorta(d)}</span>
              <span className="text-xs text-gris">{delDia.filter((c) => c.estado !== "cancelada").length} citas</span>
            </Link>
            <ul className="space-y-1.5">
              {delDia.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/admin/agenda/${c.id}`}
                    className={`block rounded-lg px-2 py-1.5 text-xs leading-snug hover:ring-1 hover:ring-taupe-oscuro ${c.estado === "cancelada" || c.estado === "no_asistio" ? "bg-stone-100 text-stone-500 line-through" : c.estado === "pendiente_sena" ? "bg-amber-50" : "bg-emerald-50"}`}
                  >
                    <span className="font-semibold">{horaLocal(c.inicio)}</span> {c.clienta?.nombre}
                    <span className="block text-gris">{nombreItem(c)}</span>
                  </Link>
                </li>
              ))}
              {delDia.length === 0 && <li className="text-xs text-gris">Libre</li>}
            </ul>
            <Link href={`/admin/agenda/nueva?fecha=${d}`} className="mt-2 block text-center text-xs text-taupe-oscuro">+ agregar</Link>
          </div>
        );
      })}
      {domingo.length > 0 && <p className="text-sm text-gris md:col-span-3 xl:col-span-6">Hay {domingo.length} cita(s) el domingo.</p>}
    </section>
  );
}

async function VistaProximas({ sb }: { sb: SB }) {
  const { desde, hasta } = desdeAhora(60);
  const citas = (await citasEntre(sb, desde, hasta)).filter((c) => c.estado === "pendiente_sena" || c.estado === "confirmada");
  const porDia = new Map<string, CitaFila[]>();
  citas.forEach((c) => {
    const f = fechaLocal(c.inicio);
    porDia.set(f, [...(porDia.get(f) ?? []), c]);
  });
  if (citas.length === 0) return <p className={`${tarjeta} text-gris`}>No hay citas próximas en los siguientes 60 días.</p>;
  return (
    <div className="space-y-6">
      {[...porDia.entries()].map(([f, lista]) => (
        <section key={f}>
          <h2 className="mb-2 font-serif text-2xl text-carbon first-letter:uppercase">{fechaLarga(f)}</h2>
          <ul className="space-y-3">{lista.map((c) => <TarjetaCita key={c.id} c={c} />)}</ul>
        </section>
      ))}
    </div>
  );
}

function TarjetaCita({ c }: { c: CitaFila }) {
  const apagada = c.estado === "cancelada" || c.estado === "no_asistio";
  return (
    <li>
      <Link href={`/admin/agenda/${c.id}`} className={`${tarjeta} flex items-start gap-4 hover:ring-taupe-oscuro ${apagada ? "opacity-60" : ""}`}>
        <div className="w-14 shrink-0 text-center">
          <p className="font-serif text-2xl leading-none text-carbon">{horaLocal(c.inicio)}</p>
          <p className="mt-1 text-xs text-gris">a {horaLocal(c.fin)}</p>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-medium text-carbon">{c.clienta?.nombre}</span>
            <Estado estado={c.estado} />
          </div>
          <p className="text-sm text-gris">{nombreItem(c)}</p>
          <p className="mt-1 text-xs text-gris">
            {c.sena_pagada ? "Seña pagada" : "Sin seña"}
            {c.recordatorio_enviado ? " · Recordatorio enviado" : ""}
          </p>
        </div>
        <span className="self-center text-gris" aria-hidden="true">›</span>
      </Link>
    </li>
  );
}
