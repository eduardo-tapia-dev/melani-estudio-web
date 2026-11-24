import Link from "next/link";
import { notFound } from "next/navigation";
import { requerirAdmin } from "@/lib/supabase/servidor";
import { SELECT_CITA, nombreItem, plantilla, type CitaFila } from "@/lib/admin-datos";
import { fechaLarga, fechaLocal, horaLocal, hoy, sumarDias } from "@/lib/tiempo";
import { linkWhatsapp, rellenar } from "@/lib/whatsapp";
import { formatoGs } from "@/lib/formato";
import Estado from "@/components/admin/Estado";
import { BotonRecordatorio } from "@/components/admin/AccionesRapidas";
import { tarjeta } from "@/components/admin/estilos";
import Icono from "@/components/admin/Iconos";
import { IconoWhatsapp } from "@/components/landing/Iconos";
import type { EstadoCita } from "@/lib/admin-datos";
import AccionesCita from "./AccionesCita";

export default async function DetalleCita({ params, searchParams }: PageProps<"/admin/agenda/[id]">) {
  const { sb } = await requerirAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const { data } = await sb.from("citas").select(SELECT_CITA).eq("id", id).maybeSingle();
  if (!data) notFound();
  const c = data as unknown as CitaFila;
  const [{ data: cfg }, { data: valor }] = await Promise.all([
    sb.from("configuracion").select("sena_monto").eq("id", 1).single(),
    c.servicio ? sb.from("servicio_valores").select("valor_referencia").eq("servicio_id", c.servicio.id).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  const fecha = fechaLocal(c.inicio);
  const esManana = fecha === sumarDias(hoy(), 1);
  const textoRecordatorio = esManana ? await plantilla(sb, "recordatorio") : "";
  const tel = c.clienta?.telefono ?? "";

  return (
    <div className="space-y-5">
      <header>
        <Link href={`/admin/agenda?vista=dia&fecha=${fecha}`} className="mb-1 inline-flex items-center gap-1.5 py-1 text-[15px] text-gris transition-colors hover:text-carbon">← Agenda del {fechaLarga(fecha)}</Link>
        {sp.nueva && (
          <p className="mt-3 flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3.5 text-[15px] text-emerald-900 ring-1 ring-emerald-200">
            <Icono nombre="check" className="size-5" /> ¡Listo! La cita quedó agendada.
          </p>
        )}
      </header>

      {/* Resumen de la cita */}
      <section className="overflow-hidden rounded-3xl bg-carbon text-hueso shadow-lg shadow-carbon/15">
        <div className="flex flex-wrap items-start justify-between gap-4 p-6 sm:p-7">
          <div>
            <p className="text-[15px] text-hueso/70 first-letter:uppercase">{fechaLarga(fecha)}</p>
            <p className="font-serif text-5xl leading-none tracking-tight">
              {horaLocal(c.inicio)} <span className="text-2xl text-hueso/60">a {horaLocal(c.fin)}</span>
            </p>
            <h1 className="mt-4 font-serif text-3xl leading-tight">{c.clienta?.nombre}</h1>
            <p className="text-[16px] text-hueso/80">{nombreItem(c)}</p>
          </div>
          <Estado estado={c.estado} />
        </div>
        <div className="grid grid-cols-2 border-t border-hueso/10 text-[15px]">
          <a href={linkWhatsapp(tel)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-4 transition-colors hover:bg-hueso/5">
            <IconoWhatsapp className="size-5" /> Escribirle
          </a>
          <Link href={`/admin/clientas/${c.clienta?.id}`} className="flex items-center justify-center gap-2 border-l border-hueso/10 py-4 transition-colors hover:bg-hueso/5">
            <Icono nombre="clientas" className="size-5" /> Ver su ficha
          </Link>
        </div>
      </section>

      {/* Próximo paso, en palabras simples */}
      <PasoSiguiente estado={c.estado} senaPagada={c.sena_pagada} yaPaso={fecha <= hoy()} />

      <section className={`${tarjeta} grid grid-cols-2 gap-4 sm:grid-cols-4`}>
        <Dato titulo="Seña" valor={c.sena_pagada ? `${formatoGs(c.sena_monto)}` : "Sin pagar"} detalle={c.sena_pagada ? c.sena_medio ?? "" : undefined} />
        <Dato titulo="Recordatorio" valor={c.recordatorio_enviado ? "Enviado ✓" : "No enviado"} />
        {c.estado === "atendida" && <Dato titulo="Cobrado en total" valor={formatoGs(c.monto_total)} detalle={c.medio_pago ?? undefined} />}
        {c.notas && <Dato titulo="Notas" valor={c.notas} />}
      </section>

      {esManana && c.clienta && (c.estado === "pendiente_sena" || c.estado === "confirmada") && (
        <section className={tarjeta}>
          <h2 className="mb-3 font-medium text-carbon">Recordatorio (la cita es mañana)</h2>
          <BotonRecordatorio
            citaId={c.id}
            enviado={c.recordatorio_enviado}
            href={linkWhatsapp(tel, rellenar(textoRecordatorio, { nombre: c.clienta.nombre.split(" ")[0], servicio: nombreItem(c), fecha: fechaLarga(fecha), hora: horaLocal(c.inicio) }))}
          />
        </section>
      )}

      <AccionesCita
        cita={{
          id: c.id,
          estado: c.estado,
          fecha,
          hora: horaLocal(c.inicio),
          duracion: Math.round((new Date(c.fin).getTime() - new Date(c.inicio).getTime()) / 60000),
          sena_pagada: c.sena_pagada,
          sena_monto: c.sena_monto,
          sena_fecha: c.sena_fecha,
          sena_medio: c.sena_medio,
          notas: c.notas ?? "",
          monto_total: c.monto_total,
          medio_pago: c.medio_pago,
        }}
        valorReferencia={valor?.valor_referencia ?? null}
        hoy={hoy()}
        senaDefault={cfg?.sena_monto ?? 50000}
      />
    </div>
  );
}

function Dato({ titulo, valor, detalle }: { titulo: string; valor: React.ReactNode; detalle?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[13px] uppercase tracking-wider text-gris">{titulo}</p>
      <div className="mt-1 text-[17px] text-carbon">{valor}</div>
      {detalle && <p className="text-sm capitalize text-gris">{detalle}</p>}
    </div>
  );
}

/** Le dice a Melani, con palabras simples, qué falta hacer con esta cita. */
function PasoSiguiente({ estado, senaPagada, yaPaso }: { estado: EstadoCita; senaPagada: boolean; yaPaso: boolean }) {
  let texto: string;
  let boton: { href: string; texto: string } | null = null;
  let tono = "bg-white ring-salvia/50";
  if (estado === "atendida") {
    texto = "Esta cita ya está cobrada. ¡Todo listo!";
    tono = "bg-emerald-50 ring-emerald-200";
  } else if (estado === "cancelada" || estado === "no_asistio") {
    texto = estado === "cancelada" ? "Esta cita está cancelada. El horario quedó libre." : "La clienta no vino. Podés reactivar la cita si se reprograma.";
    tono = "bg-stone-50 ring-stone-200";
  } else if (yaPaso) {
    texto = "Cuando termines de atenderla, anotá cuánto te pagó.";
    boton = { href: "#cobro", texto: "Cobrar esta cita" };
    tono = "bg-[#f6efe1] ring-[#e8d7b5]";
  } else if (!senaPagada) {
    texto = "Todavía no pagó la seña. Cuando te transfiera, registrala acá.";
    boton = { href: "#sena", texto: "Registrar la seña" };
    tono = "bg-amber-50 ring-amber-200";
  } else {
    texto = "Todo en orden: la seña está pagada. El día anterior te aviso para mandarle el recordatorio.";
    tono = "bg-emerald-50 ring-emerald-200";
  }
  return (
    <section className={`flex flex-col gap-4 rounded-3xl p-5 ring-1 sm:flex-row sm:items-center sm:justify-between ${tono}`} aria-label="Próximo paso">
      <p className="flex items-start gap-3 text-[16px] leading-snug text-carbon">
        <Icono nombre={estado === "atendida" ? "check" : "ayuda"} className="mt-0.5 size-5 shrink-0" />
        {texto}
      </p>
      {boton && (
        <a href={boton.href} className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-full bg-carbon px-6 text-[15px] font-medium text-hueso hover:bg-taupe-oscuro">
          {boton.texto}
        </a>
      )}
    </section>
  );
}
