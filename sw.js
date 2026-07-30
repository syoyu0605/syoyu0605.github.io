/* Syoyu 工作台 Service Worker：离线缓存应用外壳，数据仍在本地存储 */
/* v2：新增多尺寸图标（icon-180/192/512），旧 v1 缓存会在 activate 时自动清除 */
const CACHE = 'syoyu-v2';
const ASSETS = [
  './',
  './index.html',
  './icon.png',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './manifest.webmanifest'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS).catch(() => {})).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((r) => {
        const cp = r.clone();
        caches.open(CACHE).then((c) => c.put(e.request, cp));
        return r;
      })
      .catch(() => caches.match(e.request).then((m) => m || caches.match('./index.html')))
  );
});
