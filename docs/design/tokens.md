# デザイントークン

参照: `docs/01_service_spec.md`(非機能要件: スマホ375px幅基準)、`docs/03_tech_stack.md`(Tailwind CSS v4構成)

対象: `docs/design/screens/` 配下の全画面仕様。生の16進数(`#D6146F`等)は画面仕様でも実装でも使わず、本ファイルのトークン名で指定する。

本プロジェクトはTailwind CSS v4を採用する。トークンの実体は `src/app/globals.css` の `@theme` ブロックに定義してあり、画面側はそこから生成される
ユーティリティ(`bg-paper-surface` / `text-ink-sub` / `border-paper-divider` など)で参照する。**Tailwindのデフォルトパレット(neutral/pink等)は新規実装では使わない。**

配色は「紙テイスト(フラット案)」に統一する。生成りの紙面(paper)・こげ茶のインク(ink)・桜色の差し色(sakura)の3系統で構成し、
明るい面を前提にした配色のためダークテーマは持たない。

## 1. カラートークン

### 1-1. 差し色(sakura)

| トークン名 | Tailwindクラス例 | 値 | 用途 |
|---|---|---|---|
| `sakura` | `bg-sakura` | #D6146F | 主CTAボタン背景、チェック済みボックス、進捗バー、タブの下線 |
| `sakura-ink` | `text-sakura-ink` | #B01260 | 紙面上に置くピンクの文字(コントラスト確保のため背景色より濃い) |
| `sakura-soft` | `bg-sakura-soft` | #FDEEF5 | 選択中の項目背景、達成メッセージの帯 |
| `sakura-tint` | `bg-sakura-tint` | #FFF7FB | インライン追加フォームの背景 |
| `sakura-border` | `border-sakura-border` | #EFC3D9 | 白地ピンク文字ボタンの枠線、追従ボタンの枠線 |
| `sakura-field` | `border-sakura-field` | #E4A0C2 | 入力欄の枠線(入力中) |
| `sakura-undo` | `text-sakura-undo` | #FF9BC8 | 暗色トースト上の「元に戻す」文字 |

### 1-2. 面(paper)

| トークン名 | Tailwindクラス例 | 値 | 用途 |
|---|---|---|---|
| `paper` | `bg-paper` | #FDFBF7 | 画面全体の背景 |
| `paper-surface` | `bg-paper-surface` | #FFFDF8 | カード・ヘッダー・タブバー・リスト行の背景 |
| `paper-border` | `border-paper-border` | #E6E1D9 | カードの外枠線、タブバー下端 |
| `paper-divider` | `border-paper-divider` | #EEE8DE | カード内のリスト行の区切り線 |
| `paper-dashed` | `border-paper-dashed` | #DCD5C8 | 破線枠(空状態カード・写真追加タイル) |
| `paper-track` | `bg-paper-track` | #EBE5DA | 進捗バーの溝、スケルトン |
| `paper-track-border` | `border-paper-track-border` | #DED7CA | 進捗バーの溝の枠線 |
| `paper-flash` | (`animate-[paper-flash]`) | #FFF4DA | 項目を追加した直後の行のハイライト(1.2秒でフェード) |

### 1-3. 文字(ink)

上から順に濃い。用途を跨いだ流用はしない。

| トークン名 | Tailwindクラス例 | 値 | 用途 |
|---|---|---|---|
| `ink` | `text-ink` | #2A2521 | 本文・リスト項目名・しおりタイトル・暗色トーストの背景 |
| `ink-strong` | `text-ink-strong` | #3B342E | アイコン(戻る・共有)、空状態の見出し、非選択タブ |
| `ink-label` | `text-ink-label` | #5C534A | カード内の小見出しラベル(「準備状況」等) |
| `ink-sub` | `text-ink-sub` | #6F665C | 件数・日程・補足テキスト |
| `ink-muted` | `text-ink-muted` | #8C8378 | ヒント文・場所名・グループ内の件数 |
| `ink-done` | `text-ink-done` | #A79E93 | 完了済み項目の取り消し線テキスト |
| `ink-faint` | `text-ink-faint` | #BEB5A8 | 「済」バッジ、未チェックボックスの枠線、シェブロン |

