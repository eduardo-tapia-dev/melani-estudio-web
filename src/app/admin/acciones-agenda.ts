"use server";

import { refresh } from "next/cache";
import { requerirAdmin } from "@/lib/supabase/servidor";
import { normalizarTelefono } from "@/lib/formato";
import { aInstante, horaLocal } from "@/lib/tiempo";

export type Resultado<T = undefined> = { ok: true; datos?: T } | { ok: false; error: string };

type ErrorPg = { code?: string; message?: string } | null;

/** Traduce errores de Postgres a mensajes claros. */
function mensaje(e: ErrorPg): string {
  if (!e) return "Error desconocido.";
  if (e.code === "23P01") return "Ese horario se cruza con otra cita (contando los 20 minutos de margen).";
  if (e.message?.includes("FUERA_DE_HORARIO")) return e.message.replace(/^.*FUERA_DE_HORARIO:\s*/, "Fuera de horario: ");
  if (e.code === "23505" && e.message?.includes("telefono")) return "Ya existe una clienta con ese teléfono.";
  if (e.code === "23514" && e.message?.includes("telefono")) return "El teléfono no es válido.";
  if (e.code === "42501") return "No tenés permiso para esto.";
  return e.message ?? "Error al guardar.";
}

/* ---------------- Clientas ---------------- */

export async function buscarClientas(q: string) {
  const { sb } = await requerirAdmin();
  const texto = q.trim();
  if (texto.length < 2) return [];
  const digitos = texto.replace(/\D/g, "");
  let consulta = sb.from("clientas").select("id, nombre, telefono").order("nombre").limit(8);
  consulta = digitos.length >= 3
    ? consulta.like("telefono", `%${digitos.replace(/^0/, "")}%`)
    : consulta.ilike("nombre", `%${texto}%`);
  const { data } = await consulta;
  return data ?? [];
}

export async function crearClienta(nombre: string, telefono: string, notas?: string): Promise<Resultado<{ id: string; telefono: string }>> {
  const { sb } = await requerirAdmin();
  const tel = normalizarTelefono(telefono);
  if (!nombre.trim()) return { ok: false, error: "Falta el nombre." };
  if (!tel) return { ok: false, error: "El teléfono no es válido. Ejemplo: 0981 123 456" };
  const { data, error } = await sb
    .from("clientas")
    .insert({ nombre: nombre.trim(), telefono: tel, notas: notas?.trim() || null })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") {
      const { data: existente } = await sb.from("clientas").select("id, nombre").eq("telefono", tel).single();
      return { ok: false, error: `Ya existe: ${existente?.nombre ?? "otra clienta"} con ese teléfono.` };
    }
    return { ok: false, error: mensaje(error) };
  }
  return { ok: true, datos: { id: data.id, telefono: tel } };
}

export async function editarClienta(id: string, nombre: string, telefono: string, notas: string): Promise<Resultado> {
  const { sb } = await requerirAdmin();
  const tel = normalizarTelefono(telefono);
  if (!nombre.trim()) return { ok: false, error: "Falta el nombre." };
  if (!tel) return { ok: false, error: "El teléfono no es válido." };
  const { error } = await sb.from("clientas").update({ nombre: nombre.trim(), telefono: tel, notas: notas.trim() || null }).eq("id", id);
  if (error) return { ok: false, error: mensaje(error) };
  refresh();
  return { ok: true };
}

/* ---------------- Agenda ---------------- */

export async function horariosLibres(fecha: string, duracionMin: number, excluirCita?: string): Promise<string[]> {
  const { sb } = await requerirAdmin();
  const { data, error } = await sb.rpc("horarios_libres", {
    p_fecha: fecha,
    p_duracion_min: duracionMin,
    p_excluir_cita: excluirCita ?? null,
  });
  if (error) return [];
  return (data as { inicio: string }[]).map((r) => horaLocal(r.inicio));
}

export type NuevaCita = {
  clientaId: string;
  tipo: "servicio" | "curso";
  itemId: string;
  fecha: string; // YYYY-MM-DD (Asunción)
  hora: string; // HH:MM
  notas?: string;
  sena?: { monto: number; medio: "efectivo" | "transferencia"; fecha: string } | null;
};

