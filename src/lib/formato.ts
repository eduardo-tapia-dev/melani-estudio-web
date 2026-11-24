export const ZONA = "America/Asuncion";

/** 180000 → "180.000 Gs" (sin decimales). */
export function formatoGs(monto: number | null | undefined): string {
  const n = Math.round(Number(monto ?? 0));
  return `${n.toLocaleString("es-PY", { maximumFractionDigits: 0 }).replace(/,/g, ".")} Gs`;
}

/**
 * Normaliza teléfonos paraguayos a 595XXXXXXXXX.
 * Acepta "0972 612 944", "+595 972-612-944", "972612944", "595972612944".
 */
export function normalizarTelefono(entrada: string): string | null {
  let d = entrada.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("595")) d = d.slice(3);
  if (d.startsWith("0")) d = d.slice(1);
  if (d.length < 8 || d.length > 10) return null;
  return `595${d}`;
}
