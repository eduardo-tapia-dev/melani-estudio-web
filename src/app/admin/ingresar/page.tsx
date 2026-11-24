import type { Metadata } from "next";
import { Suspense } from "react";
import FormularioIngreso from "./FormularioIngreso";

export const metadata: Metadata = {
  title: "Ingresar · Panel",
  robots: { index: false, follow: false },
  manifest: "/panel.webmanifest",
  appleWebApp: { capable: true, title: "Panel MC", statusBarStyle: "default" },
};

export default function Ingresar({ searchParams }: PageProps<"/admin/ingresar">) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-salvia-claro px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-serif text-3xl tracking-[0.15em] text-carbon">MELANI CRISTINE</p>
          <p className="mt-1 text-xs tracking-[0.35em] text-taupe-oscuro">PANEL PRIVADO</p>
        </div>
        <Suspense fallback={<FormularioIngreso />}>
          {searchParams.then((sp) => (
            <FormularioIngreso sinPermiso={sp.error === "sin-permiso"} />
          ))}
        </Suspense>
      </div>
    </main>
  );
}
