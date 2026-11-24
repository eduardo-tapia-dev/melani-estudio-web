import Link from "next/link";
import { requerirAdmin } from "@/lib/supabase/servidor";
import { citasEntre, nombreItem, plantilla, type CitaFila } from "@/lib/admin-datos";
import { fechaLarga, horaLocal, hoy, mesActual, nombreMes, rangoDias, saludoDelMomento, sumarDias } from "@/lib/tiempo";
import { resumenMes } from "@/lib/resumen";
import { formatoGs } from "@/lib/formato";
import { linkWhatsapp, rellenar } from "@/lib/whatsapp";
import ActivarAvisos from "@/components/admin/ActivarAvisos";
import Estado from "@/components/admin/Estado";
import Icono, { type NombreIcono } from "@/components/admin/Iconos";
import { BotonConfirmar, BotonRecordatorio } from "@/components/admin/AccionesRapidas";
import { tarjeta } from "@/components/admin/estilos";

export default async function Inicio() {
  const { sb } = await requerirAdmin();
  const fHoy = hoy();
  const fManana = sumarDias(fHoy, 1);
  const r = rangoDias(fHoy, 2);
  const [citas, textoRecordatorio, resumen, { count: resenasPendientes }] = await Promise.all([
    citasEntre(sb, r.desde, r.hasta, true),
    plantilla(sb, "recordatorio"),
    resumenMes(sb, mesActual()),
    sb.from("resenas").select("id", { count: "exact", head: true }).eq("estado", "pendiente"),
  ]);

  const inicioManana = rangoDias(fManana).desde;
  const deHoy = citas.filter((c) => c.inicio < inicioManana);
  const deManana = citas.filter((c) => c.inicio >= inicioManana && c.estado !== "atendida");
  const enviados = deManana.filter((c) => c.recordatorio_enviado).length;
  const pendientesHoy = deHoy.filter((c) => c.estado !== "atendida").length;

  const mensaje = (c: CitaFila) =>
    rellenar(textoRecordatorio, { nombre: c.clienta?.nombre.split(" ")[0] ?? "", servicio: nombreItem(c), fecha: fechaLarga(fManana), hora: horaLocal(c.inicio) });

  const resumenDia =
    deHoy.length === 0
      ? "Hoy no tenés citas agendadas."
      : `Hoy tenés ${deHoy.length} cita${deHoy.length > 1 ? "s" : ""}${pendientesHoy && pendientesHoy < deHoy.length ? ` (te falta${pendientesHoy > 1 ? "n" : ""} ${pendientesHoy})` : ""}.`;

  return (
    <div className="space-y-10">
      {/* Saludo */}
      <header>
        <p className="text-[15px] text-gris first-letter:uppercase">{fechaLarga(fHoy)}</p>
        <h1 className="mt-1 font-serif text-[2.6rem] leading-[1.05] tracking-tight text-carbon sm:text-6xl">
          {saludoDelMomento()}, <em className="italic text-taupe-oscuro">Melani</em>
        </h1>
        <p className="mt-3 text-[17px] text-gris">
          {resumenDia} {deManana.length > 0 ? `Mañana: ${deManana.length}.` : ""}
        </p>
      </header>

      {/* Avisos importantes */}
      {((resenasPendientes ?? 0) > 0 || (deManana.length > 0 && enviados < deManana.length)) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {deManana.length > 0 && enviados < deManana.length && (
            <a href="#manana" className="flex items-center gap-4 rounded-3xl bg-amber-50 p-4 ring-1 ring-amber-200 transition-colors hover:bg-amber-100/70">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-700"><Icono nombre="campana" /></span>
              <span className="text-[15px] leading-snug text-amber-950">
                <strong className="font-medium">Faltan {deManana.length - enviados} recordatorio{deManana.length - enviados > 1 ? "s" : ""}</strong>
                <span className="block text-amber-900/80">para las citas de mañana</span>
              </span>
              <Icono nombre="flecha" className="ml-auto size-5 text-amber-700" />
            </a>
          )}
          {(resenasPendientes ?? 0) > 0 && (
            <Link href="/admin/contenido/resenas" className="flex items-center gap-4 rounded-3xl bg-white p-4 ring-1 ring-salvia/50 transition-colors hover:ring-carbon">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#f6efe1] text-[#a2741c]"><Icono nombre="estrella" /></span>
              <span className="text-[15px] leading-snug text-carbon">
                <strong className="font-medium">{resenasPendientes} reseña{resenasPendientes === 1 ? "" : "s"} nueva{resenasPendientes === 1 ? "" : "s"}</strong>
                <span className="block text-gris">Revisalas para publicarlas</span>
              </span>
              <Icono nombre="flecha" className="ml-auto size-5 text-gris" />
            </Link>
          )}
        </div>
      )}

      {/* Accesos rápidos */}
      <section aria-label="Accesos rápidos" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Acceso href="/admin/agenda/nueva" icono="mas2" titulo="Agendar cita" detalle="Una clienta te escribió" oscuro />
        <Acceso href="/admin/agenda" icono="agenda" titulo="Ver la agenda" detalle="Día, semana y próximas" />
        <Acceso href="/admin/clientas" icono="clientas" titulo="Buscar clienta" detalle="Datos e historial" />
        <Acceso href="/admin/finanzas" icono="dinero" titulo={formatoGs(resumen.bolsillo)} detalle={`Tu bolsillo en ${nombreMes(mesActual()).split(" ")[0]}`} />
      </section>

      {/* Hoy */}
      <section aria-labelledby="t-hoy">
        <Titulo id="t-hoy" titulo="Hoy" enlace={{ href: `/admin/agenda?vista=dia&fecha=${fHoy}`, texto: "Ver en la agenda" }} />
        {deHoy.length === 0 ? (
          <Vacio icono="agenda" texto="No hay citas para hoy." accion={{ href: "/admin/agenda/nueva", texto: "Agendar una cita" }} />
        ) : (
          <ol className="relative space-y-3 before:absolute before:bottom-6 before:left-[1.85rem] before:top-6 before:w-px before:bg-salvia sm:before:left-[2.1rem]">
            {deHoy.map((c) => (
              <li key={c.id} className="relative">
                <Link href={`/admin/agenda/${c.id}`} className={`${tarjeta} flex items-center gap-4 !p-4 transition-shadow hover:shadow-md sm:!p-5 ${c.estado === "atendida" ? "opacity-70" : ""}`}>
                  <span className={`relative z-10 flex size-[2.75rem] shrink-0 flex-col items-center justify-center rounded-2xl text-center ${c.estado === "atendida" ? "bg-salvia-claro text-gris" : "bg-carbon text-hueso"}`}>
                    {c.estado === "atendida" ? <Icono nombre="check" className="size-5" /> : <span className="text-[13px] font-semibold tabular-nums">{horaLocal(c.inicio)}</span>}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[17px] font-medium text-carbon">{c.clienta?.nombre}</span>
                    <span className="block truncate text-[15px] text-gris">
                      {horaLocal(c.inicio)} a {horaLocal(c.fin)} · {nombreItem(c)}
                    </span>
                  </span>
                  <span className="hidden sm:block"><Estado estado={c.estado} /></span>
                  {c.estado !== "atendida" && c.estado !== "cancelada" && c.estado !== "no_asistio" && (
                    <span className="rounded-full bg-salvia-claro px-3.5 py-2 text-sm font-medium text-carbon">Cobrar</span>
                  )}
                  <Icono nombre="flecha" className="size-5 shrink-0 text-gris" />
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Mañana: recordatorios */}
      <section aria-labelledby="t-manana" id="manana" className="scroll-mt-6">
        <Titulo id="t-manana" titulo="Mañana" detalle={<span className="inline-block first-letter:uppercase">{fechaLarga(fManana)}</span>} />
        {deManana.length === 0 ? (
          <Vacio icono="reloj" texto="Todavía no hay citas para mañana." />
        ) : (
          <>
            <div className={`${tarjeta} mb-3 !py-4`}>
              <div className="mb-2 flex items-center justify-between text-[15px]">
                <span className="text-carbon">Recordatorios enviados</span>
                <span className="font-medium tabular-nums text-carbon">
                  {enviados} de {deManana.length}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-salvia-claro" role="progressbar" aria-valuenow={enviados} aria-valuemin={0} aria-valuemax={deManana.length}>
                <div className="h-full rounded-full bg-emerald-600 transition-all duration-700" style={{ width: `${(enviados / deManana.length) * 100}%` }} />
              </div>
              <p className="mt-2 text-sm text-gris">
                {enviados === deManana.length ? "¡Listo! Ya les avisaste a todas. 🎉" : "Tocá “Enviar recordatorio”: se abre WhatsApp con el mensaje escrito y solo tenés que mandarlo."}
              </p>
            </div>
            <ul className="space-y-3">
              {deManana.map((c) => (
                <li key={c.id} className={`${tarjeta} !p-4 sm:!p-5`}>
                  <div className="flex items-start gap-4">
                    <span className="flex size-[2.75rem] shrink-0 items-center justify-center rounded-2xl bg-salvia-claro text-[13px] font-semibold tabular-nums text-carbon">{horaLocal(c.inicio)}</span>
                    <Link href={`/admin/agenda/${c.id}`} className="min-w-0 flex-1">
                      <span className="block truncate text-[17px] font-medium text-carbon">{c.clienta?.nombre}</span>
                      <span className="block truncate text-[15px] text-gris">{nombreItem(c)}</span>
                    </Link>
                    <Estado estado={c.estado} />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {c.clienta && <BotonRecordatorio citaId={c.id} href={linkWhatsapp(c.clienta.telefono, mensaje(c))} enviado={c.recordatorio_enviado} />}
                    {c.estado === "pendiente_sena" && <BotonConfirmar citaId={c.id} />}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <ActivarAvisos />
    </div>
  );
}

function Acceso({ href, icono, titulo, detalle, oscuro }: { href: string; icono: NombreIcono; titulo: string; detalle: string; oscuro?: boolean }) {
  return (
    <Link
      href={href}
      className={`group flex min-h-36 flex-col justify-between rounded-3xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${
        oscuro ? "bg-carbon text-hueso shadow-md shadow-carbon/15" : "bg-white text-carbon shadow-sm ring-1 ring-salvia/40"
      }`}
    >
      <span className={`flex size-11 items-center justify-center rounded-2xl ${oscuro ? "bg-hueso/15" : "bg-salvia-claro"}`}>
        <Icono nombre={icono} />
      </span>
      <span>
        <span className="block text-[17px] font-medium leading-tight">{titulo}</span>
        <span className={`mt-0.5 block text-sm ${oscuro ? "text-hueso/70" : "text-gris"}`}>{detalle}</span>
      </span>
    </Link>
  );
}

function Titulo({ id, titulo, detalle, enlace }: { id: string; titulo: string; detalle?: React.ReactNode; enlace?: { href: string; texto: string } }) {
  return (
    <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
      <h2 id={id} className="font-serif text-3xl text-carbon">
        {titulo} {detalle && <span className="ml-1 font-sans text-[15px] text-gris">{detalle}</span>}
      </h2>
      {enlace && (
        <Link href={enlace.href} className="text-[15px] font-medium text-taupe-oscuro underline-offset-4 hover:underline">
          {enlace.texto} →
        </Link>
      )}
    </div>
  );
}

function Vacio({ icono, texto, accion }: { icono: NombreIcono; texto: string; accion?: { href: string; texto: string } }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-salvia bg-white/50 px-6 py-10 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-salvia-claro text-gris"><Icono nombre={icono} /></span>
      <p className="text-[17px] text-gris">{texto}</p>
      {accion && (
        <Link href={accion.href} className="text-[15px] font-medium text-taupe-oscuro underline underline-offset-4">
          {accion.texto}
        </Link>
      )}
    </div>
  );
}
