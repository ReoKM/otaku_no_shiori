import {
  calculateMigrationProgressPercent,
  formatMigrationProgressLabel,
  type MigrationStatus,
} from "@/lib/migration-status";

/**
 * S6データ移行状態カード。
 * 参照: docs/design/screens/S6_設定アカウント.md「LoggedInSection」2. MigrationStatusCard、「状態」表
 *
 * `status`が`null`(移行対象データが無い/移行状態が未連携)の場合はカードごと非表示にする
 * (仕様「移行対象データが無い場合はカードごと非表示」)。
 *
 * 実際の移行トリガー・進捗取得(Issue #99「移行フロー結線」)はまだこのカードに配線されていない。
 * 呼び出し元(`LoggedInSection`)は現時点で`status={null}`を渡すため、本Issue(#96)の時点では
 * このカードは表示されない。Issue #99は`status`・`onRetry`に実データを渡すだけでよい想定
 * (このコンポーネント自体の変更は基本不要)。
 */
export function MigrationStatusCard({
  status,
  onRetry,
}: {
  status: MigrationStatus | null;
  /** 再試行ボタン押下時の処理。Issue #99が実際の再試行処理を渡す想定(未連携時は何もしない)。 */
  onRetry?: () => void;
}) {
  if (status === null) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-paper-border bg-paper-surface p-4">
      <p className="text-[13px] font-bold text-ink-label">データ移行</p>

      {status.kind === "in_progress" && (
        <>
          <p className="mt-1 text-[13px] font-medium text-ink">
            {formatMigrationProgressLabel(status.migratedCount, status.totalCount)}
          </p>
          <div
            role="progressbar"
            aria-label="データ移行の進捗"
            aria-valuenow={calculateMigrationProgressPercent(status.migratedCount, status.totalCount)}
            aria-valuemin={0}
            aria-valuemax={100}
            className="mt-2.5 box-border h-2.5 overflow-hidden rounded-full border border-paper-track-border bg-paper-track"
          >
            <div
              className="h-full rounded-full bg-sakura transition-[width] duration-300"
              style={{
                width: `${calculateMigrationProgressPercent(status.migratedCount, status.totalCount)}%`,
              }}
            />
          </div>
        </>
      )}

      {status.kind === "completed" && (
        <>
          <p className="mt-1 text-[13px] font-medium text-sakura-ink">移行が完了しました</p>
          <p className="mt-1 text-xs text-ink-sub">これからはクラウドに自動保存されます</p>
        </>
      )}

      {status.kind === "partial_failure" && (
        <>
          <p className="mt-1 text-[13px] font-medium text-red-600">一部のデータを移行できませんでした</p>
          <p className="mt-1 text-xs text-ink-sub">電波の良い場所でもう一度お試しください</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 min-h-12 w-full rounded-btn border border-sakura-border bg-white text-[15px] font-bold text-sakura-ink"
          >
            再試行
          </button>
        </>
      )}
    </div>
  );
}
