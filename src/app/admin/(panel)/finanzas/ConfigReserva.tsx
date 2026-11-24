"use client";

import { useState, useTransition } from "react";
import { guardarReserva } from "@/app/admin/acciones-finanzas";
import { btnPrimario, input, tarjeta } from "@/components/admin/estilos";

export default function ConfigReserva({ modo, porcentaje }: { modo: "promedio_3m" | "porcentaje"; porcentaje: number }) {
  const [m, setM] = useState(modo);
  const [p, setP] = useState(String(porcentaje));
  const [msg, setMsg] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();
  return (
    <details className={tarjeta}>
      <summary className="cursor-pointer font-medium text-carbon">¿Cómo se calcula “guardar para productos”?</summary>
      <div className="mt-3 space-y-3 text-sm">
        <label className="flex items-start gap-3">
          <input type="radio" name="modo" checked={m === "promedio_3m"} onChange={() => setM("promedio_3m")} className="mt-1 size-4 accent-taupe-oscuro" />
          <span><strong className="font-medium text-carbon">Promedio de compras de insumos</strong> de los 3 meses anteriores (recomendado).</span>
        </label>
        <label className="flex items-start gap-3">
          <input type="radio" name="modo" checked={m === "porcentaje"} onChange={() => setM("porcentaje")} className="mt-1 size-4 accent-taupe-oscuro" />
          <span className="flex flex-wrap items-center gap-2">
            <strong className="font-medium text-carbon">Un porcentaje fijo</strong> de los ingresos del mes:
            <input inputMode="decimal" value={p} onChange={(e) => setP(e.target.value)} disabled={m !== "porcentaje"} className={`${input} w-20 py-1.5 text-right`} aria-label="Porcentaje" />%
          </span>
        </label>
        <div className="flex items-center gap-3">
          <button
            disabled={pendiente}
            onClick={() => iniciar(async () => {
              const r = await guardarReserva(m, Number(p.replace(",", ".")));
              setMsg(r.ok ? "Guardado." : r.error);
            })}
            className={btnPrimario}
          >
            Guardar
          </button>
          {msg && <span className="text-gris">{msg}</span>}
        </div>
      </div>
    </details>
  );
}
