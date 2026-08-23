/**
 * F10「アプリをインストール」自前バナーの表示制御。
 *
 * ブラウザ標準の`beforeinstallprompt`ミニインフォバー(Android Chrome等が「たまに」出す
 * インストール通知)は`AppMenu`(ハンバーガーメニュー)導入時に`event.preventDefault()`で
 * 常時止めている(`src/lib/use-pwa-install.ts`)。本バナーはそれに代わる、デザイントークンに
 * 沿った自前のUIとして全画面で一貫させる(オーナー指示)。
 *
 * 表示制御の方針(仮置き。仕様に詳細指定が無いため。完了報告に記載):
 * - 「しつこくしない」(`login-prompt-banner.ts`と同じ考え方)を踏まえつつ、ブラウザ標準の
 *   挙動が「閉じても時間が経てばまた出る」ことに合わせ、閉じたら**一定期間だけ**再表示を
 *   止める(`login-prompt-banner.ts`の「一度閉じたら永久に出さない」とは異なる仕様判断)
 * - 表示対象は「しおりを1件以上作成済み」のユーザーに限定する(呼び出し側`InstallPromptBanner`が
 *   `guest-store`を見て判定する)。初回訪問者にいきなりインストールを勧めない
 */

const SNOOZED_UNTIL_KEY = "install-prompt-banner:snoozed-until";

/** 閉じた後、再表示を止める期間(日数)。 */
const SNOOZE_DAYS = 14;

/** 現在、スヌーズ期間中(閉じてから`SNOOZE_DAYS`日未満)かどうか。 */
export function isInstallPromptBannerSnoozed(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    const raw = window.localStorage.getItem(SNOOZED_UNTIL_KEY);
    if (!raw) {
      return false;
    }
    const snoozedUntil = Number(raw);
    return Number.isFinite(snoozedUntil) && Date.now() < snoozedUntil;
  } catch {
    return false;
  }
}

/** バナーを閉じた・インストールを実行した際に呼ぶ。以後`SNOOZE_DAYS`日は再表示しない。 */
export function snoozeInstallPromptBanner(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const snoozedUntil = Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000;
    window.localStorage.setItem(SNOOZED_UNTIL_KEY, String(snoozedUntil));
  } catch {
    // 保存できなくても致命的ではない(そのタブ内では再度出うるだけ)。
  }
}
