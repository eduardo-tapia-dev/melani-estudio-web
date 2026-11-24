"use server";

import { updateTag } from "next/cache";
import { requerirAdmin } from "@/lib/supabase/servidor";
import { TAG_SITIO } from "@/lib/sitio";
import { normalizarTelefono } from "@/lib/formato";
import type { Resultado } from "./acciones-agenda";

const slug = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "item";

const lineas = (t: string) => t.split("\n").map((l) => l.replace(/^[\s✓✔•\-*]+/, "").trim()).filter(Boolean);

function fallo(e: { message?: string; code?: string } | null): Resultado {
  if (e?.code === "23505") return { ok: false, error: "Ya existe otro con ese nombre." };
  if (e?.code === "23503") return { ok: false, error: "No se puede borrar porque tiene citas asociadas. Ocultalo en su lugar." };
  return { ok: false, error: e?.message ?? "Error al guardar." };
}

function listo<T>(datos?: T): Resultado<T> {
  updateTag(TAG_SITIO);
  return { ok: true, datos };
}

/* ---------------- Servicios ---------------- */

export type DatosServicio = {
  nombre: string;
  categoria_id: string;
  descripcion: string;
  beneficios: string; // uno por línea
  duracion_resultado: string;
  duracion_min: number;
  visible: boolean;
  orden: number;
  valor_referencia: number | null; // PRIVADO
};

export async function guardarServicio(id: string | null, d: DatosServicio): Promise<Resultado<{ id: string }>> {
  const { sb } = await requerirAdmin();
  if (!d.nombre.trim()) return { ok: false, error: "Falta el nombre." };
  if (!d.categoria_id) return { ok: false, error: "Elegí la categoría." };
  if (!(d.duracion_min > 0)) return { ok: false, error: "La duración en agenda debe ser mayor a 0." };
  const fila = {
    nombre: d.nombre.trim(),
    categoria_id: d.categoria_id,
    descripcion: d.descripcion.trim(),
    beneficios: lineas(d.beneficios),
    duracion_resultado: d.duracion_resultado.trim() || null,
    duracion_min: Math.round(d.duracion_min),
    visible: d.visible,
    orden: Math.round(d.orden) || 0,
  };
  let servicioId = id;
  if (id) {
    const { error } = await sb.from("servicios").update(fila).eq("id", id);
    if (error) return fallo(error);
  } else {
    const { data, error } = await sb.from("servicios").insert({ ...fila, slug: `${slug(d.nombre)}-${Date.now().toString(36)}` }).select("id").single();
    if (error) return fallo(error);
    servicioId = data.id;
  }
  const { error: ev } = await sb
    .from("servicio_valores")
    .upsert({ servicio_id: servicioId, valor_referencia: d.valor_referencia && d.valor_referencia > 0 ? Math.round(d.valor_referencia) : null });
  if (ev) return fallo(ev);
  return listo({ id: servicioId! });
}

export async function eliminarServicio(id: string): Promise<Resultado> {
  const { sb } = await requerirAdmin();
  const { data: fotos } = await sb.from("servicio_fotos").select("storage_path").eq("servicio_id", id);
  const { error } = await sb.from("servicios").delete().eq("id", id);
  if (error) return fallo(error);
  const rutas = (fotos ?? []).map((f) => f.storage_path).filter(Boolean) as string[];
  if (rutas.length) await sb.storage.from("sitio").remove(rutas);
  return listo();
}

export async function agregarFotoServicio(servicioId: string, url: string, storagePath: string, alt: string): Promise<Resultado> {
  const { sb } = await requerirAdmin();
  const { count } = await sb.from("servicio_fotos").select("id", { count: "exact", head: true }).eq("servicio_id", servicioId);
  const { error } = await sb.from("servicio_fotos").insert({ servicio_id: servicioId, url, storage_path: storagePath, alt, orden: count ?? 0 });
  if (error) return fallo(error);
  return listo();
}

export async function eliminarFotoServicio(fotoId: string): Promise<Resultado> {
  const { sb } = await requerirAdmin();
  const { data } = await sb.from("servicio_fotos").select("storage_path").eq("id", fotoId).single();
  const { error } = await sb.from("servicio_fotos").delete().eq("id", fotoId);
  if (error) return fallo(error);
  if (data?.storage_path) await sb.storage.from("sitio").remove([data.storage_path]);
  return listo();
}

