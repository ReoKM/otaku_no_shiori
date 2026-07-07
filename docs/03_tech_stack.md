# 03. 技術選定

前提: ランニングコストは**月0〜数千円**(無料枠中心)。3週間でMVPを出せるシンプルさを最優先。
AIエージェントが実装しやすいよう、広く使われた定番構成のみを採用する。

## スタック一覧

| レイヤー | 採用 | 理由 |
|----------|------|------|
| フレームワーク | **Next.js (App Router) + TypeScript** | Vercelとの相性・情報量・エージェントの実装精度が高い |
| UI | **Tailwind CSS** | スマホ最優先のUIを速く作れる。デザイントークンを一元管理 |
| ホスティング | **Vercel(Hobby/無料枠)** | デプロイ自動化が容易。商用利用の規約面で問題が出たら Cloudflare Pages/Workers へ移行(比較を下記) |
| BaaS | **Supabase(無料枠)** | Auth(X/Google OAuth)+Postgres+Storageが1つで揃う |
| ゲスト保存 | **IndexedDB(ラッパーとして idb など軽量ライブラリ)** | localStorageの5MB制限を回避し写真ログにも対応 |
| 共有画像生成 | **satori + resvg(@vercel/og 系)によるサーバー生成** | HTML/CSSライクにテンプレを書けてエージェントが保守しやすい。1080×1920縦長 |
| 画像リサイズ | クライアント側(Canvas)で長辺1600pxに縮小してからアップロード。**加えてSupabase Storageのバケット設定でMax File Size(2MB以下)と許可MIMEタイプ(image/jpeg, image/webp等)を必ず制限する**(クライアント処理のバイパス対策=多層防御) | Storage無料枠(1GB)の保護 |
| 地図リンク | GoogleマップのURLスキーム(`https://www.google.com/maps/search/?api=1&query=...`) | APIキー不要・無料。地図SDKはMVPでは使わない |
| 計測 | Google Analytics 4(または Cloudflare Web Analytics) | 無料。共有画像経由流入はURLパラメータ(`?via=share`)で識別 |
| 広告 | Google AdSense | 審査通過後に有効化。枠はレイアウトに最初から確保 |
| CI/CD | GitHub Actions(lint+型チェック+テスト)→ Vercel自動デプロイ | エージェント開発の品質ゲート |
| 課金(Phase 3) | Stripe | クレジット制課金。MVPでは導入しない |

### Vercel vs Cloudflare(メモ)

- Vercel Hobbyは商用サイトの扱いに制約があるため、**AdSense収益が発生する頃にVercel Pro($20/月)へ上げるか、Cloudflare Pages(無料で商用可)へ移行するかを判断**する
- satori系の画像生成はCloudflare Workersでも動かせる(`workers-og`等)ため移行は可能
- MVP期(収益ゼロ)はVercel無料枠で開始し、Phase 2の判断ポイントとして記録しておく

## データモデル草案

```mermaid
erDiagram
    users ||--o{ shiori : owns
    shiori ||--o{ packing_items : has
    shiori ||--o{ todos : has
    shiori ||--o{ itinerary_entries : has
    shiori ||--o{ shiori_spots : has
    spots ||--o{ shiori_spots : referenced_by
    shiori ||--o{ photos : has
```

| テーブル | 主なカラム |
|----------|-----------|
| `users` | id, auth_provider, display_name, created_at(Supabase Authに準拠) |
| `shiori` | id, user_id(NOT NULL・`users` への外部キー), title, start_date, end_date, trip_type(live/seichi/stage/other), purpose, cover, created_at, updated_at ※ゲストデータは端末内のみに存在し、クラウドにはログイン後の移行時に必ず `user_id` 付きでINSERTされる |
| `packing_items` | id, shiori_id, label, is_checked, sort_order |
| `todos` | id, shiori_id, label, due_date, is_done, sort_order |
| `itinerary_entries` | id, shiori_id, day_date, time, title, place_name, memo, sort_order |
| `spots` | id, name, description(オタク文脈), category, area, source(seed/ugc), status(private/pending/public), created_by |
| `shiori_spots` | shiori_id, spot_id, memo(しおり内メモ), is_visited |
| `photos` | id, shiori_id, day_date, storage_path, caption, created_at |

