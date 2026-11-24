import Link from "next/link";
import { notFound } from "next/navigation";
import { requerirAdmin } from "@/lib/supabase/servidor";
import { tituloPagina } from "@/components/admin/estilos";
import EditorServicio from "./EditorServicio";

export default async function EditarServicio({ params }: PageProps<"/admin/contenido/servicios/[id]">) {
  const { sb } = await requerirAdmin();
  const { id } = await params;
  const { data: categorias } = await sb.from("categorias").select("id, nombre").order("orden");

  let servicio = null;
  let fotos: { id: string; url: string; orden: number }[] = [];
  let valor: number | null = null;
  if (id !== "nuevo") {
    const [{ data: s }, { data: f }, { data: v }] = await Promise.all([
      sb.from("servicios").select("id, nombre, categoria_id, descripcion, beneficios, duracion_resultado, duracion_min, visible, orden").eq("id", id).maybeSingle(),
      sb.from("servicio_fotos").select("id, url, orden").eq("servicio_id", id).order("orden"),
      sb.from("servicio_valores").select("valor_referencia").eq("servicio_id", id).maybeSingle(),
    ]);
    if (!s) notFound();
    servicio = s;
    fotos = f ?? [];
    valor = v?.valor_referencia ?? null;
  }

  return (
    <div className="space-y-6">
      <header>
        <Link href="/admin/contenido/servicios" className="mb-1 inline-flex items-center gap-1.5 py-1 text-[15px] text-gris transition-colors hover:text-carbon">← Servicios</Link>
        <h1 className={tituloPagina}>{servicio?.nombre ?? "Nuevo servicio"}</h1>
      </header>
      <EditorServicio servicio={servicio} fotos={fotos} valorReferencia={valor} categorias={categorias ?? []} />
    </div>
  );
}
