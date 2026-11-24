import type { EstadoCita } from "@/lib/admin-datos";

// Palabras simples + un punto de color (nunca solo color).
export const ETIQUETA_ESTADO: Record<EstadoCita, string> = {
  pendiente_sena: "Falta la seña",
  confirmada: "Confirmada",
  atendida: "Atendida",
  cancelada: "Cancelada",
  no_asistio: "No vino",
};

const ESTILO: Record<EstadoCita, { caja: string; punto: string }> = {
  pendiente_sena: { caja: "bg-amber-50 text-amber-900 ring-amber-200", punto: "bg-amber-500" },
  confirmada: { caja: "bg-emerald-50 text-emerald-900 ring-emerald-200", punto: "bg-emerald-500" },
  atendida: { caja: "bg-salvia-claro text-carbon ring-salvia", punto: "bg-salvia-oscuro" },
  cancelada: { caja: "bg-stone-100 text-stone-600 ring-stone-200", punto: "bg-stone-400" },
  no_asistio: { caja: "bg-red-50 text-red-800 ring-red-200", punto: "bg-red-500" },
};

export default function Estado({ estado }: { estado: EstadoCita }) {
  const e = ESTILO[estado];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-medium ring-1 ${e.caja}`}>
      <span className={`size-1.5 rounded-full ${e.punto}`} aria-hidden="true" />
      {ETIQUETA_ESTADO[estado]}
    </span>
  );
}
