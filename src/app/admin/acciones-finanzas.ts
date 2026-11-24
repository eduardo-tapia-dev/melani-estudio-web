"use server";

import { refresh } from "next/cache";
import { requerirAdmin } from "@/lib/supabase/servidor";
import type { Resultado } from "./acciones-agenda";

type Medio = "efectivo" | "transferencia";
type ErrorPg = { code?: string; message?: string } | null;

function fallo(e: ErrorPg): { ok: false; error: string } {
  const m = e?.message ?? "Error al guardar.";
  const amigable = m.match(/^[A-Z_]+:\s*(.+)$/)?.[1];
  if (amigable) return { ok: false, error: amigable.charAt(0).toUpperCase() + amigable.slice(1) + "." };
  if (e?.code === "23503") return { ok: false, error: "No se puede borrar porque está en uso." };
  if (e?.code === "23505") return { ok: false, error: "Ya existe uno con ese nombre." };
  if (m.includes("MONTO_INVALIDO")) return { ok: false, error: "El monto no es válido." };
  if (m.includes("CANTIDAD_INVALIDA")) return { ok: false, error: "La cantidad no es válida." };
  return { ok: false, error: m };
}

const ok = (): Resultado => {
  refresh();
  return { ok: true };
};

const entero = (n: number) => Math.round(Number(n) || 0);
const fechaValida = (f: string) => /^\d{4}-\d{2}-\d{2}$/.test(f);

/* ---------------- Cobro de citas ---------------- */

export async function marcarAtendida(citaId: string, total: number, medio: Medio, fecha: string): Promise<Resultado<{ saldo: number }>> {
  const { sb } = await requerirAdmin();
  if (!fechaValida(fecha)) return { ok: false, error: "Fecha inválida." };
  const { data, error } = await sb.rpc("marcar_atendida", { p_cita: citaId, p_total: entero(total), p_medio: medio, p_fecha: fecha });
  if (error) return fallo(error);
  refresh();
  return { ok: true, datos: { saldo: data as number } };
}

export async function desmarcarAtendida(citaId: string): Promise<Resultado> {
  const { sb } = await requerirAdmin();
  const { error } = await sb.rpc("desmarcar_atendida", { p_cita: citaId });
  return error ? fallo(error) : ok();
}

/* ---------------- Ingresos manuales ---------------- */

export async function crearIngreso(d: { fecha: string; monto: number; medio: Medio; tipo: "servicio" | "curso"; clientaId: string | null; nota: string }): Promise<Resultado> {
  const { sb } = await requerirAdmin();
  if (!fechaValida(d.fecha)) return { ok: false, error: "Fecha inválida." };
  if (entero(d.monto) <= 0) return { ok: false, error: "El monto debe ser mayor a 0." };
  const { error } = await sb.from("ingresos").insert({
    fecha: d.fecha,
    monto: entero(d.monto),
    medio: d.medio,
    tipo: d.tipo,
    concepto: "manual",
    clienta_id: d.clientaId,
    nota: d.nota.trim() || null,
  });
  return error ? fallo(error) : ok();
}

export async function eliminarIngreso(id: string): Promise<Resultado> {
  const { sb } = await requerirAdmin();
  // Las señas y saldos se manejan desde la cita (así nunca se descuadran).
  const { data } = await sb.from("ingresos").select("concepto").eq("id", id).single();
  if (data && data.concepto !== "manual") return { ok: false, error: "Este ingreso viene de una cita: corregilo desde la cita." };
  const { error } = await sb.from("ingresos").delete().eq("id", id);
  return error ? fallo(error) : ok();
}

/* ---------------- Gastos ---------------- */

export async function crearGasto(d: { fecha: string; monto: number; categoriaId: string; medio: Medio; nota: string }): Promise<Resultado> {
  const { sb } = await requerirAdmin();
  if (!fechaValida(d.fecha)) return { ok: false, error: "Fecha inválida." };
  if (entero(d.monto) <= 0) return { ok: false, error: "El monto debe ser mayor a 0." };
  if (!d.categoriaId) return { ok: false, error: "Elegí la categoría." };
  const { error } = await sb.from("gastos").insert({ fecha: d.fecha, monto: entero(d.monto), categoria_id: d.categoriaId, medio: d.medio, nota: d.nota.trim() || null });
  return error ? fallo(error) : ok();
}

export async function eliminarGasto(id: string): Promise<Resultado> {
  const { sb } = await requerirAdmin();
  const { data: mov } = await sb.from("movimientos_insumo").select("id").eq("gasto_id", id).maybeSingle();
  if (mov) {
    // Era una compra de insumo: se anula la compra entera (devuelve el stock).
    const { error } = await sb.rpc("anular_movimiento", { p_mov: mov.id });
    return error ? fallo(error) : ok();
  }
  const { error } = await sb.from("gastos").delete().eq("id", id);
  return error ? fallo(error) : ok();
}

