const SHELL_CACHE = "mangakai-v4";
const CHAPTER_CACHE = "mangakai-chapters-v1";

const PRECACHE = [
  "/",
  "/offline",
  "/offline-reader",
  "/downloads",
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

  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch {
          if (url.pathname === "/offline-reader") {
            const reader = await caches.match("/offline-reader");

            if (reader) return reader;
          }

          if (url.pathname === "/downloads") {
            const downloads = await caches.match("/downloads");

            if (downloads) return downloads;
          }

          const offline = await caches.match("/offline");

          if (offline) return offline;

          const home = await caches.match("/");

          if (home) return home;

          return new Response("MangaKai is offline.", {
            status: 503,
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
            },
          });
        }
      })(),
    );

    return;
  }

  if (
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/_next/static/")
  ) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);

        if (cached) return cached;

        const response = await fetch(request);
        const copy = response.clone();

        const cache = await caches.open(SHELL_CACHE);
        await cache.put(request, copy);

        return response;
      })(),
    );
  }
});