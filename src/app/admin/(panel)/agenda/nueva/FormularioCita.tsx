"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { crearCita } from "@/app/admin/acciones-agenda";
import SelectorClienta, { type ClientaMin } from "@/components/admin/SelectorClienta";
import SelectorHorario from "@/components/admin/SelectorHorario";
import Icono from "@/components/admin/Iconos";
import { btnPrimario, etiqueta, input, tarjeta } from "@/components/admin/estilos";
import { formatoGs } from "@/lib/formato";

type Item = { id: string; nombre: string; duracion: number; grupo: string };

type Props = {
  servicios: Item[];
  cursos: Item[];
  fechaInicial: string;
  hoy: string;
  senaDefault: number;
  diasAtencion: number[];
  clientaInicial: ClientaMin | null;
};

const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const aFecha = (f: string) => {
  const [y, m, d] = f.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};
const sumar = (f: string, n: number) => {
  const t = aFecha(f);
  t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
};
const diaIso = (f: string) => {
  const w = aFecha(f).getUTCDay();
  return w === 0 ? 7 : w;
};
const textoFecha = (f: string) => {
  const t = aFecha(f);
  return `${DIAS[t.getUTCDay()]} ${t.getUTCDate()} ${MESES[t.getUTCMonth()]}`;
};
const duracionTexto = (min: number) => (min % 60 === 0 ? `${min / 60} h` : min > 60 ? `${Math.floor(min / 60)} h ${min % 60} min` : `${min} min`);

