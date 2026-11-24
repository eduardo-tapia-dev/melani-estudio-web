import Link from "next/link";
import { notFound } from "next/navigation";
import { requerirAdmin } from "@/lib/supabase/servidor";
import { SELECT_CITA, nombreItem, type CitaFila } from "@/lib/admin-datos";
import { formatoGs } from "@/lib/formato";
import { fechaCorta, fechaLocal, horaLocal } from "@/lib/tiempo";
import { linkWhatsapp } from "@/lib/whatsapp";
import Estado from "@/components/admin/Estado";
import { btnPrimario, btnSecundario, tarjeta, tituloPagina } from "@/components/admin/estilos";
import EditarClienta from "./EditarClienta";

export default async function FichaClienta({ params }: PageProps<"/admin/clientas/[id]">) {
  const { sb } = await requerirAdmin();
  const { id } = await params;
  const [{ data: clienta }, { data: citasData }] = await Promise.all([
    sb.from("clientas_resumen").select("*").eq("id", id).maybeSingle(),
    sb.from("citas").select(SELECT_CITA).eq("clienta_id", id).order("inicio", { ascending: false }).limit(100),
  ]);
  if (!clienta) notFound();
  const citas = (citasData ?? []) as unknown as CitaFila[];

  return (
    <div className="space-y-6">
      <header>
        <Link href="/admin/clientas" className="mb-1 inline-flex items-center gap-1.5 py-1 text-[15px] text-gris transition-colors hover:text-carbon">← Clientas</Link>
        <h1 className={tituloPagina}>{clienta.nombre}</h1>
        <p className="text-gris">0{clienta.telefono.slice(3)}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={`/admin/agenda/nueva?clienta=${clienta.id}`} className={btnPrimario}>+ Agendar cita</Link>
          <a href={linkWhatsapp(clienta.telefono)} target="_blank" rel="noopener noreferrer" className={btnSecundario}>Abrir WhatsApp</a>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className={tarjeta}>
          <p className="text-xs uppercase tracking-wider text-gris">Total gastado</p>
          <p className="mt-1 font-serif text-2xl text-carbon">{formatoGs(clienta.total_gastado)}</p>
        </div>
        <div className={tarjeta}>
          <p className="text-xs uppercase tracking-wider text-gris">Visitas</p>
          <p className="mt-1 font-serif text-2xl text-carbon">{clienta.citas_atendidas}</p>
        </div>
        <div className={`${tarjeta} col-span-2 sm:col-span-1`}>
          <p className="text-xs uppercase tracking-wider text-gris">Última visita</p>
          <p className="mt-1 font-serif text-2xl text-carbon">{clienta.ultima_visita ? fechaCorta(fechaLocal(clienta.ultima_visita)) : "—"}</p>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-serif text-2xl text-carbon">Historial de citas</h2>
        {citas.length === 0 ? (
          <p className={`${tarjeta} text-gris`}>Sin citas todavía.</p>
        ) : (
          <ul className="divide-y divide-salvia/50 overflow-hidden rounded-2xl bg-white ring-1 ring-salvia/50">
            {citas.map((c) => (
              <li key={c.id}>
                <Link href={`/admin/agenda/${c.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-salvia-claro/50">
                  <div>
                    <p className="text-carbon">{nombreItem(c)}</p>
                    <p className="text-sm capitalize text-gris">{fechaCorta(fechaLocal(c.inicio))} · {horaLocal(c.inicio)}</p>
                  </div>
                  <div className="text-right">
                    <Estado estado={c.estado} />
                    {c.monto_total ? <p className="mt-1 text-sm text-carbon">{formatoGs(c.monto_total)}</p> : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <EditarClienta clienta={{ id: clienta.id, nombre: clienta.nombre, telefono: clienta.telefono, notas: clienta.notas ?? "" }} />
    </div>
  );
}
