import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type Resumen = {
  mes: string;
  ingresos: number;
  gastos: number;
  ganancia: number;
  reserva: number;
  reserva_modo: "promedio_3m" | "porcentaje";
  reserva_porcentaje: number;
  promedio_insumos_3m: number;
  bolsillo: number;
  ingresos_por_medio: Partial<Record<"efectivo" | "transferencia", number>>;
  gastos_por_medio: Partial<Record<"efectivo" | "transferencia", number>>;
  ingresos_por_tipo: Partial<Record<"servicio" | "curso", number>>;
  ingresos_por_categoria: { categoria: string; total: number }[];
  gastos_por_categoria: { categoria: string; total: number }[];
  citas_por_estado: Partial<Record<string, number>>;
  clientas_atendidas: number;
  top_servicios: { nombre: string; cantidad: number; total: number }[];
  serie: { mes: string; ingresos: number; gastos: number }[];
};

/** Resumen del mes "YYYY-MM" (calculado en la base con resumen_mes). */
export async function resumenMes(sb: SupabaseClient, mes: string): Promise<Resumen> {
  const { data, error } = await sb.rpc("resumen_mes", { p_mes: `${mes}-01` });
  if (error) throw error;
  return data as Resumen;
}
