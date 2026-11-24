"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FotoEstudio } from "@/lib/tipos";

/**
 * Galería del estudio: grilla tipo "bento" (la primera foto más grande) y un
 * visor a pantalla completa con <dialog> nativo (Esc cierra, flechas navegan,
 * en el celular se desliza con el dedo).
 */
export default function GaleriaEstudio({ fotos }: { fotos: FotoEstudio[] }) {
  const [abierta, setAbierta] = useState<number | null>(null);
  const dialogo = useRef<HTMLDialogElement>(null);
  const toque = useRef<number | null>(null);

  const ir = useCallback((d: number) => setAbierta((i) => (i === null ? i : (i + d + fotos.length) % fotos.length)), [fotos.length]);

  useEffect(() => {
    const dlg = dialogo.current;
    if (!dlg) return;
    if (abierta !== null && !dlg.open) dlg.showModal();
    if (abierta === null && dlg.open) dlg.close();
  }, [abierta]);

  useEffect(() => {
    if (abierta === null) return;
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") ir(1);
      if (e.key === "ArrowLeft") ir(-1);
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [abierta, ir]);

  // Distribución bento (6 columnas) según cuántas fotos haya:
  // 1 → ancha · 2 → grande + alta · 3 → grande + 2 apiladas · 4 → + 1 ancha abajo · 5+ → + 2 medianas abajo
  const visibles = fotos.slice(0, 5);
  const clases = (i: number) => {
    const n = visibles.length;
    if (n === 1) return "sm:col-span-6 sm:row-span-2";
    if (i === 0) return "sm:col-span-4 sm:row-span-2";
    if (n === 2) return "sm:col-span-2 sm:row-span-2";
    if (i <= 2) return "sm:col-span-2";
    return n === 4 ? "sm:col-span-6" : "sm:col-span-3";
  };
  const resto = fotos.length - visibles.length;

  return (
    <>
      <div className="carrusel -mx-4 flex gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:auto-rows-[15rem] sm:grid-cols-6 sm:overflow-visible sm:px-0 lg:auto-rows-[17rem]">
        {visibles.map((f, i) => (
          <button
            key={f.url}
            type="button"
            onClick={() => setAbierta(i)}
            data-revelar="imagen"
            style={{ "--d": `${i * 90}ms` } as React.CSSProperties}
            className={`group relative aspect-[4/5] w-[78vw] shrink-0 overflow-hidden rounded-3xl text-left sm:aspect-auto sm:w-auto ${clases(i)}`}
            aria-label={`Ver foto ${i + 1}${f.descripcion ? `: ${f.descripcion}` : ""}`}
          >
            <Image
              src={f.url}
              alt={f.descripcion ?? "Estudio Melani Cristine"}
              fill
              sizes={i === 0 ? "(min-width: 640px) 66vw, 80vw" : "(min-width: 640px) 33vw, 80vw"}
              className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-carbon/55 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            {f.descripcion && (
              <span className="absolute inset-x-4 bottom-4 translate-y-2 text-sm text-hueso opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                {f.descripcion}
              </span>
            )}
            {i === visibles.length - 1 && resto > 0 && (
              <span className="absolute inset-0 flex items-center justify-center bg-carbon/50 font-serif text-4xl text-hueso">+{resto}</span>
            )}
          </button>
        ))}
      </div>

      <dialog
        ref={dialogo}
        onClose={() => setAbierta(null)}
        onClick={(e) => e.target === dialogo.current && setAbierta(null)}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-carbon/95 p-0 text-hueso backdrop:bg-carbon/80"
        aria-label="Fotos del estudio"
      >
        {abierta !== null && (
          <div
            className="relative flex h-full w-full items-center justify-center p-4 sm:p-12"
            onTouchStart={(e) => (toque.current = e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (toque.current === null) return;
              const dx = e.changedTouches[0].clientX - toque.current;
              if (Math.abs(dx) > 50) ir(dx < 0 ? 1 : -1);
              toque.current = null;
            }}
          >
            <figure className="relative h-full w-full max-w-5xl">
              <Image src={fotos[abierta].url} alt={fotos[abierta].descripcion ?? "Estudio Melani Cristine"} fill sizes="100vw" className="object-contain" />
              {fotos[abierta].descripcion && <figcaption className="absolute inset-x-0 bottom-0 text-center text-sm text-hueso/85">{fotos[abierta].descripcion}</figcaption>}
            </figure>
            <p className="absolute left-1/2 top-5 -translate-x-1/2 text-xs tabular-nums tracking-[0.3em] text-hueso/70">
              {abierta + 1} / {fotos.length}
            </p>
            <button onClick={() => setAbierta(null)} className="absolute right-4 top-3 flex size-11 items-center justify-center rounded-full text-3xl text-hueso/85 hover:bg-hueso/10" aria-label="Cerrar">
              ×
            </button>
            {fotos.length > 1 && (
              <>
                <button onClick={() => ir(-1)} className="absolute left-3 top-1/2 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full border border-hueso/30 text-2xl hover:bg-hueso/10 sm:flex" aria-label="Foto anterior">
                  ‹
                </button>
                <button onClick={() => ir(1)} className="absolute right-3 top-1/2 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full border border-hueso/30 text-2xl hover:bg-hueso/10 sm:flex" aria-label="Foto siguiente">
                  ›
                </button>
              </>
            )}
          </div>
        )}
      </dialog>
    </>
  );
}
