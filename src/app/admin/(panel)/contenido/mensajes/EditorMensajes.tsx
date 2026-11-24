"use client";

import { useState, useTransition } from "react";
import { guardarPlantilla } from "@/app/admin/acciones-contenido";
import { linkWhatsapp, rellenar } from "@/lib/whatsapp";
import { btnPrimario, input, tarjeta } from "@/components/admin/estilos";

type P = { clave: string; descripcion: string; texto: string };

const ORDEN = ["agendar", "agendar_general", "ubicacion", "curso", "recordatorio"];
const EJEMPLO = { servicio: "Volumen Griego", curso: "Curso de Cejas", nombre: "Ana", fecha: "lunes 16 de noviembre", hora: "10:00" };

export default function EditorMensajes({ plantillas, whatsapp }: { plantillas: P[]; whatsapp: string }) {
  const ordenadas = [...plantillas].sort((a, b) => ORDEN.indexOf(a.clave) - ORDEN.indexOf(b.clave));
  return (
    <div className="space-y-4">
      {ordenadas.map((p) => <Plantilla key={p.clave} p={p} whatsapp={whatsapp} />)}
    </div>
  );
}

function Plantilla({ p, whatsapp }: { p: P; whatsapp: string }) {
  const [texto, setTexto] = useState(p.texto);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [pendiente, iniciar] = useTransition();
  return (
    <div className={`${tarjeta} space-y-3`}>
      <p className="text-sm font-medium text-carbon">{p.descripcion || p.clave}</p>
      <textarea rows={3} className={input} value={texto} onChange={(e) => setTexto(e.target.value)} aria-label={p.descripcion} />
      <p className="rounded-lg bg-salvia-claro/60 px-3 py-2 text-sm text-gris">Ejemplo: {rellenar(texto, EJEMPLO)}</p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          disabled={pendiente || texto === p.texto}
          className={btnPrimario}
          onClick={() => iniciar(async () => {
            const r = await guardarPlantilla(p.clave, texto);
            setMsg(r.ok ? { ok: true, t: "Guardado." } : { ok: false, t: r.error });
          })}
        >
          Guardar
        </button>
        <a href={linkWhatsapp(whatsapp, rellenar(texto, EJEMPLO))} target="_blank" rel="noopener noreferrer" className="text-sm text-taupe-oscuro underline underline-offset-4">
          Probar en WhatsApp ↗
        </a>
        {msg && <span className={`text-sm ${msg.ok ? "text-emerald-800" : "text-red-700"}`}>{msg.t}</span>}
      </div>
    </div>
  );
}
