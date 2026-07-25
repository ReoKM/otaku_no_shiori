/**
 * 持ち物・やることタブ共通の並び順モード。
 * 参照: docs/design/screens/S3a_持ち物.md「並べ替えシート」
 *
 * 選択値はしおり×タブ単位でlocalStorageに保存する。DBスキーマを変更しないための実装判断
 * (ゲスト利用が前提のため端末をまたぐ同期は行わない)。
 */
export type ListSortMode = "registered" | "undone-first" | "done-first" | "manual";

export const LIST_SORT_MODES: ListSortMode[] = [
  "registered",
  "undone-first",
  "done-first",
  "manual",
];

export const LIST_SORT_MODE_LABELS: Record<ListSortMode, string> = {
  registered: "登録順",
  "undone-first": "未完了を上に",
  "done-first": "完了済みを上に",
  manual: "手動で並べ替え",
};

export const DEFAULT_LIST_SORT_MODE: ListSortMode = "registered";

/** 並び順モードを保存するタブの識別子。 */
export type SortableTab = "packing" | "todo";

function storageKey(shioriId: string, tab: SortableTab): string {
  return `shiori-sort:${tab}:${shioriId}`;
}

function isListSortMode(value: unknown): value is ListSortMode {
  return typeof value === "string" && (LIST_SORT_MODES as string[]).includes(value);
}

/**
 * 保存済みの並び順モードを読み出す。未保存・不正値・localStorage利用不可(プライベート
 * ブラウジング等)の場合は既定値「登録順」を返す。
 */
export function loadListSortMode(shioriId: string, tab: SortableTab): ListSortMode {
  if (typeof window === "undefined") {
    return DEFAULT_LIST_SORT_MODE;
  }
  try {
    const raw = window.localStorage.getItem(storageKey(shioriId, tab));
    return isListSortMode(raw) ? raw : DEFAULT_LIST_SORT_MODE;
  } catch {
    return DEFAULT_LIST_SORT_MODE;
  }
}

/** 並び順モードを保存する。localStorageが使えない環境では黙って何もしない。 */
export function saveListSortMode(
  shioriId: string,
  tab: SortableTab,
  mode: ListSortMode,
): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(storageKey(shioriId, tab), mode);
  } catch {
    // 保存できなくても表示は成立する(次回は既定値に戻るだけ)ため握りつぶす
  }
}

/**
 * 並び順モードに従って一覧を並べ替える。元配列は変更しない。
 *
 * 「登録順」と「手動で並べ替え」は呼び出し側が渡した順序(sort_order順)をそのまま使う。
 * 完了状態での並べ替えは安定ソートで行い、同じ完了状態の中では元の順序を保つ。
 */
export function applyListSortMode<T>(
  items: readonly T[],
  mode: ListSortMode,
  isDone: (item: T) => boolean,
): T[] {
  const sorted = items.slice();
  if (mode === "undone-first") {
    sorted.sort((a, b) => Number(isDone(a)) - Number(isDone(b)));
  } else if (mode === "done-first") {
    sorted.sort((a, b) => Number(isDone(b)) - Number(isDone(a)));
  }
  return sorted;
}
