// Service worker template. The build replaces the two placeholders below
// (see tools/service-worker.ts). Every build gets its own cache name, so a deploy
// can never mix old and new files.
const VERSION = "__VERSION__";
const PRECACHE = __PRECACHE__;
const CACHE = `day-reflection-${VERSION}`;

self.addEventListener("install", (event) => {
  // No skipWaiting here: the page decides when to switch, so an open form is never pulled away.
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE && key.startsWith("day-reflection-"))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    void self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) {
    return;
  }
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      // ignoreVary: module scripts send an Origin header that precached copies lack, and a server
      // answering "Vary: Origin" would make every such lookup miss.
      const hit = await cache.match(request, { ignoreSearch: true, ignoreVary: true });
      if (hit) {
        return hit;
      }
      try {
        return await fetch(request);
      } catch (error) {
        // Offline and not cached: a page navigation still gets the app shell.
        if (request.mode === "navigate") {
          const shell = await cache.match("./index.html");
          if (shell) {
            return shell;
          }
        }
        throw error;
      }
    }),
  );
});
