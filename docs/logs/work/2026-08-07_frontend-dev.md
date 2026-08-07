# 2026-08-07 frontend-dev

## 09:15 表示速度の原因調査と改善(Webフォント廃止・ルート静的化・SW戦略変更)

- Goal: 初回表示のブロッキング資産を削減し、トップ画面の初回転送を約1.1MB→約200KBにする
- 結果: 部分達成
- やったこと:
  - 本番ビルドを実測し、重さの原因を特定した(ライブサイトは実行環境のネットワークポリシーで到達できないためビルド出力で計測)
    - 原因1: `next/font`の`Zen_Kaku_Gothic_New`。日本語はGoogle Fontsがunicode-rangeを121分割で返し、4ウェイト分で@font-face 485個・woff2 484ファイル(5.4MB)を生成していた。描画ブロッキングCSSがgzip 128KB、トップの実UI文字列だけでフォント84リクエスト/750KBを要求していた
    - 原因2: `/shiori/[id]/*` の全8ルートが `ƒ`(動的)。データはIndexedDBにありサーバーレンダリングの中身が無いのに、タブ切替・リロードのたびにNetlify Functionsが起動していた
    - 原因3: Service Workerがページナビゲーションを network-first。2回目以降の訪問でも毎回ネットワーク往復を待っていた
  - 対策1(オーナー判断①): Webフォントを廃止しシステムフォントに切替
    - `src/app/layout.tsx` から `Zen_Kaku_Gothic_New` を削除
    - `src/app/globals.css` の `--font-sans` を system-ui / ヒラギノ角ゴ ProN / Noto Sans JP / Yu Gothic UI / Meiryo のスタックに変更
    - `docs/design/tokens.md`「4. タイポグラフィトークン」を実測値つきで更新し、再導入時の注意を明記
  - 対策2: 主要4タブ+共有画面を静的化
    - `packing` / `todo` / `log` / `share` のページファイルをServer Componentに戻し、`export const dynamic = "force-static"` を付与
    - `share` のフィーチャーフラグ差し戻し処理を `src/components/share/ShareRoute.tsx` に切り出し
    - `itinerary` はページ側のsearchParams読みを `src/components/itinerary/ItineraryRoute.tsx` の `useSearchParams` に移し、Suspenseで包んで静的化
  - 対策3: Service Workerのナビゲーションを stale-while-revalidate に変更
    - `public/sw.js` と `src/lib/sw-routing.ts`(二重管理)を両方更新、`CACHE_VERSION` を v2 に更新
    - オフライン時のフォールバック(キャッシュ→「/」)は維持。Issue #61 の挙動は保たれる
  - 計測結果(トップ画面、gzip):

    | 指標 | 変更前 | 変更後 |
    |---|---|---|
    | woff2ファイル数 | 484 | 0 |
    | @font-face宣言 | 485 | 0 |
    | 描画ブロッキングCSS | 128 KB | 6.3 KB |
    | フォント転送 | 750 KB / 84リクエスト | 0 |
    | JS | 191 KB | 191 KB |
    | 初回転送 合計 | 約1.1 MB / 95リクエスト超 | 197 KB / 11リクエスト |

  - CI相当を全て実行: `npm run lint` / `npm run typecheck` / `npm test`(33ファイル355件)すべて通過
- できていないこと:
  - `/shiori/[id]`(既定タブへのリダイレクト)、`/shiori/[id]/spots/search`、`/shiori/[id]/spots/search/[spotId]` の3ルートは動的(`ƒ`)のまま。サーバー側でsearchParams・spotIdを読んでいるため、静的化には`itinerary`と同様のクライアント移行が必要。主要4タブではなく優先度が下がるため今回のPRから外した
  - `src/lib/use-follow-fab.ts` のスクロールごとの `getBoundingClientRect()`(強制同期レイアウト)は未対応。IntersectionObserverへの置換が必要
  - 実機・ライブサイトでの表示速度の計測は未実施。実行環境からライブサイトへ到達できないため、数値はすべて本番ビルド出力からの算出
  - システムフォント化による見た目の実機確認(iOS/Android/Windows)は未実施
- 不明点・仮置き:
  - フォントスタックの `"Yu Gothic UI"` / `"Meiryo"`(Windows向け)は元の指定に無く今回追加した仮置き。不要ならデザイナー判断で削れる
  - `docs/design/tokens.md` のウェイト表(font-black 900 等)はクラス名をそのまま残した。システムフォントでは900が無い環境で合成太字になる場合がある
- 成果物: `src/app/layout.tsx`, `src/app/globals.css`, `src/app/shiori/[id]/{packing,todo,log,share,itinerary}/page.tsx`, `src/components/share/ShareRoute.tsx`, `src/components/itinerary/ItineraryRoute.tsx`, `public/sw.js`, `src/lib/sw-routing.ts`, `src/lib/sw-routing.test.ts`, `docs/design/tokens.md`
