const CACHE_PREFIX = "yasai-seijo-";
const CACHE_VERSION = "step19-title-v1";
const PRECACHE_NAME = `${CACHE_PREFIX}precache-${CACHE_VERSION}`;
const RUNTIME_CACHE_NAME = `${CACHE_PREFIX}runtime-${CACHE_VERSION}`;

const APP_SHELL = [
  "./",
  "./index.html",
  "./app.js",
  "./screens/title.js",
  "./audio/bgm.js",
  "./manifest.webmanifest",
  "./assets/styles.css",
  "./assets/step10.css",
  "./assets/step11.css",
  "./assets/step13.css",
  "./assets/step14.css",
  "./assets/step16.css",
  "./assets/bgm.css",
  "./assets/title.css",
  "./assets/backgrounds/lab.webp",
  "./assets/backgrounds/field.webp",
  "./assets/backgrounds/home.webp",
  "./assets/characters/portraits.webp",
  "./assets/characters/chibi-atlas.webp",
  "./assets/icons/icon-180.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./data/app-data.js",
  "./data/characters.js",
  "./data/dialogues.js",
  "./data/dialogue-engine.js",
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
  "./screens/name-settings.js",
  "./screens/save-management.js"
];

const STATIC_ASSET_PATTERN =
  /\.(?:html|css|js|json|webmanifest|png|jpe?g|webp|svg|gif|avif|woff2?|mp3)$/i;

function scopeUrl(path) {
  return new URL(path, self.registration.scope).href;
}

function isAppRequest(request) {
  const url = new URL(request.url);

  return (
    url.origin === self.location.origin &&
    url.href.startsWith(self.registration.scope)
  );
}

function canRuntimeCache(request) {
  if (request.headers.has("range")) return false;

  const url = new URL(request.url);
  return STATIC_ASSET_PATTERN.test(url.pathname);
}

async function cacheResponse(cacheName, request, response) {
  if (!response || !response.ok) return;

  const cache = await caches.open(cacheName);
  await cache.put(request, response.clone());
}

async function handleNavigation(request) {
  try {
    const response = await fetch(request);
    await cacheResponse(RUNTIME_CACHE_NAME, request, response);
    return response;
  } catch (error) {
    const cachedPage = await caches.match(request, { ignoreSearch: true });

    if (cachedPage) return cachedPage;

    const cachedIndex = await caches.match(scopeUrl("./index.html"));
    if (cachedIndex) return cachedIndex;

    const cachedRoot = await caches.match(scopeUrl("./"));
    if (cachedRoot) return cachedRoot;

    throw error;
  }
}

async function handleStaticRequest(request) {
  const cached = await caches.match(request);

  if (cached) return cached;

  const response = await fetch(request);

  if (canRuntimeCache(request)) {
    await cacheResponse(RUNTIME_CACHE_NAME, request, response);
  }

  return response;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL.map(scopeUrl)))
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  const keepCaches = new Set([PRECACHE_NAME, RUNTIME_CACHE_NAME]);

  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) => key.startsWith(CACHE_PREFIX) && !keepCaches.has(key)
            )
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET" || !isAppRequest(request)) return;

  // メディアのRange応答(206)はブラウザに任せる。音源が未配置でもSW導入を妨げない。
  if (request.headers.has("range")) return;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request));
    return;
  }

  event.respondWith(handleStaticRequest(request));
});
