import type { OAuthProvider } from "@/lib/supabase/oauth-login";
import { AccountStatusRow } from "./AccountStatusRow";
import { LogoutButton } from "./LogoutButton";
import { MigrationStatusCard } from "./MigrationStatusCard";

/**
 * S6ログイン済み状態のセクション。
 * 参照: docs/design/screens/S6_設定アカウント.md「LoggedInSection」
 *
 * `AccountStatusRow`(ログイン中プロバイダ表示)・`MigrationStatusCard`(データ移行状態)・
 * `LogoutButton`をこの順で並べる(仕様のコンポーネント構造どおり)。
 *
 * `MigrationStatusCard`には現時点で`status={null}`を渡している(カードごと非表示になる)。
 * 実際の移行状態(移行中/完了/一部失敗)を取得・連携する処理はIssue #99「移行フロー結線」の
 * スコープ。#99はここに実データを渡す配線を追加すればよい
 * (`src/lib/migration-status.ts`の`MigrationStatus`型を参照)。
 */
export function LoggedInSection({ provider }: { provider: OAuthProvider | null }) {
  return (
    <section className="flex flex-col gap-6">
      <AccountStatusRow provider={provider} />
      <MigrationStatusCard status={null} />
      <LogoutButton />
    </section>
  );
}
