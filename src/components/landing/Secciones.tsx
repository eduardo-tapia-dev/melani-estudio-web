import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import type { CategoriaPublica, ConfigPublica, CursoPublico, Faq, FotoEstudio, ResumenResenas, ServicioPublico } from "@/lib/tipos";
import GaleriaEstudio from "./GaleriaEstudio";
import Estrellas from "./Estrellas";
import FormResena from "./FormResena";
import BotonWhatsapp from "./BotonWhatsapp";
import { IconoCheck, IconoCurso, IconoInstagram, IconoReloj, IconoTiktok, IconoUbicacion, IconoWhatsapp } from "./Iconos";

/* ---------- Utilidades de presentación ---------- */

const retraso = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

/** Encabezado editorial: número + etiqueta, título grande y bajada a la derecha en escritorio. */
function Encabezado({
  sobre,
  titulo,
  intro,
  claro,
  centrado,
}: {
  sobre: string;
  titulo: ReactNode;
  intro?: string;
  claro?: boolean;
  centrado?: boolean;
}) {
  const tenue = claro ? "text-hueso/70" : "text-taupe-oscuro";
  return (
    <div className={`mb-12 sm:mb-16 ${centrado ? "mx-auto max-w-2xl text-center" : "grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-end"}`}>
      <div data-revelar="">
        <p className={`mb-4 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.3em] ${tenue} ${centrado ? "justify-center" : ""}`}>
          <span className="num-seccion tabular-nums" />
          <span className={`h-px w-8 ${claro ? "bg-hueso/40" : "bg-taupe/60"}`} aria-hidden="true" />
          {sobre}
        </p>
        <h2 className={`text-balance font-serif text-[2.6rem] leading-[1.02] tracking-tight sm:text-6xl ${claro ? "text-hueso" : "text-carbon"}`}>{titulo}</h2>
      </div>
      {intro && (
        <p data-revelar="" style={retraso(120)} className={`max-w-md text-pretty text-base leading-relaxed ${claro ? "text-hueso/80" : "text-gris"} ${centrado ? "mx-auto mt-5" : "md:justify-self-end md:pb-2"}`}>
          {intro}
        </p>
      )}
    </div>
  );
}

/** Resalta en itálica la parte después de la coma: "Más que pestañas, *diseñamos confianza*". */
function Acento({ texto, color = "text-taupe-oscuro" }: { texto: string; color?: string }) {
  const i = texto.indexOf(",");
  if (i < 0) return <>{texto}</>;
  return (
    <>
      {texto.slice(0, i + 1)} <em className={`font-normal italic ${color}`}>{texto.slice(i + 1).trim()}</em>
    </>
  );
}

function Parrafos({ texto, className = "" }: { texto: string; className?: string }) {
  return (
    <>
      {texto
        .split(/\n{2,}/)
        .filter(Boolean)
        .map((p, i) => (
          <p key={i} className={className}>
            {p}
          </p>
        ))}
    </>
  );
}

/* ---------- Portada ---------- */

