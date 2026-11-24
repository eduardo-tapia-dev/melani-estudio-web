"use client";

import { useState, useTransition } from "react";
import { guardarFaq } from "@/app/admin/acciones-contenido";
import { btnPrimario, btnSecundario, etiqueta, input, tarjeta } from "@/components/admin/estilos";

type Item = { pregunta: string; respuesta: string; visible: boolean };

export default function EditorFaq({ inicial }: { inicial: Item[] }) {
  const [items, setItems] = useState<Item[]>(inicial);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [pendiente, iniciar] = useTransition();

  const cambiar = (i: number, d: Partial<Item>) => setItems((l) => l.map((x, n) => (n === i ? { ...x, ...d } : x)));
  const mover = (i: number, d: -1 | 1) =>
    setItems((l) => {
      const j = i + d;
      if (j < 0 || j >= l.length) return l;
      const c = [...l];
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });

  return (
    <div className="space-y-4">
      {items.map((it, i) => (
        <div key={i} className={`${tarjeta} space-y-3 ${it.visible ? "" : "opacity-60"}`}>
          <div>
            <label className={etiqueta} htmlFor={`p${i}`}>Pregunta {i + 1}</label>
            <input id={`p${i}`} className={input} value={it.pregunta} onChange={(e) => cambiar(i, { pregunta: e.target.value })} />
          </div>
          <div>
            <label className={etiqueta} htmlFor={`r${i}`}>Respuesta</label>
            <textarea id={`r${i}`} rows={3} className={input} value={it.respuesta} onChange={(e) => cambiar(i, { respuesta: e.target.value })} />
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={it.visible} onChange={(e) => cambiar(i, { visible: e.target.checked })} className="size-5 accent-taupe-oscuro" />
              Visible
            </label>
            <button type="button" onClick={() => mover(i, -1)} disabled={i === 0} className="px-2 text-gris disabled:opacity-30">↑ Subir</button>
            <button type="button" onClick={() => mover(i, 1)} disabled={i === items.length - 1} className="px-2 text-gris disabled:opacity-30">↓ Bajar</button>
            <button type="button" onClick={() => confirm("¿Quitar esta pregunta?") && setItems((l) => l.filter((_, n) => n !== i))} className="ml-auto text-red-700">Quitar</button>
          </div>
        </div>
      ))}
      <button type="button" onClick={() => setItems((l) => [...l, { pregunta: "", respuesta: "", visible: true }])} className={btnSecundario}>+ Agregar pregunta</button>
      {msg && <p className={`text-sm ${msg.ok ? "text-emerald-800" : "text-red-700"}`}>{msg.t}</p>}
      <div className="sticky bottom-20 lg:bottom-4">
        <button
          disabled={pendiente}
          onClick={() =>
            iniciar(async () => {
              const r = await guardarFaq(items);
              setMsg(r.ok ? { ok: true, t: "Guardado. Ya se ve en el sitio." } : { ok: false, t: r.error });
            })
          }
          className={`${btnPrimario} w-full py-4 shadow-lg`}
        >
          {pendiente ? "Guardando…" : "Guardar preguntas"}
        </button>
      </div>
    </div>
  );
}
