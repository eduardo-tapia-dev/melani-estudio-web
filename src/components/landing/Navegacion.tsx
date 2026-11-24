"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { IconoWhatsapp } from "./Iconos";

const ANCLAS = [
  { href: "#servicios", texto: "Servicios" },
  { href: "#cursos", texto: "Cursos" },
  { href: "#sobre-mi", texto: "Sobre mí" },
  { href: "#testimonios", texto: "Reseñas" },
  { href: "#ubicacion", texto: "Ubicación" },
];

export default function Navegacion({ linkReservar }: { linkReservar: string }) {
  const [abierto, setAbierto] = useState(false);
  const [compacta, setCompacta] = useState(false);
  const [activa, setActiva] = useState<string | null>(null);

  // Fondo al bajar + sección activa
  useEffect(() => {
    const alScroll = () => setCompacta(window.scrollY > 24);
    alScroll();
    window.addEventListener("scroll", alScroll, { passive: true });
    const secciones = ANCLAS.map((a) => document.querySelector(a.href)).filter(Boolean) as Element[];
    const obs = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setActiva(`#${e.target.id}`)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    secciones.forEach((s) => obs.observe(s));
    return () => {
      window.removeEventListener("scroll", alScroll);
      obs.disconnect();
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = abierto ? "hidden" : "";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [abierto]);

  const fondo = compacta || abierto;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)] transition-all duration-500 ${
        fondo ? "border-b border-salvia/40 bg-hueso/80 shadow-[0_8px_30px_-12px_rgb(43_43_43/0.12)] backdrop-blur-xl" : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav className={`mx-auto flex max-w-6xl items-center justify-between px-4 transition-all duration-500 sm:px-6 ${compacta ? "h-14" : "h-20"}`} aria-label="Principal">
        <a href="#inicio" className="flex items-center gap-2.5" onClick={() => setAbierto(false)}>
          <Image src="/logo.png" alt="" width={40} height={40} className={`rounded-full transition-all duration-500 ${compacta ? "size-8" : "size-10"}`} priority />
          <span className="leading-none">
            <span className="block font-serif text-lg tracking-[0.18em] text-carbon">MELANI CRISTINE</span>
            <span className="block text-[0.6rem] tracking-[0.35em] text-taupe-oscuro">LASHES &amp; BROWS</span>
          </span>
        </a>

        <ul className="hidden items-center gap-1 text-sm lg:flex">
          {ANCLAS.map((a) => (
            <li key={a.href}>
              <a
                href={a.href}
                className={`relative rounded-full px-3.5 py-2 transition-colors ${activa === a.href ? "text-carbon" : "text-gris hover:text-carbon"}`}
              >
                {a.texto}
                <span
                  className={`absolute inset-x-3.5 -bottom-0.5 h-px origin-left bg-taupe-oscuro transition-transform duration-500 ${activa === a.href ? "scale-x-100" : "scale-x-0"}`}
                  aria-hidden="true"
                />
              </a>
            </li>
          ))}
          <li className="ml-3">
            <a
              href={linkReservar}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-carbon px-5 py-2.5 text-hueso transition-all hover:-translate-y-0.5 hover:bg-taupe-oscuro hover:shadow-lg hover:shadow-taupe-oscuro/25"
            >
              <IconoWhatsapp className="size-4" /> Reservar
            </a>
          </li>
        </ul>

        <button
          type="button"
          className="-mr-2 flex size-11 items-center justify-center rounded-full text-carbon lg:hidden"
          aria-expanded={abierto}
          aria-controls="menu-movil"
          aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setAbierto((v) => !v)}
        >
          <span className="relative block h-3.5 w-6">
            <span className={`absolute left-0 h-px w-6 bg-current transition-all duration-300 ${abierto ? "top-1.5 rotate-45" : "top-0"}`} />
            <span className={`absolute left-0 top-1.5 h-px bg-current transition-all duration-300 ${abierto ? "w-0 opacity-0" : "w-4"}`} />
            <span className={`absolute left-0 h-px w-6 bg-current transition-all duration-300 ${abierto ? "top-1.5 -rotate-45" : "top-3"}`} />
          </span>
        </button>
      </nav>

      <div
        id="menu-movil"
        className={`grid overflow-hidden bg-hueso transition-[grid-template-rows,opacity] duration-500 lg:hidden ${abierto ? "grid-rows-[1fr] opacity-100" : "pointer-events-none grid-rows-[0fr] opacity-0"}`}
        aria-hidden={!abierto}
      >
        <div className="min-h-0">
          <div className="h-[calc(100dvh-3.5rem)] overflow-y-auto px-6 pb-10 pt-6">
            <ul className="space-y-1">
              {[{ href: "#inicio", texto: "Inicio" }, ...ANCLAS].map((a, i) => (
                <li key={a.href} className={abierto ? "entrada" : "opacity-0"} style={{ "--d": `${80 + i * 50}ms` } as React.CSSProperties}>
                  <a href={a.href} onClick={() => setAbierto(false)} tabIndex={abierto ? 0 : -1} className="flex items-baseline gap-4 py-3 font-serif text-4xl text-carbon">
                    <span className="font-sans text-xs tabular-nums text-taupe-oscuro">0{i + 1}</span>
                    {a.texto}
                  </a>
                </li>
              ))}
            </ul>
            <a
              href={linkReservar}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={abierto ? 0 : -1}
              className="mt-8 flex items-center justify-center gap-2 rounded-full bg-carbon px-6 py-4 text-hueso"
            >
              <IconoWhatsapp /> Reservar por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
