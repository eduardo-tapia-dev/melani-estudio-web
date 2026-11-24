"use server";

import webpush from "web-push";
import { requerirAdmin } from "@/lib/supabase/servidor";
import { armarAviso, type CitaAviso } from "@/lib/aviso";
import { fechaLocal, hoy, horaLocal, rangoDias, sumarDias } from "@/lib/tiempo";
import { citasEntre, nombreItem } from "@/lib/admin-datos";
import type { Resultado } from "./acciones-agenda";

type Suscripcion = { endpoint: string; keys: { p256dh: string; auth: string } };

export async function guardarSuscripcion(sub: Suscripcion): Promise<Resultado> {
  const { sb, userId } = await requerirAdmin();
  if (!sub?.endpoint?.startsWith("https://") || !sub.keys?.p256dh || !sub.keys?.auth) return { ok: false, error: "Suscripción inválida." };
  const { error } = await sb
    .from("push_subscriptions")
    .upsert({ user_id: userId, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth }, { onConflict: "endpoint" });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function quitarSuscripcion(endpoint: string): Promise<Resultado> {
  const { sb } = await requerirAdmin();
  const { error } = await sb.from("push_subscriptions").delete().eq("endpoint", endpoint);
  return error ? { ok: false, error: error.message } : { ok: true };
}

/** Envía YA el aviso de mañana a este dispositivo (para probar). */
export async function enviarPrueba(endpoint: string): Promise<Resultado> {
  const { sb } = await requerirAdmin();
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return { ok: false, error: "Faltan las claves VAPID en el servidor." };
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "https://melanicristine.netlify.app", pub, priv);

  const { data: sub } = await sb.from("push_subscriptions").select("endpoint, p256dh, auth").eq("endpoint", endpoint).maybeSingle();
  if (!sub) return { ok: false, error: "Este dispositivo no está suscripto." };

  const manana = sumarDias(hoy(), 1);
  const r = rangoDias(manana);
  const citas = (await citasEntre(sb, r.desde, r.hasta, true)).filter((c) => c.estado !== "atendida" && fechaLocal(c.inicio) === manana);
  const aviso = armarAviso(
    manana,
    citas.map<CitaAviso>((c) => ({
      hora: horaLocal(c.inicio),
      clienta: c.clienta?.nombre.split(" ")[0] ?? "",
      servicio: nombreItem(c),
      sena: c.sena_pagada,
      recordatorio: c.recordatorio_enviado,
    })),
  );
  try {
    await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, JSON.stringify({ ...aviso, title: `Prueba · ${aviso.title}` }), { TTL: 3600 });
    return { ok: true };
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) {
      await sb.from("push_subscriptions").delete().eq("endpoint", endpoint);
      return { ok: false, error: "La suscripción venció. Volvé a activar los avisos." };
    }
    return { ok: false, error: `No se pudo enviar (${status ?? "error"}).` };
  }
}