export function Hero({ contenido, linkReservar, resenas }: { contenido: Record<string, string>; linkReservar: string; resenas: ResumenResenas }) {
  return (
    <section id="inicio" className="relative overflow-hidden bg-salvia-claro">
      {/* Manchas de color suaves (decorativas) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(40rem 40rem at 0% 30%, rgb(181 184 176 / 0.55), transparent 60%), radial-gradient(34rem 34rem at 100% 100%, rgb(160 126 108 / 0.22), transparent 65%)",
        }}
      />

      <div className="relative mx-auto grid min-h-[100svh] max-w-6xl items-center gap-12 px-4 pb-16 pt-28 sm:px-6 md:grid-cols-[1.1fr_1fr] md:pb-24 md:pt-32">
        <div className="order-2 text-center md:order-1 md:text-left">
          <p className="entrada mb-6 inline-flex items-center gap-3 text-xs font-medium uppercase tracking-[0.3em] text-taupe-oscuro" style={retraso(100)}>
            <span className="h-px w-8 bg-taupe/60" aria-hidden="true" /> Lashes &amp; Brows · San Lorenzo
          </p>
          <h1 className="entrada text-balance font-serif text-[3.2rem] leading-[0.98] tracking-tight text-carbon sm:text-7xl lg:text-[5.5rem]" style={retraso(220)}>
            <Acento texto={contenido.hero_frase ?? ""} />
          </h1>
          <p className="entrada mx-auto mt-6 max-w-md text-pretty text-base leading-relaxed text-gris sm:text-lg md:mx-0" style={retraso(380)}>
            {[contenido.hero_saludo, contenido.hero_subtitulo]
              .filter(Boolean)
              .map((t) => (/[.!?…]$/.test(t.trim()) ? t.trim() : `${t.trim()}.`))
              .join(" ")}
          </p>
          <div className="entrada mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start" style={retraso(520)}>
            <BotonWhatsapp href={linkReservar} tamano="lg" variante="oscuro">
              Reservar por WhatsApp
            </BotonWhatsapp>
            <a
              href="#servicios"
              className="group inline-flex items-center justify-center gap-2 rounded-full px-6 py-4 text-base font-medium tracking-wide text-carbon transition-colors hover:text-taupe-oscuro"
            >
              Ver servicios
              <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">→</span>
            </a>
          </div>
          <div className="entrada mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gris md:justify-start" style={retraso(660)}>
            {resenas.total > 0 ? (
              <a href="#resenas" className="flex items-center gap-2 hover:text-carbon">
                <Estrellas valor={resenas.promedio} />
                <span>
                  <strong className="font-medium text-carbon">{resenas.promedio.toLocaleString("es-PY", { minimumFractionDigits: 1 })}</strong> · {resenas.total} reseña{resenas.total === 1 ? "" : "s"}
                </span>
              </a>
            ) : (
              <span>Atención personalizada</span>
            )}
            <span className="hidden h-4 w-px bg-salvia sm:block" aria-hidden="true" />
            <span>Turnos por WhatsApp</span>
          </div>
        </div>

        <div className="order-1 md:order-2">
          <div className="relative mx-auto w-full max-w-[19rem] sm:max-w-sm md:max-w-md">
            <div className="entrada-cortina relative aspect-[4/5] overflow-hidden rounded-t-full rounded-b-3xl shadow-2xl shadow-carbon/15" style={retraso(150)}>
              <Image
                src={contenido.hero_foto || "/fotos/melani-hero.webp"}
                alt="Melani Cristine en su estudio"
                fill
                priority
                sizes="(min-width: 768px) 28rem, 80vw"
                className="object-cover"
              />
            </div>
            {/* Sello giratorio */}
            <div className="entrada absolute -bottom-6 -left-6 size-28 sm:-left-10 sm:size-32" style={retraso(900)} aria-hidden="true">
              <div className="relative size-full rounded-full bg-hueso shadow-xl shadow-carbon/10">
                <svg viewBox="0 0 120 120" className="girando absolute inset-0 size-full text-taupe-oscuro">
                  <defs>
                    <path id="sello-circulo" d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" />
                  </defs>
                  <text className="fill-current text-[9.5px] uppercase" style={{ fontFamily: "var(--font-inter)" }}>
                    {/* textLength = largo de la circunferencia (2π·44 ≈ 276): el texto cierra justo el círculo */}
                    <textPath href="#sello-circulo" textLength="272" lengthAdjust="spacing">
                      Melani Cristine · Lashes &amp; Brows ·
                    </textPath>
                  </text>
                </svg>
                <span className="absolute inset-0 flex items-center justify-center font-serif text-2xl italic text-carbon">MC</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Indicador para bajar */}
      <a href="#servicios" className="entrada absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[0.65rem] uppercase tracking-[0.3em] text-gris md:flex" style={retraso(1100)}>
        Deslizá
        <span className="relative h-10 w-px overflow-hidden bg-salvia" aria-hidden="true">
          <span className="linea-scroll absolute inset-0 bg-taupe-oscuro" />
        </span>
      </a>
    </section>
  );
}

/** Cinta con los nombres de los servicios, en movimiento continuo (decorativa). */
export function Marquesina({ nombres }: { nombres: string[] }) {
  if (nombres.length === 0) return null;
  const fila = (
    <div className="flex shrink-0 items-center">
      {nombres.map((n) => (
        <span key={n} className="flex items-center whitespace-nowrap px-6 font-serif text-2xl italic sm:text-3xl">
          {n}
          <span className="ml-12 text-base not-italic text-taupe" aria-hidden="true">✦</span>
        </span>
      ))}
    </div>
  );
  return (
    <div className="overflow-hidden border-y border-carbon/10 bg-carbon py-5 text-hueso" aria-hidden="true">
      <div className="marquesina-pista flex w-max">
        {fila}
        {fila}
      </div>
    </div>
  );
}

