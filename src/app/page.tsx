import Navegacion from "@/components/landing/Navegacion";
import { IconoWhatsapp } from "@/components/landing/Iconos";
import { Cursos, Estudio, Hero, Marquesina, Pie, PreguntasFrecuentes, Reservar, SobreMi, Servicios, Testimonios, Ubicacion } from "@/components/landing/Secciones";
import Animaciones from "@/components/landing/Animaciones";
import { formatoGs } from "@/lib/formato";
import { getSitio } from "@/lib/sitio";
import { linkWhatsapp, rellenar } from "@/lib/whatsapp";

export default async function Inicio() {
  const { config, contenido, categorias, cursos, resenas, estudio, faq, plantillas } = await getSitio();
  const wa = (texto?: string) => linkWhatsapp(config.whatsapp, texto);

  const linkAgendar = wa(plantillas.agendar_general);
  const linkServicio = (servicio: string) => wa(rellenar(plantillas.agendar ?? "", { servicio }));
  const linkCurso = (curso: string) => wa(rellenar(plantillas.curso ?? "", { curso }));
  const linkCursosGeneral = wa(rellenar(plantillas.curso ?? "", { curso: "curso de pestañas o de cejas" }));

  const varsFaq = {
    sena: formatoGs(config.sena_monto),
    medios_pago: config.medios_pago_texto,
    horario: config.horario_texto.charAt(0).toLowerCase() + config.horario_texto.slice(1),
    direccion: config.direccion,
  };
  const faqRellena = faq.map((f) => ({ pregunta: f.pregunta, respuesta: rellenar(f.respuesta, varsFaq) }));

  return (
    <>
      <Animaciones />
      <Navegacion linkReservar={linkAgendar} />
      <main>
        <Hero contenido={contenido} linkReservar={linkAgendar} resenas={resenas} />
        <Marquesina nombres={categorias.flatMap((c) => c.servicios.map((s) => s.nombre.replace(/\s*\(.*\)$/, "")))} />
        <Servicios categorias={categorias} intro={contenido.servicios_intro} consulta={contenido.consulta_valores ?? ""} linkServicio={linkServicio} />
        <Cursos cursos={cursos} intro={contenido.cursos_intro} linkCurso={linkCurso} />
        <SobreMi contenido={contenido} />
        <Estudio fotos={estudio} contenido={contenido} />
        <Testimonios
          resenas={resenas}
          servicios={categorias.flatMap((c) => c.servicios).filter((s) => s.id).map((s) => ({ id: s.id!, nombre: s.nombre }))}
        />
        <PreguntasFrecuentes faq={faqRellena} />
        <Ubicacion config={config} />
        <Reservar
          config={config}
          contenido={contenido}
          links={{ agendar: linkAgendar, ubicacion: wa(plantillas.ubicacion), cursos: linkCursosGeneral }}
        />
      </main>
      <Pie config={config} linkReservar={linkAgendar} />

      {/* Botón flotante de WhatsApp (móvil). Va más arriba para no taparse con el sello "Powered by Netlify" del plan gratis. */}
      <a
        href={linkAgendar}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Reservar por WhatsApp"
        className="latiendo fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-5 z-40 flex size-14 items-center justify-center rounded-full bg-carbon text-hueso shadow-lg shadow-carbon/25 transition-transform active:scale-95 lg:hidden"
      >
        <IconoWhatsapp className="size-7" />
      </a>
    </>
  );
}
