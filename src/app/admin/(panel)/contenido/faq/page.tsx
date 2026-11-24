import Link from "next/link";
import { requerirAdmin } from "@/lib/supabase/servidor";
import { tituloPagina } from "@/components/admin/estilos";
import EditorFaq from "./EditorFaq";

export default async function Faq() {
  const { sb } = await requerirAdmin();
  const { data } = await sb.from("faq").select("pregunta, respuesta, visible").order("orden");
  return (
    <div className="space-y-6">
      <header>
        <Link href="/admin/contenido" className="mb-1 inline-flex items-center gap-1.5 py-1 text-[15px] text-gris transition-colors hover:text-carbon">← Mi página web</Link>
        <h1 className={tituloPagina}>Preguntas frecuentes</h1>
        <p className="mt-2 text-sm text-gris">
          Podés usar <code className="rounded bg-salvia-claro px-1">{"{sena}"}</code>, <code className="rounded bg-salvia-claro px-1">{"{medios_pago}"}</code>,{" "}
          <code className="rounded bg-salvia-claro px-1">{"{horario}"}</code> y <code className="rounded bg-salvia-claro px-1">{"{direccion}"}</code>: se completan solos con los datos del negocio.
        </p>
      </header>
      <EditorFaq inicial={data ?? []} />
    </div>
  );
}
