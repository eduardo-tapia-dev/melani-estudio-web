// Texto del aviso diario. Sin dependencias: lo usan el panel y la función programada de Netlify.

export type CitaAviso = { hora: string; clienta: string; servicio: string; sena: boolean; recordatorio: boolean };

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export function armarAviso(fecha: string, citas: CitaAviso[]) {
  const [y, m, d] = fecha.split("-").map(Number);
  const dia = DIAS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  if (citas.length === 0) {
    return { title: "Mañana no hay citas", body: `Agenda libre el ${dia} ${d}/${m}.`, url: "/admin/agenda" };
  }
  const faltanRecordatorios = citas.filter((c) => !c.recordatorio).length;
  const lineas = citas.slice(0, 6).map((c) => `${c.hora} ${c.clienta} · ${c.servicio}${c.sena ? "" : " (sin seña)"}`);
  if (citas.length > 6) lineas.push(`y ${citas.length - 6} más…`);
  if (faltanRecordatorios) lineas.push(`Faltan ${faltanRecordatorios} recordatorio${faltanRecordatorios > 1 ? "s" : ""} por enviar.`);
  return {
    title: `Mañana ${dia}: ${citas.length} cita${citas.length > 1 ? "s" : ""}`,
    body: lineas.join("\n"),
    url: "/admin",
  };
}
