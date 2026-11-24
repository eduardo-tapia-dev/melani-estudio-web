"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Certificado, { type DatosCertificado } from "./Certificado";
import Icono from "@/components/admin/Iconos";
import { btnPrimario, etiqueta, input, tarjeta } from "@/components/admin/estilos";
import "./certificado.css";

// Ancho real del certificado en pantalla (297 mm a 96 ppp)
const ANCHO_REAL = (297 / 25.4) * 96;
const ALTO_REAL = (210 / 25.4) * 96;
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

type Plantilla = { nombre: string; subtitulo: string; texto: string; curso: string; carga: string };

const PLANTILLAS: Plantilla[] = [
  {
    nombre: "Extensiones de pestañas",
    subtitulo: "De Formación Profesional",
    texto: "Por haber concluido satisfactoriamente el curso VIP, Máster de Pestañas, teórico y práctico con una carga horaria de 20 horas.",
    curso: "Lashes Academy",
    carga: "Carga horaria: 5 horas por 4 días · Teórico y práctico",
  },
  {
    nombre: "Cejas",
    subtitulo: "De Formación Profesional",
    texto: "Por haber concluido satisfactoriamente el curso de Diseño de Cejas, teórico y práctico.",
    curso: "Diseño de Cejas",
    carga: "Teórico y práctico",
  },
];

const fechaTexto = (f: string) => {
  const [y, m, d] = f.split("-").map(Number);
  return y ? `${d} de ${MESES[m - 1]} de ${y}` : "";
};

/** Vista previa que se achica para entrar en la pantalla (el certificado mide 297 × 210 mm). */
function Vista({ d }: { d: DatosCertificado }) {
  const caja = useRef<HTMLDivElement>(null);
  const [escala, setEscala] = useState(0.5);
  useEffect(() => {
    const el = caja.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setEscala(e.contentRect.width / ANCHO_REAL));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={caja} className="relative w-full min-w-0 overflow-hidden rounded-xl shadow-xl shadow-carbon/15 ring-1 ring-salvia/40" style={{ height: ALTO_REAL * escala }}>
      {/* absoluto: el certificado escalado no empuja el ancho de la página */}
      <div className="absolute left-0 top-0" style={{ transform: `scale(${escala})`, transformOrigin: "top left", width: ANCHO_REAL, height: ALTO_REAL }}>
        <Certificado d={d} />
      </div>
    </div>
  );
}

const nada = () => () => {};

