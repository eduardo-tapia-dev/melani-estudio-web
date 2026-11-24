/* eslint-disable @next/next/no-img-element -- en impresión conviene la imagen tal cual, sin optimizar */
export type DatosCertificado = {
  nombre: string;
  subtitulo: string;
  texto: string;
  curso: string;
  detalles: string;
  firma: string;
};

/** Un certificado (A4 apaisado). Mismo diseño y medidas que el HTML original. */
export default function Certificado({ d }: { d: DatosCertificado }) {
  return (
    <div className="cert-page">
      <div className="cert-frame-outer" />
      <div className="cert-frame-inner" />
      <div className="cert-corner tl" />
      <div className="cert-corner tr" />
      <div className="cert-corner bl" />
      <div className="cert-corner br" />
      <div className="cert-content">
        <img className="cert-logo" src="/certificado/logo-certificado.png" alt="Melani Cristine · Lashes & Brows" />
        <div className="cert-title">Certificado</div>
        <div className="cert-divider" />
        <div className="cert-subtitle">{d.subtitulo}</div>
        <div className="cert-otorgado">Se otorga el presente a</div>
        <div className="cert-nombre">{d.nombre || "Nombre Apellido"}</div>
        <div className="cert-line-under-name" />
        <div className="cert-body-text">{d.texto}</div>
        <div className="cert-course-name">{d.curso}</div>
        <div className="cert-details">{d.detalles}</div>
        <div className="cert-firma-area">
          <div className="cert-firma-line" />
          <div className="cert-firma-label">{d.firma}</div>
        </div>
      </div>
    </div>
  );
}
