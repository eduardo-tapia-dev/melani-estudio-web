"use client";

import { useState, useTransition } from "react";
import {
  actualizarNotasCita,
  anularSena,
  cambiarEstado,
  registrarSena,
  reprogramarCita,
  type EstadoEditable,
  type Resultado,
} from "@/app/admin/acciones-agenda";
import { desmarcarAtendida, marcarAtendida } from "@/app/admin/acciones-finanzas";
import SelectorHorario from "@/components/admin/SelectorHorario";
import { btnPeligro, btnPrimario, btnSecundario, etiqueta, input, tarjeta } from "@/components/admin/estilos";
import { formatoGs } from "@/lib/formato";
import type { EstadoCita } from "@/lib/admin-datos";

type Cita = {
  id: string;
  estado: EstadoCita;
  fecha: string;
  hora: string;
  duracion: number;
  sena_pagada: boolean;
  sena_monto: number | null;
  sena_fecha: string | null;
  sena_medio: "efectivo" | "transferencia" | null;
  notas: string;
  monto_total: number | null;
  medio_pago: "efectivo" | "transferencia" | null;
};

export default function AccionesCita({ cita, hoy, senaDefault, valorReferencia }: { cita: Cita; hoy: string; senaDefault: number; valorReferencia: number | null }) {
  const [pendiente, iniciar] = useTransition();
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const activa = cita.estado === "pendiente_sena" || cita.estado === "confirmada";

  function ejecutar(accion: () => Promise<Resultado>, ok: string) {
    setMensaje(null);
    iniciar(async () => {
      const r = await accion();
      setMensaje(r.ok ? { tipo: "ok", texto: ok } : { tipo: "error", texto: r.error });
    });
  }
  const estado = (e: EstadoEditable, ok: string) => ejecutar(() => cambiarEstado(cita.id, e), ok);

  return (
    <div className="space-y-5">
      {mensaje && (
        <p
          role="status"
          className={`sticky top-3 z-20 flex items-center gap-3 rounded-2xl px-4 py-3.5 text-[15px] shadow-lg ${mensaje.tipo === "ok" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}
        >
          <span aria-hidden="true">{mensaje.tipo === "ok" ? "✓" : "!"}</span> {mensaje.texto}
        </p>
      )}

      {/* Lo más probable primero: si la cita ya pasó, cobrar; si es futura, la seña */}
      {cita.fecha <= hoy ? (
        <>
          {(activa || cita.estado === "atendida") && <Cobro cita={cita} hoy={hoy} valorReferencia={valorReferencia} pendiente={pendiente} ejecutar={ejecutar} />}
          {cita.estado !== "atendida" && <Sena cita={cita} hoy={hoy} senaDefault={senaDefault} pendiente={pendiente} ejecutar={ejecutar} />}
        </>
      ) : (
        <>
          {cita.estado !== "atendida" && <Sena cita={cita} hoy={hoy} senaDefault={senaDefault} pendiente={pendiente} ejecutar={ejecutar} />}
          {(activa || cita.estado === "atendida") && <Cobro cita={cita} hoy={hoy} valorReferencia={valorReferencia} pendiente={pendiente} ejecutar={ejecutar} />}
        </>
      )}

      {/* Reprogramar */}
      {activa && <Reprogramar cita={cita} hoy={hoy} pendiente={pendiente} ejecutar={ejecutar} />}

      {/* Cambios de estado */}
      <section className={tarjeta}>
        <h2 className="mb-1 font-serif text-2xl text-carbon">¿Cambió algo?</h2>
        <p className="mb-4 text-[15px] text-gris">Si la clienta confirmó, canceló o no vino.</p>
        <div className="flex flex-wrap gap-2">
          {cita.estado === "pendiente_sena" && (
            <button disabled={pendiente} onClick={() => estado("confirmada", "Cita confirmada.")} className={btnPrimario}>✓ Me confirmó que viene</button>
          )}
          {activa && (
            <>
              <button disabled={pendiente} onClick={() => estado("no_asistio", "Marcada: no vino.")} className={btnSecundario}>No vino</button>
              <button disabled={pendiente} onClick={() => confirm("¿Cancelar esta cita? El horario queda libre.") && estado("cancelada", "Cita cancelada.")} className={btnPeligro}>Cancelar cita</button>
            </>
          )}
          {(cita.estado === "cancelada" || cita.estado === "no_asistio") && (
            <button disabled={pendiente} onClick={() => estado(cita.sena_pagada ? "confirmada" : "pendiente_sena", "Cita reactivada.")} className={btnSecundario}>Volver a activar la cita</button>
          )}
          {cita.estado === "atendida" && <p className="text-[15px] text-gris">Para cambiar algo, primero usá “Deshacer atendida” en el cobro.</p>}
        </div>
      </section>

      {/* Notas */}
      <Notas cita={cita} pendiente={pendiente} ejecutar={ejecutar} />
    </div>
  );
}

type Ejecutar = (accion: () => Promise<Resultado>, ok: string) => void;

function Cobro({ cita, hoy, valorReferencia, pendiente, ejecutar }: { cita: Cita; hoy: string; valorReferencia: number | null; pendiente: boolean; ejecutar: Ejecutar }) {
  const atendida = cita.estado === "atendida";
  const [editando, setEditando] = useState(!atendida);
  const [total, setTotal] = useState(String(cita.monto_total ?? valorReferencia ?? ""));
  const [medio, setMedio] = useState<"efectivo" | "transferencia">(cita.medio_pago ?? "efectivo");
  const [fecha, setFecha] = useState(cita.fecha > hoy ? hoy : cita.fecha);
  const n = Number(total.replace(/\D/g, "")) || 0;
  const sena = cita.sena_pagada ? cita.sena_monto ?? 0 : 0;
  const saldo = n - sena;

  if (atendida && !editando) {
    return (
      <section id="cobro" className={`${tarjeta} scroll-mt-6 border-l-4 border-emerald-600`}>
        <h2 className="mb-2 font-serif text-2xl text-carbon">Cobro</h2>
        <dl className="grid grid-cols-3 gap-3 text-sm">
          <div><dt className="text-gris">Total</dt><dd className="font-medium text-carbon">{formatoGs(cita.monto_total)}</dd></div>
          <div><dt className="text-gris">Seña</dt><dd className="text-carbon">{formatoGs(sena)}</dd></div>
          <div><dt className="text-gris">Saldo ({cita.medio_pago})</dt><dd className="text-carbon">{formatoGs((cita.monto_total ?? 0) - sena)}</dd></div>
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => setEditando(true)} className={btnSecundario}>Corregir cobro</button>
          <button
            disabled={pendiente}
            onClick={() => confirm("¿Deshacer “atendida”? Se borra el ingreso del saldo y vuelven los insumos al stock.") && ejecutar(() => desmarcarAtendida(cita.id), "Se deshizo el cobro.")}
            className={btnPeligro}
          >
            Deshacer atendida
          </button>
        </div>
      </section>
    );
  }

  return (
    <section id="cobro" className={`${tarjeta} scroll-mt-6`}>
      <h2 className="mb-1 font-serif text-2xl text-carbon">{atendida ? "Corregir lo cobrado" : "Cobrar esta cita"}</h2>
      <p className="mb-3 text-sm text-gris">Escribí cuánto te pagó en total por el servicio. La seña que ya te pagó se descuenta sola.</p>
      <div className="grid gap-3 sm:grid-cols-3 sm:items-end">
        <div>
          <label className={etiqueta} htmlFor="c-total">Total cobrado (Gs)</label>
          <input id="c-total" inputMode="numeric" className={input} value={total} onChange={(e) => setTotal(e.target.value)} placeholder={valorReferencia ? String(valorReferencia) : "ej. 250000"} />
        </div>
        <div>
          <label className={etiqueta} htmlFor="c-medio">Medio del saldo</label>
          <select id="c-medio" className={input} value={medio} onChange={(e) => setMedio(e.target.value as "efectivo" | "transferencia")}>
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
          </select>
        </div>
        <div>
          <label className={etiqueta} htmlFor="c-fecha">Fecha del cobro</label>
          <input id="c-fecha" type="date" max={hoy} className={input} value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
      </div>
      {n > 0 && (
        <p className={`mt-3 rounded-lg px-3 py-2 text-sm ${saldo < 0 ? "bg-red-50 text-red-700" : "bg-salvia-claro/70 text-carbon"}`}>
          {formatoGs(n)} − seña {formatoGs(sena)} = <strong>{saldo < 0 ? "el total no puede ser menor que la seña" : `${formatoGs(saldo)} de saldo`}</strong>
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          disabled={pendiente || n <= 0 || saldo < 0}
          onClick={() =>
            ejecutar(async () => {
              const r = await marcarAtendida(cita.id, n, medio, fecha);
              if (r.ok) setEditando(false);
              return r.ok ? { ok: true } : r;
            }, `Cita cobrada: ${formatoGs(n)}${saldo > 0 ? ` (saldo ${formatoGs(saldo)} en ${medio})` : ""}.`)
          }
          className={btnPrimario}
        >
          ✓ {atendida ? "Guardar corrección" : "Listo, ya la atendí"}
        </button>
        {atendida && <button onClick={() => setEditando(false)} className={btnSecundario}>Cancelar</button>}
      </div>
    </section>
  );
}

function Sena({ cita, hoy, senaDefault, pendiente, ejecutar }: { cita: Cita; hoy: string; senaDefault: number; pendiente: boolean; ejecutar: Ejecutar }) {
  const [editando, setEditando] = useState(!cita.sena_pagada);
  const [monto, setMonto] = useState(String(cita.sena_monto ?? senaDefault));
  const [medio, setMedio] = useState<"transferencia" | "efectivo">(cita.sena_medio ?? "transferencia");
  const [fecha, setFecha] = useState(cita.sena_fecha ?? hoy);
  const n = Number(monto.replace(/\D/g, "")) || 0;

  if (cita.estado === "cancelada" && !cita.sena_pagada) return null;

  return (
    <section id="sena" className={`${tarjeta} scroll-mt-6`}>
      <h2 className="mb-3 font-serif text-2xl text-carbon">Seña</h2>
      {cita.sena_pagada && !editando ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-carbon">
            {formatoGs(cita.sena_monto)} por {cita.sena_medio} · {cita.sena_fecha}
          </p>
          <div className="flex gap-2">
            <button onClick={() => setEditando(true)} className={btnSecundario}>Corregir</button>
            <button disabled={pendiente} onClick={() => confirm("¿Quitar la seña? También se borra su ingreso.") && ejecutar(() => anularSena(cita.id), "Seña anulada.")} className={btnPeligro}>Anular</button>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-4 sm:items-end">
          <div>
            <label className={etiqueta} htmlFor="s-monto">Monto (Gs)</label>
            <input id="s-monto" inputMode="numeric" className={input} value={monto} onChange={(e) => setMonto(e.target.value)} />
          </div>
          <div>
            <label className={etiqueta} htmlFor="s-medio">Medio</label>
            <select id="s-medio" className={input} value={medio} onChange={(e) => setMedio(e.target.value as "transferencia" | "efectivo")}>
              <option value="transferencia">Transferencia</option>
              <option value="efectivo">Efectivo</option>
            </select>
          </div>
          <div>
            <label className={etiqueta} htmlFor="s-fecha">Fecha de pago</label>
            <input id="s-fecha" type="date" className={input} value={fecha} max={hoy} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <button
            disabled={pendiente || n <= 0}
            onClick={() => {
              ejecutar(() => registrarSena(cita.id, n, fecha, medio), `Seña de ${formatoGs(n)} registrada.`);
              setEditando(false);
            }}
            className={btnPrimario}
          >
            Registrar seña
          </button>
        </div>
      )}
    </section>
  );
}

function Reprogramar({ cita, hoy, pendiente, ejecutar }: { cita: Cita; hoy: string; pendiente: boolean; ejecutar: Ejecutar }) {
  const [abierto, setAbierto] = useState(false);
  const [fecha, setFecha] = useState(cita.fecha < hoy ? hoy : cita.fecha);
  const [hora, setHora] = useState("");
  return (
    <section className={tarjeta}>
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl text-carbon">Cambiar día u hora</h2>
        {!abierto && <button onClick={() => setAbierto(true)} className={btnSecundario}>Reprogramar</button>}
      </div>
      {abierto && (
        <div className="mt-4 space-y-4">
          <input type="date" min={hoy} className={`${input} sm:max-w-xs`} value={fecha} onChange={(e) => { setFecha(e.target.value); setHora(""); }} aria-label="Nueva fecha" />
          <SelectorHorario fecha={fecha} duracion={cita.duracion} excluirCita={cita.id} valor={hora} onCambio={setHora} />
          <div className="flex gap-2">
            <button
              disabled={pendiente || !hora}
              onClick={() => ejecutar(() => reprogramarCita(cita.id, fecha, hora), `Cita movida a ${fecha} ${hora}.`)}
              className={btnPrimario}
            >
              Guardar nuevo horario
            </button>
            <button onClick={() => setAbierto(false)} className={btnSecundario}>Cerrar</button>
          </div>
        </div>
      )}
    </section>
  );
}

function Notas({ cita, pendiente, ejecutar }: { cita: Cita; pendiente: boolean; ejecutar: Ejecutar }) {
  const [notas, setNotas] = useState(cita.notas);
  return (
    <section className={tarjeta}>
      <label htmlFor="notas" className={etiqueta}>Notas</label>
      <textarea id="notas" rows={3} className={input} value={notas} onChange={(e) => setNotas(e.target.value)} />
      {notas !== cita.notas && (
        <button disabled={pendiente} onClick={() => ejecutar(() => actualizarNotasCita(cita.id, notas), "Notas guardadas.")} className={`${btnPrimario} mt-2`}>
          Guardar notas
        </button>
      )}
    </section>
  );
}
