import Link from "next/link";
import { BackButton } from "@/components/common/BackButton";

interface ShioriDetailHeaderProps {
  /** ローディング中はタイトル部分をスケルトン表示する。 */
  loading: boolean;
  title: string;
  dateRange: string | null;
  /**
   * 指定時、ヘッダー右側に「共有画像を作る」導線(S5への遷移)を1個表示する。
   * S5画面自体の仕様(docs/design/screens/S5_共有画像プレビュー.md)は導線の設置場所を
   * スコープ外としているため、S3共通ヘッダー(全タブ共通で見える場所)に配置した
   * (frontend-dev裁量。完了報告に明記)。
   */
  shareHref?: string;
}

/**
 * S3共通ヘッダー(戻るボタン+しおりタイトル+日程)。
 * 参照: docs/design/screens/S3_しおり詳細.md「1. ヘッダー」
 */
export function ShioriDetailHeader({ loading, title, dateRange, shareHref }: ShioriDetailHeaderProps) {
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
      {shareHref && !loading && (
        <Link
          href={shareHref}
          className="shrink-0 whitespace-nowrap px-2 text-sm font-semibold text-pink-500"
        >
          共有画像を作る
        </Link>
      )}
    </header>
  );
}
