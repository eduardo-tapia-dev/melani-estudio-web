"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { guardarInsumo } from "@/app/admin/acciones-finanzas";
import { btnPrimario, btnSecundario, etiqueta, input, tarjeta } from "@/components/admin/estilos";

export default function NuevoInsumo() {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();
  if (!abierto) return <button onClick={() => setAbierto(true)} className={btnPrimario}>+ Nuevo insumo</button>;
  return (
    <form
      className={`${tarjeta} w-full space-y-3`}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        iniciar(async () => {
          const r = await guardarInsumo(null, {
            nombre: String(fd.get("nombre")),
            unidad: String(fd.get("unidad")),
            stock_minimo: Number(fd.get("minimo")),
            stock_inicial: Number(fd.get("inicial")),
            activo: true,
          });
          if (!r.ok) return setError(r.error);
          router.push(`/admin/finanzas/insumos/${r.datos!.id}`);
        });
      }}
    >
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <label className={etiqueta} htmlFor="ni-nombre">Nombre</label>
          <input id="ni-nombre" name="nombre" required className={input} placeholder="ej. Pegamento 5 ml" />
        </div>
        <div>
          <label className={etiqueta} htmlFor="ni-unidad">Unidad</label>
          <input id="ni-unidad" name="unidad" defaultValue="unidad" className={input} placeholder="unidad, ml, caja…" />
        </div>
        <div>
          <label className={etiqueta} htmlFor="ni-min">Stock mínimo</label>
          <input id="ni-min" name="minimo" type="number" step="any" min={0} defaultValue={1} className={input} />
        </div>
      </div>
      <div className="sm:max-w-xs">
        <label className={etiqueta} htmlFor="ni-ini">Stock que tenés hoy</label>
        <input id="ni-ini" name="inicial" type="number" step="any" min={0} defaultValue={0} className={input} />
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="flex gap-2">
        <button disabled={pendiente} className={btnPrimario}>{pendiente ? "Guardando…" : "Crear insumo"}</button>
        <button type="button" onClick={() => setAbierto(false)} className={btnSecundario}>Cancelar</button>
      </div>
    </form>
  );
}
