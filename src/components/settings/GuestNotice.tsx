/**
 * S6未ログイン状態の説明ブロック。
 * 参照: docs/design/screens/S6_設定アカウント.md「LoggedOutSection」1. GuestNotice
 *
 * カード化はせず地の文で置く(仕様どおり)。文言は画面仕様の文言一覧をそのまま使う。
 */
export function GuestNotice() {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-base font-black text-ink">ログインしてクラウド保存</h2>
      <p className="text-[13px] leading-[1.9] text-ink-sub">
        ログインすると、しおりが自動でクラウドに保存され、機種変更や別の端末からも見られるようになります。
      </p>
      <p className="text-xs text-ink-muted">
        今のまま(ログインなし)でも、しおりの作成・編集はすべて使えます。データはこの端末だけに保存されます。
      </p>
    </div>
  );
}