export async function moverFotoServicio(fotoId: string, direccion: -1 | 1): Promise<Resultado> {
  const { sb } = await requerirAdmin();
  const { data: foto } = await sb.from("servicio_fotos").select("servicio_id").eq("id", fotoId).single();
  if (!foto) return { ok: false, error: "No existe la foto." };
  const { data: todas } = await sb.from("servicio_fotos").select("id, orden").eq("servicio_id", foto.servicio_id).order("orden").order("id");
  const lista = (todas ?? []).map((f) => f.id);
  const i = lista.indexOf(fotoId);
  const j = i + direccion;
  if (i < 0 || j < 0 || j >= lista.length) return { ok: true };
  [lista[i], lista[j]] = [lista[j], lista[i]];
  await Promise.all(lista.map((id, orden) => sb.from("servicio_fotos").update({ orden }).eq("id", id)));
  return listo();
}

/* ---------------- Cursos ---------------- */

export type DatosCurso = {
  nombre: string;
  descripcion: string;
  incluye: string;
  no_incluye: string;
  modalidad: string;
  foto_url: string | null;
  duracion_min: number;
  visible: boolean;
  orden: number;
};

export async function guardarCurso(id: string | null, d: DatosCurso): Promise<Resultado<{ id: string }>> {
  const { sb } = await requerirAdmin();
  if (!d.nombre.trim()) return { ok: false, error: "Falta el nombre." };
  const fila = {
    nombre: d.nombre.trim(),
    descripcion: d.descripcion.trim(),
    incluye: lineas(d.incluye),
    no_incluye: lineas(d.no_incluye),
    modalidad: d.modalidad.trim() || "Presencial",
    foto_url: d.foto_url,
    duracion_min: Math.round(d.duracion_min) || 120,
    visible: d.visible,
    orden: Math.round(d.orden) || 0,
  };
  if (id) {
    const { error } = await sb.from("cursos").update(fila).eq("id", id);
    if (error) return fallo(error);
    return listo({ id });
  }
  const { data, error } = await sb.from("cursos").insert({ ...fila, slug: `${slug(d.nombre)}-${Date.now().toString(36)}` }).select("id").single();
  if (error) return fallo(error);
  return listo({ id: data.id });
}

export async function eliminarCurso(id: string): Promise<Resultado> {
  const { sb } = await requerirAdmin();
  const { error } = await sb.from("cursos").delete().eq("id", id);
  if (error) return fallo(error);
  return listo();
}

/* ---------------- Textos, FAQ, mensajes ---------------- */

export async function guardarTextos(valores: Record<string, string>): Promise<Resultado> {
  const { sb } = await requerirAdmin();
  const filas = Object.entries(valores).map(([clave, valor]) => ({ clave, valor }));
  const { error } = await sb.from("contenido_sitio").upsert(filas);
  if (error) return fallo(error);
  return listo();
}

export async function guardarFaq(items: { pregunta: string; respuesta: string; visible: boolean }[]): Promise<Resultado> {
  const { sb } = await requerirAdmin();
  const limpios = items.filter((i) => i.pregunta.trim() && i.respuesta.trim());
  const { error: e1 } = await sb.from("faq").delete().not("id", "is", null);
  if (e1) return fallo(e1);
  if (limpios.length) {
    const { error } = await sb.from("faq").insert(limpios.map((i, n) => ({ pregunta: i.pregunta.trim(), respuesta: i.respuesta.trim(), visible: i.visible, orden: n + 1 })));
    if (error) return fallo(error);
  }
  return listo();
}

export async function guardarPlantilla(clave: string, texto: string): Promise<Resultado> {
  const { sb } = await requerirAdmin();
  if (!texto.trim()) return { ok: false, error: "El mensaje no puede quedar vacío." };
  const { error } = await sb.from("plantillas_mensaje").update({ texto: texto.trim() }).eq("clave", clave);
  if (error) return fallo(error);
  return listo();
}

/* ---------------- Testimonios ---------------- */

export async function agregarTestimonio(d: { tipo: "trabajo" | "mensaje"; foto_url: string; storage_path: string; texto: string; autora: string }): Promise<Resultado> {
  const { sb } = await requerirAdmin();
  const { count } = await sb.from("testimonios").select("id", { count: "exact", head: true });
  const { error } = await sb.from("testimonios").insert({ ...d, texto: d.texto.trim() || null, autora: d.autora.trim() || null, orden: count ?? 0 });
  if (error) return fallo(error);
  return listo();
}

export async function editarTestimonio(id: string, d: { texto: string; autora: string; visible: boolean; orden: number }): Promise<Resultado> {
  const { sb } = await requerirAdmin();
  const { error } = await sb.from("testimonios").update({ texto: d.texto.trim() || null, autora: d.autora.trim() || null, visible: d.visible, orden: d.orden }).eq("id", id);
  if (error) return fallo(error);
  return listo();
}

