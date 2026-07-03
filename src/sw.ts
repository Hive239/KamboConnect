/// <reference lib="webworker" />
/**
 * KamboGuide service worker (built by vite-plugin-pwa `injectManifest`).
 * - Precaches the built app shell → instant loads + full offline.
 * - Runtime caching for images/fonts/Supabase GETs.
 * - Web push + notification-click (carried over from the old public/sw.js).
 */
import { precacheAndRoute, createHandlerBoundToURL } from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";
import { CacheFirst, NetworkFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<{ url: string; revision: string | null }> };

precacheAndRoute(self.__WB_MANIFEST || []);
self.skipWaiting();
self.addEventListener("activate", () => self.clients.claim());

// SPA navigations → serve the precached app shell (works offline + instant).
registerRoute(new NavigationRoute(createHandlerBoundToURL("index.html"), { denylist: [/^\/api\//, /^\/sw\.js$/] }));

// Images/icons: cache-first.
registerRoute(
  ({ request }) => request.destination === "image",
  new CacheFirst({
    cacheName: "kg-images",
    plugins: [new CacheableResponsePlugin({ statuses: [0, 200] }), new ExpirationPlugin({ maxEntries: 120, maxAgeSeconds: 30 * 24 * 3600 })],
  }),
);

// Fonts: cache-first, long-lived.
registerRoute(
  ({ request }) => request.destination === "font",
  new CacheFirst({ cacheName: "kg-fonts", plugins: [new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 365 * 24 * 3600 })] }),
);

// Supabase REST/storage GETs: network-first (fresh online, cached fallback offline).
registerRoute(
  ({ url, request }) => request.method === "GET" && /supabase\.co$/.test(url.hostname),
  new NetworkFirst({ cacheName: "kg-api", networkTimeoutSeconds: 5, plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })] }),
);

// ---- Web push ----
self.addEventListener("push", (event: PushEvent) => {
  let data: any = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = {}; }
  const title = data.title || "KamboGuide";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      data: { url: data.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) { if ("focus" in c) return (c as WindowClient).focus(); }
      return self.clients.openWindow(url);
    }),
  );
});
