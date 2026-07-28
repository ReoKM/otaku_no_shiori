import Link from "next/link";

// スポットは独立タブにせず旅程タブ内で扱う(2026-07-11オーナー決定。docs/01_service_spec.md参照)
export type ShioriTabId = "packing" | "todo" | "itinerary" | "log";

// 表示名はリニューアルデザインに合わせて「やること」「記録」に変更した。
// URLパス(/todo, /log)は既存リンク・SW のキャッシュルーティングを壊さないため据え置く。
const TABS: { id: ShioriTabId; label: string }[] = [
  { id: "packing", label: "持ち物" },
  { id: "todo", label: "やること" },
  { id: "itinerary", label: "旅程" },
  { id: "log", label: "記録" },
];

interface TabBarProps {
  shioriId: string;
  activeTab: ShioriTabId | null;
  /** ローディング中はタブバー全体をグレーアウトし操作不能にする。 */
  disabled?: boolean;
}

/**
 * S3共通タブバー(持ち物/やること/旅程/記録の4分割)。
 * 参照: docs/design/screens/S3_しおり詳細.md「2. タブバー」
 *
 * 選択中は差し色の文字+下辺3pxのインクバーで示す。
 */
export function TabBar({ shioriId, activeTab, disabled }: TabBarProps) {
  return (
    <nav
      className={`grid grid-cols-4 border-b border-paper-border bg-paper-surface ${
        disabled ? "pointer-events-none opacity-50" : ""
      }`}
    >
      {TABS.map((tab) => {
        const selected = tab.id === activeTab;
        return (
          <Link
            key={tab.id}
            href={`/shiori/${shioriId}/${tab.id}`}
            aria-current={selected ? "page" : undefined}
            className={`flex h-12 items-center justify-center text-[15px] tracking-[0.02em] ${
              selected
                ? "font-bold text-sakura-ink shadow-[inset_0_-3px_0_var(--color-sakura)]"
                : "font-medium text-ink-strong"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
