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

## Next.jsからの接続(実装済み)

`src/lib/supabase/` に3種類のクライアントがある。用途で使い分ける。

| ファイル | 使う場所 | 使う鍵 | RLS |
|----------|----------|--------|-----|
| `client.ts` (`getSupabaseBrowserClient`) | Client Component(`"use client"`) | anon | 効く |
| `server.ts` (`createSupabaseServerClient`) | Server Component / Route Handler / Server Action | anon + Cookieのセッション | 効く |
| `admin.ts` (`getSupabaseAdminClient`) | サーバーのみ。ゲスト→ログイン移行(F8)など限定用途 | `service_role` | **無視される** |

`admin.ts` はクライアントコードからimportしないこと。`window` があれば実行時に例外を投げるガードを入れてある。

## 接続確認の方法

環境変数を設定したあと、次の2通りで疎通を確認できる。どちらも `spots` テーブルへ件数のみのクエリを1回投げる(未ログインでも `status = 'public'` / `source = 'seed'` を読めるRLS設定のため、ログイン不要で判定できる)。

### 1. CLIから

```
$ npm run check:supabase
Supabase接続チェック

✓ NEXT_PUBLIC_SUPABASE_URL https://xxxxxxxx.supabase.co
✓ NEXT_PUBLIC_SUPABASE_ANON_KEY sb_publishable_… (46文字)
✓ SUPABASE_SERVICE_ROLE_KEY sb_secret_… (41文字)

✓ spots テーブルへ接続成功 (anonキーで見えている行数: 0)
```

失敗時は終了コード1と、原因別の対処ヒント(マイグレーション未適用 / APIキー不正 / URL・ネットワーク)を表示する。鍵の値そのものは表示しない。

### 2. アプリのAPIから

```
$ npm run dev
$ curl -s localhost:3000/api/health/supabase
{"ok":true,"table":"spots","visibleRowCount":0}
```

失敗時はHTTP 503と `{"ok":false,...,"hint":"..."}` を返す。

> CIではどちらも実行しない(GitHub ActionsにSupabaseのSecretsを持たせないため)。CIが通すのはenv検証・結果整形のユニットテストのみ。

## まだ実装していないもの(次タスク以降)

- API Route(しおり作成等、ログイン後の通常CRUD)。バックエンドAPIは各機能実装タスクで追加
- 認証(X/Google OAuth)のコールバックとセッション更新middleware(F8。W3スコープ)
- 写真バイナリの移行(Supabase Storageへの1枚ずつアップロード。#98)
- DBスキーマからの型生成(`supabase gen types`)。テーブルを実際に読み書きするAPI実装時に導入を検討

## 実装済み: ゲスト→ログインのデータ移行(テキストのみ、#97)

`POST /api/migration/guest`(仮置きのエンドポイント名)で、しおり/持ち物/TODO/旅程/行きたいスポットの
テキストデータを一括INSERTする。片道の移行専用で、ログイン後の一般CRUD APIではない。

- 認証はCookieセッション(`server.ts`)で確定させたユーザーIDのみを使う(リクエストボディの`user_id`は無視)
- 書き込みは`admin.ts`(`service_role`)。各テーブルへ主キーで`upsert`(`ignoreDuplicates: true`)するため、
  部分失敗後に同じペイロードを再送しても安全(冪等)
- `shiori_spots`がシードスポット(`seed-`ID)を参照する場合、`seedSpotDbId()`で決定論的UUIDへ変換し、
  `spots`テーブルへ`source='seed', status='public'`として(共有行として)upsertしてから紐付ける
  (参照: docs/design/screens/S4_スポット検索.md「参照整合性の注記」)
- 実装: `src/app/api/migration/guest/route.ts` / `src/lib/guest-migration.ts` /
  `src/lib/guest-migration-validation.ts` / `src/lib/seed-spot-db-id.ts`
- **実データでの疎通確認は未実施**(この開発環境に実Supabaseプロジェクトの鍵が無いため)。
  Netlifyプレビューデプロイ上でQA/オーナーが手動確認する
