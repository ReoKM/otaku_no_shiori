/**
 * S6オフライン時の注意文言。
 * 参照: docs/design/screens/S6_設定アカウント.md「LoggedOutSection」4. OfflineNotice
 *
 * 端末がオフラインのあいだ、ボタン群の直下に常時表示する
 * (`navigator.onLine`/`online`・`offline`イベントの検知は呼び出し元`LoggedOutSection`で行う)。
 * ログインボタンをタップした瞬間にオフラインだった場合の即時メッセージ
 * (該当ボタン直下に出す別枠の表示)にも同じ文言を使う。
 */
export const OFFLINE_NOTICE_TEXT = "オフラインです。通信を確認してからログインしてください";

export function OfflineNotice() {
  return <p className="text-xs text-ink-muted">{OFFLINE_NOTICE_TEXT}</p>;
}
