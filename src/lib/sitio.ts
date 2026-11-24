import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import inicial from "../../supabase/contenido-inicial.json";
import type { CategoriaPublica, ConfigPublica, CursoPublico, Faq, FotoEstudio, ResumenResenas, Sitio, Testimonio } from "./tipos";

export const TAG_SITIO = "sitio";

const CONFIG_LOCAL: ConfigPublica = {
  nombre_negocio: "Estudio Melani Cristine",
  whatsapp: "595972612944",
  instagram_url: "https://www.instagram.com/melanicristine.estudio",
  tiktok_url: "https://www.tiktok.com/@melanicristine",
  direccion: "San Lorenzo, calle 26 de Marzo, casi Los Laureles",
  ciudad: "San Lorenzo, Paraguay",
  google_maps_url: "https://maps.app.goo.gl/sASiNcjKPcBhVt4c8",
  ubicacion_lat: -25.306329,
  ubicacion_lng: -57.5124975,
  horario_texto: "Lunes a sábado, 9:30 a 20:00",
  sena_monto: 50000,
  medios_pago_texto: "Efectivo y transferencia bancaria",
};

// Columnas permitidas al público (coinciden con el GRANT por columna de la migración).
const COLUMNAS_CONFIG =
  "nombre_negocio, whatsapp, instagram_url, tiktok_url, direccion, ciudad, google_maps_url, ubicacion_lat, ubicacion_lng, horario_texto, sena_monto, medios_pago_texto";

/** Contenido desde el JSON local: se usa si Supabase aún no está configurado o falla. */
function sitioLocal(): Sitio {
  const categorias: CategoriaPublica[] = inicial.categorias
    .sort((a, b) => a.orden - b.orden)
    .map((c) => ({
      slug: c.slug,
      nombre: c.nombre,
      servicios: inicial.servicios
        .filter((s) => s.categoria === c.slug)
        .sort((a, b) => a.orden - b.orden)
        .map((s) => ({
          slug: s.slug,
          nombre: s.nombre,
          descripcion: s.descripcion,
          beneficios: s.beneficios,
          duracion_resultado: s.duracion_resultado,
          fotos: s.fotos.map((url) => ({ url, alt: s.nombre })),
        })),
    }));
  return {
    config: CONFIG_LOCAL,
    contenido: inicial.contenido,
    categorias,
    cursos: inicial.cursos.map((c) => ({
      slug: c.slug,
      nombre: c.nombre,
      descripcion: c.descripcion,
      incluye: c.incluye,
      no_incluye: c.no_incluye,
      modalidad: c.modalidad,
      foto_url: c.foto_url,
    })),
    testimonios: [],
    resenas: { promedio: 0, total: 0, lista: [] },
    estudio: [],
    faq: inicial.faq,
    plantillas: Object.fromEntries(inicial.plantillas.filter((p) => p.publico).map((p) => [p.clave, p.texto])),
    origen: "local",
  };
}

type FilaResena = { id: string; nombre: string; estrellas: number; comentario: string; fotos: string[]; servicio: { nombre: string } | null };

function armarResenas(url: string, filas: FilaResena[]): ResumenResenas {
  const total = filas.length;
  const promedio = total ? Math.round((filas.reduce((s, r) => s + r.estrellas, 0) / total) * 10) / 10 : 0;
  return {
    total,
    promedio,
    lista: filas.slice(0, 30).map((r) => ({
      id: r.id,
      nombre: r.nombre,
      estrellas: r.estrellas,
      comentario: r.comentario,
      servicio: r.servicio?.nombre ?? null,
      fotos: (r.fotos ?? []).map((p) => `${url}/storage/v1/object/public/resenas/${p}`),
    })),
  };
}

async function sitioSupabase(url: string, key: string): Promise<Sitio> {
  // cache: "no-store" → nunca reusar respuestas guardadas por Next (antes un build
  // podía publicar textos viejos). El único caché es el de getSitio ("use cache"),
  // que el panel invalida al guardar.
  const sb = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (entrada, init) => fetch(entrada, { ...init, cache: "no-store" }) },
  });
  const [cfg, cont, cats, servs, cursos, testis, faq, plant, res, est] = await Promise.all([
    sb.from("configuracion").select(COLUMNAS_CONFIG).eq("id", 1).single(),
    sb.from("contenido_sitio").select("clave, valor"),
    sb.from("categorias").select("id, slug, nombre, orden").order("orden"),
    sb
      .from("servicios")
      .select("id, slug, nombre, descripcion, beneficios, duracion_resultado, orden, categoria_id, servicio_fotos(url, alt, orden)")
      .eq("visible", true)
      .order("orden"),
    sb
      .from("cursos")
      .select("slug, nombre, descripcion, incluye, no_incluye, modalidad, foto_url")
      .eq("visible", true)
      .order("orden"),
    sb.from("testimonios").select("id, tipo, foto_url, texto, autora").eq("visible", true).order("orden").limit(30),
    sb.from("faq").select("pregunta, respuesta").eq("visible", true).order("orden"),
    sb.from("plantillas_mensaje").select("clave, texto").eq("publico", true),
    sb.from("resenas").select("id, nombre, estrellas, comentario, fotos, publicado_en, servicio:servicios(nombre)").order("publicado_en", { ascending: false }).limit(200),
    sb.from("estudio_fotos").select("url, descripcion").eq("visible", true).order("orden").order("creado_en").limit(12),
  ]);
  const error = [cfg, cont, cats, servs, cursos, testis, faq, plant, res, est].find((r) => r.error)?.error;
  if (error) throw error;

  type FotoFila = { url: string; alt: string; orden: number };
  const categorias: CategoriaPublica[] = (cats.data ?? []).map((c) => ({
    slug: c.slug,
    nombre: c.nombre,
    servicios: (servs.data ?? [])
      .filter((s) => s.categoria_id === c.id)
      .map((s) => ({
        id: s.id,
        slug: s.slug,
        nombre: s.nombre,
        descripcion: s.descripcion,
        beneficios: s.beneficios ?? [],
        duracion_resultado: s.duracion_resultado,
        fotos: ((s.servicio_fotos ?? []) as FotoFila[])
          .sort((a, b) => a.orden - b.orden)
          .slice(0, 3)
          .map((f) => ({ url: f.url, alt: f.alt || s.nombre })),
      })),
  }));

  return {
    config: { ...CONFIG_LOCAL, ...(cfg.data as Partial<ConfigPublica>) },
    contenido: { ...inicial.contenido, ...Object.fromEntries((cont.data ?? []).map((r) => [r.clave, r.valor])) },
    categorias: categorias.filter((c) => c.servicios.length > 0),
    cursos: (cursos.data ?? []) as CursoPublico[],
    testimonios: (testis.data ?? []) as Testimonio[],
    resenas: armarResenas(url, (res.data ?? []) as unknown as FilaResena[]),
    estudio: (est.data ?? []) as FotoEstudio[],
    faq: (faq.data ?? []) as Faq[],
    plantillas: Object.fromEntries((plant.data ?? []).map((p) => [p.clave, p.texto])),
    origen: "supabase",
  };
}

/** Datos públicos del sitio. Cacheado; el panel invalida con revalidateTag(TAG_SITIO). */
export async function getSitio(): Promise<Sitio> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAG_SITIO);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return sitioLocal();
  try {
    return await sitioSupabase(url, key);
  } catch (e) {
    console.error("[sitio] Supabase falló, uso contenido local:", e);
    return sitioLocal();
  }
}
