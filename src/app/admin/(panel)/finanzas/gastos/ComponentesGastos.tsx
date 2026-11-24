"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { crearCategoriaGasto, crearGasto, eliminarCategoriaGasto, eliminarGasto, renombrarCategoriaGasto } from "@/app/admin/acciones-finanzas";
import { btnPrimario, btnSecundario, etiqueta, input, tarjeta } from "@/components/admin/estilos";
import { formatoGs } from "@/lib/formato";

type Cat = { id: string; nombre: string; es_insumos: boolean };

export function NuevoGasto({ hoy, categorias }: { hoy: string; categorias: Cat[] }) {
  const [abierto, setAbierto] = useState(false);
  const [fecha, setFecha] = useState(hoy);
  const [monto, setMonto] = useState("");
  const [cat, setCat] = useState(categorias.find((c) => !c.es_insumos)?.id ?? categorias[0]?.id ?? "");
  const [medio, setMedio] = useState<"efectivo" | "transferencia">("efectivo");
  const [nota, setNota] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();
  const n = Number(monto.replace(/\D/g, "")) || 0;
  const esInsumos = categorias.find((c) => c.id === cat)?.es_insumos;

  if (!abierto) return <button onClick={() => setAbierto(true)} className={btnPrimario}>+ Nuevo gasto</button>;

  return (
    <div className={`${tarjeta} w-full space-y-4`}>
      <div className="grid gap-3 sm:grid-cols-4">
        <div>
          <label className={etiqueta} htmlFor="g-monto">Monto (Gs)</label>
          <input id="g-monto" inputMode="numeric" className={input} value={monto} onChange={(e) => setMonto(e.target.value)} />
          {n > 0 && <p className="mt-1 text-xs text-gris">{formatoGs(n)}</p>}
        </div>
        <div>
          <label className={etiqueta} htmlFor="g-cat">Categoría</label>
          <select id="g-cat" className={input} value={cat} onChange={(e) => setCat(e.target.value)}>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className={etiqueta} htmlFor="g-medio">Medio</label>
          <select id="g-medio" className={input} value={medio} onChange={(e) => setMedio(e.target.value as "efectivo" | "transferencia")}>
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
          </select>
        </div>
        <div>
          <label className={etiqueta} htmlFor="g-fecha">Fecha</label>
          <input id="g-fecha" type="date" max={hoy} className={input} value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
      </div>
      {esInsumos && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Si es una compra de un insumo del inventario, cargala desde <Link href="/admin/finanzas/insumos" className="underline">Insumos</Link>: así también suma el stock.
        </p>
      )}
      <div>
        <label className={etiqueta} htmlFor="g-nota">Detalle</label>
        <input id="g-nota" className={input} value={nota} onChange={(e) => setNota(e.target.value)} placeholder="ej. Alquiler de noviembre" />
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="flex gap-2">
        <button
          disabled={pendiente || n <= 0}
          className={btnPrimario}
          onClick={() =>
            iniciar(async () => {
              setError(null);
              const r = await crearGasto({ fecha, monto: n, categoriaId: cat, medio, nota });
              if (!r.ok) return setError(r.error);
              setAbierto(false);
              setMonto("");
              setNota("");
            })
          }
        >
          {pendiente ? "Guardando…" : "Guardar gasto"}
        </button>
        <button onClick={() => setAbierto(false)} className={btnSecundario}>Cancelar</button>
      </div>
    </div>
  );
}

export function BorrarGasto({ id, esCompra }: { id: string; esCompra: boolean }) {
  const [pendiente, iniciar] = useTransition();
  return (
    <button
      disabled={pendiente}
      onClick={() =>
        confirm(esCompra ? "¿Borrar esta compra? También se descuenta del stock del insumo." : "¿Borrar este gasto?") &&
        iniciar(async () => {
          const r = await eliminarGasto(id);
          if (!r.ok) alert(r.error);
        })
      }
      className="shrink-0 text-xs text-red-700"
    >
      Borrar
    </button>
  );
}

export function Categorias({ categorias }: { categorias: Cat[] }) {
  const [nueva, setNueva] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();
  const correr = (f: () => Promise<{ ok: boolean; error?: string }>) =>
    iniciar(async () => {
      setError(null);
      const r = await f();
      if (!r.ok) setError(r.error ?? "Error");
    });

  return (
    <details className={tarjeta}>
      <summary className="cursor-pointer font-medium text-carbon">Categorías de gasto</summary>
      <ul className="mt-4 space-y-2">
        {categorias.map((c) => (
          <li key={c.id} className="flex items-center gap-2">
            <input
              defaultValue={c.nombre}
              className={`${input} py-2`}
              aria-label={`Nombre de ${c.nombre}`}
              onBlur={(e) => e.target.value.trim() !== c.nombre && correr(() => renombrarCategoriaGasto(c.id, e.target.value))}
            />
            {c.es_insumos ? (
              <span className="shrink-0 text-xs text-gris">Compras</span>
            ) : (
              <button disabled={pendiente} onClick={() => confirm(`¿Borrar "${c.nombre}"?`) && correr(() => eliminarCategoriaGasto(c.id))} className="shrink-0 px-2 text-sm text-red-700">Borrar</button>
            )}
          </li>
        ))}
      </ul>
      <div className="mt-3 flex gap-2">
        <input value={nueva} onChange={(e) => setNueva(e.target.value)} placeholder="Nueva categoría" className={`${input} py-2`} />
        <button disabled={pendiente || !nueva.trim()} onClick={() => correr(async () => { const r = await crearCategoriaGasto(nueva); if (r.ok) setNueva(""); return r; })} className={btnSecundario}>Agregar</button>
      </div>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </details>
  );
}
