# Netlify デプロイ手順書

対応タスク: `docs/plans/2026-W28.md` タスク#10。
設定ファイルの作成とオーナー向け手順の整備までがこのリポジトリのスコープ。
実際のNetlifyアカウント作成・GitHubリポジトリ連携・環境変数への実キー登録は**オーナー作業**(`CLAUDE.md`のルールで秘密情報はコード・ログに書けないため)。

選定経緯・クレジット制の詳細は `docs/03_tech_stack.md`(ホスティング選定の経緯/クレジット制ルール)を参照。要点だけここに再掲する。

## ディレクトリ

- `netlify.toml`: ビルド設定(`npm run build`)+ `@netlify/plugin-nextjs` + Node関数のネイティブバイナリ対策

## 前提: なぜNetlifyか(要点)

- Netlify Freeは商用利用・広告(AdSense)掲載が明示的に可
- Next.js SSR・Node関数(W2のF7: satori+resvgによる共有画像生成)に対応
- 無料枠は**月間300クレジットのハードリミット**。超過すると自動リチャージ不可で月次リセットまで復旧できない
- 主な消費レート: 本番デプロイ **15クレジット/回**、帯域 **20クレジット/GB**

このハードリミットがあるため、後述の「auto-publish無効化」が必須の運用ルールになっている。

## 1. オーナー向け接続手順(未連携の場合)

1. [netlify.com](https://netlify.com) でアカウントを作成する(GitHubアカウントでのサインアップを推奨)
2. 「Add new site」→「Import an existing project」→ GitHub を選択し、`ReoKM/otaku_no_shiori` リポジトリを連携する
3. ビルド設定を確認する(`netlify.toml` から自動検出されるはずだが念のため確認)
   - Build command: `npm run build`
   - Publish directory: Next.jsプラグイン使用時は自動設定(手動指定不要)
   - ブランチ: `main` を Production branch に設定
4. サイト作成後、下記「2. 環境変数一覧」の値を Site settings → Environment variables に登録する(現時点では登録不要。W2/W3で追加時にオーナーへ改めて依頼する)
5. 下記「3. auto-publish無効化」を必ず実施する
6. デプロイ完了後、発行された `https://<site-name>.netlify.app` のURLで表示確認する(独自ドメインの検討は `docs/02_roadmap.md` の通りW3直前)

## 1-2. 連携済みの場合の確認項目

オーナーが既にNetlify連携済みと報告している場合、次を確認する(実施はオーナー作業)。

- [ ] Site settings → Build & deploy → Build settings で Build command が `npm run build` になっているか(`netlify.toml` を認識していれば自動反映される)
- [ ] `@netlify/plugin-nextjs` プラグインが有効になっているか(Site settings → Build & deploy → Plugins、または `netlify.toml` の `[[plugins]]` が認識されているか)
- [ ] Production branch が `main` になっているか
- [ ] 下記「3. auto-publish無効化」が設定済みか(**未設定なら最優先で対応**。マージのたびに本番デプロイされ続けるとクレジットが早期に枯渇する)
- [ ] 環境変数が未登録であること(現時点ではコードが環境変数を参照していないため、誤って本番キーが登録されていないか念のため確認)

## 2. 環境変数一覧

現時点(W1)でコードが参照する環境変数は**無し**。

以下はW2/W3で必要になる想定の「将来用」一覧(`supabase/README.md` と整合)。**値は絶対にこのファイル・コード・ログに書かない**。実キーの登録はオーナーがSupabaseプロジェクト作成後にNetlify管理画面上で直接行う。

| 環境変数名 | 用途 | 公開範囲 | 設定先 | 必要になる時期 |
|------------|------|----------|--------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabaseプロジェクトの接続先URL | 公開可(フロントに埋め込む) | Netlify Site settings → Environment variables | W2以降(F1〜F3のSupabase接続時) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | クライアント(ブラウザ)用の匿名キー。RLSに守られる前提 | 公開可(フロントに埋め込む) | Netlify Site settings → Environment variables | W2以降 |
| `SUPABASE_SERVICE_ROLE_KEY` | サーバー専用の管理者キー。RLSを無視できる | **非公開**。`NEXT_PUBLIC_` プレフィックスを付けない。クライアントコードに絶対含めない | Netlify Site settings → Environment variables(サーバー専用スコープ) | W3(ゲスト→ログイン移行APIなど、サーバー側でRLSをバイパスする処理が必要になった場合のみ) |

登録時の注意:

- 値をSlack・Issue・PR本文・コミットメッセージに貼らない
- `SUPABASE_SERVICE_ROLE_KEY` はNetlifyの「Contains secret values」等のシークレット扱い設定がある場合は必ず有効にする
- ローカル開発用の値は各自の `.env.local`(gitignore対象)に置き、リポジトリにコミットしない

## 3. auto-publish無効化(Locked deploys)の操作手順

`docs/03_tech_stack.md` のクレジット制ルール: 「mainへのマージごとに本番デプロイしない。auto-publishを無効化し、本番反映は週1〜2回のまとめデプロイにする」。

### 設定手順(オーナー作業)

1. Netlify管理画面でサイトを開く
2. 「Deploys」タブを開く
3. 「Trigger deploy」ボタンの右側(または Deploy settings 内)にある「Lock deploys(deployをロックする)」を選択する
   - Locked状態にすると、`main` へのマージがあっても**自動では本番反映されなくなる**(ビルド自体は走ってもpublishされない、またはビルド自体をスキップする設定にする。UIの文言はNetlifyのバージョンにより異なるため、「Stop builds」または「Lock deploy」相当の設定を確認して有効化する)
4. Locked状態でも「Trigger deploy」→「Deploy site」を手動実行すれば、その時点のmainを本番反映できる(週1〜2回のまとめデプロイはこの手動トリガーで行う)

### 運用ルール

- PRの動作確認は**プレビューデプロイ**で行う(無料枠でプレビューは無制限。Locked deploysの影響を受けない)
- 本番反映(mainの内容を公開)は**週1〜2回**、まとめて手動デプロイする
- 本番デプロイ1回で**15クレジット**消費する。月300クレジット上限のため、目安として月20回(週5回)が理論上の上限だが、帯域消費(20クレジット/GB)もあるため実際はさらに少ない回数に抑える
- クレジット超過の兆候が見えたら、Netlify Pro($20/月)へのアップグレードかCloudflareへの移行をオーナーが判断する(`docs/03_tech_stack.md` 参照)。エージェント側で勝手にアップグレードしない

## 4. 本番デプロイのクレジット消費まとめ

| 操作 | 消費クレジット | 備考 |
|------|----------------|------|
| 本番デプロイ1回 | 15クレジット | 週1〜2回のまとめデプロイのみで実行する |
| 帯域 | 20クレジット/GB | 写真等の重いデータはSupabase Storage側に載せ、Netlify側の帯域消費を抑える方針(`docs/03_tech_stack.md`) |
| プレビューデプロイ | 無料枠で無制限 | PR確認はこちらを使う |

月間上限300クレジットを超えると全プロジェクトが一時停止し(「Site not available」表示)、無料プランは自動リチャージ不可のため月次リセットまで復旧できない。デプロイ頻度は必ずこのルールの範囲内に収める。

## まだ実装していないもの(次タスク以降)

- 実際のNetlifyサイト作成・GitHub連携(オーナー作業)
- Netlify Functions本体の実装(W2のF7: 共有画像生成)
- 環境変数の実キー登録(Supabaseプロジェクト作成後、オーナー作業)
