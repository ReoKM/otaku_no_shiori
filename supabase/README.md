# Supabase 接続手順

対応タスク: `docs/plans/2026-W28.md` タスク#3。マイグレーションSQLの作成までがこのリポジトリのスコープ。
実際のSupabaseプロジェクト作成・APIキー発行はオーナー作業(`CLAUDE.md`のルールで秘密情報はコード・ログに書けないため)。

## ディレクトリ

- `supabase/migrations/0001_initial_schema.sql`: 初期スキーマ(7テーブル)+ RLSポリシー + Storageバケット設定

## オーナーに必要な作業

1. [supabase.com](https://supabase.com) でプロジェクトを新規作成する(Organization/Region/DBパスワードを決める。Regionは日本に近い `ap-northeast-1 (Tokyo)` 推奨)
2. Authentication → Providers で **X (Twitter)** と **Google** のOAuthを有効化する(それぞれ開発者ダッシュボードでOAuthアプリ登録が必要。これはF8実装時=W3スコープなのでW1では後回しでよい)
3. SQL Editor で `supabase/migrations/0001_initial_schema.sql` の内容を実行する(または Supabase CLI で `supabase db push`)
4. Project Settings → API から次の値を取得する

   | 値 | 用途 | 公開範囲 |
   |----|------|----------|
   | Project URL | クライアント/サーバー両方から使う接続先 | 公開可(フロントに埋め込む) |
   | `anon` public key | クライアント(ブラウザ)用。RLSに守られる前提の鍵 | 公開可(フロントに埋め込む) |
   | `service_role` key | サーバー専用の管理者鍵。RLSを無視できる | **非公開**。サーバー環境変数にのみ設定し、クライアントコード・ログ・リポジトリに絶対書かない |

5. 取得した値を次の場所に環境変数として登録する

   | 環境変数名 | 設定先 | 値 |
   |------------|--------|-----|
   | `NEXT_PUBLIC_SUPABASE_URL` | Netlify環境変数 + GitHub Actions Secrets(テストで使う場合) | Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Netlify環境変数 | anon public key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Netlify環境変数(サーバー専用。`NEXT_PUBLIC_`プレフィックスを付けない) | service_role key |

6. Storage → `photos` バケットが自動作成されていることを確認する(マイグレーション内で作成済み)。Max File Size 2MB・許可MIMEタイプ(image/jpeg, image/webp, image/png)が設定されていることを確認する

## RLS設計の要点(セルフチェック済み)

- 全7テーブルで `ENABLE ROW LEVEL SECURITY` 済み
- 子テーブル(`packing_items` / `todos` / `itinerary_entries` / `photos` / `shiori_spots`)は親 `shiori.user_id = auth.uid()` を参照する `EXISTS` ポリシー
- `shiori.user_id` は `NOT NULL` + `public.users(id)` への外部キー
- `spots` は `status = 'public'` または `source = 'seed'` のみ全員読み取り可。それ以外は `created_by = auth.uid()` の本人のみ
- `spots` の更新は本人の行のみ許可し、かつ `with check` で `source = 'ugc'` かつ `status in ('private', 'pending')` に固定(本人が `status` を直接 `public` にしたり `source` を `seed` に書き換えて審査を回避できないようにする)
- Storage `photos` バケットは `{user_id}/{shiori_id}/{filename}` のパス規約を前提に、先頭フォルダ(`user_id`)が本人と一致する場合のみ読み書き可

## まだ実装していないもの(次タスク以降)

- Next.jsからSupabaseクライアントを呼び出すコード(`src/lib/supabase/`)。F1〜F3実装時に追加
- API Route(しおり作成等)。バックエンドAPIは各機能実装タスクで追加
- ゲスト→ログインのデータ移行処理(F8。W3スコープ)
