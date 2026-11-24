import type { NextRequest } from "next/server";
import { requerirAdmin } from "@/lib/supabase/servidor";
import { mesActual, mesValido, rangoMes } from "@/lib/tiempo";

/**
 * CSV del mes (ingresos y gastos) para abrir en Excel o Google Sheets.
 * Separador ";" y BOM UTF-8: Excel en español lo abre con tildes y columnas correctas.
 * Montos como enteros en guaraníes (sin puntos) para poder sumarlos.
 */
export async function GET(request: NextRequest) {
  const { sb } = await requerirAdmin();
  const p = request.nextUrl.searchParams.get("mes");
  const mes = mesValido(p) ? p : mesActual();
  const r = rangoMes(mes);

  const [ing, gas] = await Promise.all([
    sb
      .from("ingresos")
      .select("fecha, monto, medio, tipo, concepto, nota, clienta:clientas(nombre), cita:citas(servicio:servicios(nombre), curso:cursos(nombre))")
      .gte("fecha", r.desde)
      .lt("fecha", r.hasta)
      .order("fecha"),
    sb.from("gastos").select("fecha, monto, medio, nota, categoria:categorias_gasto(nombre)").gte("fecha", r.desde).lt("fecha", r.hasta).order("fecha"),
  ]);
  if (ing.error || gas.error) return new Response("No se pudo exportar.", { status: 500 });

  type Ing = { fecha: string; monto: number; medio: string; tipo: string; concepto: string; nota: string | null; clienta: { nombre: string } | null; cita: { servicio: { nombre: string } | null; curso: { nombre: string } | null } | null };
  type Gas = { fecha: string; monto: number; medio: string; nota: string | null; categoria: { nombre: string } | null };
  const CONCEPTO: Record<string, string> = { sena: "Seña", saldo: "Saldo", manual: "Manual" };

  const celda = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const filas: unknown[][] = [["Fecha", "Movimiento", "Categoría / tipo", "Concepto", "Detalle", "Clienta", "Medio", "Monto (Gs)"]];
  let totalIng = 0;
  let totalGas = 0;
  for (const i of (ing.data ?? []) as unknown as Ing[]) {
    totalIng += i.monto;
    filas.push([i.fecha, "Ingreso", i.tipo === "curso" ? "Curso" : "Servicio", CONCEPTO[i.concepto] ?? i.concepto, i.cita?.servicio?.nombre ?? i.cita?.curso?.nombre ?? i.nota ?? "", i.clienta?.nombre ?? "", i.medio, i.monto]);
  }
  for (const g of (gas.data ?? []) as unknown as Gas[]) {
    totalGas += g.monto;
    filas.push([g.fecha, "Gasto", g.categoria?.nombre ?? "", "", g.nota ?? "", "", g.medio, -g.monto]);
  }
  filas.push([]);
  filas.push(["", "Total ingresos", "", "", "", "", "", totalIng]);
  filas.push(["", "Total gastos", "", "", "", "", "", -totalGas]);
  filas.push(["", "Ganancia", "", "", "", "", "", totalIng - totalGas]);

  const csv = "﻿" + filas.map((f) => f.map(celda).join(";")).join("\r\n") + "\r\n";
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="melani-cristine-${mes}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
