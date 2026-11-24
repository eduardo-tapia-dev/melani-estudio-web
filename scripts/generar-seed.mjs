// Genera supabase/seed.sql desde supabase/contenido-inicial.json (fuente única del contenido).
// Uso: node scripts/generar-seed.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(readFileSync(join(raiz, "supabase/contenido-inicial.json"), "utf8"));

const q = (v) => (v === null || v === undefined ? "null" : `'${String(v).replace(/'/g, "''")}'`);
const arr = (a) => (a && a.length ? `array[${a.map(q).join(", ")}]::text[]` : "'{}'::text[]");

const out = [];
out.push("-- GENERADO por scripts/generar-seed.mjs — no editar a mano.");
out.push("-- Contenido inicial SIN PRECIOS. Idempotente (on conflict).");
out.push("begin;");
out.push("insert into public.configuracion (id) values (1) on conflict (id) do nothing;");

for (const [clave, valor] of Object.entries(data.contenido)) {
  out.push(`insert into public.contenido_sitio (clave, valor) values (${q(clave)}, ${q(valor)}) on conflict (clave) do nothing;`);
}
for (const c of data.categorias) {
  out.push(`insert into public.categorias (slug, nombre, orden) values (${q(c.slug)}, ${q(c.nombre)}, ${c.orden}) on conflict (slug) do nothing;`);
}
for (const s of data.servicios) {
  out.push(
    `insert into public.servicios (slug, categoria_id, nombre, descripcion, beneficios, duracion_resultado, duracion_min, orden) ` +
      `select ${q(s.slug)}, id, ${q(s.nombre)}, ${q(s.descripcion)}, ${arr(s.beneficios)}, ${q(s.duracion_resultado)}, 120, ${s.orden} ` +
      `from public.categorias where slug = ${q(s.categoria)} on conflict (slug) do nothing;`
  );
  s.fotos.forEach((url, i) => {
    out.push(
      `insert into public.servicio_fotos (servicio_id, url, alt, orden) select id, ${q(url)}, ${q(s.nombre)}, ${i} ` +
        `from public.servicios where slug = ${q(s.slug)} and not exists (select 1 from public.servicio_fotos f where f.servicio_id = servicios.id and f.url = ${q(url)});`
    );
  });
}
for (const c of data.cursos) {
  out.push(
    `insert into public.cursos (slug, nombre, descripcion, incluye, no_incluye, modalidad, foto_url, orden) values ` +
      `(${q(c.slug)}, ${q(c.nombre)}, ${q(c.descripcion)}, ${arr(c.incluye)}, ${arr(c.no_incluye)}, ${q(c.modalidad)}, ${q(c.foto_url)}, ${c.orden}) on conflict (slug) do nothing;`
  );
}
out.push("do $$ begin if not exists (select 1 from public.faq) then");
data.faq.forEach((f, i) => {
  out.push(`  insert into public.faq (pregunta, respuesta, orden) values (${q(f.pregunta)}, ${q(f.respuesta)}, ${i + 1});`);
});
out.push("end if; end $$;");
for (const p of data.plantillas) {
  out.push(
    `insert into public.plantillas_mensaje (clave, descripcion, texto, publico) values (${q(p.clave)}, ${q(p.descripcion)}, ${q(p.texto)}, ${p.publico}) on conflict (clave) do nothing;`
  );
}
for (const c of data.categorias_gasto) {
  out.push(
    `insert into public.categorias_gasto (nombre, es_insumos, orden) values (${q(c.nombre)}, ${c.es_insumos}, ${c.orden}) on conflict (nombre) do nothing;`
  );
}
out.push("commit;");
writeFileSync(join(raiz, "supabase/seed.sql"), out.join("\n") + "\n", "utf8");
console.log("supabase/seed.sql generado");
