/* VerbiFox · Service Worker
   Estrategia: RED PRIMERO y SIEMPRE REVALIDANDO con el servidor
   (así se ve al instante lo más nuevo), con respaldo de caché offline. */
const CACHE = 'vfx-v3';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil((async () => {
  // borra cachés viejas para que nadie se quede con la versión anterior
  const keys = await caches.keys();
  await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
  await self.clients.claim();
})()));

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // Supabase/Mercado Pago van directo
  e.respondWith(
    // 'no-cache' obliga a revalidar con el servidor (trae lo nuevo si cambió)
    fetch(req, { cache: 'no-cache' }).then((r) => {
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
