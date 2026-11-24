"use client";

import { useState, useTransition } from "react";
import { crearIngreso, eliminarIngreso } from "@/app/admin/acciones-finanzas";
import SelectorClienta, { type ClientaMin } from "@/components/admin/SelectorClienta";
import { btnPrimario, btnSecundario, etiqueta, input, tarjeta } from "@/components/admin/estilos";
import { formatoGs } from "@/lib/formato";

export default function NuevoIngreso({ hoy }: { hoy: string }) {
  const [abierto, setAbierto] = useState(false);
  const [fecha, setFecha] = useState(hoy);
  const [monto, setMonto] = useState("");
  const [medio, setMedio] = useState<"efectivo" | "transferencia">("transferencia");
  const [tipo, setTipo] = useState<"servicio" | "curso">("curso");
  const [clienta, setClienta] = useState<ClientaMin | null>(null);
  const [nota, setNota] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();
  const n = Number(monto.replace(/\D/g, "")) || 0;

  if (!abierto) return <button onClick={() => setAbierto(true)} className={btnPrimario}>+ Ingreso manual</button>;

  return (
    <div className={`${tarjeta} w-full space-y-4`}>
      <p className="text-sm text-gris">Para pagos que no salen de una cita, por ejemplo un curso.</p>
      <div className="grid gap-3 sm:grid-cols-4">
        <div>
          <label className={etiqueta} htmlFor="i-monto">Monto (Gs)</label>
          <input id="i-monto" inputMode="numeric" className={input} value={monto} onChange={(e) => setMonto(e.target.value)} />
          {n > 0 && <p className="mt-1 text-xs text-gris">{formatoGs(n)}</p>}
        </div>
        <div>
          <label className={etiqueta} htmlFor="i-tipo">Tipo</label>
          <select id="i-tipo" className={input} value={tipo} onChange={(e) => setTipo(e.target.value as "servicio" | "curso")}>
            <option value="curso">Curso</option>
            <option value="servicio">Servicio</option>
          </select>
        </div>
        <div>
          <label className={etiqueta} htmlFor="i-medio">Medio</label>
          <select id="i-medio" className={input} value={medio} onChange={(e) => setMedio(e.target.value as "efectivo" | "transferencia")}>
            <option value="transferencia">Transferencia</option>
            <option value="efectivo">Efectivo</option>
          </select>
        </div>
        <div>
          <label className={etiqueta} htmlFor="i-fecha">Fecha</label>
          <input id="i-fecha" type="date" max={hoy} className={input} value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
      </div>
      <div>
        <p className={etiqueta}>Clienta (opcional)</p>
        <SelectorClienta valor={clienta} onCambio={setClienta} />
      </div>
      <div>
        <label className={etiqueta} htmlFor="i-nota">Nota</label>
        <input id="i-nota" className={input} value={nota} onChange={(e) => setNota(e.target.value)} placeholder="ej. Curso de cejas – 1ª cuota" />
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="flex gap-2">
        <button
          disabled={pendiente || n <= 0}
          className={btnPrimario}
          onClick={() =>
            iniciar(async () => {
              setError(null);
              const r = await crearIngreso({ fecha, monto: n, medio, tipo, clientaId: clienta?.id ?? null, nota });
              if (!r.ok) return setError(r.error);
              setAbierto(false);
              setMonto("");
              setNota("");
              setClienta(null);
            })
          }
        >
          {pendiente ? "Guardando…" : "Guardar ingreso"}
        </button>
        <button onClick={() => setAbierto(false)} className={btnSecundario}>Cancelar</button>
      </div>
    </div>
  );
}

export function BorrarIngreso({ id }: { id: string }) {
  const [pendiente, iniciar] = useTransition();
  return (
    <button
      disabled={pendiente}
      onClick={() => confirm("¿Borrar este ingreso?") && iniciar(async () => {
        const r = await eliminarIngreso(id);
        if (!r.ok) alert(r.error);
      })}
      className="shrink-0 text-xs text-red-700"
      aria-label="Borrar ingreso"
    >
      Borrar
    </button>
  );
}
