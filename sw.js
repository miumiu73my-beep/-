const CACHE_NAME = "yasai-seijo-step14-v1";

const APP_SHELL = [
  "./",
  "./index.html",
  "./app.js",
  "./manifest.webmanifest",
  "./assets/styles.css",
  "./assets/step10.css",
  "./assets/step11.css",
  "./assets/step13.css",
  "./assets/step14.css",
  "./assets/backgrounds/lab.svg",
  "./assets/backgrounds/field.svg",
  "./assets/backgrounds/home.svg",
  "./assets/characters/portraits/ichika.svg",
  "./assets/characters/portraits/chihaya.svg",
  "./assets/characters/portraits/uryu.svg",
  "./assets/characters/portraits/shuka.svg",
  "./assets/characters/chibi/ichika.svg",
  "./assets/characters/chibi/chihaya.svg",
  "./assets/characters/chibi/uryu.svg",
  "./assets/characters/chibi/shuka.svg",
  "./assets/icons/icon-180.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./data/app-data.js",
  "./data/characters.js",
  "./data/dates.js",
  "./data/names.js",
  "./data/crops.js",
  "./data/economy.js",
  "./data/quality.js",
  "./data/research.js",
  "./data/time.js",
  "./save/schema.js",
  "./save/storage.js",
  "./screens/characters.js",
  "./screens/lab.js",
  "./screens/field.js",
  "./screens/home.js",
  "./screens/name-settings.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      });
    })
  );
});
