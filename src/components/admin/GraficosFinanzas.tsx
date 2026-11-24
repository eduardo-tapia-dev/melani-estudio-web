"use client";

import { Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatoGs } from "@/lib/formato";

// Paleta validada (CVD, contraste y croma) con el validador de dataviz.
export const COLOR = { ingresos: "#2a78d6", gastos: "#c8693a", ganancia: "#6250d6" };
const TINTA = { primaria: "#2B2B2B", secundaria: "#55524E", grilla: "#E6E8E3" };

const compacto = (n: number) =>
  Math.abs(n) >= 1_000_000 ? `${+(n / 1_000_000).toFixed(1)} M` : Math.abs(n) >= 1000 ? `${Math.round(n / 1000)} mil` : String(n);

type PuntoSerie = { etiqueta: string; ingresos: number; gastos: number; ganancia: number };

function CajaTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-white px-3 py-2 text-sm shadow-lg ring-1 ring-salvia/60">
      <p className="mb-1 font-medium capitalize text-carbon">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 text-gris">
          <span className="inline-block size-2.5 rounded-sm" style={{ background: p.color }} aria-hidden="true" />
          {p.name}: <span className="tabular-nums text-carbon">{formatoGs(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

const ejes = {
  tick: { fill: TINTA.secundaria, fontSize: 12 },
  axisLine: false,
  tickLine: false,
} as const;

/** Ingresos y gastos (barras) + ganancia (línea), últimos 12 meses. Un solo eje (Gs). */
export function GraficoMeses({ datos }: { datos: PuntoSerie[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <ComposedChart data={datos} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2} barCategoryGap="25%">
          <CartesianGrid vertical={false} stroke={TINTA.grilla} />
          <XAxis dataKey="etiqueta" {...ejes} interval={0} angle={0} />
          <YAxis {...ejes} tickFormatter={compacto} width={56} />
          <Tooltip content={<CajaTooltip />} cursor={{ fill: "rgba(181,184,176,0.18)" }} />
          <Legend
            iconType="square"
            wrapperStyle={{ fontSize: 13, color: TINTA.secundaria }}
            itemSorter={(item) => ["ingresos", "gastos", "ganancia"].indexOf(String(item.dataKey))}
          />
          <Bar dataKey="ingresos" name="Ingresos" fill={COLOR.ingresos} radius={[4, 4, 0, 0]} maxBarSize={22} />
          <Bar dataKey="gastos" name="Gastos" fill={COLOR.gastos} radius={[4, 4, 0, 0]} maxBarSize={22} />
          <Line dataKey="ganancia" name="Ganancia" stroke={COLOR.ganancia} strokeWidth={2} dot={{ r: 4, strokeWidth: 2, stroke: "#fff", fill: COLOR.ganancia }} activeDot={{ r: 5 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Barras horizontales de una sola serie (sin leyenda: el título la nombra). */
export function BarrasHorizontales({ datos, formato = "gs" }: { datos: { nombre: string; valor: number }[]; formato?: "gs" | "cantidad" }) {
  const alto = Math.max(120, datos.length * 40 + 20);
  const fmt = (v: number) => (formato === "gs" ? formatoGs(v) : `${v} ${v === 1 ? "vez" : "veces"}`);
  return (
    <div className="w-full" style={{ height: alto }}>
      <ResponsiveContainer>
        <BarChart data={datos} layout="vertical" margin={{ top: 0, right: 96, left: 0, bottom: 0 }} barCategoryGap={8}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="nombre" width={150} {...ejes} tick={{ fill: TINTA.primaria, fontSize: 13 }} />
          <Tooltip
            cursor={{ fill: "rgba(181,184,176,0.18)" }}
            content={({ active, payload }) =>
              active && payload?.length ? (
                <div className="rounded-xl bg-white px-3 py-2 text-sm shadow-lg ring-1 ring-salvia/60">
                  <p className="text-carbon">{payload[0].payload.nombre}</p>
                  <p className="tabular-nums text-gris">{fmt(Number(payload[0].value))}</p>
                </div>
              ) : null
            }
          />
          <Bar
            dataKey="valor"
            fill={COLOR.ingresos}
            radius={[0, 4, 4, 0]}
            maxBarSize={24}
            label={{ position: "right", fill: TINTA.secundaria, fontSize: 12, formatter: (v: unknown) => (formato === "gs" ? compacto(Number(v)) : String(v)) }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
