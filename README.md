# Estudio Melani Cristine — App

Sitio público (link de la bio de Instagram) + panel privado de agenda, clientas y finanzas.
**Costo mensual: $0** (Netlify y Supabase en plan gratuito, sin APIs pagas: WhatsApp por links `wa.me`, avisos por Web Push).

| | |
|---|---|
| Sitio público | https://melanicristine.netlify.app |
| Panel | Panel privado de administración (acceso con usuario y contraseña) |
| Netlify | proyecto `melanicristine` |
| Supabase | proyecto `estudio-melani-cristine` (ref `cpimqeizsmjoduczhqfd`, São Paulo) |
| Stack | Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind 4 · Supabase · Recharts · web-push |

---

## Guía de uso del panel

### Instalar el panel en el celular
1. En el iPhone, abrí **Safari** en `melanicristine.netlify.app/admin` e ingresá.
2. Tocá **Compartir** → **Agregar a inicio**. Queda el ícono **"Panel MC"**: abre directo en el panel, sin barra de Safari.
3. Abrí la app desde ese ícono → en **Inicio** tocá **Activar avisos en este dispositivo** y aceptá. Probá con **Enviar prueba ahora**.
   (Requiere iOS 16.4 o más. En la computadora también se puede activar desde Chrome.)

### El día a día
1. **Una clienta escribe por WhatsApp** → en el panel tocá **+** (Nueva cita):
   buscá la clienta por nombre o teléfono (o creala ahí mismo) → elegí el servicio → la fecha → tocá uno de los **horarios libres**.
   La app ya descuenta las 2 h del servicio y los 20 min de margen; **no deja guardar dos citas que se crucen**.
   ¿Fuera de horario (ej. 19:30 o un domingo)? Tocá **Escribir otra hora** y poné la hora que quieras.
2. **Cuando paga la seña** → abrí la cita → **Registrar seña** (50.000 Gs por defecto). La cita pasa a *Confirmada* y la seña entra como ingreso.
3. **A las 20:00** te llega la notificación con las citas de mañana. En **Inicio → Citas de mañana**, tocá **Enviar recordatorio** en cada una:
   se abre WhatsApp con el mensaje armado; solo tocás *Enviar*. Cuando la clienta responde, **✓ Confirmó asistencia**.
4. **Después de atenderla** → abrí la cita → **Marcar atendida y cobrar**: escribí el **total** que pagó y si el saldo fue en efectivo o transferencia.
   La seña ya cobrada se descuenta sola; se genera el ingreso del saldo (nunca se cuenta doble).
5. Si algo salió mal: **Corregir cobro**, **Deshacer atendida**, **Anular seña**, **Reprogramar**, **Cancelar** o **No asistió**.

### Finanzas
- **Finanzas → Resumen**: elegí el mes. Muestra **Ganancia** (ingresos − gastos), **Guardar para productos** (promedio de compras de
  insumos de los 3 meses anteriores, o un % fijo: se cambia abajo de todo) y **Para tu bolsillo** (ganancia − reserva).
  Además efectivo vs. transferencia, servicios vs. cursos, servicio más vendido y gráficos de 12 meses. **⬇ Exportar mes (CSV)** lo baja para Excel.
- **Ingresos**: se cargan solos. A mano solo lo que no sale de una cita (ej. el pago de un curso).
- **Gastos**: alquiler, luz, publicidad… Las categorías se editan al final de la página.
- **Insumos**: cargá cada producto con su stock mínimo. **Registrar compra** suma stock y crea el gasto solo.
  **Usé / Ajustar** resta. Avisos de **⚠ Reponer** (stock ≤ mínimo) y **◷ Sobra** (60 días sin uso).
  Opcional: en cada insumo, "Descontar solo al atender" indica cuánto gasta cada servicio.

### Reseñas de clientas
En la sección **Resultados** del sitio, las clientas tocan **★ Dejá tu reseña**: estrellas de 1 a 5, comentario y hasta 3 fotos.
**No se publican solas**: aparecen en **Inicio** ("★ N reseñas nuevas") y en **Sitio → Reseñas de clientas**, donde las
**Publicás**, **Rechazás** o después las **Quitás del sitio**. Si un comentario parece mencionar un precio, el panel avisa.
Límites anti-spam: 15 reseñas por hora, 60 pendientes, 30 fotos por hora (bucket `resenas`, 2 MB por foto).

### Certificados
**Más → Certificados** (en la computadora, en la barra lateral). Escribí el nombre de la alumna (o varias, **una por renglón**),
elegí el curso (Pestañas o Cejas: el texto se completa solo), la fecha, y tocá **Imprimir / Guardar PDF**. Sale en A4 apaisado,
solo los certificados, uno por hoja. Para PDF: en la ventana de impresión elegí “Guardar como PDF”. En “Más opciones” se cambia
el subtítulo, el nombre del curso en dorado, la carga horaria, el lugar y lo que va debajo de la firma.
Diseño: el de `certificado_editable.html` (mismo CSS, en `src/app/admin/(panel)/certificados/certificado.css`); el logo se extrajo
a `public/certificado/logo-certificado.png`.

### Fotos del estudio
**Sitio → Fotos del estudio** → *Subir fotos del estudio* (podés elegir varias). La primera sale grande; se reordenan con ‹ ›,
se les puede poner descripción u ocultar. La sección **"El estudio"** aparece sola en el sitio cuando hay al menos 1 foto visible
(y la numeración de secciones se ajusta sola). Al tocar una foto se abre en pantalla completa.

