"use client";

import { useRef, useState } from "react";
import { supabaseNavegador } from "@/lib/supabase/navegador";
import { comprimirImagen } from "@/lib/comprimir-imagen";
import { btnSecundario } from "./estilos";

const comprimir = (f: File) => comprimirImagen(f);

type Props = {
  carpeta: string;
  onSubida: (url: string, storagePath: string) => Promise<void> | void;
  texto?: string;
  multiple?: boolean;
};

/** Botón para subir fotos al bucket público "sitio" (comprimidas en el teléfono). */
export default function SubirFoto({ carpeta, onSubida, texto = "Subir foto", multiple = false }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [estado, setEstado] = useState<string | null>(null);

  async function elegir(archivos: FileList | null) {
    if (!archivos?.length) return;
    const sb = supabaseNavegador();
    try {
      for (const [n, archivo] of [...archivos].entries()) {
        setEstado(archivos.length > 1 ? `Subiendo ${n + 1} de ${archivos.length}…` : "Subiendo…");
        const blob = await comprimir(archivo);
        const ext = blob.type === "image/webp" ? "webp" : "jpg";
        const ruta = `${carpeta}/${crypto.randomUUID()}.${ext}`;
        const { error } = await sb.storage.from("sitio").upload(ruta, blob, { contentType: blob.type, cacheControl: "31536000" });
        if (error) throw error;
        const { data } = sb.storage.from("sitio").getPublicUrl(ruta);
        await onSubida(data.publicUrl, ruta);
      }
      setEstado(null);
    } catch (e) {
      setEstado(`No se pudo subir: ${(e as Error).message}`);
    } finally {
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <div className="inline-flex flex-col gap-1">
      <input ref={ref} type="file" accept="image/*" multiple={multiple} className="hidden" onChange={(e) => elegir(e.target.files)} />
      <button type="button" onClick={() => ref.current?.click()} disabled={estado?.startsWith("Subiendo")} className={btnSecundario}>
        📷 {estado?.startsWith("Subiendo") ? estado : texto}
      </button>
      {estado && !estado.startsWith("Subiendo") && <p className="text-xs text-red-700">{estado}</p>}
    </div>
  );
}
