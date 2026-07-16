/* VerbiFox · Service Worker
   Estrategia: RED PRIMERO (siempre lo más nuevo cuando hay internet),
   con respaldo de caché para funcionar sin conexión. */
const CACHE = 'vfx-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // Supabase/Mercado Pago van directo
  e.respondWith(
    fetch(req).then((r) => {
      if (r && r.ok) {
        const copia = r.clone();
        caches.open(CACHE).then((k) => k.put(req, copia)).catch(() => {});
      }
      return r;
    }).catch(() =>
      caches.match(req).then((m) => m || caches.match('/inicio.html'))
    )
  );
});
