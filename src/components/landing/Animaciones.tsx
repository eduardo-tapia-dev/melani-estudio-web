"use client";

import { useEffect } from "react";

/**
 * Activa las animaciones al bajar: marca <html class="anim"> y va mostrando
 * cada [data-revelar] cuando entra en pantalla. También mueve la barra de
 * progreso de lectura. Sin dependencias.
 */
export default function Animaciones() {
  useEffect(() => {
    const raiz = document.documentElement;
    const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Barra de progreso
    let pendiente = false;
    const actualizar = () => {
      pendiente = false;
      const max = raiz.scrollHeight - window.innerHeight;
      raiz.style.setProperty("--progreso", String(max > 0 ? Math.min(1, window.scrollY / max) : 0));
    };
    const alScroll = () => {
      if (!pendiente) {
        pendiente = true;
        requestAnimationFrame(actualizar);
      }
    };
    actualizar();
    window.addEventListener("scroll", alScroll, { passive: true });

    if (reducir || !("IntersectionObserver" in window)) {
      return () => window.removeEventListener("scroll", alScroll);
    }

    raiz.classList.add("anim");
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            observador.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    document.querySelectorAll("[data-revelar]").forEach((el) => observador.observe(el));

    return () => {
      observador.disconnect();
      window.removeEventListener("scroll", alScroll);
      raiz.classList.remove("anim");
    };
  }, []);

  return <div aria-hidden="true" className="progreso-lectura fixed inset-x-0 top-0 z-[60] h-0.5 bg-taupe-oscuro" />;
}
