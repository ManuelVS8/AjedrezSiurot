// Service worker de Ajedrez Siurot.
// - La página (HTML), el manifest y este archivo: SIEMPRE se piden primero a la red,
//   así cualquier cambio que subas al repositorio llega a la app sin reinstalarla.
// - Si no hay conexión, se usa la última copia guardada (la app sigue funcionando).
// - Iconos, Stockfish y fuentes: se sirven de la copia guardada y se actualizan en segundo plano.
const CACHE = 'siurot-cache-v2';
const PRE = ['./', './index.html', './manifest.webmanifest', './icon192.png', './icon512.png', './logo.png'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.allSettled(PRE.map(u => c.add(new Request(u, { cache: 'reload' }))));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });

const isFresh = url => /\.(html|webmanifest)$/.test(url.pathname) || url.pathname.endsWith('/sw.js') || url.pathname.endsWith('/');

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (/(ajedrez-admin|sw-admin|manifest-admin)/.test(url.pathname)) return; // la app de admin va por su cuenta
  if (url.origin !== location.origin) {
    // fuentes de Google y similares: caché tras la primera vez
    if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) e.respondWith(swr(req));
    return;
  }
  if (req.mode === 'navigate' || isFresh(url)) e.respondWith(networkFirst(req));
  else e.respondWith(swr(req));
});

async function networkFirst(req) {
  const c = await caches.open(CACHE);
  try {
    const res = await fetch(req, { cache: 'no-cache' });
    if (res && res.ok) c.put(req, res.clone());
    return res;
  } catch (err) {
    const hit = await c.match(req, { ignoreSearch: true }) || await c.match('./index.html') || await c.match('./');
    if (hit) return hit;
    throw err;
  }
}

async function swr(req) {
  const c = await caches.open(CACHE);
  const hit = await c.match(req);
  const net = fetch(req).then(res => { if (res && (res.ok || res.type === 'opaque')) c.put(req, res.clone()); return res; }).catch(() => null);
  return hit || (await net) || Response.error();
}
