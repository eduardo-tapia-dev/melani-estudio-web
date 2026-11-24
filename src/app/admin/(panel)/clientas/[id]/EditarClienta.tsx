"use client";

import { useState, useTransition } from "react";
import { editarClienta } from "@/app/admin/acciones-agenda";
import { btnPrimario, etiqueta, input, tarjeta } from "@/components/admin/estilos";

type C = { id: string; nombre: string; telefono: string; notas: string };

export default function EditarClienta({ clienta }: { clienta: C }) {
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [pendiente, iniciar] = useTransition();
  return (
    <form
      className={`${tarjeta} space-y-3`}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        iniciar(async () => {
          const r = await editarClienta(clienta.id, String(fd.get("nombre")), String(fd.get("telefono")), String(fd.get("notas")));
          setMsg(r.ok ? { ok: true, t: "Datos guardados." } : { ok: false, t: r.error });
        });
      }}
    >
      <h2 className="font-medium text-carbon">Datos y notas</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="e-nombre" className={etiqueta}>Nombre</label>
          <input id="e-nombre" name="nombre" defaultValue={clienta.nombre} required className={input} />
        </div>
        <div>
          <label htmlFor="e-tel" className={etiqueta}>Teléfono</label>
          <input id="e-tel" name="telefono" defaultValue={`0${clienta.telefono.slice(3)}`} required inputMode="tel" className={input} />
        </div>
      </div>
      <div>
        <label htmlFor="e-notas" className={etiqueta}>Notas</label>
        <textarea id="e-notas" name="notas" rows={3} defaultValue={clienta.notas} className={input} placeholder="Alergias, preferencias, curvatura que usa…" />
      </div>
      {msg && <p className={`text-sm ${msg.ok ? "text-emerald-800" : "text-red-700"}`}>{msg.t}</p>}
      <button disabled={pendiente} className={btnPrimario}>{pendiente ? "Guardando…" : "Guardar cambios"}</button>
    </form>
  );
}