export async function eliminarTestimonio(id: string): Promise<Resultado> {
  const { sb } = await requerirAdmin();
  const { data } = await sb.from("testimonios").select("storage_path").eq("id", id).single();
  const { error } = await sb.from("testimonios").delete().eq("id", id);
  if (error) return fallo(error);
  if (data?.storage_path) await sb.storage.from("sitio").remove([data.storage_path]);
  return listo();
}

/* ---------------- Fotos del estudio ---------------- */

export async function agregarFotoEstudio(url: string, storagePath: string): Promise<Resultado> {
  const { sb } = await requerirAdmin();
  const { data: ultima } = await sb.from("estudio_fotos").select("orden").order("orden", { ascending: false }).limit(1).maybeSingle();
  const { error } = await sb.from("estudio_fotos").insert({ url, storage_path: storagePath, orden: (ultima?.orden ?? -1) + 1 });
  if (error) return fallo(error);
  return listo();
}

export async function editarFotoEstudio(id: string, d: { descripcion: string; visible: boolean }): Promise<Resultado> {
  const { sb } = await requerirAdmin();
  const { error } = await sb.from("estudio_fotos").update({ descripcion: d.descripcion.trim() || null, visible: d.visible }).eq("id", id);
  if (error) return fallo(error);
  return listo();
}

export async function moverFotoEstudio(id: string, direccion: -1 | 1): Promise<Resultado> {
  const { sb } = await requerirAdmin();
  const { data: todas } = await sb.from("estudio_fotos").select("id").order("orden").order("creado_en");
  const lista = (todas ?? []).map((f) => f.id);
  const i = lista.indexOf(id);
  const j = i + direccion;
  if (i < 0 || j < 0 || j >= lista.length) return { ok: true };
  [lista[i], lista[j]] = [lista[j], lista[i]];
  await Promise.all(lista.map((fid, orden) => sb.from("estudio_fotos").update({ orden }).eq("id", fid)));
  return listo();
}

export async function eliminarFotoEstudio(id: string): Promise<Resultado> {
  const { sb } = await requerirAdmin();
  const { data } = await sb.from("estudio_fotos").select("storage_path").eq("id", id).single();
  const { error } = await sb.from("estudio_fotos").delete().eq("id", id);
  if (error) return fallo(error);
  if (data?.storage_path) await sb.storage.from("sitio").remove([data.storage_path]);
  return listo();
}

/* ---------------- Reseñas de clientas ---------------- */

