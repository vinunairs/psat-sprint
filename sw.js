/* Test Prep Hub — service worker: shows study reminders sent from the server and opens the site when tapped.
   It deliberately does not cache pages, so new releases always load right away. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { body: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.title || "Test Prep Hub", {
    body: d.body || "Time for a quick practice set.",
    icon: "icons/icon-192.png",
    badge: "icons/badge-96.png",
    tag: d.tag || "psat-daily",
    renotify: true,
    data: { url: d.url || "./" }
  }));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "./";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
    for (const w of wins) if (w.url.includes("/psat-sprint/") && "focus" in w) return w.focus();
    return self.clients.openWindow(url);
  }));
});
