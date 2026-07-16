/*
 * オタクのしおり Service Worker(F10 PWA、アプリシェルキャッシュ)。
 *
 * データ本体はIndexedDB(ゲスト保存)にあるため、アプリシェル(HTML/JS/CSS)を
 * キャッシュすればオフラインでも持ち物・TODO・旅程の閲覧が動く(Issue #61対応)。
 *
 * 戦略:
 * - ページナビゲーション: network-first(成功したらキャッシュ更新、失敗=オフライン時は
 *   キャッシュ済みの同一URL→「/」の順でフォールバック)
 * - /_next/static/: cache-first(コンテンツハッシュ付きの不変アセット)
 * - 非GET・クロスオリジン・その他: 素通し
 *
 * 注意: decideFetchStrategy は src/lib/sw-routing.ts と同一ロジックの二重管理
 * (sw.jsはsrc/をimportできないため)。変更時は両方を更新すること。
 * 単体テストは src/lib/sw-routing.test.ts にある。
 */

const CACHE_VERSION = "v1";
const CACHE_NAME = `otaku-no-shiori-${CACHE_VERSION}`;
const APP_SHELL = ["/", "/manifest.webmanifest", "/icon.svg"];

/** src/lib/sw-routing.ts の decideFetchStrategy と同一ロジック(要同期)。 */
function decideFetchStrategy(input) {
  if (input.method !== "GET") {
    return "passthrough";
  }
  if (!input.sameOrigin) {
    return "passthrough";
  }
  if (input.mode === "navigate") {
    return "network-first-page";
  }
  if (input.pathname.startsWith("/_next/static/")) {
    return "cache-first";
  }
  return "passthrough";
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

// キャッシュ書き込みの失敗(容量不足・プライベートブラウジング等)が、取得に成功した
// レスポンスの返却を妨げないよう、書き込みはここで握りつぶす(PR #71レビュー指摘反映)。
async function updateCache(request, response) {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  } catch {
    // 書き込み失敗は無視(次回オンライン時に再試行される)
  }
}

async function networkFirstPage(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      await updateCache(request, response);
    }
    return response;
  } catch {
    // オフライン時: 同一URLのキャッシュ→アプリシェル「/」の順でフォールバックする。
    // ルーティングはクライアント側(Next.js)が行うため、「/」が返ればIndexedDBの
    // データで各タブの表示が成立する。
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    const shell = await caches.match("/");
    if (shell) {
      return shell;
    }
    return Response.error();
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  const response = await fetch(request);
  if (response.ok) {
    await updateCache(request, response);
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  const strategy = decideFetchStrategy({
    method: request.method,
    mode: request.mode,
    sameOrigin: url.origin === self.location.origin,
    pathname: url.pathname,
  });

  if (strategy === "network-first-page") {
    event.respondWith(networkFirstPage(request));
    return;
  }
  if (strategy === "cache-first") {
    event.respondWith(cacheFirst(request));
    return;
  }
  // passthrough: respondWithを呼ばず、ブラウザの通常のネットワーク処理に任せる。
  // ただしプリキャッシュ済みの静的ファイル(manifest/icon)はオフラインでも返せるよう照合する。
  if (strategy === "passthrough" && request.method === "GET" && APP_SHELL.includes(url.pathname)) {
    event.respondWith(cacheFirst(request));
  }
});
