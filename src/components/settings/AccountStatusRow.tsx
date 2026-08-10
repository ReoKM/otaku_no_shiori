import { getProviderLoginLabel } from "@/lib/supabase/auth-provider";
import type { OAuthProvider } from "@/lib/supabase/oauth-login";

/**
 * S6ログイン済み状態の見出しブロック。
 * 参照: docs/design/screens/S6_設定アカウント.md「LoggedInSection」1. AccountStatusRow
 *
 * カード化はせず地の文で置く(`GuestNotice`と同じレイアウト方針)。
 *
 * `provider`が`null`のとき(想定外のプロバイダでログインしている等、本来発生しない想定の
 * ケース)はプロバイダ行を省略し、見出しのみ表示する(型不整合による表示崩れを避けるための
 * 防御的処理)。
 */
export function AccountStatusRow({ provider }: { provider: OAuthProvider | null }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-base font-black text-ink">アカウント</h2>
      {provider !== null && <p className="text-[13px] text-ink-sub">{getProviderLoginLabel(provider)}</p>}
    </div>
  );
}
