// ==========================================
// SERVICE WORKER BÁSICO - AGROBOUNTY
// ==========================================
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Permite que las peticiones vayan directo a la red (Supabase, imágenes, etc.)
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});