// Fechas y horas siempre en hora de Asunción (America/Asuncion), sin librerías.
export const TZ = "America/Asuncion";

const partes = (d: Date) => {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const g = (t: string) => Number(f.find((p) => p.type === t)!.value);
  return { y: g("year"), m: g("month"), d: g("day"), h: g("hour"), mi: g("minute"), s: g("second") };
};

/** Diferencia (ms) entre la hora local de Asunción y UTC en ese instante. */
function offset(d: Date) {
  const p = partes(d);
  return Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s) - Math.floor(d.getTime() / 1000) * 1000;
}

/** "2026-11-16" + "10:30" (hora de Asunción) → Date (instante UTC). */
export function aInstante(fecha: string, hora = "00:00"): Date {
  const [y, m, d] = fecha.split("-").map(Number);
  const [h, mi] = hora.split(":").map(Number);
  const supuesto = Date.UTC(y, m - 1, d, h, mi);
  const primero = supuesto - offset(new Date(supuesto));
  return new Date(supuesto - offset(new Date(primero)));
}

/** Date → "YYYY-MM-DD" en Asunción. */
export function fechaLocal(d: Date | string): string {
  const p = partes(new Date(d));
  return `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
}

/** Date → "HH:MM" en Asunción. */
export function horaLocal(d: Date | string): string {
  const p = partes(new Date(d));
  return `${String(p.h).padStart(2, "0")}:${String(p.mi).padStart(2, "0")}`;
}

export const hoy = () => fechaLocal(new Date());

/** "Buenos días" / "Buenas tardes" / "Buenas noches" según la hora de Asunción. */
export function saludoDelMomento(): string {
  const h = Number(horaLocal(new Date()).slice(0, 2));
  return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
}

/** Desde ahora hasta dentro de N días (ISO UTC). */
export function desdeAhora(dias: number) {
  const ahora = Date.now();
  return { desde: new Date(ahora).toISOString(), hasta: new Date(ahora + dias * 86400000).toISOString() };
}

export function sumarDias(fecha: string, n: number): string {
  const [y, m, d] = fecha.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
}

/** 1 = lunes … 7 = domingo */
export function diaSemana(fecha: string): number {
  const [y, m, d] = fecha.split("-").map(Number);
  const w = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return w === 0 ? 7 : w;
}

export const lunesDe = (fecha: string) => sumarDias(fecha, 1 - diaSemana(fecha));

/** Rango [desde, hasta) en UTC ISO que cubre los días locales indicados. */
export function rangoDias(desde: string, dias = 1) {
  return { desde: aInstante(desde).toISOString(), hasta: aInstante(sumarDias(desde, dias)).toISOString() };
}

const DIAS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** "2026-11-16" → "lunes 16 de noviembre" */
export function fechaLarga(fecha: string): string {
  const [, m, d] = fecha.split("-").map(Number);
  return `${DIAS[diaSemana(fecha) - 1]} ${d} de ${MESES[m - 1]}`;
}

/** "2026-11-16" → "lun 16/11" */
export function fechaCorta(fecha: string): string {
  const [, m, d] = fecha.split("-").map(Number);
  return `${DIAS[diaSemana(fecha) - 1].slice(0, 3)} ${d}/${m}`;
}

export const nombreDia = (fecha: string) => DIAS[diaSemana(fecha) - 1];

/* ---- Meses ("YYYY-MM") ---- */
export const mesActual = () => hoy().slice(0, 7);
export const mesValido = (m: unknown): m is string => typeof m === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(m);
export function sumarMeses(mes: string, n: number): string {
  const [y, m] = mes.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1 + n, 1));
  return t.toISOString().slice(0, 7);
}
/** "2026-11" → "noviembre 2026"; corto → "nov 26" */
export function nombreMes(mes: string, corto = false): string {
  const [y, m] = mes.split("-").map(Number);
  return corto ? `${MESES[m - 1].slice(0, 3)} ${String(y).slice(2)}` : `${MESES[m - 1]} ${y}`;
}
export const rangoMes = (mes: string) => ({ desde: `${mes}-01`, hasta: `${sumarMeses(mes, 1)}-01` });
