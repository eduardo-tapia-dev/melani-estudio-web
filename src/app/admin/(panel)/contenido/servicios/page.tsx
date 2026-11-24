import Image from "next/image";
import Link from "next/link";
import { requerirAdmin } from "@/lib/supabase/servidor";
import { btnPrimario, tituloPagina } from "@/components/admin/estilos";

type Fila = {
  id: string;
  nombre: string;
  visible: boolean;
  orden: number;
  categoria: { nombre: string; orden: number } | null;
  servicio_fotos: { url: string; orden: number }[];
};

export default async function ListaServicios() {
  const { sb } = await requerirAdmin();
  const { data } = await sb.from("servicios").select("id, nombre, visible, orden, categoria:categorias(nombre, orden), servicio_fotos(url, orden)").order("orden");
  const servicios = (data ?? []) as unknown as Fila[];
  const grupos = new Map<string, Fila[]>();
  servicios
    .sort((a, b) => (a.categoria?.orden ?? 0) - (b.categoria?.orden ?? 0) || a.orden - b.orden)
    .forEach((s) => grupos.set(s.categoria?.nombre ?? "Sin categoría", [...(grupos.get(s.categoria?.nombre ?? "Sin categoría") ?? []), s]));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/admin/contenido" className="mb-1 inline-flex items-center gap-1.5 py-1 text-[15px] text-gris transition-colors hover:text-carbon">← Mi página web</Link>
          <h1 className={tituloPagina}>Servicios</h1>
        </div>
        <Link href="/admin/contenido/servicios/nuevo" className={btnPrimario}>+ Nuevo servicio</Link>
      </header>
      {[...grupos.entries()].map(([g, lista]) => (
        <section key={g}>
          <h2 className="mb-2 font-serif text-xl text-taupe-oscuro">{g}</h2>
          <ul className="divide-y divide-salvia/50 overflow-hidden rounded-2xl bg-white ring-1 ring-salvia/50">
            {lista.map((s) => {
              const foto = [...s.servicio_fotos].sort((a, b) => a.orden - b.orden)[0];
              return (
                <li key={s.id}>
                  <Link href={`/admin/contenido/servicios/${s.id}`} className="flex items-center gap-3 px-3 py-2.5 hover:bg-salvia-claro/50">
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-salvia-claro">
                      {foto && <Image src={foto.url} alt="" fill sizes="48px" className="object-cover" />}
                    </div>
                    <span className="min-w-0 flex-1 truncate text-carbon">{s.nombre}</span>
                    {!s.visible && <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs text-stone-700">Oculto</span>}
                    <span className="text-xs text-gris">{s.servicio_fotos.length} foto{s.servicio_fotos.length === 1 ? "" : "s"}</span>
                    <span className="text-gris" aria-hidden="true">›</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
