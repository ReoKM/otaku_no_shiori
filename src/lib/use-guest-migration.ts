"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  createFetchGuestMigrationApiClient,
  runGuestMigration,
} from "@/lib/guest-migration-orchestrator";
import {
  collectAllGuestTextData,
  getGuestMigrationState,
  listAllGuestPhotos,
  markGuestDataMigrated,
} from "@/lib/guest-store";
import type { MigrationStatus } from "@/lib/migration-status";

/**
 * S6`MigrationStatusCard`向けに、ゲスト→クラウド移行フロー(F8・Issue #99)を実行し
 * 進捗状態を返すフック。参照: docs/design/screens/S6_設定アカウント.md「状態」表
 *
 * ログイン成功の検知は`supabase.auth.onAuthStateChange`の`SIGNED_IN`イベントで行う
 * (`src/components/settings/SettingsRoute.tsx`の購読パターンを踏襲)。加えて、
 * 前回セッションで移行が完了しないままアプリを閉じたケースを拾えるよう、マウント時点で
 * 既にログイン済みだった場合も1回実行する(`guest-store`側の移行済みフラグがあるため、
 * 既に完了している場合は`runGuestMigration`が`no_data`を返すだけで実害は無い)。
 *
 * 実際の移行ロジック(`runGuestMigration`)はSupabase/IndexedDB/fetchに依存しない
 * 純粋寄りの関数として`guest-migration-orchestrator.ts`に切り出してあり、そちらを
 * ユニットテストの対象にしている。このフック自体はReactへの配線のみを担当する
 * (`src/lib/use-compact-header.ts`等、既存のuse-*.tsフックと同じ方針)。
 */
export interface UseGuestMigrationResult {
  /** `MigrationStatusCard`にそのまま渡せる状態。`null`ならカードごと非表示。 */
  status: MigrationStatus | null;
  /** 再試行ボタン押下時に呼ぶ。失敗した写真のみを再送する。 */
  onRetry: () => void;
}

export function useGuestMigration(): UseGuestMigrationResult {
  const [status, setStatus] = useState<MigrationStatus | null>(null);
  // 直近の失敗写真ID一覧。再試行ボタンはこれを`retryFailedPhotoIds`として渡す。
  const failedPhotoIdsRef = useRef<string[]>([]);
  // 二重起動防止(SIGNED_INイベントとマウント時チェックが両方走るケースがあるため)。
  const runningRef = useRef(false);

  const start = useCallback(async (retryFailedPhotoIds?: string[]) => {
    if (runningRef.current) {
      return;
    }
    runningRef.current = true;
    try {
      const outcome = await runGuestMigration({
        guestStore: { getGuestMigrationState, markGuestDataMigrated, collectAllGuestTextData, listAllGuestPhotos },
        apiClient: createFetchGuestMigrationApiClient(),
        onProgress: (migratedCount, totalCount) => {
          setStatus({ kind: "in_progress", migratedCount, totalCount });
        },
        retryFailedPhotoIds,
      });

      if (outcome.phase === "no_data") {
        failedPhotoIdsRef.current = [];
        setStatus(null);
      } else if (outcome.phase === "success") {
        failedPhotoIdsRef.current = [];
        setStatus({ kind: "completed" });
      } else {
        failedPhotoIdsRef.current = outcome.failedPhotoIds;
        setStatus({ kind: "partial_failure" });
      }
    } finally {
      runningRef.current = false;
    }
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let cancelled = false;

    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled && data.user) {
        void start();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        void start();
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [start]);

  const onRetry = useCallback(() => {
    void start(failedPhotoIdsRef.current);
  }, [start]);

  return { status, onRetry };
}
