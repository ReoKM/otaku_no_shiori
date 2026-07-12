# 作業ログ(frontend-dev, W1タスク#9専用)

※タスク#8(F2持ち物リスト)が同時刻に`2026-07-11_frontend-dev.md`へ追記するため、
コンフリクト回避で本タスク(#9)専用にファイル名を分けている(呼び出し元指示による仮置き)。

## 03:30 F3実装: TODOリスト(テンプレ+期限日+ゲスト保存)

- Goal: テンプレTODOが投入され、期限日の追加・編集・削除、期限が近い順の表示、期限当日の強調表示が動き、IndexedDBに保存される状態のPRが1本出ている。
- 結果: 達成
- やったこと:
  - `docs/design/screens/S3b_TODO.md`・`docs/01_service_spec.md`(F3)・`docs/design/tokens.md`を確認
  - 純粋関数を`src/lib/todo-sort.ts`に切り出し: `isDueToday`(期限当日判定)/`sortTodos`(未完了→完了・期限近い順・期限なし末尾のソート規則)/`todoGroupKey`・`canMoveUp`・`canMoveDown`・`moveTodoInGroup`(並べ替えモードのグループ境界ロジック)/`formatDueDate`(「8/15(土)」形式)/`todayYmd`
  - `src/lib/todo-sort.test.ts`(28件)・`src/lib/todo-validation.test.ts`(5件)を追加。`npm test`で計77件全通過を確認
  - `src/lib/todo-validation.ts`にラベルのtrim()バリデーション(空なら「TODOの名前を入れてください」)を追加
  - `src/lib/todo-template-seed.ts`にテンプレ投入済みフラグ(localStorage、仮置き)を追加
  - `src/templates/todo-templates.ts`にF3テンプレ(チケット申込/当落確認/チケット発券/ホテル予約/交通手配/遠征資金の準備、期限日すべて未設定)と`seedTodoTemplate`を追加(`guest-store.ts`の`createTodo`を呼ぶのみで`guest-store.ts`自体は変更していない)
  - `src/components/todo/`配下にS3b仕様書のコンポーネント名どおり実装: `TodoTab`(本体、状態管理)/`Toolbar`/`TodoRow`(通常/編集中/削除確認中)/`TodoRowSortMode`/`EmptyTodo`/`AddForm`/`TodoSkeleton`
  - `src/app/shiori/[id]/todo/page.tsx`のプレースホルダーを`TodoTab`呼び出しに置き換え
  - `npm run lint && npm run typecheck && npm test`が全部通ることを確認
  - Playwright(検証用に`--no-save`で一時インストール、コミット対象外)で実機相当の動作確認: しおり作成→TODOタブ初回オープンでテンプレ6件自動投入→期限日を当日に編集して強調表示(背景色+左枠線+「(今日)」)を確認→チェックで完了済みが末尾に移動を確認→並べ替えモードでグループ境界の矢印がdisabled表示になることを確認→手動追加→削除確認→リロード後もIndexedDBに保存された状態が維持されることを確認。スクリーンショット7枚で375px幅の崩れが無いことも確認
  - `npm run build`(Next.js本番ビルド)が成功することを確認
- できていないこと: なし
- 不明点・仮置き:
  - テンプレ投入済みフラグは`guest-store.ts`/`types/shiori.ts`を変更しない方針のため、`localStorage`キー(`todo-template-seeded:<shioriId>`)で実装した(週次計画の指示どおりの仮置き)
  - 手動追加項目の文字数上限30文字はS3b仕様書側の仮置き(数値記載なし)をそのまま踏襲。上限超過時の専用エラー文言は仕様に無いため`maxLength`属性でタイプ自体を防ぐのみとした
  - 編集中のキャンセルボタンのaria-label「編集をキャンセル」はS3b自体の文言一覧には無いが、`S3a_持ち物.md`の同パターンに合わせて付与した(視認可能な文言ではなくアクセシビリティラベルのため文言一覧との不一致ではないと判断)
- 成果物: PR #24(https://github.com/ReoKM/otaku_no_shiori/pull/24)
