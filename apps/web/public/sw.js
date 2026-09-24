const SHELL_CACHE = "mangakai-v3";
const CHAPTER_CACHE = "mangakai-chapters-v1";

const PRECACHE = [
  "/offline",
  "/offline-reader",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(PRECACHE)),
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter(
            (key) =>
              key.startsWith("mangakai-v") &&
              key !== SHELL_CACHE &&
              key !== CHAPTER_CACHE,
          )
          .map((key) => caches.delete(key)),
      ),
    ),
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  // API stays network-only.
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(SHELL_CACHE);

        if (url.pathname === "/offline-reader") {
          return cache.match("/offline-reader");
        }

        if (url.pathname === "/offline") {
          return cache.match("/offline");
        }

        return cache.match("/offline");
      }),
    );

    return;
  }

  if (
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/_next/static/")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;

        return fetch(request).then((response) => {
          const copy = response.clone();

          caches.open(SHELL_CACHE).then((cache) => {
            cache.put(request, copy);
          });

          return response;
        });
      }),
    );
  }
});