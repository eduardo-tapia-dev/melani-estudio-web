/** Reemplaza {variables} en una plantilla. Las variables desconocidas quedan tal cual. */
export function rellenar(plantilla: string, vars: Record<string, string | undefined>): string {
  return plantilla.replace(/\{(\w+)\}/g, (m, k: string) => vars[k] ?? m);
}

/**
 * Link gratuito wa.me con texto precargado. encodeURIComponent codifica bien
 * tildes, ñ, emojis (UTF-8) y saltos de línea (%0A).
 */
export function linkWhatsapp(telefono: string, texto?: string): string {
  const tel = telefono.replace(/\D/g, "");
  return texto ? `https://wa.me/${tel}?text=${encodeURIComponent(texto)}` : `https://wa.me/${tel}`;
}
