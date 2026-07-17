import Link from "next/link";

// スポットは独立タブにせず旅程タブ内で扱う(2026-07-11オーナー決定。docs/01_service_spec.md参照)
export type ShioriTabId = "packing" | "todo" | "itinerary" | "log";

const TABS: { id: ShioriTabId; label: string }[] = [
  { id: "packing", label: "持ち物" },
  { id: "todo", label: "TODO" },
  { id: "itinerary", label: "旅程" },
  { id: "log", label: "ログ" },
];

interface TabBarProps {
  shioriId: string;
  activeTab: ShioriTabId | null;
  /** ローディング中はタブバー全体をグレーアウトし操作不能にする。 */
  disabled?: boolean;
}

/**
 * S3共通タブバー(持ち物/TODO/旅程/ログの4分割)。
 * 参照: docs/design/screens/S3_しおり詳細.md「タブバー(下部固定・見出しタブ意匠)」
 *
 * 2026-07 UI刷新: 画面下部固定(親指で押しやすい位置)に移動。
 * 汎用のアイコン型ボトムナビにはせず、「本の小口から見出しタブが覗いている」意匠とする:
 * 各タブは上角丸+枠線の"インデックスタブ"形状で下端から生え、選択中タブだけ
 * 1段高く(引き出されたしおりのように)持ち上がる。
 * バーの高さ(コンテンツ56px+境界1px+セーフエリア)は`--s3-tabbar-height`
 * (globals.css)として共有し、コンテンツ側の下パディング・sticky入力フォームの
 * 逃げ幅に使う。タップ領域は最小44px(h-11)を維持する。
 */
export function TabBar({ shioriId, activeTab, disabled }: TabBarProps) {
  return (
    <nav
      aria-label="しおりのタブ"
      className={`s3-tabbar fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)] ${
        disabled ? "pointer-events-none opacity-50" : ""
      }`}
    >
      <div className="grid h-14 grid-cols-4 items-end gap-1 px-2">
        {TABS.map((tab) => {
          const selected = tab.id === activeTab;
          return (
            <Link
              key={tab.id}
              href={`/shiori/${shioriId}/${tab.id}`}
              aria-current={selected ? "page" : undefined}
              className={`flex items-center justify-center rounded-t-lg border border-b-0 text-sm ${
                selected
                  ? "h-12 border-pink-300 bg-pink-100 font-semibold text-pink-700"
                  : "h-11 border-neutral-200 bg-neutral-100 text-neutral-500"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