function Paso({ numero, titulo, hecho, children }: { numero: number; titulo: string; hecho: boolean; children: React.ReactNode }) {
  return (
    <section className={tarjeta} aria-label={titulo}>
      <h2 className="mb-4 flex items-center gap-3 text-[17px] font-medium text-carbon">
        <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm transition-colors ${hecho ? "bg-emerald-600 text-white" : "bg-carbon text-hueso"}`}>
          {hecho ? <Icono nombre="check" className="size-4" /> : numero}
        </span>
        {titulo}
      </h2>
      {children}
    </section>
  );
}

export default function FormularioCita({ servicios, cursos, fechaInicial, hoy, senaDefault, diasAtencion, clientaInicial }: Props) {
  const router = useRouter();
  const [clienta, setClienta] = useState<ClientaMin | null>(clientaInicial);
  const [itemClave, setItemClave] = useState("");
  const [fecha, setFecha] = useState(fechaInicial);
  const [hora, setHora] = useState("");
  const [notas, setNotas] = useState("");
  const [conSena, setConSena] = useState(false);
  const [senaMonto, setSenaMonto] = useState(String(senaDefault));
  const [senaMedio, setSenaMedio] = useState<"transferencia" | "efectivo">("transferencia");
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  const grupos = useMemo(() => {
    const m = new Map<string, Item[]>();
    [...servicios, ...cursos].forEach((i) => m.set(i.grupo, [...(m.get(i.grupo) ?? []), i]));
    return [...m.entries()];
  }, [servicios, cursos]);
  const [grupoActivo, setGrupoActivo] = useState(grupos[0]?.[0] ?? "");

  // Próximos 8 días en que el estudio atiende
  const proximos = useMemo(() => {
    const lista: string[] = [];
    for (let i = 0; lista.length < 8 && i < 21; i++) {
      const f = sumar(hoy, i);
      if (diasAtencion.includes(diaIso(f))) lista.push(f);
    }
    return lista;
  }, [hoy, diasAtencion]);

  const [tipo, itemId] = itemClave ? (itemClave.split(":") as ["servicio" | "curso", string]) : [null, ""];
  const item = [...servicios, ...cursos].find((i) => i.id === itemId);
  const diaCerrado = !diasAtencion.includes(diaIso(fecha));
  const etiquetaDia = (f: string) => (f === hoy ? "Hoy" : f === sumar(hoy, 1) ? "Mañana" : textoFecha(f).split(" ")[0]);

  function guardar() {
    setError(null);
    if (!clienta) return setError("Falta elegir la clienta (paso 1).");
    if (!tipo || !item) return setError("Falta elegir el servicio (paso 2).");
    if (!hora) return setError("Falta elegir el horario (paso 3).");
    iniciar(async () => {
      const r = await crearCita({
        clientaId: clienta.id,
        tipo,
        itemId,
        fecha,
        hora,
        notas,
        sena: conSena ? { monto: Number(senaMonto.replace(/\D/g, "")), medio: senaMedio, fecha: hoy } : null,
      });
      if (!r.ok) return setError(r.error);
      router.push(`/admin/agenda/${r.datos!.id}?nueva=1`);
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        guardar();
      }}
      className="space-y-4"
    >
      <Paso numero={1} titulo="¿Para quién es la cita?" hecho={Boolean(clienta)}>
        <SelectorClienta valor={clienta} onCambio={setClienta} />
      </Paso>

      <Paso numero={2} titulo="¿Qué se va a hacer?" hecho={Boolean(item)}>
        <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Categorías">
          {grupos.map(([g]) => (
            <button
              key={g}
              type="button"
              role="tab"
              aria-selected={grupoActivo === g}
              onClick={() => setGrupoActivo(g)}
              className={`shrink-0 rounded-full px-4 py-2.5 text-[15px] transition-colors ${grupoActivo === g ? "bg-carbon text-hueso" : "bg-salvia-claro text-carbon hover:bg-salvia/50"}`}
            >
              {g}
            </button>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Servicio">
          {(grupos.find(([g]) => g === grupoActivo)?.[1] ?? []).map((i) => {
            const clave = `${i.grupo === "Cursos" ? "curso" : "servicio"}:${i.id}`;
            const on = itemClave === clave;
            return (
              <button
                key={clave}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => {
                  setItemClave(clave);
                  setHora("");
                }}
                className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all ${on ? "border-carbon bg-carbon text-hueso shadow-md" : "border-salvia/70 bg-white text-carbon hover:border-carbon"}`}
              >
                <span className="text-[16px] leading-snug">{i.nombre}</span>
                <span className={`shrink-0 text-sm ${on ? "text-hueso/75" : "text-gris"}`}>{duracionTexto(i.duracion)}</span>
              </button>
            );
          })}
        </div>
      </Paso>

      <Paso numero={3} titulo="¿Qué día y a qué hora?" hecho={Boolean(hora)}>
        <p className={etiqueta}>Día</p>
        <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1">
          {proximos.map((f) => {
            const on = fecha === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => {
                  setFecha(f);
                  setHora("");
                }}
                className={`flex w-[4.5rem] shrink-0 flex-col items-center rounded-2xl border py-2.5 transition-all ${on ? "border-carbon bg-carbon text-hueso shadow-md" : "border-salvia/70 bg-white text-carbon hover:border-carbon"}`}
              >
                <span className={`text-xs capitalize ${on ? "text-hueso/75" : "text-gris"}`}>{etiquetaDia(f)}</span>
                <span className="font-serif text-2xl leading-tight">{aFecha(f).getUTCDate()}</span>
                <span className={`text-xs ${on ? "text-hueso/75" : "text-gris"}`}>{MESES[aFecha(f).getUTCMonth()]}</span>
              </button>
            );
          })}
        </div>
        <label className="flex flex-wrap items-center gap-3 text-[15px] text-gris">
          Otro día:
          <input
            type="date"
            min={hoy}
            className={`${input} w-auto py-2.5`}
            value={fecha}
            onChange={(e) => {
              setFecha(e.target.value);
              setHora("");
            }}
          />
        </label>
        {diaCerrado && <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-[15px] text-amber-900">Ese día el estudio no atiende.</p>}

        <p className={`${etiqueta} mt-6`}>Horarios libres</p>
        <SelectorHorario fecha={fecha} duracion={item?.duracion ?? null} valor={hora} onCambio={setHora} />
      </Paso>

      <Paso numero={4} titulo="¿Ya pagó la seña?" hecho={conSena}>
        <div className="grid grid-cols-2 gap-2">
          {[
            { v: false, t: "Todavía no" },
            { v: true, t: "Sí, ya pagó" },
          ].map((o) => (
            <button
              key={o.t}
              type="button"
              aria-pressed={conSena === o.v}
              onClick={() => setConSena(o.v)}
              className={`rounded-2xl border px-4 py-3.5 text-[16px] transition-all ${conSena === o.v ? "border-carbon bg-carbon text-hueso" : "border-salvia/70 bg-white text-carbon hover:border-carbon"}`}
            >
              {o.t}
            </button>
          ))}
        </div>
        {conSena && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="sena" className={etiqueta}>¿Cuánto pagó?</label>
              <input id="sena" inputMode="numeric" className={input} value={senaMonto} onChange={(e) => setSenaMonto(e.target.value)} />
              <p className="mt-1 text-sm text-gris">{formatoGs(Number(senaMonto.replace(/\D/g, "")) || 0)}</p>
            </div>
            <div>
              <p className={etiqueta}>¿Cómo pagó?</p>
              <div className="grid grid-cols-2 gap-2">
                {(["transferencia", "efectivo"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={senaMedio === m}
                    onClick={() => setSenaMedio(m)}
                    className={`rounded-2xl border px-3 py-3.5 text-[15px] capitalize ${senaMedio === m ? "border-carbon bg-carbon text-hueso" : "border-salvia/70 bg-white text-carbon"}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="mt-5">
          <label htmlFor="notas" className={etiqueta}>Notas (opcional)</label>
          <textarea id="notas" rows={2} className={input} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Ej.: quiere curvatura C, es alérgica a…" />
        </div>
      </Paso>

      {error && (
        <p role="alert" className="flex items-start gap-3 rounded-2xl bg-red-50 px-4 py-3.5 text-[15px] text-red-800 ring-1 ring-red-200">
          <Icono nombre="ayuda" className="mt-0.5 size-5 shrink-0" /> {error}
        </p>
      )}

      {/* Resumen + confirmar (siempre a mano) */}
      <div className="sticky bottom-24 z-10 lg:bottom-4">
        <div className="rounded-3xl bg-carbon p-3 text-hueso shadow-2xl shadow-carbon/30">
          {clienta && item && hora && (
            <p className="px-3 pb-3 pt-1 text-[15px] leading-snug text-hueso/85">
              <strong className="font-medium text-hueso">{clienta.nombre}</strong> · {item.nombre}
              <span className="block capitalize">
                {textoFecha(fecha)} a las {hora}
              </span>
            </p>
          )}
          <button type="submit" disabled={pendiente} className={`${btnPrimario} w-full !bg-hueso py-4 text-[17px] !text-carbon hover:!bg-white`}>
            {pendiente ? "Guardando…" : clienta && item && hora ? "✓ Confirmar cita" : "Agendar cita"}
          </button>
        </div>
      </div>
    </form>
  );
}
