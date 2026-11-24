"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseNavegador } from "@/lib/supabase/navegador";
import { btnPrimario, etiqueta, input, tarjeta } from "@/components/admin/estilos";

/**
 * Supabase solo acepta email: el usuario "melani" se guarda internamente como
 * melani@melanicristine.netlify.app (dominio propio del sitio; nunca recibe correos).
 * Si se escribe un email completo, se usa tal cual.
 */
export const DOMINIO_USUARIOS = "melanicristine.netlify.app";
const usuarioAEmail = (u: string) => {
  const limpio = u.trim().toLowerCase();
  return limpio.includes("@") ? limpio : `${limpio}@${DOMINIO_USUARIOS}`;
};

export default function FormularioIngreso({ sinPermiso = false }: { sinPermiso?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(sinPermiso ? "Esta cuenta no tiene acceso al panel." : null);
  const [cargando, setCargando] = useState(false);

  // Si ya hay sesión (o se puede renovar), volver directo al panel.
  useEffect(() => {
    if (sinPermiso) {
      supabaseNavegador().auth.signOut();
      return;
    }
    supabaseNavegador()
      .auth.getSession()
      .then(({ data }) => {
        if (data.session) {
          router.replace("/admin");
          router.refresh();
        }
      });
  }, [router, sinPermiso]);

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setCargando(true);
    setError(null);
    const { error } = await supabaseNavegador().auth.signInWithPassword({
      email: usuarioAEmail(String(fd.get("usuario"))),
      password: String(fd.get("password")),
    });
    if (error) {
      setError(error.message.includes("Invalid") ? "Usuario o contraseña incorrectos." : "No se pudo ingresar. Probá de nuevo.");
      setCargando(false);
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={enviar} className={`${tarjeta} space-y-4`}>
      <div>
        <label htmlFor="usuario" className={etiqueta}>Usuario</label>
        <input id="usuario" name="usuario" type="text" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} required className={input} />
      </div>
      <div>
        <label htmlFor="password" className={etiqueta}>Contraseña</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={input} />
      </div>
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={cargando} className={`${btnPrimario} w-full py-3.5`}>
        {cargando ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