export default function EditorCertificados({ hoy, fuente }: { hoy: string; fuente: string }) {
  // true solo en el navegador (para el portal), sin setState dentro de un efecto
  const enNavegador = useSyncExternalStore(nada, () => true, () => false);
  const [alumnas, setAlumnas] = useState("");
  const [plantilla, setPlantilla] = useState(0);
  const [subtitulo, setSubtitulo] = useState(PLANTILLAS[0].subtitulo);
  const [texto, setTexto] = useState(PLANTILLAS[0].texto);
  const [curso, setCurso] = useState(PLANTILLAS[0].curso);
  const [carga, setCarga] = useState(PLANTILLAS[0].carga);
  const [lugar, setLugar] = useState("San Lorenzo, Paraguay");
  const [fecha, setFecha] = useState(hoy);
  const [firma, setFirma] = useState("Directora · Instructora");

  const usarPlantilla = (i: number) => {
    const p = PLANTILLAS[i];
    setPlantilla(i);
    setSubtitulo(p.subtitulo);
    setTexto(p.texto);
    setCurso(p.curso);
    setCarga(p.carga);
  };

  const nombres = useMemo(() => {
    const lista = alumnas.split("\n").map((n) => n.trim()).filter(Boolean);
    return lista.length ? lista : [""];
  }, [alumnas]);

  const base: Omit<DatosCertificado, "nombre"> = {
    subtitulo,
    texto,
    curso,
    detalles: [carga, [lugar, fechaTexto(fecha)].filter(Boolean).join(" · ")].filter(Boolean).join("\n"),
    firma,
  };
  const faltaNombre = nombres.length === 1 && !nombres[0];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)]">
      {/* Formulario */}
      <div className="min-w-0 space-y-4">
        <section className={tarjeta}>
          <label htmlFor="alumnas" className={etiqueta}>Nombre de la alumna</label>
          <textarea
            id="alumnas"
            rows={3}
            className={input}
            value={alumnas}
            onChange={(e) => setAlumnas(e.target.value)}
            placeholder="Dana Villagra"
          />
          <p className="mt-1.5 text-sm text-gris">¿Varias alumnas? Escribí <strong>una por renglón</strong> y se arma un certificado para cada una.</p>
        </section>

        <section className={tarjeta}>
          <p className={etiqueta}>Curso</p>
          <div className="grid grid-cols-2 gap-2">
            {PLANTILLAS.map((p, i) => (
              <button
                key={p.nombre}
                type="button"
                onClick={() => usarPlantilla(i)}
                aria-pressed={plantilla === i}
                className={`rounded-2xl border px-3 py-3 text-[15px] leading-tight transition-all ${plantilla === i ? "border-carbon bg-carbon text-hueso" : "border-salvia/70 bg-white text-carbon hover:border-carbon"}`}
              >
                {p.nombre}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-gris">Elegí uno y se completa el texto. Después podés cambiar lo que quieras.</p>
        </section>

        <section className={`${tarjeta} space-y-4`}>
          <div>
            <label htmlFor="c-fecha" className={etiqueta}>Fecha</label>
            <input id="c-fecha" type="date" className={input} value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div>
            <label htmlFor="c-texto" className={etiqueta}>Texto</label>
            <textarea id="c-texto" rows={4} className={input} value={texto} onChange={(e) => setTexto(e.target.value)} />
          </div>
          <details className="group">
            <summary className="cursor-pointer list-none text-[15px] font-medium text-taupe-oscuro">
              <span className="group-open:hidden">+ Más opciones (título, carga horaria, lugar, firma)</span>
              <span className="hidden group-open:inline">− Menos opciones</span>
            </summary>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="c-sub" className={etiqueta}>Debajo de “Certificado”</label>
                <input id="c-sub" className={input} value={subtitulo} onChange={(e) => setSubtitulo(e.target.value)} />
              </div>
              <div>
                <label htmlFor="c-curso" className={etiqueta}>Nombre del curso (en dorado)</label>
                <input id="c-curso" className={input} value={curso} onChange={(e) => setCurso(e.target.value)} />
              </div>
              <div>
                <label htmlFor="c-carga" className={etiqueta}>Carga horaria</label>
                <input id="c-carga" className={input} value={carga} onChange={(e) => setCarga(e.target.value)} />
              </div>
              <div>
                <label htmlFor="c-lugar" className={etiqueta}>Lugar</label>
                <input id="c-lugar" className={input} value={lugar} onChange={(e) => setLugar(e.target.value)} />
              </div>
              <div>
                <label htmlFor="c-firma" className={etiqueta}>Debajo de la firma</label>
                <input id="c-firma" className={input} value={firma} onChange={(e) => setFirma(e.target.value)} />
              </div>
            </div>
          </details>
        </section>

        <div className="sticky bottom-24 z-10 space-y-2 rounded-3xl bg-[#f5f3ef]/95 p-2 pb-3 shadow-[0_-8px_24px_-12px_rgb(43_43_43/0.15)] backdrop-blur lg:bottom-4">
          <button type="button" onClick={() => window.print()} disabled={faltaNombre} className={`${btnPrimario} w-full py-4 text-[17px] shadow-xl shadow-carbon/20`}>
            <Icono nombre="diploma" className="size-5" />
            {faltaNombre ? "Escribí el nombre para imprimir" : nombres.length > 1 ? `Imprimir / Guardar PDF (${nombres.length})` : "Imprimir / Guardar PDF"}
          </button>
          <p className="text-center text-sm text-gris">Para PDF: en la ventana de impresión elegí “Guardar como PDF”.</p>
        </div>
      </div>

      {/* Vista previa (arriba en el celular, a la derecha en la computadora) */}
      <div className="order-first min-w-0 space-y-4 lg:order-none lg:sticky lg:top-6 lg:self-start">
        <p className="text-[15px] text-gris">
          Vista previa{nombres.length > 1 ? ` · ${nombres.length} certificados` : ""} · así se va a imprimir (A4 apaisado)
        </p>
        {nombres.slice(0, 3).map((n, i) => (
          <Vista key={`${n}-${i}`} d={{ ...base, nombre: n }} />
        ))}
        {nombres.length > 3 && <p className="text-center text-[15px] text-gris">…y {nombres.length - 3} más.</p>}
      </div>

      {/* Versión para imprimir: va directo en <body> (tamaño real, oculta en pantalla) */}
      {enNavegador &&
        createPortal(
          <div className={`cert-impresion ${fuente}`} aria-hidden="true">
            {nombres.map((n, i) => (
              <Certificado key={`p-${n}-${i}`} d={{ ...base, nombre: n }} />
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
