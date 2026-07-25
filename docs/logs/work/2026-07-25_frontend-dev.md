# 2026-07-25 frontend-dev

## 17:20 UIリニューアル(1/5) デザイントークン+ヘッダー/タブバー
- Goal: 紙テイストのデザイントークンが `globals.css` に入り、S3のヘッダーとタブバーが新デザインで表示され、CI(lint + tsc + テスト)が通る
- 結果: 達成
- やったこと:
  - `src/app/globals.css` を全面書き換え。paper(面)/ink(文字)/sakura(差し色)の3系統・22トークンを `@theme` に定義。Geist変数とダークテーマ定義を撤去
  - アニメーション3種(`paper-flash` / `paper-sheet-up` / `paper-fade-up`)と `prefers-reduced-motion` の抑制指定を追加
  - 本文フォントを Zen Kaku Gothic New(next/font、weight 400/500/700/900)に変更。`subsets` は指定しない方針を採用
  - `theme_color` を `#f6339a` → `#D6146F`、`background_color` を `#ffffff` → `#FDFBF7` に更新(`layout.tsx` と `manifest.webmanifest` を同値で揃えた)
  - `ShioriDetailHeader` を刷新: 22px/900・2行のタイトル、共有導線をテキストリンクからアイコンボタン(44×44px)へ変更、スクロール連動のコンパクト表示に対応
  - `src/lib/use-compact-header.ts` を新規追加(縮め36px/戻し12pxの二段閾値)
  - `TabBar` を刷新: ラベルを「TODO」→「やること」、「ログ」→「記録」に変更。選択中は `sakura-ink` 太字+下辺3pxインクバー。`aria-current="page"` を追加
  - `BackButton` の「‹」文字をSVGアイコンに差し替え
  - S3レイアウトでヘッダーとタブバーを1つの `sticky` ブロックにまとめた
  - `docs/design/tokens.md` のカラー/角丸/タイポグラフィ節を新トークン体系に書き換え、`docs/design/screens/S3_しおり詳細.md` のヘッダー・タブバー仕様を更新
- できていないこと:
  - 持ち物・やること・旅程・記録の各タブ本体は未着手(PR②〜⑤で対応)。このPRのマージ後、各タブは旧トークン(neutral/pink)のまま残るため一時的に見た目が不揃いになる
  - 実機・ブラウザでの表示確認をしていない(この環境で開発サーバを立ち上げての目視確認は未実施)。`next build` の成功と静的検査までは確認済み
  - フォント読み込み後の実測LCP・CLSを計測していない
- 不明点・仮置き:
  - デザイン案の #4A423A を #3B342E(`ink-strong`)に統合した。視認上ほぼ同一でトークン数を抑えるための判断。tokens.md に明記済み
  - ヘッダー右の「その他メニュー」(ケバブ)は、デザインに描かれているが中身の項目が未定義のため実装していない。何を入れるかオーナー判断が必要
  - タブの表示名のみ変更し、URLパス(`/todo`・`/log`)は据え置いた。既存リンクとService Workerのキャッシュルーティングを壊さないため
  - ダークテーマ定義を削除した。紙テイストは明るい面前提の配色で、デザインにダーク版が無いため
  - フォントのweightは4種すべて読み込んだ(ビルド成果物のwoff2は484ファイル/計5.6MB)。`preload: false` のためユーザーが実際に取得するのは必要なunicode-rangeチャンクのみ
- 成果物: `src/app/globals.css`、`src/app/layout.tsx`、`src/app/shiori/[id]/layout.tsx`、`src/components/shiori-detail/ShioriDetailHeader.tsx`、`src/components/shiori-detail/TabBar.tsx`、`src/components/common/BackButton.tsx`、`src/lib/use-compact-header.ts`、`public/manifest.webmanifest`、`docs/design/tokens.md`、`docs/design/screens/S3_しおり詳細.md`
