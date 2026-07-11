# オタクのしおり

> 遠征(ライブ・イベント・聖地巡礼)のすべてを、1冊の「しおり」に。

オタクの遠征に必要な「持ち物・TODO・旅程・行きたいスポット・写真とログ」を1つにまとめ、
遠征後は映える共有画像にしてSNSに投稿できる、遠征のための実用ツール。

## ドキュメント

サービス仕様は10問のインタビュー(2026-07)で確定した意思決定に基づく。

| ドキュメント | 内容 |
|--------------|------|
| [docs/00_vision.md](./docs/00_vision.md) | ビジョン・コンセプト・ターゲット・北極星指標 |
| [docs/01_service_spec.md](./docs/01_service_spec.md) | MVPのサービス仕様(機能・画面・フロー・非スコープ) |
| [docs/02_roadmap.md](./docs/02_roadmap.md) | ロードマップ(MVP 3週間 → ひなたフェスキャンペーン → AIルート生成) |
| [docs/03_tech_stack.md](./docs/03_tech_stack.md) | 技術選定・データモデル・コスト見積り |
| [docs/04_growth_monetization.md](./docs/04_growth_monetization.md) | 集客(UGC/SNS/SEO)・収益化(広告→クレジット課金) |
| [docs/05_agent_team.md](./docs/05_agent_team.md) | AI自律開発体制(12エージェント+スキル設計・ライティング規約) |

## 基本方針(サマリ)

- **実用性ファースト**: 1人で使っても便利、を最優先。収集癖・共感はそれを支える
- **MVPは3週間で公開**: 機能は最小限、スマホWeb/PWA、ゲスト利用OK(登録は保存・共有時)
- **UGCで広がる**: 共有画像(ロゴ+URL入り)が主の流入動線。公式XはAI下書き→オーナー承認投稿
- **収益化は段階的に**: バナー広告 → AI聖地巡礼ルート生成のクレジット制
- **AI自律開発**: オーナーはコードを書かず、承認と意思決定のみ。開発・運用・集客はエージェントチームが行う

## AI自律開発体制

- 共通ルール: [CLAUDE.md](./CLAUDE.md)
- エージェント定義(12体): `.claude/agents/`
- スキル(6種): `.claude/skills/`(`/sns-draft` `/spec-sync` `/weekly-report` `/release-check` `/seed-spot` `/self-improve`)

## 開発環境

Next.js(App Router)+ TypeScript + Tailwind CSS。詳細な構成方針は [docs/03_tech_stack.md](./docs/03_tech_stack.md) を参照。

```bash
npm install       # 依存関係インストール
npm run dev       # 開発サーバー起動(http://localhost:3000)
npm run lint      # ESLint
npm run typecheck # tsc --noEmit
npm test          # Vitest
npm run build     # 本番ビルド
```

### CI

PR作成時に GitHub Actions(`.github/workflows/ci.yml`)が `lint` / `typecheck` / `test` の3ジョブを実行する。すべて成功しないとPRはマージ可能な状態にならない。

### Supabase

- マイグレーションSQLは `supabase/migrations/` に置く(スキーマ+RLSポリシー)
- 実際のSupabaseプロジェクト作成・APIキー発行はオーナー作業(秘密情報のためエージェントはコード・ログに書かない)。手順は `supabase/README.md` を参照

## ステータス

W1(基盤+しおり作成/持ち物/TODO)着手中。Next.jsプロジェクト基盤・CI・Supabaseスキーマ(SQL)まで完了。実プロジェクトへの接続・画面実装は次タスク。
