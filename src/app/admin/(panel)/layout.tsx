import type { Metadata } from "next";
import { Suspense } from "react";
import NavPanel from "@/components/admin/NavPanel";
import MantenerSesion from "@/components/admin/MantenerSesion";

// Manifest propio: instalado desde el panel, el ícono abre directo en /admin.
export const metadata: Metadata = {
  title: "Panel · Melani Cristine",
  robots: { index: false, follow: false },
  manifest: "/panel.webmanifest",
  appleWebApp: { capable: true, title: "Panel MC", statusBarStyle: "default" },
};

// El panel siempre depende de la sesión: se renderiza en el servidor en cada visita.
export const instant = false;

export default function LayoutPanel({ children }: LayoutProps<"/admin">) {
  return (
    <div
      className="min-h-dvh text-[16px] lg:flex"
      style={{ background: "radial-gradient(60rem 40rem at 100% 0%, rgb(230 232 227 / 0.9), transparent 60%), #f5f3ef" }}
    >
      <NavPanel />
      <MantenerSesion />
      <main className="min-w-0 flex-1 px-4 pb-36 pt-[calc(1.5rem+env(safe-area-inset-top))] sm:px-6 lg:px-12 lg:pb-14 lg:pt-10">
        <div className="mx-auto max-w-5xl">
          <Suspense fallback={<Cargando />}>{children}</Suspense>
        </div>
      </main>
    </div>
  );
}

function Cargando() {
  return (
    <div className="space-y-5" aria-live="polite">
      <p className="flex items-center gap-3 text-[15px] text-gris">
        <span className="size-4 animate-spin rounded-full border-2 border-salvia border-t-taupe-oscuro" aria-hidden="true" />
        Cargando…
      </p>
      <div className="h-10 w-56 animate-pulse rounded-xl bg-salvia/40" />
      <div className="h-36 animate-pulse rounded-3xl bg-white/80" />
      <div className="h-36 animate-pulse rounded-3xl bg-white/80" />
    </div>
  );
}
