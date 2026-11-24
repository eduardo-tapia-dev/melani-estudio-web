"use client";

import { useTransition } from "react";
import { cambiarEstado, marcarRecordatorio } from "@/app/admin/acciones-agenda";
import { IconoWhatsapp } from "@/components/landing/Iconos";
import Icono from "./Iconos";
import { btnSecundario, btnWhatsapp } from "./estilos";

/** "Enviar recordatorio": abre WhatsApp con el mensaje armado y marca la cita. */
export function BotonRecordatorio({ citaId, href, enviado }: { citaId: string; href: string; enviado: boolean }) {
  const [pendiente, iniciar] = useTransition();
  if (enviado) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2.5 text-[15px] font-medium text-emerald-900 ring-1 ring-emerald-200">
          <Icono nombre="check" className="size-5" /> Recordatorio enviado
        </span>
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm text-gris underline underline-offset-4">
          Reenviar
        </a>
        <button type="button" disabled={pendiente} onClick={() => iniciar(() => void marcarRecordatorio(citaId, false))} className="text-sm text-gris underline underline-offset-4">
          No lo mandé
        </button>
      </div>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" onClick={() => iniciar(() => void marcarRecordatorio(citaId, true))} className={`${btnWhatsapp} w-full sm:w-auto`}>
      <IconoWhatsapp className="size-5" /> Enviar recordatorio
    </a>
  );
}

export function BotonConfirmar({ citaId }: { citaId: string }) {
  const [pendiente, iniciar] = useTransition();
  return (
    <button type="button" disabled={pendiente} onClick={() => iniciar(() => void cambiarEstado(citaId, "confirmada"))} className={`${btnSecundario} w-full sm:w-auto`}>
      <Icono nombre="check" className="size-5" /> {pendiente ? "Guardando…" : "Me confirmó que viene"}
    </button>
  );
}
