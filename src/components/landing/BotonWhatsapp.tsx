import { IconoWhatsapp } from "./Iconos";

type Props = {
  href: string;
  children: React.ReactNode;
  variante?: "solido" | "oscuro" | "contorno" | "claro" | "contornoClaro";
  tamano?: "md" | "lg";
  icono?: React.ReactNode;
  className?: string;
};

const VARIANTES = {
  solido: "bg-taupe-oscuro text-hueso hover:bg-carbon hover:shadow-taupe-oscuro/25",
  oscuro: "bg-carbon text-hueso hover:bg-taupe-oscuro hover:shadow-taupe-oscuro/30",
  contorno: "border border-taupe-oscuro text-taupe-oscuro hover:bg-taupe-oscuro hover:text-hueso",
  claro: "bg-hueso text-carbon hover:bg-white hover:shadow-black/20",
  contornoClaro: "border border-hueso/35 text-hueso hover:border-hueso hover:bg-hueso/10",
};

export default function BotonWhatsapp({ href, children, variante = "solido", tamano = "md", icono, className = "" }: Props) {
  const t = tamano === "lg" ? "px-7 py-4 text-base" : "px-5 py-3 text-sm";
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-wide transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taupe-oscuro ${VARIANTES[variante]} ${t} ${className}`}
    >
      {icono ?? <IconoWhatsapp />}
      {children}
    </a>
  );
}
