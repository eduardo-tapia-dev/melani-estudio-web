// Íconos del panel (trazo fino, coherentes con el sitio).
const RUTAS = {
  inicio: "M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-8.5Z",
  agenda: "M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v12a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-12ZM4 10h16M8.5 3v4M15.5 3v4",
  clientas: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7.5 9a7.5 7.5 0 0 1 15 0",
  dinero: "M3 7h18v10H3zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 7v10M18 7v10",
  web: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3c2.5 2.4 3.8 5.4 3.8 9s-1.3 6.6-3.8 9c-2.5-2.4-3.8-5.4-3.8-9S9.5 5.4 12 3Z",
  mas: "M5 12h.01M12 12h.01M19 12h.01",
  mas2: "M12 5v14M5 12h14",
  check: "m5 12.5 4.5 4.5L19 7.5",
  reloj: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v4.5l3 2",
  campana: "M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Zm4 4h4",
  estrella: "M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 16.9l-5.3 2.8 1.1-5.9L3.5 9.7l5.9-.8L12 3.5Z",
  salir: "M15 4h3a1.5 1.5 0 0 1 1.5 1.5v13A1.5 1.5 0 0 1 18 20h-3M10 16l4-4-4-4M14 12H4",
  flecha: "m9 6 6 6-6 6",
  atras: "m15 6-6 6 6 6",
  telefono: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z",
  tijera: "M6 7a2 2 0 1 0 0-.01M6 17a2 2 0 1 0 0-.01M8 8l12 9M8 16l12-9",
  ojo: "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Zm9.5 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  ayuda: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-2.5-11.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5V14m0 3h.01",
  caja: "M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9ZM3 7.5 12 12l9-4.5M12 12v9",
  diploma: "M4 5h16v11H4zM8 9h8M8 12h5M15.5 14.5a2 2 0 1 0 0-.01M14.5 16.2 14 21l1.5-1 1.5 1-.5-4.8",
} as const;

export type NombreIcono = keyof typeof RUTAS;

export default function Icono({ nombre, className = "size-6" }: { nombre: NombreIcono; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={RUTAS[nombre]} />
    </svg>
  );
}
