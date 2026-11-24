// Función programada (Netlify, gratis): todos los días a las 20:00 de Asunción
// (23:00 UTC; Paraguay usa UTC−3 todo el año) envía por Web Push el resumen de
// las citas de mañana a los dispositivos suscriptos.
// Se autentica en Supabase con CRON_TOKEN (no usa la service_role key).
import type { Config } from "@netlify/functions";
import webpush from "web-push";
import { armarAviso, type CitaAviso } from "../../src/lib/aviso";

type Datos = {
  fecha: string;
  citas: CitaAviso[];
  suscripciones: { endpoint: string; p256dh: string; auth: string }[];
};

async function rpc<T>(nombre: string, cuerpo: Record<string, unknown>): Promise<T> {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/${nombre}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  });
  if (!res.ok) throw new Error(`${nombre}: HTTP ${res.status} ${await res.text()}`);
  const texto = await res.text();
  return (texto ? JSON.parse(texto) : null) as T;
}

export default async function avisoDiario() {
  const token = process.env.CRON_TOKEN;
  if (!token || !process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    console.error("[aviso-diario] faltan variables de entorno");
    return;
  }
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "https://melanicristine.netlify.app", process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);

  const datos = await rpc<Datos>("aviso_diario", { p_token: token });
  if (datos.suscripciones.length === 0) {
    console.log("[aviso-diario] sin dispositivos suscriptos");
    return;
  }
  const aviso = armarAviso(datos.fecha, datos.citas);
  let enviados = 0;
  for (const s of datos.suscripciones) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(aviso), { TTL: 6 * 3600 });
      enviados++;
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) await rpc("quitar_suscripcion", { p_token: token, p_endpoint: s.endpoint });
      console.error(`[aviso-diario] fallo (${status ?? "?"})`);
    }
  }
  console.log(`[aviso-diario] ${datos.citas.length} citas mañana, ${enviados}/${datos.suscripciones.length} avisos enviados`);
}

export const config: Config = { schedule: "0 23 * * *" };
