import Link from "next/link";
import { requerirAdmin } from "@/lib/supabase/servidor";
import { formatoGs } from "@/lib/formato";
import { fechaCorta, fechaLocal } from "@/lib/tiempo";
import { tarjeta, tituloPagina, input, btnSecundario } from "@/components/admin/estilos";
import NuevaClienta from "./NuevaClienta";

type Fila = { id: string; nombre: string; telefono: string; total_gastado: number; citas_atendidas: number; ultima_visita: string | null };

export default async function Clientas({ searchParams }: PageProps<"/admin/clientas">) {
  const { sb } = await requerirAdmin();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";

  let consulta = sb.from("clientas_resumen").select("id, nombre, telefono, total_gastado, citas_atendidas, ultima_visita").order("nombre").limit(200);
  if (q) {
    const dig = q.replace(/\D/g, "").replace(/^0/, "");
    consulta = dig.length >= 3 ? consulta.like("telefono", `%${dig}%`) : consulta.ilike("nombre", `%${q}%`);
  }
  const { data } = await consulta;
  const clientas = (data ?? []) as Fila[];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className={tituloPagina}>Clientas</h1>
        <NuevaClienta />
      </header>

      <form action="/admin/clientas" className="flex gap-2" role="search">
        <input name="q" defaultValue={q} placeholder="Buscar por nombre o teléfono…" className={input} aria-label="Buscar clienta" />
        <button className={btnSecundario}>Buscar</button>
      </form>

      {clientas.length === 0 ? (
        <p className={`${tarjeta} text-gris`}>{q ? "No se encontraron clientas." : "Todavía no hay clientas cargadas."}</p>
      ) : (
        <ul className="divide-y divide-salvia/50 overflow-hidden rounded-2xl bg-white ring-1 ring-salvia/50">
          {clientas.map((c) => (
            <li key={c.id}>
              <Link href={`/admin/clientas/${c.id}`} className="flex items-center justify-between gap-4 px-4 py-3.5 hover:bg-salvia-claro/50">
                <div className="min-w-0">
                  <p className="truncate font-medium text-carbon">{c.nombre}</p>
                  <p className="text-sm text-gris">0{c.telefono.slice(3)}</p>
                </div>
                <div className="shrink-0 text-right text-sm">
                  <p className="text-carbon">{formatoGs(c.total_gastado)}</p>
                  <p className="text-xs text-gris">
                    {c.citas_atendidas} visita{c.citas_atendidas === 1 ? "" : "s"}
                    {c.ultima_visita ? ` · última ${fechaCorta(fechaLocal(c.ultima_visita))}` : ""}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
