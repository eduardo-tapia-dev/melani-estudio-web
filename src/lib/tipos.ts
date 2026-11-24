// Tipos del sitio PÚBLICO. A propósito no existe ningún campo de precio o monto,
// salvo la seña (que la FAQ informa explícitamente).

export type ConfigPublica = {
  nombre_negocio: string;
  whatsapp: string;
  instagram_url: string;
  tiktok_url: string;
  direccion: string;
  ciudad: string;
  google_maps_url: string | null;
  ubicacion_lat: number | null;
  ubicacion_lng: number | null;
  horario_texto: string;
  sena_monto: number;
  medios_pago_texto: string;
};

export type Foto = { url: string; alt: string };

export type ServicioPublico = {
  id?: string;
  slug: string;
  nombre: string;
  descripcion: string;
  beneficios: string[];
  duracion_resultado: string | null;
  fotos: Foto[];
};

export type CategoriaPublica = { slug: string; nombre: string; servicios: ServicioPublico[] };

export type CursoPublico = {
  slug: string;
  nombre: string;
  descripcion: string;
  incluye: string[];
  no_incluye: string[];
  modalidad: string;
  foto_url: string | null;
};

export type Testimonio = { id: string; tipo: "trabajo" | "mensaje"; foto_url: string; texto: string | null; autora: string | null };

export type Faq = { pregunta: string; respuesta: string };

export type Resena = { id: string; nombre: string; estrellas: number; comentario: string; servicio: string | null; fotos: string[] };
export type FotoEstudio = { url: string; descripcion: string | null };
export type ResumenResenas ={ promedio: number; total: number; lista: Resena[] };

export type Sitio = {
  config: ConfigPublica;
  contenido: Record<string, string>;
  categorias: CategoriaPublica[];
  cursos: CursoPublico[];
  testimonios: Testimonio[];
  resenas: ResumenResenas;
  estudio: FotoEstudio[];
  faq: Faq[];
  plantillas: Record<string, string>;
  origen: "supabase" | "local";
};
