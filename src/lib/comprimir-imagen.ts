"use client";

/** Reduce a ≤max px y convierte a WebP (o JPEG si el navegador no sabe WebP). */
export async function comprimirImagen(archivo: File, max = 1600): Promise<Blob> {
  const bitmap = await createImageBitmap(archivo).catch(() => null);
  const img: CanvasImageSource & { width: number; height: number } =
    bitmap ??
    (await new Promise<HTMLImageElement>((ok, mal) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = mal;
      i.src = URL.createObjectURL(archivo);
    }));
  const escala = Math.min(1, max / Math.max(img.width, img.height));
  const w = Math.round(img.width * escala);
  const h = Math.round(img.height * escala);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
  const a = (tipo: string) => new Promise<Blob | null>((ok) => canvas.toBlob(ok, tipo, 0.82));
  const webp = await a("image/webp");
  if (webp && webp.type === "image/webp") return webp;
  return (await a("image/jpeg"))!;
}
