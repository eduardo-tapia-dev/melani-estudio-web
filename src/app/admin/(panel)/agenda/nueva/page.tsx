import Link from "next/link";
import { requerirAdmin } from "@/lib/supabase/servidor";
import { catalogoAgenda } from "@/lib/admin-datos";
import { hoy } from "@/lib/tiempo";
import { tituloPagina } from "@/components/admin/estilos";
import FormularioCita from "./FormularioCita";

export default async function NuevaCita({ searchParams }: PageProps<"/admin/agenda/nueva">) {
  const { sb } = await requerirAdmin();
  const sp = await searchParams;
  const fecha = typeof sp.fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.fecha) && sp.fecha >= hoy() ? sp.fecha : hoy();
  const { servicios, cursos, config } = await catalogoAgenda(sb);

  let clienta: { id: string; nombre: string; telefono: string } | null = null;
  if (typeof sp.clienta === "string") {
    const { data } = await sb.from("clientas").select("id, nombre, telefono").eq("id", sp.clienta).maybeSingle();
    clienta = data;
  }

  return (
    <div className="space-y-6">
      <header>
        <Link href="/admin/agenda" className="mb-1 inline-flex items-center gap-1.5 py-1 text-[15px] text-gris transition-colors hover:text-carbon">← Agenda</Link>
        <h1 className={tituloPagina}>Agendar una cita</h1>
        <p className="mt-1 text-[15px] text-gris">Completá los 4 pasos. Los horarios que se ven ya están libres.</p>
      </header>
      <FormularioCita
        servicios={servicios.map((s) => ({ id: s.id, nombre: s.nombre, duracion: s.duracion_min, grupo: s.categoria?.nombre ?? "Servicios" }))}
        cursos={cursos.map((c) => ({ id: c.id, nombre: c.nombre, duracion: c.duracion_min, grupo: "Cursos" }))}
        fechaInicial={fecha}
        hoy={hoy()}
        senaDefault={config.sena_monto}
        diasAtencion={config.dias_atencion}
        clientaInicial={clienta}
      />
    </div>
  );
}