export async function crearCategoriaGasto(nombre: string): Promise<Resultado> {
  const { sb } = await requerirAdmin();
  if (!nombre.trim()) return { ok: false, error: "Falta el nombre." };
  const { count } = await sb.from("categorias_gasto").select("id", { count: "exact", head: true });
  const { error } = await sb.from("categorias_gasto").insert({ nombre: nombre.trim(), orden: (count ?? 0) + 1 });
  return error ? fallo(error) : ok();
}

export async function renombrarCategoriaGasto(id: string, nombre: string): Promise<Resultado> {
  const { sb } = await requerirAdmin();
  if (!nombre.trim()) return { ok: false, error: "Falta el nombre." };
  const { error } = await sb.from("categorias_gasto").update({ nombre: nombre.trim() }).eq("id", id);
  return error ? fallo(error) : ok();
}

export async function eliminarCategoriaGasto(id: string): Promise<Resultado> {
  const { sb } = await requerirAdmin();
  const { data } = await sb.from("categorias_gasto").select("es_insumos").eq("id", id).single();
  if (data?.es_insumos) return { ok: false, error: "La categoría de insumos no se puede borrar (la usan las compras)." };
  const { error } = await sb.from("categorias_gasto").delete().eq("id", id);
  return error ? fallo(error) : ok();
}

/* ---------------- Insumos ---------------- */

export async function guardarInsumo(id: string | null, d: { nombre: string; unidad: string; stock_minimo: number; activo: boolean; stock_inicial?: number }): Promise<Resultado<{ id: string }>> {
  const { sb } = await requerirAdmin();
  if (!d.nombre.trim()) return { ok: false, error: "Falta el nombre." };
  const fila = { nombre: d.nombre.trim(), unidad: d.unidad.trim() || "unidad", stock_minimo: Number(d.stock_minimo) || 0, activo: d.activo };
  if (id) {
    const { error } = await sb.from("insumos").update(fila).eq("id", id);
    if (error) return fallo(error);
    refresh();
    return { ok: true, datos: { id } };
  }
  const { data, error } = await sb.from("insumos").insert(fila).select("id").single();
  if (error) return fallo(error);
  if (d.stock_inicial && d.stock_inicial > 0) {
    await sb.from("movimientos_insumo").insert({ insumo_id: data.id, tipo: "ajuste", cantidad: d.stock_inicial, nota: "Stock inicial" });
  }
  refresh();
  return { ok: true, datos: { id: data.id } };
}

export async function registrarCompra(insumoId: string, d: { cantidad: number; costoTotal: number; fecha: string; medio: Medio; nota: string }): Promise<Resultado> {
  const { sb } = await requerirAdmin();
  if (!fechaValida(d.fecha)) return { ok: false, error: "Fecha inválida." };
  const { error } = await sb.rpc("registrar_compra", {
    p_insumo: insumoId,
    p_cantidad: Number(d.cantidad),
    p_costo_total: entero(d.costoTotal),
    p_fecha: d.fecha,
    p_medio: d.medio,
    p_nota: d.nota,
  });
  return error ? fallo(error) : ok();
}

/** Uso (resta) o ajuste (+/-) manual de stock. */
export async function moverStock(insumoId: string, tipo: "uso" | "ajuste", cantidad: number, nota: string): Promise<Resultado> {
  const { sb } = await requerirAdmin();
  const n = Number(cantidad);
  if (!n) return { ok: false, error: "La cantidad no puede ser 0." };
  const { error } = await sb.from("movimientos_insumo").insert({
    insumo_id: insumoId,
    tipo,
    cantidad: tipo === "uso" ? -Math.abs(n) : n,
    nota: nota.trim() || null,
  });
  return error ? fallo(error) : ok();
}

export async function anularMovimiento(id: string): Promise<Resultado> {
  const { sb } = await requerirAdmin();
  const { error } = await sb.rpc("anular_movimiento", { p_mov: id });
  return error ? fallo(error) : ok();
}

/** Cantidades que usa cada servicio de este insumo (0 = no se usa). */
export async function guardarUsoEnServicios(insumoId: string, usos: { servicioId: string; cantidad: number }[]): Promise<Resultado> {
  const { sb } = await requerirAdmin();
  const { error: e1 } = await sb.from("servicio_insumos").delete().eq("insumo_id", insumoId);
  if (e1) return fallo(e1);
  const filas = usos.filter((u) => Number(u.cantidad) > 0).map((u) => ({ servicio_id: u.servicioId, insumo_id: insumoId, cantidad: Number(u.cantidad) }));
  if (filas.length) {
    const { error } = await sb.from("servicio_insumos").insert(filas);
    if (error) return fallo(error);
  }
  return ok();
}

/* ---------------- Reserva para productos ---------------- */

export async function guardarReserva(modo: "promedio_3m" | "porcentaje", porcentaje: number): Promise<Resultado> {
  const { sb } = await requerirAdmin();
  const p = Math.min(100, Math.max(0, Number(porcentaje) || 0));
  const { error } = await sb.from("configuracion").update({ reserva_modo: modo, reserva_porcentaje: p }).eq("id", 1);
  return error ? fallo(error) : ok();
}
