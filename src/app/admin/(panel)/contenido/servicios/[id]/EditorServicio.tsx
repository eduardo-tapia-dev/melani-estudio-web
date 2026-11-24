"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { agregarFotoServicio, eliminarFotoServicio, eliminarServicio, guardarServicio, moverFotoServicio } from "@/app/admin/acciones-contenido";
import SubirFoto from "@/components/admin/SubirFoto";
import { ayuda, btnPeligro, btnPrimario, btnSecundario, etiqueta, input, tarjeta } from "@/components/admin/estilos";

type Servicio = {
  id: string;
  nombre: string;
  categoria_id: string;
  descripcion: string;
  beneficios: string[];
  duracion_resultado: string | null;
  duracion_min: number;
  visible: boolean;
  orden: number;
};

type Props = {
  servicio: Servicio | null;
  fotos: { id: string; url: string; orden: number }[];
  valorReferencia: number | null;
  categorias: { id: string; nombre: string }[];
};

export default function EditorServicio({ servicio, fotos, valorReferencia, categorias }: Props) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);

  function guardar(fd: FormData) {
    setMsg(null);
    iniciar(async () => {
      const r = await guardarServicio(servicio?.id ?? null, {
        nombre: String(fd.get("nombre")),
        categoria_id: String(fd.get("categoria_id")),
        descripcion: String(fd.get("descripcion")),
        beneficios: String(fd.get("beneficios")),
        duracion_resultado: String(fd.get("duracion_resultado")),
        duracion_min: Number(fd.get("duracion_min")),
        visible: fd.get("visible") === "on",
        orden: Number(fd.get("orden")),
        valor_referencia: Number(String(fd.get("valor_referencia")).replace(/\D/g, "")) || null,
      });
      if (!r.ok) return setMsg({ ok: false, t: r.error });
      if (!servicio) router.replace(`/admin/contenido/servicios/${r.datos!.id}`);
      else setMsg({ ok: true, t: "Guardado. Ya se ve en el sitio." });
    });
  }

  return (
    <div className="space-y-5">
      <form action={guardar} className={`${tarjeta} space-y-4`}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="nombre" className={etiqueta}>Nombre</label>
            <input id="nombre" name="nombre" required defaultValue={servicio?.nombre} className={input} />
          </div>
          <div>
            <label htmlFor="categoria_id" className={etiqueta}>Categoría</label>
            <select id="categoria_id" name="categoria_id" required defaultValue={servicio?.categoria_id ?? categorias[0]?.id} className={input}>
              {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="descripcion" className={etiqueta}>Descripción breve</label>
          <textarea id="descripcion" name="descripcion" rows={3} defaultValue={servicio?.descripcion} className={input} />
        </div>
        <div>
          <label htmlFor="beneficios" className={etiqueta}>Beneficios (uno por línea, se muestran con ✓)</label>
          <textarea id="beneficios" name="beneficios" rows={4} defaultValue={servicio?.beneficios.join("\n")} className={input} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="duracion_resultado" className={etiqueta}>Duración del resultado</label>
            <input id="duracion_resultado" name="duracion_resultado" defaultValue={servicio?.duracion_resultado ?? ""} placeholder="ej. 2 a 4 semanas aprox." className={input} />
          </div>
          <div>
            <label htmlFor="duracion_min" className={etiqueta}>Duración en agenda (min)</label>
            <input id="duracion_min" name="duracion_min" type="number" min={10} step={10} required defaultValue={servicio?.duracion_min ?? 120} className={input} />
          </div>
          <div>
            <label htmlFor="orden" className={etiqueta}>Orden</label>
            <input id="orden" name="orden" type="number" defaultValue={servicio?.orden ?? 99} className={input} />
          </div>
        </div>
        <div className="rounded-xl bg-salvia-claro/60 p-4">
          <label htmlFor="valor_referencia" className={etiqueta}>🔒 Valor de referencia (privado)</label>
          <input id="valor_referencia" name="valor_referencia" inputMode="numeric" defaultValue={valorReferencia ?? ""} placeholder="Opcional, en Gs" className={`${input} sm:max-w-xs`} />
          <p className={ayuda}>Nunca se muestra en el sitio. Sirve para completar solo el cobro al cerrar la cita.</p>
        </div>
        <label className="flex items-center gap-3">
          <input type="checkbox" name="visible" defaultChecked={servicio?.visible ?? true} className="size-5 accent-taupe-oscuro" />
          <span className="text-sm text-carbon">Visible en el sitio</span>
        </label>
        {msg && <p className={`text-sm ${msg.ok ? "text-emerald-800" : "text-red-700"}`}>{msg.t}</p>}
        <button disabled={pendiente} className={btnPrimario}>{pendiente ? "Guardando…" : servicio ? "Guardar cambios" : "Crear servicio"}</button>
      </form>

      {servicio && (
        <section className={`${tarjeta} space-y-4`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-medium text-carbon">Fotos ({fotos.length}) <span className="text-sm font-normal text-gris">· el sitio muestra las primeras 3</span></h2>
            <SubirFoto
              carpeta={`servicios/${servicio.id}`}
              multiple
              texto="Agregar fotos"
              onSubida={async (url, ruta) => {
                const r = await agregarFotoServicio(servicio.id, url, ruta, servicio.nombre);
                if (!r.ok) setMsg({ ok: false, t: r.error });
              }}
            />
          </div>
          {fotos.length === 0 ? (
            <p className="text-sm text-gris">Sin fotos todavía.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {fotos.map((f, i) => (
                <li key={f.id} className={`overflow-hidden rounded-xl ring-1 ${i < 3 ? "ring-taupe-oscuro" : "ring-salvia opacity-60"}`}>
                  <div className="relative aspect-square">
                    <Image src={f.url} alt="" fill sizes="200px" className="object-cover" />
                  </div>
                  <div className="flex items-center justify-between bg-white px-1 py-1">
                    <button type="button" disabled={pendiente || i === 0} onClick={() => iniciar(async () => void (await moverFotoServicio(f.id, -1)))} className="px-2 py-1 text-lg text-carbon disabled:opacity-30" aria-label="Mover antes">‹</button>
                    <button type="button" disabled={pendiente} onClick={() => confirm("¿Borrar esta foto?") && iniciar(async () => void (await eliminarFotoServicio(f.id)))} className="px-2 py-1 text-xs text-red-700">Borrar</button>
                    <button type="button" disabled={pendiente || i === fotos.length - 1} onClick={() => iniciar(async () => void (await moverFotoServicio(f.id, 1)))} className="px-2 py-1 text-lg text-carbon disabled:opacity-30" aria-label="Mover después">›</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {servicio && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pendiente}
            className={btnPeligro}
            onClick={() =>
              confirm(`¿Borrar "${servicio.nombre}" definitivamente? Si tiene citas, no se puede: ocultalo en su lugar.`) &&
              iniciar(async () => {
                const r = await eliminarServicio(servicio.id);
                if (!r.ok) return setMsg({ ok: false, t: r.error });
                router.replace("/admin/contenido/servicios");
              })
            }
          >
            Borrar servicio
          </button>
          <a href={`/#servicios`} target="_blank" className={btnSecundario}>Ver en el sitio ↗</a>
        </div>
      )}
    </div>
  );
}
