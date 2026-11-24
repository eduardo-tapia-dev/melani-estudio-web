"use client";

import { useState, useTransition } from "react";
import { anularMovimiento, guardarInsumo, guardarUsoEnServicios, moverStock, registrarCompra } from "@/app/admin/acciones-finanzas";
import type { Resultado } from "@/app/admin/acciones-agenda";
import { btnPrimario, btnSecundario, etiqueta, input, tarjeta } from "@/components/admin/estilos";
import { formatoGs } from "@/lib/formato";

function useAccion() {
  const [pendiente, iniciar] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const correr = (f: () => Promise<Resultado<unknown>>, ok: string, despues?: () => void) =>
    iniciar(async () => {
      setMsg(null);
      const r = await f();
      setMsg(r.ok ? { ok: true, t: ok } : { ok: false, t: r.error });
      if (r.ok) despues?.();
    });
  const Mensaje = () => (msg ? <p className={`text-sm ${msg.ok ? "text-emerald-800" : "text-red-700"}`}>{msg.t}</p> : null);
  return { pendiente, correr, Mensaje };
}

export function FormCompra({ insumoId, unidad, hoy }: { insumoId: string; unidad: string; hoy: string }) {
  const [cant, setCant] = useState("");
  const [costo, setCosto] = useState("");
  const [medio, setMedio] = useState<"efectivo" | "transferencia">("transferencia");
  const [fecha, setFecha] = useState(hoy);
  const [nota, setNota] = useState("");
  const { pendiente, correr, Mensaje } = useAccion();
  const c = Number(cant.replace(",", ".")) || 0;
  const t = Number(costo.replace(/\D/g, "")) || 0;
  return (
    <section className={`${tarjeta} space-y-3`}>
      <h2 className="font-medium text-carbon">🛍 Registrar compra</h2>
      <p className="text-xs text-gris">Suma al stock y crea el gasto en “Insumos” automáticamente.</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={etiqueta} htmlFor="co-cant">Cantidad ({unidad})</label>
          <input id="co-cant" inputMode="decimal" className={input} value={cant} onChange={(e) => setCant(e.target.value)} />
        </div>
        <div>
          <label className={etiqueta} htmlFor="co-costo">Costo total (Gs)</label>
          <input id="co-costo" inputMode="numeric" className={input} value={costo} onChange={(e) => setCosto(e.target.value)} />
        </div>
        <div>
          <label className={etiqueta} htmlFor="co-medio">Medio</label>
          <select id="co-medio" className={input} value={medio} onChange={(e) => setMedio(e.target.value as "efectivo" | "transferencia")}>
            <option value="transferencia">Transferencia</option>
            <option value="efectivo">Efectivo</option>
          </select>
        </div>
        <div>
          <label className={etiqueta} htmlFor="co-fecha">Fecha</label>
          <input id="co-fecha" type="date" max={hoy} className={input} value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
      </div>
      <input className={input} value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Proveedor o detalle (opcional)" aria-label="Detalle de la compra" />
      {c > 0 && t > 0 && <p className="text-sm text-gris">{formatoGs(t)} → {formatoGs(Math.round(t / c))} por {unidad}</p>}
      <Mensaje />
      <button
        disabled={pendiente || c <= 0}
        onClick={() => correr(() => registrarCompra(insumoId, { cantidad: c, costoTotal: t, fecha, medio, nota }), `Compra registrada: +${c} ${unidad}.`, () => { setCant(""); setCosto(""); setNota(""); })}
        className={btnPrimario}
      >
        Registrar compra
      </button>
    </section>
  );
}

export function FormUso({ insumoId, unidad }: { insumoId: string; unidad: string }) {
  const [tipo, setTipo] = useState<"uso" | "ajuste">("uso");
  const [cant, setCant] = useState("");
  const [nota, setNota] = useState("");
  const { pendiente, correr, Mensaje } = useAccion();
  const c = Number(cant.replace(",", ".")) || 0;
  return (
    <section className={`${tarjeta} space-y-3`}>
      <h2 className="font-medium text-carbon">✎ Uso o ajuste</h2>
      <div className="inline-flex rounded-xl bg-salvia-claro p-1">
        {(["uso", "ajuste"] as const).map((t) => (
          <button key={t} onClick={() => setTipo(t)} className={`rounded-lg px-3 py-1.5 text-sm ${tipo === t ? "bg-white text-carbon shadow-sm" : "text-gris"}`}>
            {t === "uso" ? "Usé" : "Ajustar (+/−)"}
          </button>
        ))}
      </div>
      <p className="text-xs text-gris">
        {tipo === "uso" ? `Resta del stock lo que usaste (${unidad}).` : "Corrige el stock: positivo suma, negativo resta (ej. −1 si se venció o rompió)."}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={etiqueta} htmlFor="us-cant">Cantidad</label>
          <input id="us-cant" inputMode="decimal" className={input} value={cant} onChange={(e) => setCant(e.target.value)} placeholder={tipo === "uso" ? "1" : "-1"} />
        </div>
        <div>
          <label className={etiqueta} htmlFor="us-nota">Motivo</label>
          <input id="us-nota" className={input} value={nota} onChange={(e) => setNota(e.target.value)} placeholder="opcional" />
        </div>
      </div>
      <Mensaje />
      <button
        disabled={pendiente || !c}
        onClick={() => correr(() => moverStock(insumoId, tipo, c, nota), tipo === "uso" ? `Se restaron ${Math.abs(c)} ${unidad}.` : "Stock ajustado.", () => { setCant(""); setNota(""); })}
        className={btnSecundario}
      >
        Guardar
      </button>
    </section>
  );
}

