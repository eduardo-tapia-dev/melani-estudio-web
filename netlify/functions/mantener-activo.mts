// Función programada: una consulta liviana diaria para que Supabase (plan
// gratuito) no pause el proyecto por 7 días de inactividad.
import type { Config } from "@netlify/functions";

export default async function mantenerActivo() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/ping`, {
    method: "POST",
    headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, "Content-Type": "application/json" },
    body: "{}",
  });
  console.log(`[mantener-activo] ping ${res.status} ${await res.text()}`);
}

// 12:00 UTC todos los días (09:00 en Asunción).
export const config: Config = { schedule: "0 12 * * *" };
