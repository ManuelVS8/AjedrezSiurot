// Service worker de la app de administración: red primero, copia guardada si no hay conexión.
const CACHE='siurot-admin-v1';
self.addEventListener('install',e=>{self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{for(const k of await caches.keys())if(k.startsWith('siurot-admin-')&&k!==CACHE)await caches.delete(k);await self.clients.claim();})());});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);if(u.origin!==location.origin)return;
 e.respondWith((async()=>{try{const n=await fetch(r);if(n.ok){const c=await caches.open(CACHE);c.put(r,n.clone());}return n;}catch(x){const c=await caches.match(r);if(c)return c;throw x;}})());});
