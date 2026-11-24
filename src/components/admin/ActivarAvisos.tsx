"use client";

import { useEffect, useState, useTransition } from "react";
import { enviarPrueba, guardarSuscripcion, quitarSuscripcion } from "@/app/admin/acciones-push";
import { btnPrimario, btnSecundario, tarjeta } from "./estilos";

type Estado = "cargando" | "no-soportado" | "ios-instalar" | "bloqueado" | "inactivo" | "activo";

function claveAUint8(base64: string) {
  const relleno = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + relleno).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

async function registro() {
  return (await navigator.serviceWorker.getRegistration("/")) ?? navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
}

/** Tarjeta para activar el aviso diario de las 20:00 en este dispositivo. */
export default function ActivarAvisos() {
  const [estado, setEstado] = useState<Estado>("cargando");
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  useEffect(() => {
    let vivo = true;
    (async () => {
      const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
      const instalada = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
      let e: Estado;
      let ep: string | null = null;
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) e = ios && !instalada ? "ios-instalar" : "no-soportado";
      else if (Notification.permission === "denied") e = "bloqueado";
      else {
        const sub = await (await registro()).pushManager.getSubscription();
        ep = sub?.endpoint ?? null;
        e = sub ? "activo" : "inactivo";
      }
      if (vivo) {
        setEndpoint(ep);
        setEstado(e);
      }
    })().catch(() => vivo && setEstado("no-soportado"));
    return () => {
      vivo = false;
    };
  }, []);

  function activar() {
    setMsg(null);
    iniciar(async () => {
      try {
        const permiso = await Notification.requestPermission();
        if (permiso !== "granted") {
          setEstado(permiso === "denied" ? "bloqueado" : "inactivo");
          return;
        }
        const reg = await registro();
        await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: claveAUint8(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!) });
        const r = await guardarSuscripcion(JSON.parse(JSON.stringify(sub)));
        if (!r.ok) return setMsg(r.error);
        setEndpoint(sub.endpoint);
        setEstado("activo");
        setMsg("Listo: todos los días a las 20:00 te llega el resumen de mañana.");
      } catch (e) {
        setMsg(`No se pudo activar: ${(e as Error).message}`);
      }
    });
  }

  function desactivar() {
    iniciar(async () => {
      const sub = await (await registro()).pushManager.getSubscription();
      if (sub) {
        await quitarSuscripcion(sub.endpoint);
        await sub.unsubscribe();
      }
      setEndpoint(null);
      setEstado("inactivo");
      setMsg("Avisos desactivados en este dispositivo.");
    });
  }

  if (estado === "cargando") return null;

  return (
    <section className={tarjeta} aria-labelledby="t-avisos">
      <h2 id="t-avisos" className="font-medium text-carbon">🔔 Aviso diario de las 20:00</h2>
      {estado === "activo" && (
        <>
          <p className="mt-1 text-sm text-gris">Activado en este dispositivo: cada día a las 20:00 llega el resumen de las citas de mañana.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button disabled={pendiente} onClick={() => endpoint && iniciar(async () => { const r = await enviarPrueba(endpoint); setMsg(r.ok ? "Prueba enviada: debería llegar en unos segundos." : r.error); })} className={btnSecundario}>
              Enviar prueba ahora
            </button>
            <button disabled={pendiente} onClick={desactivar} className="px-3 text-sm text-gris underline underline-offset-4">Desactivar</button>
          </div>
        </>
      )}
      {estado === "inactivo" && (
        <>
          <p className="mt-1 text-sm text-gris">Recibí una notificación cada tarde con las citas del día siguiente. Gratis.</p>
          <button disabled={pendiente} onClick={activar} className={`${btnPrimario} mt-3`}>{pendiente ? "Activando…" : "Activar avisos en este dispositivo"}</button>
        </>
      )}
      {estado === "ios-instalar" && (
        <p className="mt-1 text-sm text-gris">
          En iPhone, primero instalá el panel: en Safari tocá <strong>Compartir</strong> → <strong>Agregar a inicio</strong>, abrilo desde el ícono y volvé a esta pantalla (requiere iOS 16.4 o más).
        </p>
      )}
      {estado === "bloqueado" && <p className="mt-1 text-sm text-gris">Las notificaciones están bloqueadas para este sitio. Habilitalas en los ajustes del navegador y recargá.</p>}
      {estado === "no-soportado" && <p className="mt-1 text-sm text-gris">Este navegador no permite notificaciones.</p>}
      {msg && <p className="mt-2 text-sm text-carbon">{msg}</p>}
    </section>
  );
}