export async function crearCita(c: NuevaCita): Promise<Resultado<{ id: string }>> {
  const { sb } = await requerirAdmin();
  if (!c.clientaId) return { ok: false, error: "Elegí o creá la clienta." };
  if (!c.itemId) return { ok: false, error: "Elegí el servicio o curso." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(c.fecha) || !/^\d{2}:\d{2}$/.test(c.hora)) return { ok: false, error: "Elegí fecha y hora." };

  const { data, error } = await sb
    .from("citas")
    .insert({
      clienta_id: c.clientaId,
      servicio_id: c.tipo === "servicio" ? c.itemId : null,
      curso_id: c.tipo === "curso" ? c.itemId : null,
      inicio: aInstante(c.fecha, c.hora).toISOString(),
      notas: c.notas?.trim() || null,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: mensaje(error) };

  if (c.sena && c.sena.monto > 0) {
    const r = await sb.rpc("registrar_sena", { p_cita: data.id, p_monto: c.sena.monto, p_fecha: c.sena.fecha, p_medio: c.sena.medio });
    if (r.error) return { ok: false, error: `La cita se guardó, pero la seña no: ${mensaje(r.error)}` };
  }
  refresh();
  return { ok: true, datos: { id: data.id } };
}

export async function reprogramarCita(id: string, fecha: string, hora: string): Promise<Resultado> {
  const { sb } = await requerirAdmin();
  const { data: actual } = await sb.from("citas").select("inicio, fin").eq("id", id).single();
  if (!actual) return { ok: false, error: "La cita no existe." };
  const inicio = aInstante(fecha, hora);
  const duracion = new Date(actual.fin).getTime() - new Date(actual.inicio).getTime();
  const { error } = await sb
    .from("citas")
    .update({ inicio: inicio.toISOString(), fin: new Date(inicio.getTime() + duracion).toISOString(), recordatorio_enviado: false, recordatorio_enviado_en: null })
    .eq("id", id);
  if (error) return { ok: false, error: mensaje(error) };
  refresh();
  return { ok: true };
}

const ESTADOS = ["pendiente_sena", "confirmada", "cancelada", "no_asistio"] as const;
export type EstadoEditable = (typeof ESTADOS)[number];

export async function cambiarEstado(id: string, estado: EstadoEditable): Promise<Resultado> {
  const { sb } = await requerirAdmin();
  if (!ESTADOS.includes(estado)) return { ok: false, error: "Estado inválido." };
  const { error } = await sb.from("citas").update({ estado }).eq("id", id);
  if (error) return { ok: false, error: mensaje(error) };
  refresh();
  return { ok: true };
}

export async function actualizarNotasCita(id: string, notas: string): Promise<Resultado> {
  const { sb } = await requerirAdmin();
  const { error } = await sb.from("citas").update({ notas: notas.trim() || null }).eq("id", id);
  if (error) return { ok: false, error: mensaje(error) };
  refresh();
  return { ok: true };
}

export async function registrarSena(id: string, monto: number, fecha: string, medio: "efectivo" | "transferencia"): Promise<Resultado> {
  const { sb } = await requerirAdmin();
  const { error } = await sb.rpc("registrar_sena", { p_cita: id, p_monto: Math.round(monto), p_fecha: fecha, p_medio: medio });
  if (error) return { ok: false, error: mensaje(error) };
  refresh();
  return { ok: true };
}

export async function anularSena(id: string): Promise<Resultado> {
  const { sb } = await requerirAdmin();
  const { error } = await sb.rpc("anular_sena", { p_cita: id });
  if (error) return { ok: false, error: mensaje(error) };
  refresh();
  return { ok: true };
}

export async function marcarRecordatorio(id: string, enviado = true): Promise<Resultado> {
  const { sb } = await requerirAdmin();
  const { error } = await sb
    .from("citas")
    .update({ recordatorio_enviado: enviado, recordatorio_enviado_en: enviado ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { ok: false, error: mensaje(error) };
  refresh();
  return { ok: true };
}

export async function cerrarSesion() {
  const { sb } = await requerirAdmin();
  await sb.auth.signOut();
}
