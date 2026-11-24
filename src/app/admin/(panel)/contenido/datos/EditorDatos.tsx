"use client";

import { useState, useTransition } from "react";
import { guardarDatosNegocio, type DatosNegocio } from "@/app/admin/acciones-contenido";
import { ayuda, btnPrimario, etiqueta, input, tarjeta } from "@/components/admin/estilos";
import { formatoGs } from "@/lib/formato";

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export default function EditorDatos({ datos }: { datos: DatosNegocio }) {
  const [d, setD] = useState<DatosNegocio>({ ...datos, whatsapp: `0${datos.whatsapp.slice(3)}` });
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [pendiente, iniciar] = useTransition();
  const set = <K extends keyof DatosNegocio>(k: K, v: DatosNegocio[K]) => setD((x) => ({ ...x, [k]: v }));
  const campo = (k: keyof DatosNegocio, titulo: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={k} className={etiqueta}>{titulo}</label>
      <input id={k} className={input} value={String(d[k] ?? "")} onChange={(e) => set(k, (extra.type === "number" ? Number(e.target.value) : e.target.value) as never)} {...extra} />
    </div>
  );

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        iniciar(async () => {
          const r = await guardarDatosNegocio(d);
          setMsg(r.ok ? { ok: true, t: "Guardado." } : { ok: false, t: r.error });
        });
      }}
    >
      <section className={`${tarjeta} grid gap-4 sm:grid-cols-2`}>
        <h2 className="font-serif text-xl text-carbon sm:col-span-2">Contacto y redes</h2>
        {campo("whatsapp", "WhatsApp del estudio", { inputMode: "tel" })}
        {campo("instagram_url", "Instagram (link)")}
        {campo("tiktok_url", "TikTok (link)")}
        <div className="sm:col-span-2">
          {campo("google_maps_url", "Link de Google Maps")}
          <p className={ayuda}>
            En Google Maps: Compartir → Copiar vínculo. Al guardar, el mapa del sitio toma la ubicación de este link
            {d.ubicacion_lat != null && d.ubicacion_lng != null ? ` (hoy: ${d.ubicacion_lat}, ${d.ubicacion_lng})` : ""}. Si lo dejás vacío, el mapa no se muestra.
          </p>
        </div>
        {campo("direccion", "Dirección")}
        {campo("ciudad", "Ciudad (pie de página)")}
      </section>

      <section className={`${tarjeta} space-y-4`}>
        <h2 className="font-serif text-xl text-carbon">Horario y agenda</h2>
        <div>
          <p className={etiqueta}>Días de atención</p>
          <div className="flex flex-wrap gap-2">
            {DIAS.map((nombre, i) => {
              const n = i + 1;
              const on = d.dias_atencion.includes(n);
              return (
                <button
                  key={n}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set("dias_atencion", on ? d.dias_atencion.filter((x) => x !== n) : [...d.dias_atencion, n])}
                  className={`min-w-14 rounded-full border px-4 py-2.5 text-[15px] ${on ? "border-carbon bg-carbon text-hueso" : "border-salvia bg-white text-carbon"}`}
                >
                  {nombre}
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          {campo("hora_apertura", "Abre", { type: "time" })}
          {campo("hora_cierre", "Cierra", { type: "time" })}
          {campo("margen_min", "Margen entre clientas (min)", { type: "number", min: 0, step: 5 })}
          {campo("duracion_default_min", "Duración por defecto (min)", { type: "number", min: 10, step: 10 })}
        </div>
        {campo("horario_texto", "Horario como se muestra en el sitio")}
        <p className={ayuda}>El margen nuevo se aplica a las citas que se creen o muevan desde ahora.</p>
      </section>

      <section className={`${tarjeta} grid gap-4 sm:grid-cols-2`}>
        <h2 className="font-serif text-xl text-carbon sm:col-span-2">Pagos</h2>
        <div>
          {campo("sena_monto", "Seña por defecto (Gs)", { type: "number", min: 0, step: 5000 })}
          <p className={ayuda}>{formatoGs(d.sena_monto)} · se muestra en las preguntas frecuentes.</p>
        </div>
        {campo("medios_pago_texto", "Medios de pago (texto)")}
      </section>

      {msg && <p className={`text-sm ${msg.ok ? "text-emerald-800" : "text-red-700"}`}>{msg.t}</p>}
      <div className="sticky bottom-20 lg:bottom-4">
        <button disabled={pendiente} className={`${btnPrimario} w-full py-4 shadow-lg`}>{pendiente ? "Guardando…" : "Guardar datos"}</button>
      </div>
    </form>
  );
}
