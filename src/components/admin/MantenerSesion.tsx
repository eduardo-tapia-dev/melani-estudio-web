"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseNavegador } from "@/lib/supabase/navegador";

/**
 * Mantiene la sesión fresca mientras el panel está abierto: el cliente del
 * navegador renueva el token antes de que venza y lo guarda en las cookies
 * (reemplaza al middleware, que Netlify no empaqueta bien en este proyecto).
 */
export default function MantenerSesion() {
  const router = useRouter();
  useEffect(() => {
    const sb = supabaseNavegador();
    const { data } = sb.auth.onAuthStateChange((evento) => {
      if (evento === "SIGNED_OUT") {
        router.replace("/admin/ingresar");
        router.refresh();
      }
    });
    return () => data.subscription.unsubscribe();
  }, [router]);
  return null;
}
