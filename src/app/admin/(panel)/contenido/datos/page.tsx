import Link from "next/link";
import { requerirAdmin } from "@/lib/supabase/servidor";
import { tituloPagina } from "@/components/admin/estilos";
import EditorDatos from "./EditorDatos";

export default async function Datos() {
  const { sb } = await requerirAdmin();
  const { data } = await sb
    .from("configuracion")
    .select("whatsapp, instagram_url, tiktok_url, direccion, ciudad, google_maps_url, ubicacion_lat, ubicacion_lng, horario_texto, hora_apertura, hora_cierre, dias_atencion, margen_min, duracion_default_min, sena_monto, medios_pago_texto")
    .eq("id", 1)
    .single();
  return (
    <div className="space-y-6">
      <header>
        <Link href="/admin/contenido" className="mb-1 inline-flex items-center gap-1.5 py-1 text-[15px] text-gris transition-colors hover:text-carbon">← Mi página web</Link>
        <h1 className={tituloPagina}>Datos del negocio</h1>
      </header>
      {data && <EditorDatos datos={{ ...data, hora_apertura: data.hora_apertura.slice(0, 5), hora_cierre: data.hora_cierre.slice(0, 5), google_maps_url: data.google_maps_url ?? "" }} />}
    </div>
  );
}
