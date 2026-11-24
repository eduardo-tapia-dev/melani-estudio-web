// Estilos del panel. Pensados para usar con el dedo y leer sin esfuerzo:
// textos de 16–17 px, botones altos (≥ 48 px) y esquinas suaves.
export const input =
  "block w-full rounded-2xl border border-salvia/80 bg-white px-4 py-3.5 text-[17px] text-carbon placeholder:text-gris/55 shadow-[inset_0_1px_2px_rgb(43_43_43/0.04)] transition-colors focus:border-taupe-oscuro focus:outline-none focus:ring-4 focus:ring-taupe-oscuro/10 disabled:bg-salvia-claro";
export const etiqueta = "mb-2 block text-[15px] font-medium text-carbon";
export const ayuda = "mt-1.5 text-sm text-gris";

export const btn =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 py-3 text-[15px] font-medium transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45";
export const btnPrimario = `${btn} bg-carbon text-hueso shadow-sm hover:bg-taupe-oscuro hover:shadow-md`;
export const btnSecundario = `${btn} border border-salvia bg-white text-carbon hover:border-carbon`;
export const btnPeligro = `${btn} border border-red-200 bg-white text-red-700 hover:bg-red-50`;
export const btnWhatsapp = `${btn} bg-[#1f7a4d] text-white shadow-sm hover:bg-[#17603c]`;

export const tarjeta = "rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgb(43_43_43/0.04),0_8px_24px_-12px_rgb(43_43_43/0.08)] ring-1 ring-salvia/35 sm:p-6";
export const tituloPagina = "font-serif text-[2.4rem] leading-tight tracking-tight text-carbon sm:text-5xl";
export const subtitulo = "mt-1 text-[15px] text-gris";
