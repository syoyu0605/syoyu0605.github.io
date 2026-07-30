/* Syoyu 工作台 Service Worker：离线缓存图标外壳，应用主文件始终走网络拿最新版 */
/* v3：不再预缓存 index.html，fetch 阶段对 html 始终网络优先，保证 PWA 启动即最新 */
const CACHE = 'syoyu-v3';
const ASSETS = [
  './',
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
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return; // 跨域资源（如字体）直接放行
  // 应用主文件（导航请求 / .html）始终网络优先，保证用户拿到最新版
  if (url.pathname.endsWith('/') || url.pathname.endsWith('.html')) {
    e.respondWith(
      fetch(e.request)
        .then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, cp)); return r; })
        .catch(() => caches.match(e.request).then((m) => m || caches.match('./index.html') || caches.match('./')))
    );
    return;
  }
  // 其他静态资源（图标等）：网络优先 + 回退缓存
  e.respondWith(
    fetch(e.request)
      .then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, cp)); return r; })
      .catch(() => caches.match(e.request).then((m) => m || caches.match('./')))
  );
});