export function UsoEnServicios({ insumoId, unidad, servicios }: { insumoId: string; unidad: string; servicios: { id: string; nombre: string; cantidad: number }[] }) {
  const [valores, setValores] = useState(Object.fromEntries(servicios.map((s) => [s.id, s.cantidad ? String(s.cantidad) : ""])));
  const { pendiente, correr, Mensaje } = useAccion();
  const usados = servicios.filter((s) => s.cantidad > 0).length;
  return (
    <details className={tarjeta}>
      <summary className="cursor-pointer font-medium text-carbon">
        Descontar solo al atender {usados > 0 ? <span className="text-sm font-normal text-gris">· se usa en {usados} servicio{usados > 1 ? "s" : ""}</span> : <span className="text-sm font-normal text-gris">· opcional</span>}
      </summary>
      <p className="mt-2 text-sm text-gris">Cuánto {unidad} se gasta en cada servicio. Al marcar una cita como atendida, se resta del stock. Dejá vacío si no aplica.</p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {servicios.map((s) => (
          <li key={s.id} className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-sm text-carbon">{s.nombre}</span>
            <input
              inputMode="decimal"
              className={`${input} w-24 py-2 text-right`}
              value={valores[s.id]}
              onChange={(e) => setValores((v) => ({ ...v, [s.id]: e.target.value }))}
              aria-label={`Cantidad para ${s.nombre}`}
            />
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center gap-3">
        <button
          disabled={pendiente}
          onClick={() => correr(() => guardarUsoEnServicios(insumoId, Object.entries(valores).map(([servicioId, v]) => ({ servicioId, cantidad: Number(String(v).replace(",", ".")) || 0 }))), "Guardado.")}
          className={btnPrimario}
        >
          Guardar
        </button>
        <Mensaje />
      </div>
    </details>
  );
}

export function EditarInsumo({ insumo }: { insumo: { id: string; nombre: string; unidad: string; stock_minimo: number; activo: boolean } }) {
  const { pendiente, correr, Mensaje } = useAccion();
  return (
    <details className={tarjeta}>
      <summary className="cursor-pointer font-medium text-carbon">Editar datos</summary>
      <form
        className="mt-3 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          correr(() => guardarInsumo(insumo.id, { nombre: String(fd.get("nombre")), unidad: String(fd.get("unidad")), stock_minimo: Number(fd.get("minimo")), activo: fd.get("activo") === "on" }), "Guardado.");
        }}
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className={etiqueta} htmlFor="ed-nombre">Nombre</label>
            <input id="ed-nombre" name="nombre" defaultValue={insumo.nombre} className={input} />
          </div>
          <div>
            <label className={etiqueta} htmlFor="ed-unidad">Unidad</label>
            <input id="ed-unidad" name="unidad" defaultValue={insumo.unidad} className={input} />
          </div>
          <div>
            <label className={etiqueta} htmlFor="ed-min">Stock mínimo</label>
            <input id="ed-min" name="minimo" type="number" step="any" min={0} defaultValue={insumo.stock_minimo} className={input} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="activo" defaultChecked={insumo.activo} className="size-5 accent-taupe-oscuro" /> Activo (desmarcá si ya no lo usás)
        </label>
        <Mensaje />
        <button disabled={pendiente} className={btnPrimario}>Guardar</button>
      </form>
    </details>
  );
}

export function AnularMovimiento({ id, esCompra }: { id: string; esCompra: boolean }) {
  const [pendiente, iniciar] = useTransition();
  return (
    <button
      disabled={pendiente}
      onClick={() => confirm(esCompra ? "¿Anular esta compra? Se resta del stock y se borra su gasto." : "¿Anular este movimiento?") && iniciar(async () => { const r = await anularMovimiento(id); if (!r.ok) alert(r.error); })}
      className="shrink-0 text-xs text-red-700"
    >
      Anular
    </button>
  );
}
