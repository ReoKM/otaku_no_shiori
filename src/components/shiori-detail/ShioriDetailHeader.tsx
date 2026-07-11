import { BackButton } from "@/components/common/BackButton";

interface ShioriDetailHeaderProps {
  /** ローディング中はタイトル部分をスケルトン表示する。 */
  loading: boolean;
  title: string;
  dateRange: string | null;
}

/**
 * S3共通ヘッダー(戻るボタン+しおりタイトル+日程)。
 * 参照: docs/design/screens/S3_しおり詳細.md「1. ヘッダー」
 */
export function ShioriDetailHeader({ loading, title, dateRange }: ShioriDetailHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-neutral-200 bg-white px-2 py-2">
      <BackButton href="/" />
      <div className="min-w-0 flex-1">
        {loading ? (
          <div className="flex flex-col gap-1">
            <div className="h-5 w-2/3 animate-pulse rounded bg-neutral-200" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-neutral-200" />
          </div>
        ) : (
          <>
            <p className="truncate text-xl font-bold text-neutral-900">{title}</p>
            {dateRange && <p className="text-sm text-neutral-500">{dateRange}</p>}
          </>
        )}
      </div>
    </header>
  );
}
