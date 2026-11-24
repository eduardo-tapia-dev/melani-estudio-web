// Genera imágenes PLACEHOLDER (logo, íconos PWA, fotos de servicios/cursos/hero)
// mientras llegan las fotos reales o los recortes del catálogo.
// No sobrescribe archivos existentes salvo con --forzar.
// Uso: node scripts/generar-placeholders.mjs [--forzar]
import sharp from "sharp";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const pub = join(raiz, "public");
const forzar = process.argv.includes("--forzar");
const data = JSON.parse(readFileSync(join(raiz, "supabase/contenido-inicial.json"), "utf8"));

const C = { hueso: "#F7F5F2", salvia: "#B5B8B0", salviaClaro: "#E6E8E3", taupe: "#A07E6C", taupeOsc: "#7A5C4D", carbon: "#2B2B2B" };
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

async function guardar(svg, ruta, ancho, alto, formato = "webp") {
  const destino = join(pub, ruta);
  if (existsSync(destino) && !forzar) return;
  mkdirSync(dirname(destino), { recursive: true });
  let img = sharp(Buffer.from(svg)).resize(ancho, alto);
  img = formato === "png" ? img.png() : img.webp({ quality: 82 });
  await img.toFile(destino);
  console.log("✓", ruta);
}

const monograma = (tam, fondo, color, conTexto = false) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${tam}" height="${tam}" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${fondo}"/>
  <circle cx="256" cy="${conTexto ? 220 : 256}" r="${conTexto ? 150 : 190}" fill="none" stroke="${color}" stroke-width="4"/>
  <text x="256" y="${conTexto ? 262 : 300}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif"
        font-size="${conTexto ? 130 : 160}" font-style="italic" fill="${color}" letter-spacing="-6">MC</text>
  ${conTexto ? `<text x="256" y="420" text-anchor="middle" font-family="Georgia, serif" font-size="30" letter-spacing="6" fill="${color}">MELANI CRISTINE</text>
  <text x="256" y="460" text-anchor="middle" font-family="Arial, sans-serif" font-size="17" letter-spacing="5" fill="${color}">LASHES &amp; BROWS</text>` : ""}
</svg>`;

const foto = (titulo, sub, w, h) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${C.salviaClaro}"/><stop offset="1" stop-color="${C.salvia}"/>
  </linearGradient></defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <circle cx="${w / 2}" cy="${h * 0.42}" r="${Math.min(w, h) * 0.16}" fill="none" stroke="${C.hueso}" stroke-width="3"/>
  <text x="${w / 2}" y="${h * 0.42 + Math.min(w, h) * 0.06}" text-anchor="middle" font-family="Georgia, serif" font-style="italic"
        font-size="${Math.min(w, h) * 0.16}" fill="${C.hueso}">MC</text>
  <text x="${w / 2}" y="${h * 0.72}" text-anchor="middle" font-family="Georgia, serif" font-size="${Math.min(w, h) * 0.065}" fill="${C.carbon}">${esc(titulo)}</text>
  <text x="${w / 2}" y="${h * 0.72 + Math.min(w, h) * 0.07}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.min(w, h) * 0.035}"
        letter-spacing="3" fill="${C.taupeOsc}">${esc(sub)}</text>
</svg>`;

// Logo e íconos
await guardar(monograma(1024, C.hueso, C.taupeOsc, true), "logo.png", 1024, 1024, "png");
await guardar(monograma(512, C.hueso, C.taupeOsc), "icons/icon-192.png", 192, 192, "png");
await guardar(monograma(512, C.hueso, C.taupeOsc), "icons/icon-512.png", 512, 512, "png");
await guardar(monograma(512, C.taupeOsc, C.hueso), "icons/icon-maskable-512.png", 512, 512, "png");
await guardar(monograma(512, C.hueso, C.taupeOsc), "icons/apple-touch-icon.png", 180, 180, "png");

// Fotos de Melani
await guardar(foto("Melani Cristine", "FOTO PRÓXIMAMENTE", 900, 1125), "fotos/melani-hero.webp", 900, 1125);
await guardar(foto("Sobre mí", "FOTO PRÓXIMAMENTE", 900, 1125), "fotos/melani-sobre-mi.webp", 900, 1125);

// Servicios y cursos
for (const s of data.servicios) for (const f of s.fotos) await guardar(foto(s.nombre, "ESTUDIO MELANI CRISTINE", 900, 900), f, 900, 900);
for (const c of data.cursos) await guardar(foto(c.nombre, "PRESENCIAL", 900, 900), c.foto_url, 900, 900);
