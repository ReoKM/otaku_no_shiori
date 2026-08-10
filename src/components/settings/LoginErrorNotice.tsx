/**
 * S6ログイン失敗時のカード。
 * 参照: docs/design/screens/S6_設定アカウント.md「LoggedOutSection」3. LoginErrorNotice
 *
 * `/auth/callback`(#94)がエラーで`/settings`へ戻ってきた場合のみ、呼び出し元
 * (`SettingsRoute`)が`authError`クエリパラメータを検知してこのコンポーネントを出す。
 * プロバイダ固有のエラー詳細は表示しない(汎用の1パターンのみ。仕様の「不明点・仮置き」参照)。
 */
export function LoginErrorNotice() {
  return (
    <div className="rounded-xl border border-red-400 bg-paper-surface px-4 py-3" role="alert">
      <p className="text-xs font-medium text-red-600">
        ログインできませんでした。もう一度お試しください
      </p>
    </div>
  );
}
