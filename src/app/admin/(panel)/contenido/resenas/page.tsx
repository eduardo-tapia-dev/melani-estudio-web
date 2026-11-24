import Link from "next/link";
import { requerirAdmin } from "@/lib/supabase/servidor";
import { fechaCorta, fechaLocal } from "@/lib/tiempo";
import Estrellas from "@/components/landing/Estrellas";
import { tarjeta, tituloPagina } from "@/components/admin/estilos";
import { AccionesResena, LimpiarHuerfanas } from "./AccionesResena";

type Fila = {
  id: string;
  nombre: string;
  estrellas: number;
  comentario: string;
  fotos: string[];
  estado: "pendiente" | "aprobada" | "rechazada";
  creado_en: string;
  servicio: { nombre: string } | null;
};

const ESTADOS = [
  { v: "pendiente", t: "Para revisar" },
  { v: "aprobada", t: "Publicadas" },
  { v: "rechazada", t: "Rechazadas" },
] as const;

// Avisa si el comentario parece tener precios (el sitio no debe mostrar montos).
const pareceMonto = (t: string) => /\d{2,3}[.\s]?\d{3}|\bgs\b|guaran|\$/i.test(t);

export default async function Resenas({ searchParams }: PageProps<"/admin/contenido/resenas">) {
  const { sb } = await requerirAdmin();
  const sp = await searchParams;
  const estado = ESTADOS.some((e) => e.v === sp.estado) ? (sp.estado as Fila["estado"]) : "pendiente";
  const [{ data }, { data: conteo }] = await Promise.all([
    sb.from("resenas").select("id, nombre, estrellas, comentario, fotos, estado, creado_en, servicio:servicios(nombre)").eq("estado", estado).order("creado_en", { ascending: false }).limit(100),
    sb.from("resenas").select("estado"),
  ]);
  const filas = (data ?? []) as unknown as Fila[];
  const cuenta = (e: string) => (conteo ?? []).filter((r) => r.estado === e).length;
  const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/resenas/`;

  return (
    <div className="space-y-6">
      <header>
        <Link href="/admin/contenido" className="mb-1 inline-flex items-center gap-1.5 py-1 text-[15px] text-gris transition-colors hover:text-carbon">← Mi página web</Link>
        <h1 className={tituloPagina}>Reseñas de clientas</h1>
        <p className="mt-2 text-sm text-gris">Las clientas las dejan desde la sección “Resultados” del sitio. Solo se publican las que aprobás.</p>
      </header>

      <nav className="flex flex-wrap gap-1" aria-label="Estado">
        {ESTADOS.map((e) => (
          <Link
            key={e.v}
            href={`/admin/contenido/resenas?estado=${e.v}`}
            aria-current={estado === e.v ? "page" : undefined}
            className={`rounded-full px-4 py-2.5 text-[15px] ${estado === e.v ? "bg-carbon text-hueso" : "bg-white text-carbon ring-1 ring-salvia/60"}`}
          >
            {e.t} ({cuenta(e.v)})
          </Link>
        ))}
      </nav>

      {filas.length === 0 ? (
        <p className={`${tarjeta} text-gris`}>{estado === "pendiente" ? "No hay reseñas para revisar. 🎉" : "No hay reseñas acá."}</p>
      ) : (
        <ul className="space-y-4">
          {filas.map((r) => (
            <li key={r.id} className={tarjeta}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <Estrellas valor={r.estrellas} tamano="size-5" />
                  <span className="font-medium text-carbon">{r.nombre}</span>
                  {r.servicio && <span className="text-sm text-gris">· {r.servicio.nombre}</span>}
                </div>
                <span className="text-xs capitalize text-gris">{fechaCorta(fechaLocal(r.creado_en))}</span>
              </div>
              <p className="mt-3 whitespace-pre-line text-carbon">“{r.comentario}”</p>
              {pareceMonto(r.comentario) && (
                <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">⚠ Parece mencionar un precio. Recordá que el sitio no muestra montos.</p>
              )}
              {r.fotos.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.fotos.map((f) => (
                    <a key={f} href={base + f} target="_blank" rel="noopener noreferrer" className="block size-24 overflow-hidden rounded-xl ring-1 ring-salvia">
                      {/* eslint-disable-next-line @next/next/no-img-element -- vista de moderación, sin optimizar a propósito */}
                      <img src={base + f} alt={`Foto de ${r.nombre}`} className="size-full object-cover" />
                    </a>
                  ))}
                </div>
              )}
              <AccionesResena id={r.id} estado={r.estado} />
            </li>
          ))}
        </ul>
      )}

      <LimpiarHuerfanas />
    </div>
  );
}