/** Aprueba: mueve las fotos de pendientes/ a aprobadas/ y la publica. */
export async function aprobarResena(id: string): Promise<Resultado> {
  const { sb } = await requerirAdmin();
  const { data: r } = await sb.from("resenas").select("fotos").eq("id", id).single();
  if (!r) return { ok: false, error: "La reseña no existe." };
  const nuevas: string[] = [];
  for (const f of r.fotos as string[]) {
    if (f.startsWith("pendientes/")) {
      const destino = f.replace(/^pendientes\//, "aprobadas/");
      const { error } = await sb.storage.from("resenas").move(f, destino);
      if (error) return { ok: false, error: `No se pudo mover una foto: ${error.message}` };
      nuevas.push(destino);
    } else nuevas.push(f);
  }
  const { error } = await sb.from("resenas").update({ estado: "aprobada", fotos: nuevas, publicado_en: new Date().toISOString() }).eq("id", id);
  if (error) return fallo(error);
  return listo();
}

/** Rechaza u oculta: borra las fotos y la deja como rechazada (no se publica). */
export async function rechazarResena(id: string): Promise<Resultado> {
  const { sb } = await requerirAdmin();
  const { data: r } = await sb.from("resenas").select("fotos").eq("id", id).single();
  if (r?.fotos?.length) await sb.storage.from("resenas").remove(r.fotos as string[]);
  const { error } = await sb.from("resenas").update({ estado: "rechazada", fotos: [] }).eq("id", id);
  if (error) return fallo(error);
  return listo();
}

export async function eliminarResena(id: string): Promise<Resultado> {
  const { sb } = await requerirAdmin();
  const { data: r } = await sb.from("resenas").select("fotos").eq("id", id).single();
  if (r?.fotos?.length) await sb.storage.from("resenas").remove(r.fotos as string[]);
  const { error } = await sb.from("resenas").delete().eq("id", id);
  if (error) return fallo(error);
  return listo();
}

/** Borra fotos subidas a pendientes/ que nunca se usaron en una reseña (más de 1 día). */
export async function limpiarFotosHuerfanas(): Promise<Resultado<{ borradas: number }>> {
  const { sb } = await requerirAdmin();
  const { data: archivos } = await sb.storage.from("resenas").list("pendientes", { limit: 1000 });
  const { data: usadas } = await sb.from("resenas").select("fotos");
  const enUso = new Set((usadas ?? []).flatMap((r) => r.fotos as string[]));
  const limite = Date.now() - 86400000;
  const huerfanas = (archivos ?? [])
    .filter((a) => a.created_at && new Date(a.created_at).getTime() < limite)
    .map((a) => `pendientes/${a.name}`)
    .filter((p) => !enUso.has(p));
  if (huerfanas.length) await sb.storage.from("resenas").remove(huerfanas);
  return { ok: true, datos: { borradas: huerfanas.length } };
}

/* ---------------- Datos del negocio ---------------- */

export type DatosNegocio = {
  whatsapp: string;
  instagram_url: string;
  tiktok_url: string;
  direccion: string;
  ciudad: string;
  google_maps_url: string;
  ubicacion_lat: number | null;
  ubicacion_lng: number | null;
  horario_texto: string;
  hora_apertura: string;
  hora_cierre: string;
  dias_atencion: number[];
  margen_min: number;
  duracion_default_min: number;
  sena_monto: number;
  medios_pago_texto: string;
};

/** Coordenadas desde un link de Google Maps (sigue los links cortos maps.app.goo.gl). */
async function coordenadasDeLink(link: string): Promise<{ lat: number; lng: number } | null> {
  const leer = (u: string) => {
    const m = u.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ?? u.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) ?? decodeURIComponent(u).match(/[?&](?:q|query|ll|destination)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
    return m ? { lat: Number(m[1]), lng: Number(m[2]) } : null;
  };
  let url = link.trim();
  for (let i = 0; i < 4; i++) {
    const c = leer(url);
    if (c) return c;
    if (!/^https:\/\/(maps\.app\.goo\.gl|goo\.gl|maps\.google\.|www\.google\.)/.test(url)) return null;
    try {
      const r = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(5000) });
      const siguiente = r.headers.get("location");
      if (!siguiente) return null;
      url = siguiente;
    } catch {
      return null;
    }
  }
  return leer(url);
}

export async function guardarDatosNegocio(d: DatosNegocio): Promise<Resultado> {
  const { sb } = await requerirAdmin();
  const wa = normalizarTelefono(d.whatsapp);
  if (!wa) return { ok: false, error: "El WhatsApp no es válido." };
  if (d.hora_apertura >= d.hora_cierre) return { ok: false, error: "La hora de apertura debe ser antes del cierre." };
  if (!d.dias_atencion.length) return { ok: false, error: "Elegí al menos un día de atención." };
  const url = (u: string) => (u.trim() ? (/^https?:\/\//.test(u.trim()) ? u.trim() : `https://${u.trim()}`) : "");
  const mapa = url(d.google_maps_url);
  // Si cambió el link y no se escribieron coordenadas a mano, se sacan del link.
  const { data: actual } = await sb.from("configuracion").select("google_maps_url").eq("id", 1).single();
  let lat = d.ubicacion_lat;
  let lng = d.ubicacion_lng;
  if (mapa && (mapa !== actual?.google_maps_url || lat == null || lng == null)) {
    const c = await coordenadasDeLink(mapa);
    if (c) ({ lat, lng } = c);
  }
  if (!mapa) lat = lng = null;
  const { error } = await sb
    .from("configuracion")
    .update({
      whatsapp: wa,
      instagram_url: url(d.instagram_url),
      tiktok_url: url(d.tiktok_url),
      direccion: d.direccion.trim(),
      ciudad: d.ciudad.trim(),
      google_maps_url: mapa || null,
      ubicacion_lat: lat,
      ubicacion_lng: lng,
      horario_texto: d.horario_texto.trim(),
      hora_apertura: d.hora_apertura,
      hora_cierre: d.hora_cierre,
      dias_atencion: [...new Set(d.dias_atencion)].sort(),
      margen_min: Math.max(0, Math.round(d.margen_min)),
      duracion_default_min: Math.max(10, Math.round(d.duracion_default_min)),
      sena_monto: Math.max(0, Math.round(d.sena_monto)),
      medios_pago_texto: d.medios_pago_texto.trim(),
    })
    .eq("id", 1);
  if (error) return fallo(error);
  return listo();
}
