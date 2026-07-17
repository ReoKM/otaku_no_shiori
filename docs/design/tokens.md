# デザイントークン

参照: `docs/01_service_spec.md`(非機能要件: スマホ375px幅基準)、`docs/03_tech_stack.md`(Tailwind CSS v4構成)

対象: `docs/design/screens/` 配下の全画面仕様。生の16進数(`#F472B6`等)は画面仕様では使わず、本ファイルのトークン名で指定する。

本プロジェクトはTailwind CSS v4(`src/app/globals.css`で`@import "tailwindcss"` + `@theme`)を採用済み。下記トークンはTailwindの**デフォルトパレット名**(neutral/pink/red/amber等)をクラス名として使い続け、パレットの実値だけを`globals.css`の`@theme`ブロックで上書きする運用とする(独自のtailwind.config拡張はしない)。実値の変更履歴: 2026-07にパープル基調ブランド(元デザイン仕様は共有アップロードの`DESIGN.md`)へ全面リブランドした。

## 0. ブランド刷新のサマリ(2026-07)

- カラー: ピンク基調 → **パープル基調**(`primary-500 #747bd9`)。ニュートラルもグレー系 → 暖色系に変更
- タイポグラフィ: Geist(見出し)+システムフォント(本文) → **Space Grotesk単一ファミリー**(見出し・本文共通)。Space GroteskはCJKグリフを含まないため、日本語部分は`system-ui, sans-serif`に自動フォールバックする(英数字・記号のみSpace Groteskで描画される)
- 角丸: 全体を1段階タイトに変更(下記「3. 角丸トークン」参照)
- シャドウ: 新規にトークン化(下記「7. シャドウトークン」参照)
- 実装は`globals.css`の`@theme`でTailwindデフォルトパレット(pink/neutral/red/amber)と`radius-*`/`shadow-*`の値を上書きする方式。コンポーネント側のクラス名(`bg-pink-500`等)は変更していない

## 1. カラートークン

### 1-1. ブランド/プライマリ

| トークン名 | 用途 | Tailwindクラス例 | 値 |
|---|---|---|---|
| `color-primary` | メインCTAボタン背景、選択中タブ・チップの強調色 | `bg-pink-500` / `text-pink-500` / `border-pink-500` | #747bd9 |
| `color-primary-hover` | プライマリボタンのhover/active/押下時 | `bg-pink-600` | #595eb4 |
| `color-primary-soft` | 選択済みチップ・バッジの背景(薄) | `bg-pink-100` | #ebf0ff |
| `color-primary-soft-text` | `color-primary-soft` 背景上の文字 | `text-pink-700` | #404489 |

プライマリのフルスケール(`globals.css`で`pink-50`〜`pink-950`として定義): 50 `#f6f9ff` / 100 `#ebf0ff` / 200 `#d1daff` / 300 `#b3bdff` / 400 `#929bf7` / 500 `#747bd9` / 600 `#595eb4` / 700 `#404489` / 800 `#292c60` / 900 `#151637` / 950 `#07081f`。

### 1-2. ニュートラル(背景・境界・テキスト)

| トークン名 | 用途 | Tailwindクラス例 | 値 |
|---|---|---|---|
| `color-bg-app` | 画面全体の背景 | `bg-neutral-50` | #fbfaf9 |
| `color-bg-surface` | カード・入力欄・モーダルの背景 | `bg-white` | #ffffff |
| `color-border-default` | カード枠線・入力欄の通常枠線 | `border-neutral-200` | #e2ddd9 |
| `color-border-strong` | 入力欄フォーカス時の枠線 | `border-neutral-400` | #aba39c |
| `color-text-primary` | 本文・見出し・入力値 | `text-neutral-900` | #1d1a18 |
| `color-text-secondary` | 補足テキスト(日程・遠征タイプラベル等) | `text-neutral-500` | #8d847e |
| `color-text-muted` | プレースホルダー・注意書き | `text-neutral-400` | #aba39c |
| `color-text-disabled` | 無効化ボタン・無効化項目の文字 | `text-neutral-400` | #aba39c |
| `color-bg-disabled` | 無効化ボタンの背景 | `bg-neutral-200` | #e2ddd9 |

