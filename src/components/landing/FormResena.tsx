"use client";

import { useRef, useState } from "react";
import { supabaseNavegador } from "@/lib/supabase/navegador";
import { comprimirImagen } from "@/lib/comprimir-imagen";

type Servicio = { id: string; nombre: string };

const ETIQUETAS = ["", "Malo", "Regular", "Bueno", "Muy bueno", "¡Excelente!"];
const campo =
  "block w-full rounded-xl border border-salvia bg-white px-3.5 py-3 text-base text-carbon placeholder:text-gris/60 focus:border-taupe-oscuro focus:outline-none focus:ring-2 focus:ring-taupe-oscuro/20";

/** Formulario público de reseña. Se publica cuando Melani la aprueba. */
export default function FormResena({ servicios }: { servicios: Servicio[] }) {
  const [abierto, setAbierto] = useState(false);
  const [estrellas, setEstrellas] = useState(0);
  const [hover, setHover] = useState(0);
  const [fotos, setFotos] = useState<{ archivo: File; vista: string }[]>([]);
  const [estado, setEstado] = useState<"editando" | "enviando" | "enviada">("editando");
  const [error, setError] = useState<string | null>(null);
  const inputFotos = useRef<HTMLInputElement>(null);

  function agregarFotos(lista: FileList | null) {
    if (!lista) return;
    const nuevas = [...lista].filter((f) => f.type.startsWith("image/")).slice(0, 3 - fotos.length);
    setFotos((a) => [...a, ...nuevas.map((archivo) => ({ archivo, vista: URL.createObjectURL(archivo) }))]);
    if (inputFotos.current) inputFotos.current.value = "";
  }

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (fd.get("sitio_web")) return; // trampa anti-bots
    if (!estrellas) return setError("Elegí cuántas estrellas le das.");
    setError(null);
    setEstado("enviando");
    const sb = supabaseNavegador();
    try {
      const rutas: string[] = [];
      for (const f of fotos) {
        const blob = await comprimirImagen(f.archivo, 1400);
        const ruta = `pendientes/${crypto.randomUUID()}.${blob.type === "image/webp" ? "webp" : "jpg"}`;
        const { error } = await sb.storage.from("resenas").upload(ruta, blob, { contentType: blob.type, cacheControl: "31536000" });
        if (error) throw new Error("No se pudo subir una foto. Probá con menos fotos o más tarde.");
        rutas.push(ruta);
      }
      const { error } = await sb.rpc("crear_resena", {
        p_nombre: String(fd.get("nombre")),
        p_estrellas: estrellas,
        p_comentario: String(fd.get("comentario")),
        p_servicio: fd.get("servicio") || null,
        p_fotos: rutas,
      });
      if (error) throw new Error(error.message.replace(/^[A-Z_]+:\s*/, ""));
      setEstado("enviada");
    } catch (err) {
      setError((err as Error).message || "No se pudo enviar. Probá de nuevo.");
      setEstado("editando");
    }
  }

  if (estado === "enviada") {
    return (
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-salvia/50" role="status">
        <p className="font-serif text-2xl text-carbon">¡Gracias por tu reseña! 💛</p>
        <p className="mt-2 text-sm text-gris">Melani la va a revisar y se publicará en esta página en los próximos días.</p>
      </div>
    );
  }

  if (!abierto) {
    return (
      <div className="text-center">
        <button
          onClick={() => setAbierto(true)}
          className="inline-flex items-center gap-2 rounded-full bg-taupe-oscuro px-6 py-3.5 text-sm font-medium tracking-wide text-hueso transition-colors hover:bg-carbon"
        >
          ★ Dejá tu reseña
        </button>
        <p className="mt-2 text-xs text-gris">¿Te atendiste con Melani? Contanos cómo te fue y subí una foto si querés.</p>
      </div>
    );
  }

  const mostrar = hover || estrellas;
  return (
    <form onSubmit={enviar} className="mx-auto max-w-xl space-y-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-salvia/50 sm:p-7">
      <h3 className="font-serif text-2xl text-carbon">Tu reseña</h3>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-carbon">¿Cómo calificás tu experiencia?</legend>
        <div className="flex items-center gap-1" role="radiogroup" aria-label="Calificación" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={estrellas === n}
              aria-label={`${n} estrella${n > 1 ? "s" : ""}`}
              onClick={() => setEstrellas(n)}
              onMouseEnter={() => setHover(n)}
              className="p-1 transition-transform active:scale-90"
            >
              <svg viewBox="0 0 24 24" className={`size-10 ${n <= mostrar ? "text-[#b8862b]" : "text-[#d9d6cf]"}`} fill="currentColor" aria-hidden="true">
                <path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4L2.8 9.5l6.4-.8L12 2.8z" />
              </svg>
            </button>
          ))}
          <span className="ml-2 text-sm text-gris" aria-live="polite">{ETIQUETAS[mostrar]}</span>
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="r-nombre" className="mb-1.5 block text-sm font-medium text-carbon">Tu nombre</label>
          <input id="r-nombre" name="nombre" required minLength={2} maxLength={60} autoComplete="given-name" className={campo} />
        </div>
        <div>
          <label htmlFor="r-servicio" className="mb-1.5 block text-sm font-medium text-carbon">Servicio (opcional)</label>
          <select id="r-servicio" name="servicio" className={campo} defaultValue="">
            <option value="">—</option>
            {servicios.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="r-comentario" className="mb-1.5 block text-sm font-medium text-carbon">Tu comentario</label>
        <textarea id="r-comentario" name="comentario" required minLength={5} maxLength={800} rows={4} className={campo} placeholder="¿Qué te pareció el resultado y la atención?" />
      </div>

      <div>
        <p className="mb-1.5 text-sm font-medium text-carbon">Fotos del resultado (opcional, hasta 3)</p>
        <div className="flex flex-wrap gap-2">
          {fotos.map((f, i) => (
            <div key={f.vista} className="relative size-20 overflow-hidden rounded-xl ring-1 ring-salvia">
              {/* eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob:) */}
              <img src={f.vista} alt={`Foto ${i + 1}`} className="size-full object-cover" />
              <button
                type="button"
                onClick={() => setFotos((a) => a.filter((_, j) => j !== i))}
                className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-carbon/70 text-sm text-white"
                aria-label={`Quitar foto ${i + 1}`}
              >
                ×
              </button>
            </div>
          ))}
          {fotos.length < 3 && (
            <button type="button" onClick={() => inputFotos.current?.click()} className="flex size-20 flex-col items-center justify-center rounded-xl border-2 border-dashed border-salvia text-xs text-gris hover:border-taupe-oscuro">
              <span className="text-2xl leading-none">+</span>
              Foto
            </button>
          )}
        </div>
        <input ref={inputFotos} type="file" accept="image/*" multiple className="hidden" onChange={(e) => agregarFotos(e.target.files)} />
      </div>

      {/* Campo trampa: invisible para personas, los bots suelen completarlo */}
      <input type="text" name="sitio_web" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <p className="text-xs text-gris">Tu reseña se publica después de que Melani la revise. Solo se muestra tu nombre.</p>
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={estado === "enviando"} className="inline-flex items-center justify-center rounded-full bg-taupe-oscuro px-6 py-3.5 text-sm font-medium text-hueso hover:bg-carbon disabled:opacity-60">
          {estado === "enviando" ? (fotos.length ? "Subiendo fotos…" : "Enviando…") : "Enviar reseña"}
        </button>
        <button type="button" onClick={() => setAbierto(false)} className="rounded-full px-5 py-3.5 text-sm text-gris underline underline-offset-4">Cancelar</button>
      </div>
    </form>
  );
}
