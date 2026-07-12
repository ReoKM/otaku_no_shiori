## W2タスク#7 共有画像テンプレート実装(シンプル/にぎやか、satori)

- Goal: 1080×1920のsatoriテンプレート2種(シンプル/にぎやか)が、Netlify Functionから呼び出せる関数+Props定義付きで実装され、PRが1本出ている
- 結果: 達成
- やったこと:
  - `src/templates/share-image/`に`types.ts`(Props型・デフォルト定数)/`simple.tsx`/`nigiyaka.tsx`(1080×1920テンプレ2種)/`common.tsx`(LogoUrlBar・Chip・PhotoRow等の共通部品)/`colors.ts`/`fonts.ts`(Google FontsからNoto Sans JPを動的サブセット取得)/`render.ts`(Props+テンプレ種別→satoriでSVG文字列)を実装
  - 依存に`satori`を追加(`@resvg/resvg-js`はタスク#11のbackend-dev担当のため追加していない)
  - サービス名「オタクのしおり」+URL(`https://otaku-no-shiori.netlify.app/?via=share`、Propsで差し替え可)を両テンプレに必ず配置。`?via=share`は流入計測用
  - ユニットテスト20件(テンプレ構造の直接検査+satori統合)を実装
  - `vitest.config.ts`に`@/`エイリアスのresolve設定を追加(値importをテストから解決できるように。W1からの既知課題の根本対応)
- できていないこと:
  - 生成画像のビジュアル確認(PNG化はタスク#11のresvg統合後。SVG構造・テキスト含有のテストのみ)
  - satori統合テストはGoogle Fontsへのネットワークアクセスを伴う(オフライン環境では失敗する。テストコメントに明記)
- 不明点・仮置き:
  - デザイントーン: シンプル=白基調・情報整理型/にぎやか=ピンク基調・チップ装飾多め(仕様に指定が無いため仮置き。オーナーレビューで調整前提=週次計画オーナー判断3の推奨A)
  - フォントはGoogle FontsからNoto Sans JPを実行時に動的サブセット取得する方式(リポジトリにフォントを同梱しない。Function実行時のネットワーク前提)
  - URLは本番ドメイン未定のため`otaku-no-shiori.netlify.app`で仮置き(Propsで差し替え可能)
  - 実装担当エージェントがセッション上限で中断したため、最終検証(テストヘルパーの関数コンポーネント展開対応)・コミット・PR作成はオーケストレーター(claude)が引き継いだ
- 成果物: PR(w2/task7-share-templates)、`src/templates/share-image/`一式、`vitest.config.ts`(エイリアス追加)
- 作業ログ: docs/logs/work/2026-07-12_share-image-designer.md
