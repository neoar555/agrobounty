// ==========================================
// SERVICE WORKER CON CACHÉ BÁSICO - AGROBOUNTY
// ==========================================
const CACHE_NAME = 'agrobounty-cache-v2';
const ASSETS_TO_CACHE = [
    './index.html',
    './dashboard.html',
    './publicar.html',
    './cuenta.html',
    './detalle.html',
    './nosotros.html',
    './css/style.css',
    './js/main.js',
    './js/dashboard.js',
    './js/publicar.js',
    './js/detalle.js',
    './js/auth.js',
    './assets/icon.jpg'
];

// 1. Instalación: Guardar archivos estáticos en caché
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// 2. Activación: Limpiar cachés antiguas si actualizas la app
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// 3. Interceptar peticiones: Priorizar red para Supabase, y usar caché para los archivos de la app
self.addEventListener('fetch', (event) => {
    // Si la petición es hacia Supabase o APIs externas, dejamos que viaje normal por la red
    if (event.request.url.includes('supabase.co') || event.request.url.includes('openstreetmap.org')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Si hay internet, actualizamos la caché con la respuesta fresca
                return response;
            })
            .catch(() => {
                // Si no hay internet, devolvemos la versión guardada en caché
                return caches.match(event.request);
            })
    );
});