import type { Metadata } from "next";
import { Great_Vibes } from "next/font/google";
import { requerirAdmin } from "@/lib/supabase/servidor";
import { hoy } from "@/lib/tiempo";
import { tituloPagina } from "@/components/admin/estilos";
import EditorCertificados from "./EditorCertificados";

const greatVibes = Great_Vibes({ subsets: ["latin"], weight: "400", variable: "--font-great-vibes" });

export const metadata: Metadata = { title: "Certificados · Panel" };

export default async function Certificados() {
  await requerirAdmin();
  return (
    <div className={`space-y-6 ${greatVibes.variable}`}>
      <header>
        <h1 className={tituloPagina}>Certificados</h1>
        <p className="mt-1 text-[15px] text-gris">Escribí el nombre de la alumna, elegí el curso y tocá “Imprimir / Guardar PDF”.</p>
      </header>
      <EditorCertificados hoy={hoy()} fuente={greatVibes.variable} />
    </div>
  );
}
