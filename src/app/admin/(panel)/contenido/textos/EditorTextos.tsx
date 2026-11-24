"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { guardarTextos } from "@/app/admin/acciones-contenido";
import SubirFoto from "@/components/admin/SubirFoto";
import { btnPrimario, etiqueta, input, tarjeta } from "@/components/admin/estilos";

type Campo = { clave: string; titulo: string; largo?: boolean };

const SECCIONES: { titulo: string; foto?: { clave: string; titulo: string }; campos: Campo[] }[] = [
  {
    titulo: "Portada (arriba de todo)",
    foto: { clave: "hero_foto", titulo: "Foto de Melani" },
    campos: [
      { clave: "hero_saludo", titulo: "Saludo" },
      { clave: "hero_frase", titulo: "Frase principal" },
      { clave: "hero_subtitulo", titulo: "Subtítulo", largo: true },
    ],
  },
  {
    titulo: "Servicios y cursos",
    campos: [
      { clave: "servicios_intro", titulo: "Introducción de servicios" },
      { clave: "consulta_valores", titulo: "Línea bajo cada servicio (dejar vacío para ocultar)" },
      { clave: "cursos_intro", titulo: "Introducción de cursos", largo: true },
    ],
  },
  {
    titulo: "Sobre mí",
    foto: { clave: "sobre_mi_foto", titulo: "Foto" },
    campos: [
      { clave: "sobre_mi_titulo", titulo: "Título" },
      { clave: "sobre_mi_texto", titulo: "Historia (dejá una línea en blanco entre párrafos)", largo: true },
    ],
  },
  {
    titulo: "Reservas",
    campos: [
      { clave: "reservar_titulo", titulo: "Título de reservas" },
      { clave: "reservar_texto", titulo: "Texto de reservas", largo: true },
    ],
  },
];

export default function EditorTextos({ valores }: { valores: Record<string, string> }) {
  const [v, setV] = useState(valores);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [pendiente, iniciar] = useTransition();
  const cambiado = JSON.stringify(v) !== JSON.stringify(valores);

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        iniciar(async () => {
          const r = await guardarTextos(v);
          setMsg(r.ok ? { ok: true, t: "Guardado. Ya se ve en el sitio." } : { ok: false, t: r.error });
        });
      }}
    >
      {SECCIONES.map((s) => (
        <section key={s.titulo} className={`${tarjeta} space-y-4`} aria-labelledby={`sec-${s.titulo}`}>
          <h2 id={`sec-${s.titulo}`} className="font-serif text-xl text-carbon">{s.titulo}</h2>
          {s.foto && (
            <div className="flex flex-wrap items-center gap-4 rounded-xl bg-salvia-claro/50 p-3">
              <div className="relative aspect-[4/5] w-28 shrink-0 overflow-hidden rounded-xl bg-salvia-claro ring-1 ring-salvia/60">
                {v[s.foto.clave] ? (
                  <Image src={v[s.foto.clave]} alt={s.foto.titulo} fill sizes="112px" className="object-cover" />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-xs text-gris">Sin foto</span>
                )}
              </div>
              <div className="min-w-0 space-y-2">
                <p className="text-sm font-medium text-carbon">{s.foto.titulo}</p>
                <SubirFoto carpeta="sitio" texto="Cambiar foto" onSubida={(url) => setV((x) => ({ ...x, [s.foto!.clave]: url }))} />
                {v[s.foto.clave] !== valores[s.foto.clave] && <p className="text-xs text-amber-800">Foto nueva lista: tocá “Guardar cambios” abajo para publicarla.</p>}
              </div>
            </div>
          )}
          {s.campos.map((c) => (
            <div key={c.clave}>
              <label htmlFor={c.clave} className={etiqueta}>{c.titulo}</label>
              {c.largo ? (
                <textarea id={c.clave} rows={c.clave === "sobre_mi_texto" ? 8 : 3} className={input} value={v[c.clave] ?? ""} onChange={(e) => setV((x) => ({ ...x, [c.clave]: e.target.value }))} />
              ) : (
                <input id={c.clave} className={input} value={v[c.clave] ?? ""} onChange={(e) => setV((x) => ({ ...x, [c.clave]: e.target.value }))} />
              )}
            </div>
          ))}
        </section>
      ))}
      {msg && <p className={`text-sm ${msg.ok ? "text-emerald-800" : "text-red-700"}`}>{msg.t}</p>}
      <div className="sticky bottom-20 lg:bottom-4">
        <button disabled={pendiente || !cambiado} className={`${btnPrimario} w-full py-4 shadow-lg`}>
          {pendiente ? "Guardando…" : cambiado ? "Guardar cambios" : "Sin cambios"}
        </button>
      </div>
    </form>
  );
}
