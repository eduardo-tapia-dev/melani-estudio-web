"use client";

import { useState, useTransition } from "react";
import { aprobarResena, eliminarResena, limpiarFotosHuerfanas, rechazarResena } from "@/app/admin/acciones-contenido";
import { btnPeligro, btnPrimario, btnSecundario } from "@/components/admin/estilos";

export function AccionesResena({ id, estado }: { id: string; estado: "pendiente" | "aprobada" | "rechazada" }) {
  const [pendiente, iniciar] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const correr = (f: () => Promise<{ ok: boolean; error?: string }>) =>
    iniciar(async () => {
      setError(null);
      const r = await f();
      if (!r.ok) setError(r.error ?? "Error");
    });
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {estado !== "aprobada" && (
        <button disabled={pendiente} onClick={() => correr(() => aprobarResena(id))} className={btnPrimario}>
          ✓ Publicar
        </button>
      )}
      {estado === "pendiente" && (
        <button disabled={pendiente} onClick={() => confirm("¿Rechazar esta reseña? Se borran sus fotos.") && correr(() => rechazarResena(id))} className={btnSecundario}>
          Rechazar
        </button>
      )}
      {estado === "aprobada" && (
        <button disabled={pendiente} onClick={() => confirm("¿Quitar esta reseña del sitio? Se borran sus fotos.") && correr(() => rechazarResena(id))} className={btnSecundario}>
          Quitar del sitio
        </button>
      )}
      {estado === "rechazada" && (
        <button disabled={pendiente} onClick={() => confirm("¿Borrar definitivamente?") && correr(() => eliminarResena(id))} className={btnPeligro}>
          Borrar
        </button>
      )}
      {error && <span className="text-sm text-red-700">{error}</span>}
    </div>
  );
}

export function LimpiarHuerfanas() {
  const [pendiente, iniciar] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-gris">
      <button
        disabled={pendiente}
        onClick={() => iniciar(async () => {
          const r = await limpiarFotosHuerfanas();
          setMsg(r.ok ? `Listo: ${r.datos?.borradas ?? 0} foto(s) sin usar borradas.` : r.error);
        })}
        className="underline underline-offset-4"
      >
        Limpiar fotos subidas que nunca se enviaron
      </button>
      {msg && <span>{msg}</span>}
    </div>
  );
}
