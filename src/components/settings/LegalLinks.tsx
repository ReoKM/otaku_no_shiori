import Link from "next/link";

/**
 * S6共通フッター(利用規約・プライバシーポリシー)。常時表示。
 * 参照: docs/design/screens/S6_設定アカウント.md「LegalLinks」
 *
 * S1フッター(`src/app/page.tsx`)と同じ配置・文言・遷移先で揃える。
 */
export function LegalLinks() {
  return (
    <footer className="flex items-center justify-center gap-6 px-6 pt-2 pb-6">
      <Link href="/terms" className="text-xs text-ink-muted underline-offset-2 hover:underline">
        利用規約
      </Link>
      <Link href="/privacy" className="text-xs text-ink-muted underline-offset-2 hover:underline">
        プライバシーポリシー
      </Link>
    </footer>
  );
}
