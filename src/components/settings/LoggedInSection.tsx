import type { OAuthProvider } from "@/lib/supabase/oauth-login";
import { useGuestMigration } from "@/lib/use-guest-migration";
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
 * `MigrationStatusCard`には`useGuestMigration`(`src/lib/use-guest-migration.ts`、Issue #99)が
 * 返す実データを渡す。移行対象データが無い/既に移行済みの場合は`status`が`null`になり
 * カードごと非表示になる(仕様どおり)。
 */
export function LoggedInSection({ provider }: { provider: OAuthProvider | null }) {
  const { status, onRetry } = useGuestMigration();

  return (
    <section className="flex flex-col gap-6">
      <AccountStatusRow provider={provider} />
      <MigrationStatusCard status={status} onRetry={onRetry} />
      <LogoutButton />
    </section>
  );
}
