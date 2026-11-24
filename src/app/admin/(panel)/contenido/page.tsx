import Link from "next/link";
import { requerirAdmin } from "@/lib/supabase/servidor";
import Icono, { type NombreIcono } from "@/components/admin/Iconos";
import { tituloPagina } from "@/components/admin/estilos";

const SECCIONES: { href: string; titulo: string; texto: string; icono: NombreIcono }[] = [
  { href: "resenas", titulo: "Reseñas de clientas", texto: "Revisá y publicá lo que escriben las clientas.", icono: "estrella" },
  { href: "servicios", titulo: "Servicios", texto: "Nombre, descripción, fotos y orden.", icono: "tijera" },
  { href: "estudio", titulo: "Fotos del estudio", texto: "Fotos del salón. Se muestran cuando subas la primera.", icono: "caja" },
  { href: "textos", titulo: "Textos y fotos de portada", texto: "Bienvenida, frase principal y “Sobre mí”.", icono: "web" },
  { href: "cursos", titulo: "Cursos", texto: "Qué incluyen, foto y si se muestran.", icono: "agenda" },
  { href: "faq", titulo: "Preguntas frecuentes", texto: "Seña, pagos, cancelaciones, horario.", icono: "ayuda" },
  { href: "mensajes", titulo: "Mensajes de WhatsApp", texto: "Textos de los botones y del recordatorio.", icono: "telefono" },
  { href: "datos", titulo: "Datos del negocio", texto: "WhatsApp, redes, dirección, horario y seña.", icono: "inicio" },
];

export default async function Contenido() {
  await requerirAdmin();
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className={tituloPagina}>Mi página web</h1>
          <p className="mt-1 text-[15px] text-gris">Lo que cambies acá se ve en tu página en unos segundos.</p>
        </div>
        <a href="/" target="_blank" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-salvia bg-white px-5 text-[15px] text-carbon hover:border-carbon">
          <Icono nombre="ojo" className="size-5" /> Ver mi página
        </a>
      </header>
      <ul className="grid gap-3 sm:grid-cols-2">
        {SECCIONES.map((s) => (
          <li key={s.href}>
            <Link
              href={`/admin/contenido/${s.href}`}
              className="group flex h-full items-center gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-salvia/40 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-salvia-claro text-carbon transition-colors group-hover:bg-carbon group-hover:text-hueso">
                <Icono nombre={s.icono} />
              </span>
              <span className="min-w-0">
                <span className="block text-[17px] font-medium text-carbon">{s.titulo}</span>
                <span className="block text-[15px] leading-snug text-gris">{s.texto}</span>
              </span>
              <Icono nombre="flecha" className="ml-auto size-5 shrink-0 text-gris" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