/* ---------- Servicios ---------- */

function Galeria({ fotos, nombre }: { fotos: ServicioPublico["fotos"]; nombre: string }) {
  if (fotos.length === 0) return <div className="aspect-[4/5] rounded-3xl bg-salvia-claro" />;
  return (
    <div className="relative overflow-hidden rounded-3xl">
      <div className="carrusel flex aspect-[4/5] overflow-x-auto" aria-label={`Fotos de ${nombre}`}>
        {fotos.map((f, i) => (
          <div key={f.url} className="relative aspect-[4/5] w-full shrink-0 overflow-hidden">
            <Image
              src={f.url}
              alt={f.alt || nombre}
              fill
              sizes="(min-width: 1024px) 22rem, (min-width: 640px) 45vw, 90vw"
              className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
              loading={i === 0 ? undefined : "lazy"}
            />
          </div>
        ))}
      </div>
      {fotos.length > 1 && (
        <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-carbon/55 px-2.5 py-1 text-[0.7rem] text-hueso backdrop-blur">
          1/{fotos.length} · deslizá
        </div>
      )}
    </div>
  );
}

function TarjetaServicio({ s, link, numero, indice }: { s: ServicioPublico; link: string; numero: string; indice: number }) {
  return (
    <article data-revelar="" style={retraso((indice % 3) * 110)} className="group flex flex-col">
      <Galeria fotos={s.fotos} nombre={s.nombre} />
      <div className="flex flex-1 flex-col px-1 pt-5">
        <div className="flex items-baseline gap-3">
          <span className="text-xs tabular-nums text-taupe-oscuro">{numero}</span>
          <h4 className="font-serif text-[1.7rem] leading-tight text-carbon">{s.nombre}</h4>
        </div>
        <p className="mt-2 text-pretty text-sm leading-relaxed text-gris">{s.descripcion}</p>
        {s.beneficios.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {s.beneficios.map((b) => (
              <li key={b} className="inline-flex items-center gap-1.5 rounded-full bg-salvia-claro px-3 py-1 text-xs text-carbon">
                <IconoCheck className="size-3.5 text-taupe-oscuro" />
                {b}
              </li>
            ))}
          </ul>
        )}
        {s.duracion_resultado && (
          <p className="mt-4 flex items-center gap-2 text-xs uppercase tracking-wider text-salvia-oscuro">
            <IconoReloj className="size-4" /> Dura {s.duracion_resultado}
          </p>
        )}
        <div className="mt-auto pt-5">
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border-b border-carbon/25 pb-1 text-sm font-medium text-carbon transition-colors hover:border-taupe-oscuro hover:text-taupe-oscuro"
          >
            <IconoWhatsapp className="size-4" /> Agendar por WhatsApp
            <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </article>
  );
}

