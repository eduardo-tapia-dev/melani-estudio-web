"use client";

import { useEffect, useState, useTransition } from "react";
import { buscarClientas, crearClienta } from "@/app/admin/acciones-agenda";
import { btnPrimario, btnSecundario, etiqueta, input } from "./estilos";

export type ClientaMin = { id: string; nombre: string; telefono: string };

const telVisible = (t: string) => `0${t.slice(3, 6)} ${t.slice(6, 9)} ${t.slice(9)}`;

/** Buscar por nombre o teléfono, o crear una clienta nueva sin salir del formulario. */
export default function SelectorClienta({ valor, onCambio }: { valor: ClientaMin | null; onCambio: (c: ClientaMin | null) => void }) {
  const [q, setQ] = useState("");
  const [resultados, setResultados] = useState<ClientaMin[]>([]);
  const [creando, setCreando] = useState(false);
  const [nombre, setNombre] = useState("");
  const [tel, setTel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  useEffect(() => {
    if (valor || q.trim().length < 2) return;
    const t = setTimeout(() => {
      buscarClientas(q).then(setResultados);
    }, 250);
    return () => clearTimeout(t);
  }, [q, valor]);

  if (valor) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-taupe-oscuro bg-white px-4 py-3">
        <div>
          <p className="font-medium text-carbon">{valor.nombre}</p>
          <p className="text-sm text-gris">{telVisible(valor.telefono)}</p>
        </div>
        <button type="button" onClick={() => onCambio(null)} className="text-sm text-taupe-oscuro underline underline-offset-4">Cambiar</button>
      </div>
    );
  }

  if (creando) {
    return (
      <div className="space-y-3 rounded-xl border border-salvia bg-white p-4">
        <div>
          <label className={etiqueta} htmlFor="nc-nombre">Nombre</label>
          <input id="nc-nombre" className={input} value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="off" />
        </div>
        <div>
          <label className={etiqueta} htmlFor="nc-tel">Teléfono (WhatsApp)</label>
          <input id="nc-tel" className={input} value={tel} onChange={(e) => setTel(e.target.value)} inputMode="tel" placeholder="0981 123 456" autoComplete="off" />
        </div>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            disabled={pendiente}
            className={btnPrimario}
            onClick={() =>
              iniciar(async () => {
                setError(null);
                const r = await crearClienta(nombre, tel);
                if (!r.ok) return setError(r.error);
                onCambio({ id: r.datos!.id, nombre: nombre.trim(), telefono: r.datos!.telefono });
                setCreando(false);
              })
            }
          >
            {pendiente ? "Guardando…" : "Guardar clienta"}
          </button>
          <button type="button" className={btnSecundario} onClick={() => setCreando(false)}>Cancelar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <input
        className={input}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          if (e.target.value.trim().length < 2) setResultados([]);
        }}
        placeholder="Buscar por nombre o teléfono…"
        autoComplete="off"
        aria-label="Buscar clienta"
      />
      {resultados.length > 0 && (
        <ul className="divide-y divide-salvia/50 overflow-hidden rounded-xl border border-salvia bg-white">
          {resultados.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => onCambio(c)} className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-salvia-claro">
                <span className="font-medium text-carbon">{c.nombre}</span>
                <span className="text-sm text-gris">{telVisible(c.telefono)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {q.trim().length >= 2 && resultados.length === 0 && <p className="text-sm text-gris">No se encontró. </p>}
      <button
        type="button"
        onClick={() => {
          setCreando(true);
          const soloDigitos = /^[\d\s+()-]+$/.test(q);
          setNombre(soloDigitos ? "" : q);
          setTel(soloDigitos ? q : "");
        }}
        className="text-sm font-medium text-taupe-oscuro underline underline-offset-4"
      >
        + Clienta nueva
      </button>
    </div>
  );
}
