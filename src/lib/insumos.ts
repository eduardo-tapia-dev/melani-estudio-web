export type InsumoEstado = {
  id: string;
  nombre: string;
  unidad: string;
  stock_actual: number;
  stock_minimo: number;
  costo_ultima_compra: number | null;
  activo: boolean;
  ultimo_uso: string | null;
  por_reponer: boolean;
  sobra: boolean;
};

/** 2.5 → "2,5" (sin ceros de más) */
export const cantidad = (n: number) => Number(n).toLocaleString("es-PY", { maximumFractionDigits: 2 });