export function Servicios({
  categorias,
  intro,
  consulta,
  linkServicio,
}: {
  categorias: CategoriaPublica[];
  intro?: string;
  consulta: string;
  linkServicio: (nombre: string) => string;
}) {
  // Numeración corrida (01, 02, …) a través de todas las categorías.
  const inicio = categorias.map((_, i) => categorias.slice(0, i).reduce((s, c) => s + c.servicios.length, 0));
  return (
    <section id="servicios" className="px-4 py-24 sm:px-6 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <Encabezado sobre="Servicios" titulo={<>Lo que hacemos <em className="italic text-taupe-oscuro">por tu mirada</em></>} intro={intro} />
        <nav
          data-revelar=""
          className="sticky top-14 z-30 -mx-4 mb-14 flex gap-2 overflow-x-auto bg-hueso/95 px-4 py-3 sm:mx-0 sm:justify-start sm:rounded-full sm:px-2"
          aria-label="Categorías"
        >
          {categorias.map((c) => (
            <a
              key={c.slug}
              href={`#cat-${c.slug}`}
              className="shrink-0 rounded-full border border-salvia px-4 py-2 text-sm text-carbon transition-all hover:border-carbon hover:bg-carbon hover:text-hueso"
            >
              {c.nombre} <span className="text-xs text-gris">{c.servicios.length}</span>
            </a>
          ))}
        </nav>
        <div className="space-y-24">
          {categorias.map((c, ci) => (
            <div key={c.slug} id={`cat-${c.slug}`} className="scroll-mt-32">
              <div data-revelar="" className="mb-10 flex flex-wrap items-end justify-between gap-3 border-b border-salvia/60 pb-4">
                <h3 className="font-serif text-4xl text-carbon sm:text-5xl">{c.nombre}</h3>
                {consulta && <p className="text-xs uppercase tracking-[0.2em] text-gris">{consulta}</p>}
              </div>
              <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
                {c.servicios.map((s, i) => (
                  <TarjetaServicio key={s.slug} s={s} link={linkServicio(s.nombre)} numero={String(inicio[ci] + i + 1).padStart(2, "0")} indice={i} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Cursos ---------- */

export function Cursos({ cursos, intro, linkCurso }: { cursos: CursoPublico[]; intro?: string; linkCurso: (n: string) => string }) {
  if (cursos.length === 0) return null;
  return (
    <section id="cursos" className="rounded-t-[2.5rem] bg-carbon px-4 py-24 sm:rounded-t-[4rem] sm:px-6 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <Encabezado sobre="Cursos" titulo={<>Aprendé <em className="italic text-taupe">el oficio</em></>} intro={intro} claro />
        <div className="grid gap-8 md:grid-cols-2">
          {cursos.map((c, i) => (
            <article key={c.slug} data-revelar="" style={retraso(i * 140)} className="group flex flex-col overflow-hidden rounded-[2rem] bg-hueso">
              {c.foto_url && (
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image src={c.foto_url} alt={c.nombre} fill sizes="(min-width: 768px) 34rem, 90vw" className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105" />
                  <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-hueso/90 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-carbon backdrop-blur">
                    <IconoCurso className="size-4 text-taupe-oscuro" /> {c.modalidad}
                  </span>
                </div>
              )}
              <div className="flex flex-1 flex-col p-7 sm:p-9">
                <h3 className="font-serif text-4xl leading-tight text-carbon">{c.nombre}</h3>
                <p className="mt-3 text-pretty text-sm leading-relaxed text-gris">{c.descripcion}</p>
                <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                  {c.incluye.map((x) => (
                    <li key={x} className="flex items-start gap-2 text-sm text-carbon">
                      <IconoCheck className="mt-0.5 size-4 shrink-0 text-taupe-oscuro" /> {x}
                    </li>
                  ))}
                </ul>
                {c.no_incluye.length > 0 && <p className="mt-4 text-xs text-gris">No incluye: {c.no_incluye.join(", ").toLowerCase()}.</p>}
                <div className="mt-auto pt-8">
                  <BotonWhatsapp href={linkCurso(c.nombre)} variante="oscuro" className="w-full sm:w-auto">
                    Quiero información
                  </BotonWhatsapp>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Sobre mí ---------- */

export function SobreMi({ contenido }: { contenido: Record<string, string> }) {
  return (
    <section id="sobre-mi" className="-mt-10 rounded-t-[2.5rem] bg-hueso px-4 py-24 sm:-mt-16 sm:rounded-t-[4rem] sm:px-6 sm:py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-14 md:grid-cols-[1fr_1.15fr]">
        <div className="relative mx-auto w-full max-w-sm md:max-w-none">
          <div data-revelar="imagen" className="relative aspect-[4/5] overflow-hidden rounded-3xl">
            <Image src={contenido.sobre_mi_foto || "/fotos/melani-sobre-mi.webp"} alt="Melani Cristine" fill sizes="(min-width: 768px) 30rem, 85vw" className="object-cover" />
          </div>
          <div aria-hidden="true" className="absolute -right-4 -top-4 -z-10 size-full rounded-3xl border border-taupe/40" />
        </div>
        <div>
          <p data-revelar="" className="mb-4 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.3em] text-taupe-oscuro">
            <span className="num-seccion tabular-nums" />
            <span className="h-px w-8 bg-taupe/60" aria-hidden="true" />
            Mi historia
          </p>
          <h2 data-revelar="" style={retraso(80)} className="font-serif text-5xl leading-[1.02] tracking-tight text-carbon sm:text-6xl">
            {contenido.sobre_mi_titulo || "Sobre mí"}
          </h2>
          <div data-revelar="" style={retraso(180)} className="mt-8 space-y-5 text-pretty text-base leading-relaxed text-gris sm:text-lg">
            <Parrafos texto={contenido.sobre_mi_texto ?? ""} />
          </div>
          <p data-revelar="" style={retraso(280)} className="mt-10 font-serif text-4xl italic text-taupe-oscuro">
            Melani
          </p>
        </div>
      </div>
    </section>
  );
}

/* ---------- El estudio (fotos del salón) ---------- */

export function Estudio({ fotos, contenido }: { fotos: FotoEstudio[]; contenido: Record<string, string> }) {
  // Sin fotos visibles, la sección no aparece (y la numeración se corre sola).
  if (fotos.length === 0) return null;
  return (
    <section id="estudio" className="px-4 pb-24 sm:px-6 sm:pb-32">
      <div className="mx-auto max-w-6xl">
        <Encabezado
          sobre="El estudio"
          titulo={<Acento texto={contenido.estudio_titulo || "Tu momento, en un espacio pensado para vos"} />}
          intro={contenido.estudio_texto}
        />
        <GaleriaEstudio fotos={fotos} />
      </div>
    </section>
  );
}

/* ---------- Resultados y reseñas ---------- */

export function Testimonios({ resenas, servicios }: { resenas: ResumenResenas; servicios: { id: string; nombre: string }[] }) {
  return (
    <section id="testimonios" className="bg-salvia-claro px-4 py-24 sm:px-6 sm:py-32">
      <div className="mx-auto max-w-6xl">
        {/* Reseñas de clientas (la galería "Trabajos reales" se quitó a pedido) */}
        <div id="resenas">
          <div className="mb-12 grid gap-6 sm:mb-16 md:grid-cols-[1.2fr_auto] md:items-end">
            <div data-revelar="">
              <p className="mb-4 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.3em] text-taupe-oscuro">
                <span className="num-seccion tabular-nums" />
                <span className="h-px w-8 bg-taupe/60" aria-hidden="true" />
                Reseñas
              </p>
              <h2 className="text-balance font-serif text-[2.6rem] leading-[1.02] tracking-tight text-carbon sm:text-6xl">
                Lo que dicen <em className="italic text-taupe-oscuro">nuestras clientas</em>
              </h2>
            </div>
            {resenas.total > 0 ? (
              <div data-revelar="" style={retraso(120)} className="flex items-center gap-4">
                <span className="font-serif text-6xl leading-none text-carbon">{resenas.promedio.toLocaleString("es-PY", { minimumFractionDigits: 1 })}</span>
                <span className="text-sm text-gris">
                  <Estrellas valor={resenas.promedio} tamano="size-5" />
                  <span className="mt-1 block">{resenas.total} reseña{resenas.total === 1 ? "" : "s"}</span>
                </span>
              </div>
            ) : (
              <p data-revelar="" style={retraso(120)} className="max-w-xs text-pretty text-gris">
                Todavía no hay reseñas publicadas. ¡Sé la primera en contar tu experiencia!
              </p>
            )}
          </div>

          {resenas.lista.length > 0 && (
            <div className="carrusel -mx-4 mb-14 flex gap-5 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
              {resenas.lista.map((r, i) => (
                <figure key={r.id} data-revelar="" style={retraso(Math.min(i, 3) * 100)} className="flex w-[82vw] max-w-sm shrink-0 flex-col rounded-3xl bg-hueso p-7">
                  <span className="font-serif text-6xl leading-none text-taupe/50" aria-hidden="true">“</span>
                  <blockquote className="-mt-4 flex-1 text-pretty text-base leading-relaxed text-carbon">{r.comentario}</blockquote>
                  {r.fotos.length > 0 && (
                    <div className="mt-5 flex gap-2">
                      {r.fotos.map((f, j) => (
                        <a key={f} href={f} target="_blank" rel="noopener noreferrer" className="relative size-20 overflow-hidden rounded-2xl" aria-label={`Ver foto ${j + 1} de ${r.nombre}`}>
                          <Image src={f} alt={`Resultado de ${r.nombre}`} fill sizes="80px" className="object-cover transition-transform duration-500 hover:scale-110" />
                        </a>
                      ))}
                    </div>
                  )}
                  <figcaption className="mt-6 flex items-center justify-between gap-3 border-t border-salvia/60 pt-4">
                    <span className="text-sm">
                      <span className="block font-medium text-carbon">{r.nombre}</span>
                      {r.servicio && <span className="text-xs text-gris">{r.servicio}</span>}
                    </span>
                    <Estrellas valor={r.estrellas} />
                  </figcaption>
                </figure>
              ))}
            </div>
          )}

          <div data-revelar="">
            <FormResena servicios={servicios} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Preguntas frecuentes ---------- */

export function PreguntasFrecuentes({ faq }: { faq: Faq[] }) {
  if (faq.length === 0) return null;
  return (
    <section id="preguntas" className="px-4 py-24 sm:px-6 sm:py-32">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[1fr_1.5fr]">
        <div className="md:sticky md:top-28 md:self-start">
          <p data-revelar="" className="mb-4 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.3em] text-taupe-oscuro">
            <span className="num-seccion tabular-nums" />
            <span className="h-px w-8 bg-taupe/60" aria-hidden="true" />
            Dudas
          </p>
          <h2 data-revelar="" style={retraso(80)} className="font-serif text-5xl leading-[1.02] tracking-tight text-carbon sm:text-6xl">
            Preguntas <em className="italic text-taupe-oscuro">frecuentes</em>
          </h2>
        </div>
        <div className="divide-y divide-salvia/70 border-y border-salvia/70">
          {faq.map((f, i) => (
            <details key={f.pregunta} data-revelar="" style={retraso(i * 60)} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-left font-serif text-2xl text-carbon transition-colors hover:text-taupe-oscuro">
                {f.pregunta}
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-salvia text-taupe-oscuro transition-all duration-300 group-open:rotate-45 group-open:border-carbon group-open:bg-carbon group-open:text-hueso" aria-hidden="true">
                  +
                </span>
              </summary>
              <p className="pb-7 pr-12 text-pretty text-base leading-relaxed text-gris">{f.respuesta}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Ubicación (mapa) ---------- */

export function Ubicacion({ config }: { config: ConfigPublica }) {
  const { ubicacion_lat: lat, ubicacion_lng: lng } = config;
  if (lat == null || lng == null) return null;
  const punto = `${lat},${lng}`;
  // Links universales de Google Maps: en el celular abren la app.
  const abrir = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(punto)}`;
  const comoLlegar = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(punto)}`;
  // Mapa embebido sin clave de API (gratis).
  const embed = `https://maps.google.com/maps?q=${encodeURIComponent(punto)}&z=17&hl=es&output=embed`;

  return (
    <section id="ubicacion" className="bg-salvia-claro px-4 py-24 sm:px-6 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <Encabezado sobre="Ubicación" titulo={<>Cómo llegar <em className="italic text-taupe-oscuro">al estudio</em></>} intro={config.direccion} />
        <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-stretch">
          <a
            href={abrir}
            target="_blank"
            rel="noopener noreferrer"
            data-revelar="imagen"
            className="group relative block overflow-hidden rounded-3xl shadow-xl shadow-carbon/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-taupe-oscuro"
            aria-label="Abrir la ubicación del estudio en Google Maps"
          >
            <iframe
              src={embed}
              title="Mapa de la ubicación del Estudio Melani Cristine"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="pointer-events-none block aspect-[4/3] h-full w-full border-0 grayscale-[35%] transition-[filter] duration-500 group-hover:grayscale-0 lg:aspect-auto lg:min-h-[26rem]"
              tabIndex={-1}
            />
            <span className="absolute inset-x-3 bottom-3 flex items-center justify-center gap-2 rounded-full bg-hueso/95 px-4 py-3 text-sm font-medium text-carbon shadow-md backdrop-blur transition-transform duration-300 group-hover:-translate-y-1 sm:inset-x-auto sm:right-4 sm:bottom-4">
              <IconoUbicacion className="size-4 text-taupe-oscuro" /> Tocá el mapa para abrir la ubicación
            </span>
          </a>
          <div data-revelar="" style={retraso(150)} className="flex flex-col justify-between gap-8 rounded-3xl bg-hueso p-8">
            <dl className="space-y-6">
              <div>
                <dt className="text-xs uppercase tracking-[0.25em] text-taupe-oscuro">Dirección</dt>
                <dd className="mt-2 font-serif text-2xl leading-snug text-carbon">{config.direccion}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.25em] text-taupe-oscuro">Horario</dt>
                <dd className="mt-2 font-serif text-2xl leading-snug text-carbon">{config.horario_texto}</dd>
              </div>
            </dl>
            <a
              href={comoLlegar}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-carbon px-6 py-4 text-sm font-medium tracking-wide text-hueso transition-all hover:-translate-y-0.5 hover:bg-taupe-oscuro hover:shadow-lg hover:shadow-taupe-oscuro/25"
            >
              <IconoUbicacion /> Cómo llegar
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Reservar / contacto ---------- */

export function Reservar({
  config,
  contenido,
  links,
}: {
  config: ConfigPublica;
  contenido: Record<string, string>;
  links: { agendar: string; ubicacion: string; cursos: string };
}) {
  const mapa =
    config.ubicacion_lat != null && config.ubicacion_lng != null
      ? `https://www.google.com/maps/search/?api=1&query=${config.ubicacion_lat},${config.ubicacion_lng}`
      : config.google_maps_url;
  const redes = "flex size-12 items-center justify-center rounded-full border border-hueso/30 transition-all hover:-translate-y-0.5 hover:bg-hueso hover:text-carbon";
  return (
    <section id="reservar" className="relative overflow-hidden rounded-t-[2.5rem] bg-carbon px-4 py-24 text-hueso sm:rounded-t-[4rem] sm:px-6 sm:py-32">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(44rem 30rem at 50% 0%, rgb(160 126 108 / 0.28), transparent 70%)" }} />
      <div className="relative mx-auto max-w-4xl text-center">
        <p data-revelar="" className="mb-6 flex items-center justify-center gap-3 text-xs font-medium uppercase tracking-[0.3em] text-hueso/70">
          <span className="num-seccion tabular-nums" />
          <span className="h-px w-8 bg-hueso/40" aria-hidden="true" />
          Reservas
        </p>
        <h2 data-revelar="" style={retraso(80)} className="text-balance font-serif text-6xl leading-[0.98] tracking-tight sm:text-8xl">
          <Acento texto={contenido.reservar_titulo || "Reservá tu cita"} color="text-taupe" />
        </h2>
        {contenido.reservar_texto && (
          <p data-revelar="" style={retraso(160)} className="mx-auto mt-6 max-w-lg text-pretty text-base leading-relaxed text-hueso/75 sm:text-lg">
            {contenido.reservar_texto}
          </p>
        )}
        <div data-revelar="" style={retraso(240)} className="mx-auto mt-12 flex max-w-2xl flex-col gap-3 sm:flex-row sm:justify-center">
          <BotonWhatsapp href={links.agendar} variante="claro" tamano="lg" className="sm:flex-1">
            Agendar
          </BotonWhatsapp>
          <BotonWhatsapp href={links.ubicacion} variante="contornoClaro" tamano="lg" icono={<IconoUbicacion />} className="sm:flex-1">
            Ubicación
          </BotonWhatsapp>
          <BotonWhatsapp href={links.cursos} variante="contornoClaro" tamano="lg" icono={<IconoCurso />} className="sm:flex-1">
            Cursos
          </BotonWhatsapp>
        </div>
        <div data-revelar="" style={retraso(320)} className="mt-14 flex items-center justify-center gap-3">
          <a href={config.instagram_url} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className={redes}>
            <IconoInstagram className="size-5" />
          </a>
          <a href={config.tiktok_url} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className={redes}>
            <IconoTiktok className="size-5" />
          </a>
          {mapa && (
            <a href={mapa} target="_blank" rel="noopener noreferrer" aria-label="Ver en Google Maps" className={redes}>
              <IconoUbicacion className="size-5" />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------- Pie ---------- */

export function Pie({ config, linkReservar }: { config: ConfigPublica; linkReservar: string }) {
  return (
    <footer className="bg-carbon px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] text-sm text-hueso/60 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 border-t border-hueso/10 pt-8 sm:flex-row">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="" width={40} height={40} className="size-10 rounded-full" />
          <span className="leading-tight">
            <span className="block font-serif text-base tracking-[0.18em] text-hueso">MELANI CRISTINE</span>
            <span className="block text-xs">{config.ciudad} · {config.horario_texto}</span>
          </span>
        </div>
        <div className="flex items-center gap-5">
          <a href={config.instagram_url} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-hueso"><IconoInstagram /></a>
          <a href={config.tiktok_url} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="hover:text-hueso"><IconoTiktok /></a>
          <a href={linkReservar} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="hover:text-hueso"><IconoWhatsapp /></a>
        </div>
        <p className="text-xs">© {config.nombre_negocio}</p>
      </div>
    </footer>
  );
}
