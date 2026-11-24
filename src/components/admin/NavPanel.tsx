"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cerrarSesion } from "@/app/admin/acciones-agenda";
import Icono, { type NombreIcono } from "./Iconos";

type Item = { href: string; texto: string; icono: NombreIcono; detalle: string };

const PRINCIPALES: Item[] = [
  { href: "/admin", texto: "Inicio", icono: "inicio", detalle: "Tu día de un vistazo" },
  { href: "/admin/agenda", texto: "Agenda", icono: "agenda", detalle: "Citas por día y semana" },
  { href: "/admin/clientas", texto: "Clientas", icono: "clientas", detalle: "Datos e historial" },
  { href: "/admin/finanzas", texto: "Dinero", icono: "dinero", detalle: "Lo que entra y sale" },
  { href: "/admin/contenido", texto: "Mi página web", icono: "web", detalle: "Fotos, textos y reseñas" },
  { href: "/admin/certificados", texto: "Certificados", icono: "diploma", detalle: "Para las alumnas de los cursos" },
];

function useSalir() {
  const router = useRouter();
  return async () => {
    await cerrarSesion();
    router.replace("/admin/ingresar");
    router.refresh();
  };
}

export default function NavPanel() {
  const ruta = usePathname();
  const salir = useSalir();
  const [mas, setMas] = useState(false);
  const activo = (href: string) => (href === "/admin" ? ruta === "/admin" : ruta.startsWith(href));

  return (
    <>
      {/* ---------- Computadora: barra lateral ---------- */}
      <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 flex-col border-r border-salvia/40 bg-hueso/80 px-5 py-7 backdrop-blur lg:flex">
        <Link href="/admin" className="mb-9 flex items-center gap-3 px-2">
          <Image src="/logo.png" alt="" width={44} height={44} className="size-11 rounded-full ring-1 ring-salvia/50" />
          <span className="leading-tight">
            <span className="block font-serif text-xl tracking-[0.12em] text-carbon">MELANI</span>
            <span className="block text-[0.65rem] tracking-[0.3em] text-taupe-oscuro">MI PANEL</span>
          </span>
        </Link>

        <Link
          href="/admin/agenda/nueva"
          className="mb-7 flex items-center justify-center gap-2 rounded-full bg-carbon px-4 py-3.5 text-[15px] font-medium text-hueso shadow-md shadow-carbon/15 transition-all hover:-translate-y-0.5 hover:bg-taupe-oscuro"
        >
          <Icono nombre="mas2" className="size-5" /> Agendar una cita
        </Link>

        <nav className="flex flex-1 flex-col gap-1.5" aria-label="Panel">
          {PRINCIPALES.map((i) => {
            const on = activo(i.href);
            return (
              <Link
                key={i.href}
                href={i.href}
                aria-current={on ? "page" : undefined}
                className={`group flex items-center gap-3.5 rounded-2xl px-3 py-2.5 transition-colors ${on ? "bg-white shadow-sm ring-1 ring-salvia/50" : "hover:bg-white/60"}`}
              >
                <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors ${on ? "bg-carbon text-hueso" : "bg-salvia-claro text-carbon group-hover:bg-salvia/50"}`}>
                  <Icono nombre={i.icono} className="size-5" />
                </span>
                <span className="leading-tight">
                  <span className="block text-[15px] font-medium text-carbon">{i.texto}</span>
                  <span className="block text-xs text-gris">{i.detalle}</span>
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-salvia/40 pt-4 text-[15px]">
          <a href="/" target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-gris hover:bg-white/60 hover:text-carbon">
            <Icono nombre="ojo" className="size-5" /> Ver mi página
          </a>
          <button onClick={salir} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-gris hover:bg-white/60 hover:text-carbon">
            <Icono nombre="salir" className="size-5" /> Salir
          </button>
        </div>
      </aside>

      {/* ---------- Celular: barra inferior ---------- */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-salvia/50 bg-hueso/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_-15px_rgb(43_43_43/0.2)] backdrop-blur-xl lg:hidden"
        aria-label="Panel"
      >
        <div className="mx-auto grid max-w-md grid-cols-5 items-end">
          {PRINCIPALES.slice(0, 2).map((i) => (
            <Pestana key={i.href} item={i} on={activo(i.href)} />
          ))}
          <Link href="/admin/agenda/nueva" className="flex flex-col items-center gap-1 pb-2" aria-label="Agendar una cita">
            <span className="-mt-6 flex size-[3.75rem] items-center justify-center rounded-full bg-carbon text-hueso shadow-lg shadow-carbon/25 ring-4 ring-hueso transition-transform active:scale-95">
              <Icono nombre="mas2" className="size-7" />
            </span>
            <span className="text-[12px] font-medium text-carbon">Agendar</span>
          </Link>
          <Pestana item={PRINCIPALES[2]} on={activo(PRINCIPALES[2].href)} />
          <button
            onClick={() => setMas(true)}
            className={`flex flex-col items-center gap-1 pb-2 pt-2.5 ${mas || PRINCIPALES.slice(3).some((i) => activo(i.href)) ? "text-carbon" : "text-gris"}`}
            aria-expanded={mas}
            aria-haspopup="dialog"
          >
            <span className="flex size-8 items-center justify-center">
              <Icono nombre="mas" className="size-7" />
            </span>
            <span className="text-[12px] font-medium">Más</span>
          </button>
        </div>
      </nav>

      {/* Hoja "Más" */}
      {mas && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Más opciones">
          <button className="absolute inset-0 bg-carbon/40 backdrop-blur-[2px]" onClick={() => setMas(false)} aria-label="Cerrar" />
          <div className="entrada absolute inset-x-0 bottom-0 rounded-t-[2rem] bg-hueso px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3 shadow-2xl">
            <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-salvia" aria-hidden="true" />
            <div className="grid gap-2">
              {PRINCIPALES.slice(3).map((i) => (
                <Link key={i.href} href={i.href} onClick={() => setMas(false)} className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-salvia/40">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-salvia-claro text-carbon">
                    <Icono nombre={i.icono} />
                  </span>
                  <span>
                    <span className="block text-[17px] font-medium text-carbon">{i.texto}</span>
                    <span className="block text-sm text-gris">{i.detalle}</span>
                  </span>
                  <Icono nombre="flecha" className="ml-auto size-5 text-gris" />
                </Link>
              ))}
              <a href="/" target="_blank" className="flex items-center gap-4 rounded-2xl p-4 text-[17px] text-carbon">
                <Icono nombre="ojo" className="size-6 text-gris" /> Ver mi página
              </a>
              <button onClick={salir} className="flex items-center gap-4 rounded-2xl p-4 text-left text-[17px] text-carbon">
                <Icono nombre="salir" className="size-6 text-gris" /> Salir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Pestana({ item, on }: { item: Item; on: boolean }) {
  return (
    <Link href={item.href} aria-current={on ? "page" : undefined} className={`flex flex-col items-center gap-1 pb-2 pt-2.5 ${on ? "text-carbon" : "text-gris"}`}>
      <span className={`flex h-8 w-14 items-center justify-center rounded-full transition-colors ${on ? "bg-salvia-claro" : ""}`}>
        <Icono nombre={item.icono} className="size-6" />
      </span>
      <span className="text-[12px] font-medium">{item.texto}</span>
    </Link>
  );
}

export function BotonSalirMovil() {
  return null;
}
