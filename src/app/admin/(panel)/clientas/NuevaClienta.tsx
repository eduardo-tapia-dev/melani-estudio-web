"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { crearClienta } from "@/app/admin/acciones-agenda";
import { btnPrimario, btnSecundario, etiqueta, input, tarjeta } from "@/components/admin/estilos";

export default function NuevaClienta() {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  if (!abierto) return <button onClick={() => setAbierto(true)} className={btnPrimario}>+ Nueva clienta</button>;

  return (
    <form
      className={`${tarjeta} w-full space-y-3`}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setError(null);
        iniciar(async () => {
          const r = await crearClienta(String(fd.get("nombre")), String(fd.get("telefono")), String(fd.get("notas") ?? ""));
          if (!r.ok) return setError(r.error);
          router.push(`/admin/clientas/${r.datos!.id}`);
        });
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="n-nombre" className={etiqueta}>Nombre</label>
          <input id="n-nombre" name="nombre" required className={input} autoComplete="off" />
        </div>
        <div>
          <label htmlFor="n-tel" className={etiqueta}>Teléfono (WhatsApp)</label>
          <input id="n-tel" name="telefono" required inputMode="tel" placeholder="0981 123 456" className={input} autoComplete="off" />
        </div>
      </div>
      <div>
        <label htmlFor="n-notas" className={etiqueta}>Notas (opcional)</label>
        <textarea id="n-notas" name="notas" rows={2} className={input} placeholder="Alergias, preferencias…" />
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="flex gap-2">
        <button disabled={pendiente} className={btnPrimario}>{pendiente ? "Guardando…" : "Guardar"}</button>
        <button type="button" onClick={() => setAbierto(false)} className={btnSecundario}>Cancelar</button>
      </div>
    </form>
  );
}
