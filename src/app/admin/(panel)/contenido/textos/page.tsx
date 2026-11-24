import Link from "next/link";
import { requerirAdmin } from "@/lib/supabase/servidor";
import { tituloPagina } from "@/components/admin/estilos";
import EditorTextos from "./EditorTextos";

export default async function Textos() {
  const { sb } = await requerirAdmin();
  const { data } = await sb.from("contenido_sitio").select("clave, valor");
  const valores = Object.fromEntries((data ?? []).map((r) => [r.clave, r.valor]));
  return (
    <div className="space-y-6">
      <header>
        <Link href="/admin/contenido" className="mb-1 inline-flex items-center gap-1.5 py-1 text-[15px] text-gris transition-colors hover:text-carbon">← Mi página web</Link>
        <h1 className={tituloPagina}>Textos de la página</h1>
      </header>
      <EditorTextos valores={valores} />
    </div>
  );
}