ニュートラルのフルスケール(`globals.css`で`neutral-50`〜`neutral-950`として定義): 50 `#fbfaf9` / 100 `#f4f1ef` / 200 `#e2ddd9` / 300 `#cac3bd` / 400 `#aba39c` / 500 `#8d847e` / 600 `#6f6761` / 700 `#524c47` / 800 `#36322e` / 900 `#1d1a18` / 950 `#0d0b09`。

### 1-3. エラー

| トークン名 | 用途 | Tailwindクラス例 | 値 |
|---|---|---|---|
| `color-error` | エラーメッセージの文字・アイコン | `text-red-600` | #c35c57 |
| `color-error-border` | エラー時の入力欄枠線 | `border-red-400` | #cc7470 |
| `color-error-bg` | エラー時の入力欄背景(薄) | `bg-red-50` | #f8f2f2 |

### 1-4. 期限強調(S3b TODO用)

| トークン名 | 用途 | Tailwindクラス例 | 値 |
|---|---|---|---|
| `color-due-today-bg` | 期限当日の行の背景 | `bg-amber-50` | #f9f6f1 |
| `color-due-today-border` | 期限当日の行の左枠線(強調バー) | `border-amber-400` | #dbb261 |
| `color-due-today-text` | 期限当日の日付文字 | `text-amber-700` | #8d6820 |

### 1-5. 未使用の意味色(将来用・仮置き)

DESIGN.mdは`success` `#46944b` / `info` `#1289c7` をブランドカラーとして定義しているが、現行コードにこれらを使う箇所が無いため`globals.css`では未定義(Tailwindデフォルトの`green-*`/`sky-*`等をそのまま使う想定)。今後「成功トースト」「情報バナー」等を追加する際は、このセクションを更新してから実装すること。

### 1-5. 広告枠プレースホルダー(F9)

| トークン名 | 用途 | Tailwindクラス例 | 値(参考) |
|---|---|---|---|
| `color-ad-placeholder-bg` | 広告枠の背景 | `bg-neutral-100` | #f5f5f5 |
| `color-ad-placeholder-border` | 広告枠の破線境界 | `border-neutral-300`(`border-dashed`) | #d4d4d4 |
| `color-ad-placeholder-text` | 広告枠内の説明文字 | `text-neutral-400` | #a3a3a3 |

### 1-6. カバー(しおり)プリセット

`shiori.cover` は単一text列。`color:#F472B6` または `emoji:🎫` のプレフィックス方式で保存する(アーキテクト確定仕様)。UIでは自由入力ではなく下記プリセットから選択する方式とする(仮置き。理由は各画面仕様の「不明点・仮置き」欄参照)。

プリセットカラー8色:

| トークン名 | Tailwind名 | 値(保存値の例) |
|---|---|---|
| `cover-color-1` | pink-400 | `color:#F472B6` |
| `cover-color-2` | sky-400 | `color:#38BDF8` |
| `cover-color-3` | amber-400 | `color:#FBBF24` |
| `cover-color-4` | emerald-400 | `color:#34D399` |
| `cover-color-5` | violet-400 | `color:#A78BFA` |
| `cover-color-6` | orange-400 | `color:#FB923C` |
| `cover-color-7` | rose-400 | `color:#FB7185` |
| `cover-color-8` | slate-400 | `color:#94A3B8` |

プリセット絵文字8種(保存値の例、いずれも `emoji:` プレフィックス): `emoji:🎫` `emoji:🎤` `emoji:🎡` `emoji:⛩️` `emoji:📷` `emoji:🚃` `emoji:🌸` `emoji:⭐`

デフォルト値(未選択時): `cover-color-1`(`color:#F472B6`)。

## 2. 余白トークン(spacing)

Tailwindのデフォルトspacingスケール(4pxの倍数)をそのまま使う。

| トークン名 | Tailwind | px |
|---|---|---|
| `space-1` | `1` | 4px |
| `space-2` | `2` | 8px |
| `space-3` | `3` | 12px |
| `space-4` | `4` | 16px |
| `space-5` | `5` | 20px |
| `space-6` | `6` | 24px |
| `space-8` | `8` | 32px |
| `space-10` | `10` | 40px |

画面共通の適用ルール:

| 用途 | トークン |
|---|---|
| 画面左右の余白 | `space-4`(16px) |
| カード内パディング | `space-4`(16px) |
| フォーム項目間の縦間隔 | `space-5`(20px) |
| セクション間の縦間隔 | `space-8`(32px) |
| リスト行の上下パディング | `space-3`(12px) |
| ヘッダー高さ相当の内側パディング | `space-4`(16px) |

