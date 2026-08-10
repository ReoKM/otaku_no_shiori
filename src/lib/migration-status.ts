/**
 * S6 `MigrationStatusCard`(データ移行状態カード)の状態モデルと表示文言の整形ロジック。
 * 参照: docs/design/screens/S6_設定アカウント.md「LoggedInSection」2. MigrationStatusCard、「状態」表
 *
 * 実際の移行トリガー・進捗取得(ゲスト→クラウドのテキスト一括移行・写真1枚ずつのアップロード)は
 * `src/lib/guest-migration-orchestrator.ts` + `src/lib/use-guest-migration.ts`(Issue #99
 * 「移行フロー結線」)が担当する。`MigrationStatus`型はIssue #99実装時にそのまま流用でき、
 * 型調整は不要だった(`runGuestMigration`の戻り値をこの型の3種にそのままマップしている)。
 */

/**
 * データ移行状態。
 *
 * - `null`（呼び出し側の型ではなく、propとして渡す値）: 移行対象データが無い、または
 *   状態が未取得。カードごと非表示にする（仕様「移行対象データが無い場合はカードごと非表示」）
 * - `in_progress`: 移行中。進捗バーを表示する
 * - `completed`: 移行完了
 * - `partial_failure`: 一部失敗。再試行ボタンを表示する
 */
export type MigrationStatus =
  | { kind: "in_progress"; migratedCount: number; totalCount: number }
  | { kind: "completed" }
  | { kind: "partial_failure" };

/**
 * 移行中の状態行の文言を組み立てる。
 * 文言一覧「移行中 | しおりを移行しています…(例: 3/5件)」に対応する。
 *
 * 例: `formatMigrationProgressLabel(3, 5)` → `"しおりを移行しています…(3/5件)"`
 */
export function formatMigrationProgressLabel(migratedCount: number, totalCount: number): string {
  return `しおりを移行しています…(${migratedCount}/${totalCount}件)`;
}

/**
 * 進捗バーの`aria-valuenow`用パーセンテージ(0〜100の整数)を計算する。
 * `totalCount`が0の場合は0を返す(0除算を避ける。`PackingProgressCard`と同じ考え方)。
 */
export function calculateMigrationProgressPercent(migratedCount: number, totalCount: number): number {
  if (totalCount <= 0) {
    return 0;
  }
  return Math.round((migratedCount / totalCount) * 100);
}
