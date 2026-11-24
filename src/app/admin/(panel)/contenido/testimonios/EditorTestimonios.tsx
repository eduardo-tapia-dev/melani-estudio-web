"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { agregarTestimonio, editarTestimonio, eliminarTestimonio } from "@/app/admin/acciones-contenido";
import SubirFoto from "@/components/admin/SubirFoto";
import { btnPrimario, etiqueta, input, tarjeta } from "@/components/admin/estilos";

type T = { id: string; tipo: "trabajo" | "mensaje"; foto_url: string; texto: string | null; autora: string | null; visible: boolean; orden: number };

export default function EditorTestimonios({ testimonios }: { testimonios: T[] }) {
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="space-y-6">
      <div className={`${tarjeta} space-y-3`}>
        <p className="font-medium text-carbon">Agregar</p>
        <p className="text-sm text-gris">Podés elegir varias fotos a la vez. Las capturas de WhatsApp se muestran completas (sin recortar).</p>
        <div className="flex flex-wrap gap-2">
          <SubirFoto
            carpeta="testimonios"
            multiple
            texto="Fotos de trabajos"
            onSubida={async (url, ruta) => {
              const r = await agregarTestimonio({ tipo: "trabajo", foto_url: url, storage_path: ruta, texto: "", autora: "" });
              if (!r.ok) setError(r.error);
            }}
          />
          <SubirFoto
            carpeta="testimonios"
            multiple
            texto="Capturas de mensajes"
            onSubida={async (url, ruta) => {
              const r = await agregarTestimonio({ tipo: "mensaje", foto_url: url, storage_path: ruta, texto: "", autora: "" });
              if (!r.ok) setError(r.error);
            }}
          />
        </div>
        {error && <p className="text-sm text-red-700">{error}</p>}
      </div>

      {testimonios.length === 0 ? (
        <p className="text-sm text-gris">Todavía no hay fotos. Mientras tanto, el sitio invita a ver Instagram.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {testimonios.map((t) => <Item key={t.id} t={t} />)}
        </ul>
      )}
    </div>
  );
}

function Item({ t }: { t: T }) {
  const [texto, setTexto] = useState(t.texto ?? "");
  const [autora, setAutora] = useState(t.autora ?? "");
  const [visible, setVisible] = useState(t.visible);
  const [orden, setOrden] = useState(t.orden);
  const [pendiente, iniciar] = useTransition();
  const cambiado = texto !== (t.texto ?? "") || autora !== (t.autora ?? "") || visible !== t.visible || orden !== t.orden;

  return (
    <li className={`${tarjeta} space-y-3 ${visible ? "" : "opacity-60"}`}>
      <div className={`relative overflow-hidden rounded-xl bg-hueso ${t.tipo === "mensaje" ? "aspect-[9/16] max-h-72" : "aspect-square"}`}>
        <Image src={t.foto_url} alt="" fill sizes="300px" className={t.tipo === "mensaje" ? "object-contain" : "object-cover"} />
      </div>
      <p className="text-xs uppercase tracking-wider text-gris">{t.tipo === "mensaje" ? "Captura de mensaje" : "Foto de trabajo"}</p>
      <div>
        <label className={etiqueta} htmlFor={`tx-${t.id}`}>Texto (opcional)</label>
        <input id={`tx-${t.id}`} className={input} value={texto} onChange={(e) => setTexto(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={etiqueta} htmlFor={`au-${t.id}`}>Nombre</label>
          <input id={`au-${t.id}`} className={input} value={autora} onChange={(e) => setAutora(e.target.value)} />
        </div>
        <div>
          <label className={etiqueta} htmlFor={`or-${t.id}`}>Orden</label>
          <input id={`or-${t.id}`} type="number" className={input} value={orden} onChange={(e) => setOrden(Number(e.target.value))} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} className="size-5 accent-taupe-oscuro" /> Visible
      </label>
      <div className="flex items-center justify-between">
        <button disabled={!cambiado || pendiente} onClick={() => iniciar(async () => void (await editarTestimonio(t.id, { texto, autora, visible, orden })))} className={btnPrimario}>Guardar</button>
        <button disabled={pendiente} onClick={() => confirm("¿Borrar esta foto?") && iniciar(async () => void (await eliminarTestimonio(t.id)))} className="text-sm text-red-700">Borrar</button>
      </div>
    </li>
  );
}