設計メモ:

- ユーザー自由入力スポットも `spots` に `source=ugc, status=private` で入れる(Phase 2の公開申請フローで `pending → public` に遷移できる形にしておく)
- テンプレート(持ち物・TODO)はMVPでは**コード内の定数**(JSON)でよい。DB化はテンプレが増えるPhase 2で検討
- Supabase RLS(Row Level Security)を**全テーブルに**設定する。「自分のしおりだけ読み書き可」に加え、子テーブル(`packing_items` / `todos` / `itinerary_entries` / `photos` / `shiori_spots`)にも親 `shiori.user_id` を参照するポリシー(`EXISTS` 句)を必ず適用する(`shiori_id` を知る第三者の不正読み書きを防ぐ)。`spots` は `status=public` または `source=seed` のみ全員読み取り可

## ゲスト → ログインのデータ移行

1. ゲストのしおり一式はIndexedDBに、サーバーと同じスキーマ形状(JSON)で保存する(写真はバイナリ=BlobとしてIndexedDBに保存)
2. ログイン成功時、端末内の全しおり(テキストデータ)をAPIに送信 → サーバー側で `user_id` を付けて一括INSERT
3. 続いて写真バイナリを1枚ずつSupabase Storageへアップロードし、返ってきた `storage_path` を対応する `photos` レコードに紐付けて登録する(枚数が多い場合に備え、進捗表示+失敗分のみ再送できる実装にする)
4. テキスト+写真の全件成功後にIndexedDB側へ「移行済み」フラグを付け、以後はクラウドを正とする
5. 衝突は考えない(ゲストデータは新規INSERTのみ。同一ユーザーの複数端末ゲストデータもそれぞれ別しおりとして追加)
6. 移行失敗時はゲストデータを消さずリトライ可能にする(端末データを消すのは移行成功後のみ)

## 月額コスト見積り

| 項目 | MVP期 | 成長期の目安 |
|------|-------|--------------|
| Vercel | 0円 | Pro $20/月 or Cloudflareへ移行で0円 |
| Supabase | 0円 | Pro $25/月(DB 500MB/Storage 1GB超過時) |
| ドメイン | 約150円/月(年1,500〜2,000円) | 同左 |
| GA4/AdSense | 0円 | 0円 |
| AI API(SNS下書き等) | 0円〜数百円(このリポジトリのエージェント運用内で完結させる) | ルート生成開始後は従量。クレジット課金で回収 |
| **合計** | **約150円〜数百円/月** | 収益に応じて段階増 |

## リポジトリ構成(実装開始時の指針)

```
otaku_no_shiori/
├── docs/                  # 本仕様書群(常に最新を維持)
├── src/
│   ├── app/               # Next.js App Router(画面: S1〜S6)
│   ├── components/
│   ├── lib/               # supabaseクライアント, ゲスト保存(IndexedDB), 移行ロジック
│   ├── templates/         # 持ち物・TODOテンプレ(JSON定数)、共有画像テンプレ
│   └── types/
├── supabase/              # マイグレーションSQL, RLSポリシー
├── seeds/                 # 運営シードスポットのデータ(JSON/CSV)
└── .claude/               # エージェント定義・スキル(→ docs/05_agent_team.md)
```

## 品質ゲート(CI)

- `lint`(ESLint)+ `tsc --noEmit` + ユニットテスト(Vitest)をGitHub Actionsで必須化
- E2Eは主要フロー1本(しおり作成→持ち物チェック→共有画像生成)をPlaywrightでW3に追加
- mainブランチ直pushは禁止。全変更はPR経由(コードレビュアーエージェントが必ずレビュー)
