/* ===================== service-worker.js =====================
   Mise en cache des fichiers de l'application pour un fonctionnement
   hors ligne. Stratégie : "cache d'abord, puis réseau" pour les fichiers
   de l'app, avec repli sur le réseau pour tout le reste.

  Le cache est limité au dossier de déploiement (compatible GitHub Pages).
*/

const APP_SCOPE = new URL(self.registration.scope);
const SCOPE_KEY = APP_SCOPE.pathname.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'root';
const CACHE_PREFIX = `plombiertool-${SCOPE_KEY}-`;
const APP_CACHE_NAME = `${CACHE_PREFIX}v8`;

const FILES_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/db.js',
  './js/app.js',
  './js/hydraulique.js',
  './js/chauffage.js',
  './js/mesures.js',
  './js/tubes.js',
  './js/devis.js',
  './js/checklist.js',
  './js/fiches.js',
  './js/interventions.js',
  './js/auth.js',
  './js/firebase-config.js',
  './js/firebase-loader.js',
  './js/settings.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Installation : on met en cache tous les fichiers de l'application
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(APP_CACHE_NAME).then((cache) =>
      cache.addAll(FILES_TO_CACHE.map(file => new URL(file, APP_SCOPE).href))
    )
  );
});

// Activation : on supprime les anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== APP_CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

// Interception des requêtes : cache d'abord, sinon réseau
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== APP_SCOPE.origin || !requestUrl.pathname.startsWith(APP_SCOPE.pathname)) return;

  event.respondWith(
    caches.open(APP_CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      if (cached) return cached;
      try {
        const response = await fetch(event.request);
        if (response.ok) cache.put(event.request, response.clone());
        return response;
      } catch {
        if (event.request.mode === 'navigate') {
          return cache.match(new URL('index.html', APP_SCOPE).href);
        }
        return Response.error();
      }
    })
  );
});
