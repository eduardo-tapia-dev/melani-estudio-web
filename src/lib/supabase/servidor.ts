import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";

/** Cliente Supabase con la sesión de la usuaria (respeta RLS). Solo en servidor. */
export async function supabaseServidor() {
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (lista) => {
        try {
          lista.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // En Server Components no se pueden escribir cookies; el proxy refresca la sesión.
        }
      },
    },
  });
}

/**
 * Capa de acceso: exige sesión de administradora. Se llama en cada página y
 * en cada Server Action del panel (no se confía en el cliente).
 */
export async function requerirAdmin() {
  const sb = await supabaseServidor();
  const { data } = await sb.auth.getClaims();
  if (!data?.claims?.sub) redirect("/admin/ingresar");
  const { data: esAdmin } = await sb.rpc("es_admin");
  if (!esAdmin) redirect("/admin/ingresar?error=sin-permiso");
  return { sb, userId: data.claims.sub as string, email: (data.claims.email as string | undefined) ?? "" };
}
