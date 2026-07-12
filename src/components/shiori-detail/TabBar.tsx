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
 * 参照: docs/design/screens/S3_しおり詳細.md「2. タブバー」
 */
export function TabBar({ shioriId, activeTab, disabled }: TabBarProps) {
  return (
    <nav
      className={`grid grid-cols-4 border-b border-neutral-200 bg-white ${
        disabled ? "pointer-events-none opacity-50" : ""
      }`}
    >
      {TABS.map((tab) => {
        const selected = tab.id === activeTab;
        return (
          <Link
            key={tab.id}
            href={`/shiori/${shioriId}/${tab.id}`}
            className={`flex h-11 items-center justify-center border-b-2 text-sm ${
              selected
                ? "border-pink-500 text-pink-500"
                : "border-transparent text-neutral-500"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