## 3. 角丸トークン(radius)

2026-07リブランドで1段階タイトに変更(`globals.css`の`@theme`で`--radius-sm/md/lg/xl`を上書き)。クラス名は変更していない。

| トークン名 | Tailwind | px | 適用対象 |
|---|---|---|---|
| `radius-sm` | `rounded-md` | 4px(旧6px) | 小さいバッジ・カウンタ |
| `radius-md` | `rounded-lg` | 6px(旧8px) | ボタン・入力欄 |
| `radius-lg` | `rounded-xl` | 8px(旧12px) | カード・モーダル |
| `radius-full` | `rounded-full` | 完全な円/ピル | チップ・スウォッチ・アイコンボタン |

## 4. タイポグラフィトークン

フォントファミリー: **Space Grotesk**単一ファミリー(見出し・本文共通、`--font-space-grotesk`)。旧Geist(見出し)+システムフォント(本文)から変更。Space GroteskはCJKグリフを含まないため、日本語の見出し・本文は`system-ui, sans-serif`に自動フォールバックする(英数字・記号のみSpace Groteskで描画される)。サイズ・行間・太さはクラス名を変更していない。

| トークン名 | Tailwind | サイズ/行間 | 用途 |
|---|---|---|---|
| `text-heading-lg` | `text-xl font-bold` | 20px/28px | 画面タイトル(ヘッダー) |
| `text-heading-md` | `text-lg font-bold` | 18px/28px | セクション見出し(タブ内見出し等) |
| `text-body` | `text-base` | 16px/24px | 本文・入力値・リスト項目ラベル |
| `text-body-sm` | `text-sm` | 14px/20px | 補足・日程・遠征タイプラベル |
| `text-caption` | `text-xs` | 12px/16px | 注意書き・文字数カウンタ・広告枠表記 |
| `text-button` | `text-base font-semibold` | 16px/24px | ボタン文言 |

## 5. コンポーネント共通仕様(タップ領域)

遠征当日の片手操作を前提に、タップ領域は最小44×44pxを確保する。

| 要素 | 最小サイズ |
|---|---|
| ボタン(高さ) | 44px以上 |
| 入力欄(高さ) | 44px以上 |
| チェックボックス・上下並べ替えボタン | 44×44px |
| タブ(1個あたりの幅・高さ) | 高さ44px以上、幅は5分割で375px内に収まる範囲 |

## 6. レイアウト基準

- 基準幅: 375px(スマホ)。全画面はこの幅で崩れないことを確認する
- 画面最大幅: PCでは`max-w-md`(448px)程度に制限し中央寄せ(左右は`color-bg-app`で余白埋め)
- ヘッダーは画面上部に固定(`sticky top-0`)、背景`color-bg-surface`、下端に`color-border-default`の1px境界線

## 7. シャドウトークン(2026-07新規)

ニュートラル(黒のみ、色味なし)・控えめな強度。`globals.css`の`@theme`で`--shadow-sm/md/lg/xl`として定義し、Tailwindの`shadow-*`クラスがそのまま使える。

| トークン名 | Tailwind | 用途 |
|---|---|---|
| `shadow-sm` | `shadow-sm` | ドロップダウン |
| `shadow-md` | `shadow-md` | カード |
| `shadow-lg` | `shadow-lg` | モーダル、FAB(`FabButton`) |
| `shadow-xl` | `shadow-xl` | トースト |

## 8. インタラクション状態(2026-07新規)

| 状態 | ルール | 実装 |
|---|---|---|
| `hover` | 明度 −5% | 未適用(仮置き。既存ボタンに`hover:`クラスが無いため今回のリブランドでは追加していない。追加時は`bg-pink-600`等1段階濃いシェードを使う) |
| `active` | 明度 −10% | 未適用(hoverと同様の理由) |
| `focus` | `color-primary`の2px実線、2pxオフセット | 適用済み。`globals.css`の`:focus-visible`にグローバル定義(キーボード操作時のみ全要素へ適用) |
| `disabled` | 不透明度40% | 未適用(仮置き。既存コードは`color-bg-disabled`/`color-text-disabled`という別トークンで無効化状態を表現しており、DESIGN.mdのopacity方式とは仕組みが異なる。混在を避けるため今回は既存方式を維持) |
