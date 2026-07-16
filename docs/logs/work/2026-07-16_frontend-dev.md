# 2026-07-16 frontend-dev 作業ログ

## 08:30 W3タスク1〜3(F10 PWA / F9広告枠 / 計測スタブ)

- Goal: W3タスク1〜3(F10 PWA / F9広告枠 / 計測スタブ)が実装され、lint/typecheck/testが通る
- 結果: 達成
- やったこと:
  - タスク1 F10 PWA(新規npm依存なし):
    - `public/manifest.webmanifest`: name「オタクのしおり」・standalone・theme_color `#f6339a`(UIのTailwind pink-500相当)・SVGアイコン1枚
    - `public/icon.svg`: 栞モチーフの自作SVG(ピンク角丸背景+白いしおり形)。PNG/apple-touch-icon の今後の追加をファイル内コメントにTODO明記
    - `public/sw.js`: install時にアプリシェル(`/`・manifest・icon)をプリキャッシュ。ページナビゲーションはnetwork-first(オフライン時は同一URLキャッシュ→`/`へフォールバック、Issue #61対応)、`/_next/static/`はcache-first、非GET・クロスオリジンは素通し。キャッシュ名にバージョン(`otaku-no-shiori-v1`)を含めactivateで旧キャッシュを削除
    - `src/lib/sw-routing.ts` + `src/lib/sw-routing.test.ts`: fetch分岐を純粋関数`decideFetchStrategy`として切り出しユニットテスト5件。sw.js側は同一ロジックを二重管理(sw.jsはsrc/をimportできないため。両ファイルに要同期コメントを明記)
    - `src/components/common/ServiceWorkerRegistration.tsx`: SW登録のみの不可視clientコンポーネント。`NODE_ENV === "production"`のみ登録
    - `src/app/layout.tsx`: `metadata.manifest`追加、`viewport.themeColor`追加、ServiceWorkerRegistrationをbodyに配置
  - タスク2 F9広告枠:
    - 配置確認: `AdSlotPlaceholder`の使用箇所はS1(`src/app/page.tsx`)とS3d(`LogTab.tsx`)の2箇所のみで仕様どおり(過不足なし、変更不要)
    - `src/components/common/AdSlotPlaceholder.tsx`: 「広告枠(準備中)」の破線プレースホルダから自社告知(「オタクのしおり」+「遠征のおともに。持ち物・TODO・旅程をこの1冊で。」)に変更。公式X未開設のため外部導線なし。`aria-hidden`は実コンテンツになったため除去
  - タスク3 計測スタブ:
    - `src/app/layout.tsx`: `NEXT_PUBLIC_GA_ID`設定時のみGA4のgtagスクリプトを`next/script`(afterInteractive)で読み込む。未設定時は一切何も読み込まない。docsには触れていない
  - `npm run lint` / `npx tsc --noEmit` / `npm test`(317件)全て成功
- できていないこと:
  - PWAの実機オフライン動作確認(SWは本番ビルドのみ登録のため、Netlifyプレビューデプロイでの確認が必要。QA/レビュー時に実施依頼)
  - PNGアイコン・apple-touch-iconの作成(SVG1枚のみ。icon.svg内にTODO記載)
- 不明点・仮置き:
  - Netlify(`@netlify/plugin-nextjs`)で`public/`配下(sw.js等)がサイトルートでそのまま配信され、SWのスコープが`/`になる前提で実装した(この環境からNetlify実配信は検証不能)
  - theme_color `#f6339a`はTailwind v4のpink-500近似hex。デザイントークンに公式hex定義が無いため仮置き
  - SWのフォールバック順(同一URLキャッシュ→`/`)は仕様に明記が無いため実装裁量で決めた
  - 自社告知の文言は例示(「遠征のおともに。」)をベースに1行補足を追加した仮文言。オーナー確認で差し替え可
- 成果物:
  - 新規: `public/manifest.webmanifest` `public/icon.svg` `public/sw.js` `src/lib/sw-routing.ts` `src/lib/sw-routing.test.ts` `src/components/common/ServiceWorkerRegistration.tsx`
  - 変更: `src/app/layout.tsx` `src/components/common/AdSlotPlaceholder.tsx`
  - ブランチ `claude/w2-ui-refinements-17nk5f` に1コミット。push・PR操作は呼び出し元が実施(PR #69)
