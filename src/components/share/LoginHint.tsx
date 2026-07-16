/**
 * S5 LoginHint(F8ログイン促し・一言のみ)。
 * 参照: docs/design/screens/S5_共有画像プレビュー.md「LoginHint(F8ログイン促し・一言のみ)」
 * タップ不可・遷移導線なし(S6はW3未実装のため)。
 */
export function LoginHint() {
  return (
    <p className="text-sm text-neutral-500">
      💡 ログインすると、しおりを他の端末からも見られるようになります
    </p>
  );
}
