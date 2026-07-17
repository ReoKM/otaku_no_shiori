/**
 * S3タブシェルの左右スワイプ移動・ページめくり方向のロジック。
 * 参照: docs/design/screens/S3_しおり詳細.md「タブ間のスワイプ移動」「ページめくりトランジション」
 *
 * タッチイベントの購読は`src/app/shiori/[id]/layout.tsx`側で行い、
 * ここには座標計算・配列操作の純関数のみを置く(Vitestで単体テストするため)。
 */

/** スワイプ・遷移の方向。next = タブ配列で後ろ(右のページ)へ進む / prev = 前(左のページ)へ戻る。 */
export type SwipeDirection = "next" | "prev";

/** タッチ移動の軸判定結果。 */
export type TouchAxis = "horizontal" | "vertical";

/** スワイプ成立に必要な水平移動量(px)。これ未満はタップ・微動とみなす。 */
export const SWIPE_MIN_DISTANCE_PX = 48;

/**
 * スワイプ成立を許す縦横比の上限。|dy| が |dx| × この値 を超えたら
 * 「斜め・縦寄りの動き」としてスワイプ扱いしない(縦スクロールとの誤爆防止)。
 * 0.5 = 水平から約27度以内の動きのみスワイプと判定する。
 */
export const SWIPE_MAX_VERTICAL_RATIO = 0.5;

/** 軸ロック判定を始める最小移動量(px)。これ未満では軸を確定しない。 */
export const AXIS_LOCK_THRESHOLD_PX = 10;

/**
 * タッチ開始点からの移動量(dx, dy)で「横の動きか縦の動きか」を判定する。
 * 移動が小さいうちは null(未確定)を返す。
 * 一度 vertical と確定したタッチは呼び出し側でスワイプ対象から外す
 * (縦スクロール後に指が横へ流れても誤発火させないため)。
 */
export function resolveTouchAxis(dx: number, dy: number): TouchAxis | null {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < AXIS_LOCK_THRESHOLD_PX) {
    return null;
  }
  return Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
}

/**
 * タッチ終了時の移動量(dx, dy)からスワイプ方向を判定する。
 * - 水平移動が`SWIPE_MIN_DISTANCE_PX`未満 → null
 * - 縦移動が`SWIPE_MAX_VERTICAL_RATIO`を超える割合 → null(縦スクロール)
 * - 左へスワイプ(dx < 0)→ "next"(次のページをめくる)
 * - 右へスワイプ(dx > 0)→ "prev"(前のページへ戻る)
 */
export function detectHorizontalSwipe(dx: number, dy: number): SwipeDirection | null {
  if (Math.abs(dx) < SWIPE_MIN_DISTANCE_PX) {
    return null;
  }
  if (Math.abs(dy) > Math.abs(dx) * SWIPE_MAX_VERTICAL_RATIO) {
    return null;
  }
  return dx < 0 ? "next" : "prev";
}

/**
 * タブ配列上で現在タブの隣(next/prev)のタブを返す。
 * 端(先頭より前・末尾より後ろ)や現在タブが配列に無い場合は null(何もしない)。
 */
export function getAdjacentTab<T extends string>(
  tabs: readonly T[],
  current: T | null,
  direction: SwipeDirection,
): T | null {
  if (current === null) {
    return null;
  }
  const index = tabs.indexOf(current);
  if (index < 0) {
    return null;
  }
  const nextIndex = direction === "next" ? index + 1 : index - 1;
  if (nextIndex < 0 || nextIndex >= tabs.length) {
    return null;
  }
  return tabs[nextIndex];
}

/**
 * タブ遷移(from → to)のページめくり方向を返す。
 * 配列で後ろのタブへ進むなら "next"(新ページが右から入る)、
 * 前へ戻るなら "prev"(左から入る)。同一タブ・不明なタブ・初回表示は null(アニメーション無し)。
 */
export function getTabTransitionDirection<T extends string>(
  tabs: readonly T[],
  from: T | null,
  to: T | null,
): SwipeDirection | null {
  if (from === null || to === null || from === to) {
    return null;
  }
  const fromIndex = tabs.indexOf(from);
  const toIndex = tabs.indexOf(to);
  if (fromIndex < 0 || toIndex < 0) {
    return null;
  }
  return toIndex > fromIndex ? "next" : "prev";
}
