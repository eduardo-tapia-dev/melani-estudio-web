// Recorta SOLO las fotos de las páginas del catálogo (nunca la página entera,
// porque tienen precios impresos) y las guarda en /public/fotos como WebP ≤1600 px.
//
// Uso: node scripts/recortar-catalogo.mjs <carpeta-catalogo-paginas>
// Las cajas de recorte están en scripts/recortes.json, en PORCENTAJE de la página
// (x, y, ancho, alto de 0 a 100) para que no dependan de la resolución del JPG.
import sharp from "sharp";
import { readFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const carpeta = process.argv[2];
if (!carpeta) {
  console.error("Falta la carpeta: node scripts/recortar-catalogo.mjs ./catalogo-paginas");
  process.exit(1);
}
const recortes = JSON.parse(readFileSync(join(raiz, "scripts/recortes.json"), "utf8"));

for (const r of recortes) {
  const origen = resolve(carpeta, r.pagina);
  if (!existsSync(origen)) {
    console.warn("⚠ no existe", origen);
    continue;
  }
  const meta = await sharp(origen).metadata();
  const left = Math.round((r.x / 100) * meta.width);
  const top = Math.round((r.y / 100) * meta.height);
  const width = Math.round((r.ancho / 100) * meta.width);
  const height = Math.round((r.alto / 100) * meta.height);
  const destino = join(raiz, "public", r.destino);
  mkdirSync(dirname(destino), { recursive: true });
  await sharp(origen)
    .extract({ left, top, width, height })
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(destino);
  console.log(`✓ ${r.pagina} → ${r.destino} (${width}×${height})`);
}