### Sitio web (desde el panel → Sitio)
Servicios (fotos, descripción, beneficios, orden, ocultar), cursos, textos de portada y "sobre mí", testimonios,
preguntas frecuentes, mensajes de WhatsApp y datos del negocio (horario, seña, margen, redes, **link de Google Maps**).
Los cambios se ven en el sitio en segundos. **El sitio nunca muestra precios**; el "valor de referencia" de cada servicio es privado.

### Cambiar la contraseña
Supabase → **SQL Editor** → reemplazar `NUEVA` y ejecutar:
```sql
update auth.users set encrypted_password = extensions.crypt('NUEVA', extensions.gen_salt('bf'))
where email = 'melani@melanicristine.netlify.app';
```
(Supabase solo acepta emails: el login convierte el usuario `melani` en `melani@melanicristine.netlify.app`, que no recibe correos.)

---

## Variables de entorno

| Variable | Tipo | Para qué |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | pública | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | pública | *publishable key* (`sb_publishable_…`); todo lo privado lo protege RLS |
| `NEXT_PUBLIC_SITE_URL` | pública | URL final del sitio |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | pública | clave pública Web Push |
| `VAPID_PRIVATE_KEY` | **secreta** | firma de los avisos push |
| `VAPID_SUBJECT` | pública | contacto VAPID (URL del sitio) |
| `CRON_TOKEN` | **secreta** | autentica las funciones programadas ante Supabase (su hash SHA-256 está en `cron_secreto`) |

No se usa la `service_role` key de Supabase en ningún lado.

## Desplegar desde cero

### Supabase (plan gratuito)
1. Crear proyecto (región São Paulo).
2. **SQL Editor**: ejecutar en orden `supabase/migrations/0001_esquema.sql`, `0002_agenda.sql`, `0003_finanzas.sql`, `0004_avisos.sql`, y después `supabase/seed.sql`.
3. **Authentication → Sign In / Providers**: desactivar **Allow new users to sign up**.
4. **Authentication → Users → Add user → Create new user**: email `melani@melanicristine.netlify.app`, contraseña, *Auto confirm* ✓.
5. **SQL Editor**:
   ```sql
   insert into public.admins (user_id) select id from auth.users where email = 'melani@melanicristine.netlify.app';
   insert into public.cron_secreto (id, hash) values (1, encode(extensions.digest('<CRON_TOKEN>', 'sha256'), 'hex'))
     on conflict (id) do update set hash = excluded.hash;
   ```
6. **Settings → API Keys**: copiar URL y *publishable key*.

### Netlify (plan gratuito, sin Git)
```bash
npm install
npx netlify-cli login
npx netlify-cli sites:create --name melanicristine
npx netlify-cli env:set NEXT_PUBLIC_SUPABASE_URL https://xxxx.supabase.co   # y el resto de la tabla
npx netlify-cli deploy --build --prod
```
**Importante:** los sitios creados por CLI nacen **privados**. En Netlify → Project configuration → General → Visitor access →
*Edit visibility* → Private + **Previews only** (producción pública, previews privadas).

Las funciones programadas se publican solas desde `netlify/functions/`:
- `aviso-diario` — `0 23 * * *` UTC = **20:00 en Asunción** (Paraguay es UTC−3 todo el año): resumen push de las citas de mañana.
- `mantener-activo` — diaria: consulta liviana para que Supabase no pause el proyecto (pausa tras 7 días sin actividad).

## Desarrollo local
```bash
npm install
cp .env.example .env.local
npm run dev        # http://localhost:3000
```
Sin Supabase configurado, la landing usa `supabase/contenido-inicial.json`. Para regenerar el seed: `node scripts/generar-seed.mjs`.

## Fotos
- Recortes del catálogo: cajas en `scripts/recortes.json` (en % de la página) → `node scripts/recortar-catalogo.mjs ../catalogo-paginas`.
  Solo se recortan las fotos, nunca la página entera (tiene precios). Las páginas viven fuera del proyecto.
- Logo: reemplazar `public/logo.png` y `public/icons/*` (hoy son un monograma provisorio).

## Seguridad
- **Sin precios en público**: `servicios` no tiene precio; el valor de referencia vive en `servicio_valores` (solo admin).
- Tablas con montos o datos de clientas: RLS solo-admin **y** sin privilegios para `anon` (responden 401).
- `configuracion`: `anon` solo lee columnas no financieras (GRANT por columna). Única cifra pública: la seña, en la FAQ.
- Anti-choques en la base: exclusion constraint `tstzrange(inicio, fin + margen)`. El horario de atención solo arma los
  "Horarios libres"; con **Escribir otra hora** se puede agendar fuera de horario (`0008_fuera_de_horario.sql`), siempre que
  la cita termine antes de la medianoche y no se cruce con otra.
- Ingresos de cita únicos por `(cita_id, concepto)` → la seña nunca se cuenta dos veces.

## Notas técnicas
- **Sin middleware**: el adaptador de Netlify (5.16.x) falla al empaquetar `proxy.ts` desde Windows. Cada página y Server Action
  del panel verifica la sesión (`requerirAdmin()`) y el navegador renueva el token (`MantenerSesion`). Si el panel queda cerrado
  mucho tiempo puede pedir ingresar de nuevo.
- **Emojis en WhatsApp**: los links llevan 👋/🙏 bien codificados (`%F0%9F%91%8B`). La página intermedia de WhatsApp en
  **computadora** los muestra como "�" (bug de WhatsApp). En el celular `wa.me` abre la app directo y deberían
  llegar bien (verificar en un iPhone real).
- Paleta de gráficos (azul / terracota / violeta) validada para daltonismo; la del sitio mantiene la marca (sin rosado).
