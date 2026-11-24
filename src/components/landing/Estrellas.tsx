/** Estrellas de solo lectura (accesibles: el lector de pantalla oye "4 de 5 estrellas"). */
export default function Estrellas({ valor, tamano = "size-4" }: { valor: number; tamano?: string }) {
  const redondeado = Math.round(valor * 2) / 2;
  return (
    <span className="inline-flex items-center gap-0.5 text-[#b8862b]" role="img" aria-label={`${valor.toLocaleString("es-PY")} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const lleno = redondeado >= n ? 1 : redondeado >= n - 0.5 ? 0.5 : 0;
        return (
          <svg key={n} viewBox="0 0 24 24" className={tamano} aria-hidden="true">
            <defs>
              <linearGradient id={`e${n}-${lleno}`}>
                <stop offset={`${lleno * 100}%`} stopColor="currentColor" />
                <stop offset={`${lleno * 100}%`} stopColor="#d9d6cf" />
              </linearGradient>
            </defs>
            <path fill={`url(#e${n}-${lleno})`} d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4L2.8 9.5l6.4-.8L12 2.8z" />
          </svg>
        );
      })}
    </span>
  );
}
