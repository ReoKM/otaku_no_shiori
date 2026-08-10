/**
 * S6ログインボタンの第三者ブランドアイコン(X / Google)。
 * 参照: docs/design/screens/S6_設定アカウント.md「不明点・仮置き」
 *
 * 各社のブランドガイドラインに基づく公式ロゴマークのため、
 * `docs/design/tokens.md`の「生の16進数を使わない」ルールの対象外(トークン化しない)。
 * Xはモノクロ表示(`currentColor`でinkトークンを継承)、Googleは公式4色をそのまま使う。
 */

export function XLogoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function GoogleLogoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.273c0-.851-.076-1.67-.218-2.455H12v4.64h6.46a5.52 5.52 0 0 1-2.395 3.622v3.01h3.877c2.269-2.09 3.578-5.166 3.578-8.817z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.956-1.075 7.941-2.91l-3.877-3.01c-1.075.72-2.45 1.147-4.064 1.147-3.126 0-5.773-2.11-6.72-4.946H1.28v3.107A11.997 11.997 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.281A7.2 7.2 0 0 1 4.909 12c0-.792.136-1.562.371-2.281V6.612H1.28A11.997 11.997 0 0 0 0 12c0 1.936.463 3.768 1.28 5.388z"
      />
      <path
        fill="#EA4335"
        d="M12 4.773c1.763 0 3.346.606 4.591 1.796l3.443-3.443C17.951 1.19 15.236 0 12 0 7.31 0 3.244 2.69 1.28 6.612l4 3.107C6.227 6.883 8.874 4.773 12 4.773z"
      />
    </svg>
  );
}
