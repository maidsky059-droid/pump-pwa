// =====================================================
//  Service Worker — 遠心ポンプ シミュレータ PWA
//  キャッシュ戦略: Cache-First (オフライン対応)
// =====================================================

const CACHE_NAME = "pump-simulator-v2";

// キャッシュするリソース
const PRECACHE_URLS = [
  "./index.html",
  "./manifest.json",
  "https://unpkg.com/react@18/umd/react.production.min.js",
  "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js",
  "https://unpkg.com/prop-types@15.8.1/prop-types.min.js",
  "https://unpkg.com/recharts@2.12.7/umd/Recharts.js",
];

// ─── インストール: 全リソースをキャッシュ ────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ─── アクティベート: 古いキャッシュ削除 ──────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── フェッチ: Cache-First 戦略 ──────────────────────
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          // 成功したレスポンスはキャッシュに保存
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          // ネットワークエラー時: index.htmlにフォールバック
          return caches.match("./index.html");
        });
    })
  );
});
