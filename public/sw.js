/*
 * オタクのしおり Service Worker(F10 PWA、アプリシェルキャッシュ)。
 *
 * データ本体はIndexedDB(ゲスト保存)にあるため、アプリシェル(HTML/JS/CSS)を
 * キャッシュすればオフラインでも持ち物・TODO・旅程の閲覧が動く(Issue #61対応)。
 *
 * 戦略:
 * - ページナビゲーション: stale-while-revalidate(キャッシュがあれば即返し、裏で更新。
 *   キャッシュが無ければネットワーク待ち。オフラインかつ未キャッシュなら「/」へフォールバック)
 * - /_next/static/: cache-first(コンテンツハッシュ付きの不変アセット)
 * - 非GET・クロスオリジン・その他: 素通し
 *
 * 注意: decideFetchStrategy は src/lib/sw-routing.ts と同一ロジックの二重管理
 * (sw.jsはsrc/をimportできないため)。変更時は両方を更新すること。
 * 単体テストは src/lib/sw-routing.test.ts にある。
 */

// 戦略変更(network-first → stale-while-revalidate)とWebフォント廃止でアセットが
// 入れ替わるため、旧キャッシュを確実に破棄するようv2へ上げる(activateで削除される)。
const CACHE_VERSION = "v2";
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
    return "stale-while-revalidate-page";
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

async function staleWhileRevalidatePage(request) {
  const cached = await caches.match(request);

  // 裏で最新版を取りに行きキャッシュを更新する。次回の遷移から新しい内容が使われる。
  const fetching = fetch(request)
    .then((response) => {
      if (response.ok) {
        // updateCache は response.clone() を使うため、ここで返す response は消費されない。
        return updateCache(request, response).then(() => response);
      }
      return response;
    })
    .catch(() => null);

  if (cached) {
    // キャッシュがあれば待たずに即返す(ネットワーク往復を体感から消す)。
    return cached;
  }

  // 初回訪問など未キャッシュのときだけネットワークを待つ。
  const response = await fetching;
  if (response) {
    return response;
  }

  // オフラインかつ未キャッシュ: アプリシェル「/」へフォールバックする。
  // ルーティングはクライアント側(Next.js)が行うため、「/」が返ればIndexedDBの
  // データで各タブの表示が成立する(Issue #61「オフライン時に白画面」の解消)。
  const shell = await caches.match("/");
  if (shell) {
    return shell;
  }
  return Response.error();
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

  if (strategy === "stale-while-revalidate-page") {
    event.respondWith(staleWhileRevalidatePage(request));
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
