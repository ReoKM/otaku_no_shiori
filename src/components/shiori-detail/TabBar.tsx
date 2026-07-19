import Link from "next/link";

// スポットは独立タブにせず旅程タブ内で扱う(2026-07-11オーナー決定。docs/01_service_spec.md参照)
export type ShioriTabId = "packing" | "todo" | "itinerary" | "log";

/**
 * タブのアイコン(線画、feather風の自作パス)。
 * currentColorで描くため、選択/非選択の色は親のtextクラスで切り替わる。
 * アイコンアセット・ライブラリは追加しない(インラインSVGのみ)。
 */
const TAB_ICON_PATHS: Record<ShioriTabId, React.ReactNode> = {
  // 持ち物: バッグ
  packing: (
    <>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </>
  ),
  // TODO: チェック付き四角
  todo: (
    <>
      <path d="m9 11 3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </>
  ),
  // 旅程: マップピン
  itinerary: (
    <>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  // ログ: ペン
  log: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </>
  ),
};

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
 * 参照: docs/design/screens/S3_しおり詳細.md「タブバー(下部浮遊・ピル意匠)」
 * 企画: docs/design/notes/2026-07-19_S3ノートUI-v2企画.md
 *
 * 2026-07-19 v2刷新: 画面端に張り付いたバーをやめ、周囲に余白を持って浮かぶ
 * ピル形状のパネル(rounded-full+shadow-xl)にする。選択中タブはアイコンを
 * パープルの円(bg-pink-500)に収め、負マージンでバー上端からせり出させる
 * (前回の「見出しタブが1段持ち上がる」DNAの継承。札形状自体は廃止)。
 * バーの占有高さは`--s3-tabbar-height`(globals.css)として共有し、
 * コンテンツ側の下パディング・sticky入力フォームの逃げ幅に使う。
 * タップ領域は各タブともバー全高64px(h-16)×幅1/4で44px以上を維持する。
 */
export function TabBar({ shioriId, activeTab, disabled }: TabBarProps) {
  return (
    <nav
      aria-label="しおりのタブ"
      className={`fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-20 mx-auto max-w-md rounded-full border border-neutral-200 bg-white shadow-xl ${
        disabled ? "pointer-events-none opacity-50" : ""
      }`}
    >
      <div className="grid h-16 grid-cols-4 px-3">
        {TABS.map((tab) => {
          const selected = tab.id === activeTab;
          return (
            <Link
              key={tab.id}
              href={`/shiori/${shioriId}/${tab.id}`}
              aria-current={selected ? "page" : undefined}
              className="flex flex-col items-center justify-center gap-1"
            >
              <span
                className={`flex items-center justify-center rounded-full transition-all duration-200 ${
                  selected
                    ? "-mt-7 h-11 w-11 bg-pink-500 text-white shadow-lg"
                    : "h-6 w-6 text-neutral-500"
                }`}
              >
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={selected ? "h-6 w-6" : "h-5 w-5"}
                >
                  {TAB_ICON_PATHS[tab.id]}
                </svg>
              </span>
              <span
                className={`text-xs ${
                  selected ? "font-semibold text-pink-700" : "text-neutral-500"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
