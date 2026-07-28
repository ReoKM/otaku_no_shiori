/**
 * 持ち物・やることタブ共通の並び順モード。
 * 参照: docs/design/screens/S3a_持ち物.md「並べ替えシート」
 *
 * 選択値はしおり×タブ単位でlocalStorageに保存する。DBスキーマを変更しないための実装判断
 * (ゲスト利用が前提のため端末をまたぐ同期は行わない)。
 */
export type ListSortMode =
  | "due-soon"
  | "registered"
  | "undone-first"
  | "done-first"
  | "manual";

export const LIST_SORT_MODE_LABELS: Record<ListSortMode, string> = {
  "due-soon": "期限が近い順",
  registered: "登録順",
  "undone-first": "未完了を上に",
  "done-first": "完了済みを上に",
  manual: "手動で並べ替え",
};

/** 並び順モードを保存するタブの識別子。 */
export type SortableTab = "packing" | "todo";

/**
 * タブごとに選べる並び順。
 *
 * 「期限が近い順」はやることタブ限定。`docs/01_service_spec.md` のF3が
 * 「期限が近い順に表示」を求めているため、リニューアル後も既定の並びとして残す
 * (デザイン案の4択には無いが、仕様上の機能を落とさないための追加)。
 * 持ち物には期限が無いので出さない。
 */
export const SORT_MODES_BY_TAB: Record<SortableTab, ListSortMode[]> = {
  packing: ["registered", "undone-first", "done-first", "manual"],
  todo: ["due-soon", "registered", "undone-first", "done-first", "manual"],
};

/** タブごとの既定の並び順。 */
export const DEFAULT_SORT_MODE_BY_TAB: Record<SortableTab, ListSortMode> = {
  packing: "registered",
  todo: "due-soon",
};

function storageKey(shioriId: string, tab: SortableTab): string {
  return `shiori-sort:${tab}:${shioriId}`;
}

/**
 * 保存済みの並び順モードを読み出す。未保存・不正値・そのタブで選べないモード・
 * localStorage利用不可(プライベートブラウジング等)の場合はタブごとの既定値を返す。
 */
export function loadListSortMode(shioriId: string, tab: SortableTab): ListSortMode {
  const fallback = DEFAULT_SORT_MODE_BY_TAB[tab];
  if (typeof window === "undefined") {
    return fallback;
  }
  try {
    const raw = window.localStorage.getItem(storageKey(shioriId, tab));
    const allowed = SORT_MODES_BY_TAB[tab] as string[];
    return raw !== null && allowed.includes(raw) ? (raw as ListSortMode) : fallback;
  } catch {
    return fallback;
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
 * 「登録順」「手動で並べ替え」「期限が近い順」は呼び出し側が渡した順序をそのまま使う。
 * 「期限が近い順」の並べ替えは期限日を知っている呼び出し側(やることタブ)が
 * 事前に済ませてから渡す(`src/lib/todo-sort.ts`の`sortTodos`)。
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