デザイン案にあった #4A423A は #3B342E と視認上ほぼ同一のため `ink-strong` に統合した(トークン数を抑えるための実装判断)。

### 1-4. エラー

| トークン名 | Tailwindクラス例 | 値 | 用途 |
|---|---|---|---|
| `color-error` | `text-red-600` | #dc2626 | エラーメッセージの文字・アイコン |
| `color-error-border` | `border-red-400` | #f87171 | エラー時の入力欄枠線 |
| `color-error-bg` | `bg-red-50` | #fef2f2 | エラー時の入力欄背景(薄) |

入力の重複警告など「エラーではないが注意を促す」文言は赤ではなく `sakura-ink` を使う。

### 1-5. 期限強調(やることタブ用)

| トークン名 | Tailwindクラス例 | 値 | 用途 |
|---|---|---|---|
| `color-due-today-bg` | `bg-amber-50` | #fffbeb | 期限当日の行の背景 |
| `color-due-today-border` | `border-amber-400` | #fbbf24 | 期限当日の行の左枠線(強調バー) |
| `color-due-today-text` | `text-amber-700` | #b45309 | 期限当日の日付文字 |

### 1-5b. 広告枠プレースホルダー(F9)

| トークン名 | Tailwindクラス例 | 値 | 用途 |
|---|---|---|---|
| `color-ad-placeholder-bg` | `bg-paper-surface` | #FFFDF8 | 広告枠の背景 |
| `color-ad-placeholder-border` | `border-paper-dashed`(`border-dashed`) | #DCD5C8 | 広告枠の破線境界 |
| `color-ad-placeholder-text` | `text-ink-muted` | #8C8378 | 広告枠内の説明文字 |

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

| トークン名 | Tailwind | px | 適用対象 |
|---|---|---|---|
| `radius-sm` | `rounded-lg` | 8px | チェックボックス、小さいバッジ |
| `radius-md` | `rounded-xl` | 12px | 入力欄、小ボタン、写真タイル |
| `radius-btn` | `rounded-btn` | 14px | 主CTAボタン(独自追加。Tailwind既定に無い中間値) |
| `radius-lg` | `rounded-2xl` | 16px | カード、リストカード、ボトムシート上端 |
| `radius-full` | `rounded-full` | 完全な円/ピル | 進捗バー、追従ボタン、チップ |

## 4. タイポグラフィトークン

書体は **Zen Kaku Gothic New**(Google Fonts)。`src/app/layout.tsx` で `next/font` により自己ホストする。
weightは400/500/700/900の4種を読み込む。

`next/font` が持つこのファミリのサブセット一覧には `japanese` が無いため `subsets` は**指定しない**
(指定すると日本語グリフが欠落しシステムフォントにフォールバックする)。あわせて `preload: false` とし、
約110分割されたunicode-rangeチャンクの全先読みを避ける。

| トークン名 | Tailwind | サイズ/太さ | 用途 |
|---|---|---|---|
| `text-title` | `text-[22px]/[1.35] font-black` | 22px / 900 | しおりタイトル(ヘッダー通常時) |
| `text-title-compact` | `text-[17px]/[1.35] font-black` | 17px / 900 | しおりタイトル(スクロール時) |
| `text-heading` | `text-base font-black` | 16px / 900 | 日付グループ見出し(旅程・記録) |
| `text-tab` | `text-[15px] font-bold` / `font-medium` | 15px | タブ(選択中は700、非選択は500) |
| `text-body` | `text-base font-medium` | 16px / 500 | リスト項目名・入力値 |
| `text-body-done` | `text-base font-normal line-through` | 16px / 400 | 完了済みのリスト項目名 |
| `text-label` | `text-[13px] font-bold` | 13px / 700 | カード内の小見出し(「準備状況」等) |
| `text-body-sm` | `text-[13px] font-medium` | 13px / 500 | 件数・日程・並べ替えボタン |
| `text-caption` | `text-xs` | 12px / 400 | ヒント文・注意書き・文字数カウンタ |
| `text-button` | `text-[15px] font-bold` | 15px / 700 | ボタン文言 |

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
