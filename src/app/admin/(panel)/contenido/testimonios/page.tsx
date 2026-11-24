import Link from "next/link";
import { requerirAdmin } from "@/lib/supabase/servidor";
import { tituloPagina } from "@/components/admin/estilos";
import EditorTestimonios from "./EditorTestimonios";

export default async function Testimonios() {
  const { sb } = await requerirAdmin();
  const { data } = await sb.from("testimonios").select("id, tipo, foto_url, texto, autora, visible, orden").order("orden");
  return (
    <div className="space-y-6">
      <header>
        <Link href="/admin/contenido" className="mb-1 inline-flex items-center gap-1.5 py-1 text-[15px] text-gris transition-colors hover:text-carbon">← Mi página web</Link>
        <h1 className={tituloPagina}>Resultados y testimonios</h1>
      </header>
      <EditorTestimonios testimonios={data ?? []} />
    </div>
  );
}
