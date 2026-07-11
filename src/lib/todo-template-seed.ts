/**
 * S3b(TODOタブ)のテンプレ投入済みフラグ。
 *
 * 仮置き(完了報告にも記載): guest-store.ts / types/shiori.ts は変更しない方針のため、
 * `shiori`レコードにフラグ列を追加する代わりに`localStorage`キー(`todo-template-seeded:<shioriId>`)
 * で「初回」と「全削除後」を区別する。0件かどうかだけでは両者を区別できないため必須。
 * SSR環境(Next.jsのサーバーサイド)では`window`が無いため、常にfalse(未投入)として扱いガードする。
 */
const KEY_PREFIX = "todo-template-seeded:";

export function isTodoTemplateSeeded(shioriId: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return window.localStorage.getItem(KEY_PREFIX + shioriId) === "1";
  } catch {
    // プライベートブラウジング等でlocalStorageが使えない場合は毎回未投入扱いにフォールバックする。
    return false;
  }
}

export function markTodoTemplateSeeded(shioriId: string): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(KEY_PREFIX + shioriId, "1");
  } catch {
    // 保存できなくても致命的ではない(次回開いた時に再度自動投入を試みるだけ)。
  }
}
