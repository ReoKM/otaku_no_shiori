/**
 * 持ち物(S3a)・TODO(S3b)の「並べ替えモード」で使う、長押しドラッグによる並び替えの
 * 純粋計算ロジック。UI(ポインターイベント処理)は`use-drag-sort.ts`が担当し、
 * ここでは座標・配列操作のみを扱う(vitestで単体テスト可能にするための分離)。
 */

/** ドラッグ中でない行の矩形情報(並び順どおりに渡す)。 */
export interface RowRect {
  id: string;
  /** ビューポート基準の上端Y座標(`getBoundingClientRect().top`相当)。 */
  top: number;
  height: number;
}

/**
 * ポインターのY座標から、`rows`(ドラッグ中の行を除いた、表示順の行矩形)のどこに
 * 挿入すべきかを計算する。各行の中央Yを基準に、ポインターがその行の中央より上なら
 * その行の直前に挿入する。すべての行の中央より下なら末尾(`rows.length`)を返す。
 */
export function computeDropIndex(rows: RowRect[], pointerY: number): number {
  for (let i = 0; i < rows.length; i += 1) {
    const mid = rows[i].top + rows[i].height / 2;
    if (pointerY < mid) {
      return i;
    }
  }
  return rows.length;
}

/**
 * `order`配列内の`draggedId`を取り除き、`dropIndex`(取り除いた後の配列における挿入位置)の
 * 位置へ挿入し直した新しい配列を返す。`dropIndex`は`0`〜`order.length - 1`の範囲へクランプする。
 * `draggedId`が`order`に含まれない場合は`order`をそのまま返す(呼び出し側の不整合を無視して安全側に倒す)。
 */
export function moveIdToIndex(order: string[], draggedId: string, dropIndex: number): string[] {
  if (!order.includes(draggedId)) {
    return order;
  }
  const others = order.filter((id) => id !== draggedId);
  const clamped = Math.max(0, Math.min(dropIndex, others.length));
  return [...others.slice(0, clamped), draggedId, ...others.slice(clamped)];
}

/**
 * TODOの並べ替えモードのように「同じグループ内でのみ並べ替え可能」という制約がある場合に、
 * `dropIndex`(`others`=ドラッグ中の項目を除いた配列における挿入位置)を、
 * `targetGroupKey`と同じグループの範囲内へクランプする。
 * `others`はグループごとに連続していること(呼び出し側=`sortTodos`済みの並び順)を前提とする。
 * `targetGroupKey`に一致する項目が`others`に1件も無い場合は`dropIndex`をそのまま返す
 * (グループの範囲が特定できないため制約をかけない)。
 */
export function clampIndexToGroupRange(
  others: string[],
  groupKeyOf: (id: string) => string,
  targetGroupKey: string,
  dropIndex: number,
): number {
  const start = others.findIndex((id) => groupKeyOf(id) === targetGroupKey);
  if (start === -1) {
    return dropIndex;
  }
  let end = start;
  while (end < others.length && groupKeyOf(others[end]) === targetGroupKey) {
    end += 1;
  }
  return Math.max(start, Math.min(dropIndex, end));
}
