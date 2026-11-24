"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { agregarFotoEstudio, editarFotoEstudio, eliminarFotoEstudio, guardarTextos, moverFotoEstudio } from "@/app/admin/acciones-contenido";
import SubirFoto from "@/components/admin/SubirFoto";
import { btnPrimario, etiqueta, input, tarjeta } from "@/components/admin/estilos";

type Foto = { id: string; url: string; descripcion: string | null; visible: boolean; orden: number };

export default function EditorEstudio({ fotos, titulo, texto }: { fotos: Foto[]; titulo: string; texto: string }) {
  const [error, setError] = useState<string | null>(null);
  const visibles = fotos.filter((f) => f.visible).length;
  return (
    <div className="space-y-6">
      <section className={`${tarjeta} space-y-3`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-medium text-carbon">Fotos ({fotos.length})</p>
            <p className="text-sm text-gris">
              {visibles === 0 ? "La sección está oculta en el sitio hasta que haya al menos 1 foto visible." : `Se muestran ${visibles} en el sitio. La primera sale más grande.`}
            </p>
          </div>
          <SubirFoto
            carpeta="estudio"
            multiple
            texto="Subir fotos del estudio"
            onSubida={async (url, ruta) => {
              const r = await agregarFotoEstudio(url, ruta);
              if (!r.ok) setError(r.error);
            }}
          />
        </div>
        <p className="text-xs text-gris">Consejo: fotos horizontales y con buena luz. Podés elegir varias a la vez; se achican solas antes de subir.</p>
        {error && <p className="text-sm text-red-700">{error}</p>}
      </section>

      {fotos.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fotos.map((f, i) => (
            <FotoItem key={f.id} f={f} primera={i === 0} ultima={i === fotos.length - 1} />
          ))}
        </ul>
      )}

      <TextosEstudio titulo={titulo} texto={texto} />
    </div>
  );
}

function FotoItem({ f, primera, ultima }: { f: Foto; primera: boolean; ultima: boolean }) {
  const [descripcion, setDescripcion] = useState(f.descripcion ?? "");
  const [visible, setVisible] = useState(f.visible);
  const [pendiente, iniciar] = useTransition();
  const cambiado = descripcion !== (f.descripcion ?? "") || visible !== f.visible;
  return (
    <li className={`${tarjeta} space-y-3 ${visible ? "" : "opacity-60"}`}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-salvia-claro">
        <Image src={f.url} alt="" fill sizes="(min-width: 1024px) 20rem, 50vw" className="object-cover" />
        {primera && <span className="absolute left-2 top-2 rounded-full bg-carbon/75 px-2.5 py-1 text-xs text-hueso">Principal</span>}
      </div>
      <input className={`${input} py-2`} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Descripción (opcional), ej. Sala de atención" aria-label="Descripción de la foto" />
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} className="size-5 accent-taupe-oscuro" /> Visible
        </label>
        <div className="flex items-center gap-1">
          <button disabled={pendiente || primera} onClick={() => iniciar(async () => void (await moverFotoEstudio(f.id, -1)))} className="px-2 py-1 text-lg disabled:opacity-30" aria-label="Mover antes">‹</button>
          <button disabled={pendiente || ultima} onClick={() => iniciar(async () => void (await moverFotoEstudio(f.id, 1)))} className="px-2 py-1 text-lg disabled:opacity-30" aria-label="Mover después">›</button>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <button disabled={pendiente || !cambiado} onClick={() => iniciar(async () => void (await editarFotoEstudio(f.id, { descripcion, visible })))} className={btnPrimario}>
          Guardar
        </button>
        <button disabled={pendiente} onClick={() => confirm("¿Borrar esta foto?") && iniciar(async () => void (await eliminarFotoEstudio(f.id)))} className="text-sm text-red-700">
          Borrar
        </button>
      </div>
    </li>
  );
}

function TextosEstudio({ titulo, texto }: { titulo: string; texto: string }) {
  const [t, setT] = useState(titulo);
  const [x, setX] = useState(texto);
  const [msg, setMsg] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();
  return (
    <section className={`${tarjeta} space-y-3`}>
      <p className="font-medium text-carbon">Texto de la sección</p>
      <div>
        <label htmlFor="est-titulo" className={etiqueta}>Título (la parte después de la coma va en cursiva)</label>
        <input id="est-titulo" className={input} value={t} onChange={(e) => setT(e.target.value)} />
      </div>
      <div>
        <label htmlFor="est-texto" className={etiqueta}>Texto</label>
        <textarea id="est-texto" rows={3} className={input} value={x} onChange={(e) => setX(e.target.value)} />
      </div>
      <div className="flex items-center gap-3">
        <button
          disabled={pendiente || (t === titulo && x === texto)}
          onClick={() => iniciar(async () => {
            const r = await guardarTextos({ estudio_titulo: t, estudio_texto: x });
            setMsg(r.ok ? "Guardado." : r.error);
          })}
          className={btnPrimario}
        >
          Guardar texto
        </button>
        {msg && <span className="text-sm text-gris">{msg}</span>}
      </div>
    </section>
  );
}
