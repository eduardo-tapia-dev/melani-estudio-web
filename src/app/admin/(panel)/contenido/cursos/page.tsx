import Link from "next/link";
import { requerirAdmin } from "@/lib/supabase/servidor";
import { tituloPagina } from "@/components/admin/estilos";
import EditorCursos from "./EditorCursos";

export default async function Cursos() {
  const { sb } = await requerirAdmin();
  const { data } = await sb.from("cursos").select("id, nombre, descripcion, incluye, no_incluye, modalidad, foto_url, duracion_min, visible, orden").order("orden");
  return (
    <div className="space-y-6">
      <header>
        <Link href="/admin/contenido" className="mb-1 inline-flex items-center gap-1.5 py-1 text-[15px] text-gris transition-colors hover:text-carbon">← Mi página web</Link>
        <h1 className={tituloPagina}>Cursos</h1>
      </header>
      <EditorCursos cursos={data ?? []} />
    </div>
  );
}
