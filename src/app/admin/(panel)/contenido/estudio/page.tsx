import Link from "next/link";
import { requerirAdmin } from "@/lib/supabase/servidor";
import { tituloPagina } from "@/components/admin/estilos";
import EditorEstudio from "./EditorEstudio";

export default async function FotosEstudio() {
  const { sb } = await requerirAdmin();
  const [{ data: fotos }, { data: textos }] = await Promise.all([
    sb.from("estudio_fotos").select("id, url, descripcion, visible, orden").order("orden").order("creado_en"),
    sb.from("contenido_sitio").select("clave, valor").in("clave", ["estudio_titulo", "estudio_texto"]),
  ]);
  const t = Object.fromEntries((textos ?? []).map((r) => [r.clave, r.valor]));
  return (
    <div className="space-y-6">
      <header>
        <Link href="/admin/contenido" className="mb-1 inline-flex items-center gap-1.5 py-1 text-[15px] text-gris transition-colors hover:text-carbon">← Mi página web</Link>
        <h1 className={tituloPagina}>Fotos del estudio</h1>
        <p className="mt-2 text-sm text-gris">
          Se muestran en la sección “El estudio” del sitio. Mientras no haya fotos visibles, la sección no aparece.
        </p>
      </header>
      <EditorEstudio fotos={fotos ?? []} titulo={t.estudio_titulo ?? ""} texto={t.estudio_texto ?? ""} />
    </div>
  );
}
