"use client";

import { useEffect, useState } from "react";
import { horariosLibres } from "@/app/admin/acciones-agenda";
import { input } from "./estilos";

type Props = {
  fecha: string;
  duracion: number | null;
  excluirCita?: string;
  valor: string;
  onCambio: (hora: string) => void;
};

/** Muestra los horarios libres del día según la duración del servicio. */
export default function SelectorHorario({ fecha, duracion, excluirCita, valor, onCambio }: Props) {
  const [horas, setHoras] = useState<string[] | null>(null);
  const [manual, setManual] = useState(false);
  const clave = duracion ? `${fecha}|${duracion}|${excluirCita ?? ""}` : null;
  const [claveCargada, setClaveCargada] = useState<string | null>(null);

  useEffect(() => {
    if (!clave || !duracion) return;
    let vigente = true;
    horariosLibres(fecha, duracion, excluirCita).then((h) => {
      if (!vigente) return;
      setHoras(h);
      setClaveCargada(clave);
    });
    return () => {
      vigente = false;
    };
  }, [clave, fecha, duracion, excluirCita]);

  if (!duracion) return <p className="rounded-2xl bg-salvia-claro/60 px-4 py-3 text-[15px] text-gris">Primero elegí qué se va a hacer (paso 2) y acá aparecen los horarios libres.</p>;
  const cargando = claveCargada !== clave;

  return (
    <div className="space-y-3">
      {cargando ? (
        <p className="text-sm text-gris">Buscando horarios libres…</p>
      ) : horas && horas.length > 0 ? (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6" role="radiogroup" aria-label="Horarios libres">
          {horas.map((h) => (
            <button
              key={h}
              type="button"
              role="radio"
              aria-checked={valor === h}
              onClick={() => {
                setManual(false);
                onCambio(h);
              }}
              className={`rounded-2xl border px-2 py-3.5 text-[16px] font-medium tabular-nums transition-all ${valor === h ? "border-carbon bg-carbon text-hueso shadow-md" : "border-salvia/70 bg-white text-carbon hover:border-carbon"}`}
            >
              {h}
            </button>
          ))}
        </div>
      ) : (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">No quedan horarios libres ese día (o el estudio no atiende).</p>
      )}
      <div className="text-sm">
        {manual ? (
          <label className="flex items-center gap-2">
            <span className="text-gris">Otra hora:</span>
            <input type="time" step={600} value={valor} onChange={(e) => onCambio(e.target.value)} className={`${input} w-36 py-2`} />
          </label>
        ) : (
          <button type="button" onClick={() => setManual(true)} className="text-gris underline underline-offset-4">Escribir otra hora</button>
        )}
      </div>
    </div>
  );
}
