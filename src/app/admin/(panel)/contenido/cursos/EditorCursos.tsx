"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { eliminarCurso, guardarCurso } from "@/app/admin/acciones-contenido";
import SubirFoto from "@/components/admin/SubirFoto";
import { btnPeligro, btnPrimario, btnSecundario, etiqueta, input, tarjeta } from "@/components/admin/estilos";

type Curso = {
  id: string;
  nombre: string;
  descripcion: string;
  incluye: string[];
  no_incluye: string[];
  modalidad: string;
  foto_url: string | null;
  duracion_min: number;
  visible: boolean;
  orden: number;
};

export default function EditorCursos({ cursos }: { cursos: Curso[] }) {
  const [nuevo, setNuevo] = useState(false);
  return (
    <div className="space-y-5">
      {cursos.map((c) => <FormCurso key={c.id} curso={c} />)}
      {nuevo ? <FormCurso curso={null} onListo={() => setNuevo(false)} /> : <button onClick={() => setNuevo(true)} className={btnSecundario}>+ Agregar curso</button>}
    </div>
  );
}

function FormCurso({ curso, onListo }: { curso: Curso | null; onListo?: () => void }) {
  const [foto, setFoto] = useState<string | null>(curso?.foto_url ?? null);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [pendiente, iniciar] = useTransition();

  return (
    <form
      className={`${tarjeta} space-y-4`}
      action={(fd) =>
        iniciar(async () => {
          const r = await guardarCurso(curso?.id ?? null, {
            nombre: String(fd.get("nombre")),
            descripcion: String(fd.get("descripcion")),
            incluye: String(fd.get("incluye")),
            no_incluye: String(fd.get("no_incluye")),
            modalidad: String(fd.get("modalidad")),
            foto_url: foto,
            duracion_min: Number(fd.get("duracion_min")),
            visible: fd.get("visible") === "on",
            orden: Number(fd.get("orden")),
          });
          setMsg(r.ok ? { ok: true, t: "Guardado." } : { ok: false, t: r.error });
          if (r.ok) onListo?.();
        })
      }
    >
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="w-full shrink-0 sm:w-48">
          <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-salvia-claro">
            {foto && <Image src={foto} alt="" fill sizes="200px" className="object-cover" />}
          </div>
          <div className="mt-2">
            <SubirFoto carpeta="cursos" texto={foto ? "Cambiar foto" : "Subir foto"} onSubida={(url) => setFoto(url)} />
          </div>
          {foto !== (curso?.foto_url ?? null) && <p className="mt-1 text-xs text-amber-800">Guardá para aplicar la foto.</p>}
        </div>
        <div className="flex-1 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={etiqueta} htmlFor={`n-${curso?.id}`}>Nombre</label>
              <input id={`n-${curso?.id}`} name="nombre" required defaultValue={curso?.nombre} className={input} />
            </div>
            <div>
              <label className={etiqueta} htmlFor={`m-${curso?.id}`}>Modalidad</label>
              <input id={`m-${curso?.id}`} name="modalidad" defaultValue={curso?.modalidad ?? "Presencial"} className={input} />
            </div>
          </div>
          <div>
            <label className={etiqueta} htmlFor={`d-${curso?.id}`}>Descripción</label>
            <textarea id={`d-${curso?.id}`} name="descripcion" rows={2} defaultValue={curso?.descripcion} className={input} />
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={etiqueta} htmlFor={`i-${curso?.id}`}>Incluye (uno por línea)</label>
          <textarea id={`i-${curso?.id}`} name="incluye" rows={4} defaultValue={curso?.incluye.join("\n")} className={input} />
        </div>
        <div>
          <label className={etiqueta} htmlFor={`x-${curso?.id}`}>No incluye (uno por línea)</label>
          <textarea id={`x-${curso?.id}`} name="no_incluye" rows={4} defaultValue={curso?.no_incluye.join("\n") ?? "Kit"} className={input} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3 sm:items-end">
        <div>
          <label className={etiqueta} htmlFor={`dm-${curso?.id}`}>Duración en agenda (min)</label>
          <input id={`dm-${curso?.id}`} name="duracion_min" type="number" min={10} step={10} defaultValue={curso?.duracion_min ?? 120} className={input} />
        </div>
        <div>
          <label className={etiqueta} htmlFor={`o-${curso?.id}`}>Orden</label>
          <input id={`o-${curso?.id}`} name="orden" type="number" defaultValue={curso?.orden ?? 9} className={input} />
        </div>
        <label className="flex items-center gap-3 pb-3">
          <input type="checkbox" name="visible" defaultChecked={curso?.visible ?? true} className="size-5 accent-taupe-oscuro" />
          <span className="text-sm text-carbon">Visible en el sitio</span>
        </label>
      </div>
      {msg && <p className={`text-sm ${msg.ok ? "text-emerald-800" : "text-red-700"}`}>{msg.t}</p>}
      <div className="flex flex-wrap gap-2">
        <button disabled={pendiente} className={btnPrimario}>{pendiente ? "Guardando…" : curso ? "Guardar curso" : "Crear curso"}</button>
        {curso && (
          <button
            type="button"
            disabled={pendiente}
            className={btnPeligro}
            onClick={() => confirm(`¿Borrar "${curso.nombre}"?`) && iniciar(async () => {
              const r = await eliminarCurso(curso.id);
              if (!r.ok) setMsg({ ok: false, t: r.error });
            })}
          >
            Borrar
          </button>
        )}
        {!curso && <button type="button" onClick={onListo} className={btnSecundario}>Cancelar</button>}
      </div>
    </form>
  );
}
