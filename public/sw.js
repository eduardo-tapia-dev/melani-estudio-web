/* Service worker de Estudio Melani Cristine.
   - Páginas: red primero, con copia offline de respaldo (nunca cachea /admin ni /api).
   - Estáticos (/_next/static, íconos, fotos): caché primero.
   - Push: se completa en la fase 4 (notificación diaria de citas de mañana). */
const VERSION = "v1";
const CACHE_PAGINAS = `paginas-${VERSION}`;
const CACHE_ESTATICOS = `estaticos-${VERSION}`;

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_PAGINAS).then((c) => c.add("/")).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.endsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/api") || url.pathname.startsWith("/auth")) return;

  const esEstatico =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/fotos/") ||
    url.pathname.startsWith("/_next/image");

  if (esEstatico) {
    e.respondWith(
      caches.open(CACHE_ESTATICOS).then(async (c) => {
        const hit = await c.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) c.put(req, res.clone());
        return res;
      })
    );
    return;
  }

  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copia = res.clone();
          caches.open(CACHE_PAGINAS).then((c) => c.put(req, copia));
          return res;
        })
        .catch(async () => (await caches.match(req)) || (await caches.match("/")))
    );
  }
});

self.addEventListener("push", (e) => {
  let data = { title: "Estudio Melani Cristine", body: "" };
  try {
    data = { ...data, ...e.data.json() };
  } catch {}
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: data.url || "/admin" },
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const destino = (e.notification.data && e.notification.data.url) || "/admin";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((cs) => {
      for (const c of cs) if ("focus" in c) { c.navigate(destino); return c.focus(); }
      return self.clients.openWindow(destino);
    })
  );
});
