import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type EstadoCita = "pendiente_sena" | "confirmada" | "atendida" | "cancelada" | "no_asistio";

export type CitaFila = {
  id: string;
  inicio: string;
  fin: string;
  estado: EstadoCita;
  sena_pagada: boolean;
  sena_monto: number | null;
  sena_fecha: string | null;
  sena_medio: "efectivo" | "transferencia" | null;
  monto_total: number | null;
  medio_pago: "efectivo" | "transferencia" | null;
  recordatorio_enviado: boolean;
  notas: string | null;
  clienta: { id: string; nombre: string; telefono: string } | null;
  servicio: { id: string; nombre: string; duracion_min: number } | null;
  curso: { id: string; nombre: string; duracion_min: number } | null;
};

export const SELECT_CITA =
  "id, inicio, fin, estado, sena_pagada, sena_monto, sena_fecha, sena_medio, monto_total, medio_pago, recordatorio_enviado, notas, " +
  "clienta:clientas(id, nombre, telefono), servicio:servicios(id, nombre, duracion_min), curso:cursos(id, nombre, duracion_min)";

export const ACTIVAS: EstadoCita[] = ["pendiente_sena", "confirmada", "atendida"];

export async function citasEntre(sb: SupabaseClient, desde: string, hasta: string, soloActivas = false): Promise<CitaFila[]> {
  let q = sb.from("citas").select(SELECT_CITA).gte("inicio", desde).lt("inicio", hasta).order("inicio");
  if (soloActivas) q = q.in("estado", ACTIVAS);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as CitaFila[];
}

export const nombreItem = (c: Pick<CitaFila, "servicio" | "curso">) => c.servicio?.nombre ?? c.curso?.nombre ?? "—";

export async function catalogoAgenda(sb: SupabaseClient) {
  const [s, c, cfg] = await Promise.all([
    sb.from("servicios").select("id, nombre, duracion_min, visible, categoria:categorias(nombre, orden)").order("orden"),
    sb.from("cursos").select("id, nombre, duracion_min").order("orden"),
    sb.from("configuracion").select("sena_monto, margen_min, hora_apertura, hora_cierre, dias_atencion").eq("id", 1).single(),
  ]);
  return {
    servicios: (s.data ?? []) as unknown as { id: string; nombre: string; duracion_min: number; visible: boolean; categoria: { nombre: string } | null }[],
    cursos: (c.data ?? []) as { id: string; nombre: string; duracion_min: number }[],
    config: cfg.data as { sena_monto: number; margen_min: number; hora_apertura: string; hora_cierre: string; dias_atencion: number[] },
  };
}

export async function plantilla(sb: SupabaseClient, clave: string): Promise<string> {
  const { data } = await sb.from("plantillas_mensaje").select("texto").eq("clave", clave).single();
  return data?.texto ?? "";
}
