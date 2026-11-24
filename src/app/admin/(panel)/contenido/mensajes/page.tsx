import Link from "next/link";
import { requerirAdmin } from "@/lib/supabase/servidor";
import { tituloPagina } from "@/components/admin/estilos";
import EditorMensajes from "./EditorMensajes";

export default async function Mensajes() {
  const { sb } = await requerirAdmin();
  const [{ data }, { data: cfg }] = await Promise.all([
    sb.from("plantillas_mensaje").select("clave, descripcion, texto").order("clave"),
    sb.from("configuracion").select("whatsapp").eq("id", 1).single(),
  ]);
  return (
    <div className="space-y-6">
      <header>
        <Link href="/admin/contenido" className="mb-1 inline-flex items-center gap-1.5 py-1 text-[15px] text-gris transition-colors hover:text-carbon">← Mi página web</Link>
        <h1 className={tituloPagina}>Mensajes de WhatsApp</h1>
        <p className="mt-2 text-sm text-gris">Las palabras entre llaves, como {"{servicio}"}, se reemplazan solas. Usá *asteriscos* para negrita en WhatsApp.</p>
      </header>
      <EditorMensajes plantillas={data ?? []} whatsapp={cfg?.whatsapp ?? ""} />
    </div>
  );
}
