/**
 * F8「しおり保存後のバナー表示」の表示制御。
 * 参照: docs/01_service_spec.md F8「ログインを促すタイミング: しおり保存後のバナー表示、
 * 共有画像生成後の一言、の2箇所のみ。しつこくしない」
 *
 * このファイルはS2(しおり作成)・S3(しおり詳細)から呼ばれる表示制御ロジックのみを持つ。
 * 実際のバナーUIは`src/components/shiori-detail/LoginPromptBanner.tsx`。
 *
 * 表示制御の方針(仮置き。仕様に詳細指定が無いため。完了報告に記載):
 * - 「保存後」を「しおり作成直後、詳細画面への遷移で初めて表示されたタイミング」と解釈する。
 *   `markShioriJustCreated`をS2の作成成功時に呼び、`consumeShioriJustCreated`をS3側の
 *   バナー表示コンポーネントが一度だけ読み取って消費する(sessionStorage、タブを閉じる/
 *   同じしおりに戻ってきても再表示しない)。
 * - 一度閉じた(×ボタン)場合は、以後どのしおりでも二度と表示しない(localStorage、
 *   永続的なフラグ)。「しつこくしない」という仕様方針を優先し、しおり単位ではなく
 *   アプリ全体で1回きりの表示にする。
 * - ログイン済みかどうかの判定は呼び出し側(コンポーネント)がSupabaseセッションを見て行う
 *   (このファイルはstorageの読み書きのみを担当する)。
 *
 * SSR環境(Next.jsのサーバーサイド)では`window`が無いため、常に「未消費/未表示」側へ
 * フォールバックする。プライベートブラウジング等でstorageが使えない場合も同様に握りつぶす
 * (`src/lib/todo-template-seed.ts`と同じ方針)。
 */

const JUST_CREATED_KEY_PREFIX = "login-prompt-banner:just-created:";
const DISMISSED_KEY = "login-prompt-banner:dismissed";

/** S2の作成成功時に呼ぶ。「このしおりは保存直後である」印をsessionStorageに残す。 */
export function markShioriJustCreated(shioriId: string): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.sessionStorage.setItem(JUST_CREATED_KEY_PREFIX + shioriId, "1");
  } catch {
    // 保存できなくても致命的ではない(バナーが出ないだけ)。
  }
}

/**
 * 「保存直後」印を一度だけ読み取り、読み取ったらその場で消費(削除)する。
 * 2回目以降の呼び出し(再訪問・リロード)は常にfalseを返す。
 */
export function consumeShioriJustCreated(shioriId: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    const key = JUST_CREATED_KEY_PREFIX + shioriId;
    const value = window.sessionStorage.getItem(key);
    if (value !== "1") {
      return false;
    }
    window.sessionStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/** 過去にバナーを閉じたことがあるか(アプリ全体・永続)。 */
export function isLoginPromptBannerDismissed(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return window.localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

/** バナーを閉じた(以後二度と表示しない)。 */
export function dismissLoginPromptBannerForever(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(DISMISSED_KEY, "1");
  } catch {
    // 保存できなくても、そのタブのセッション内では非表示状態を保てる(componentのstateで担保)。
  }
}
