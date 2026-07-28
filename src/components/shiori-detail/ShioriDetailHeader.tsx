import Link from "next/link";
import { BackButton } from "@/components/common/BackButton";

interface ShioriDetailHeaderProps {
  /** ローディング中はタイトル部分をスケルトン表示する。 */
  loading: boolean;
  title: string;
  dateRange: string | null;
  /**
   * 指定時、ヘッダー右側に「共有画像を作る」導線(S5への遷移)をアイコンボタンで表示する。
   * S5画面自体の仕様(docs/design/screens/S5_共有画像プレビュー.md)は導線の設置場所を
   * スコープ外としているため、S3共通ヘッダー(全タブ共通で見える場所)に配置した。
   */
  shareHref?: string;
  /** スクロール中はタイトルを1行に縮め、日程を隠す。 */
  compact: boolean;
}

/**
 * S3共通ヘッダー(戻るボタン+しおりタイトル+日程+共有アイコン)。
 * 参照: docs/design/screens/S3_しおり詳細.md「1. ヘッダー」
 *
 * スクロールすると余白とタイトルを縮め、日程を隠してタブを見える位置に保つ。
 */
export function ShioriDetailHeader({
  loading,
  title,
  dateRange,
  shareHref,
  compact,
}: ShioriDetailHeaderProps) {
  return (
    <div
      className={`flex items-start gap-1.5 bg-paper-surface px-6 transition-[padding] duration-200 ${
        compact ? "pt-2 pb-2.5" : "pt-4 pb-3.5"
      }`}
    >
      <BackButton href="/" />
      <div className="min-w-0 flex-1 px-1">
        {loading ? (
          <div className="flex flex-col gap-2 py-1">
            <div className="h-6 w-2/3 animate-pulse rounded bg-paper-track" />
            {!compact && <div className="h-4 w-1/3 animate-pulse rounded bg-paper-track" />}
          </div>
        ) : (
          <>
            <p
              className={`overflow-hidden font-black tracking-[0.01em] text-ink ${
                compact ? "line-clamp-1 text-[17px]/[1.35]" : "line-clamp-2 text-[22px]/[1.35]"
              }`}
            >
              {title}
            </p>
            {dateRange && !compact && (
              <p className="mt-2 text-[13px] font-medium tracking-[0.02em] text-ink-sub">
                {dateRange}
              </p>
            )}
          </>
        )}
      </div>
      {shareHref && !loading && (
        <Link
          href={shareHref}
          aria-label="共有画像を作る"
          className="-mr-2.5 flex h-11 w-11 shrink-0 items-center justify-center text-ink-strong"
        >
          <ShareIcon />
        </Link>
      )}
    </div>
  );
}

function ShareIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 2.5v8" />
      <path d="M6.2 5.3 9 2.5l2.8 2.8" />
      <path d="M4 9.5v4.6c0 .8.6 1.4 1.4 1.4h7.2c.8 0 1.4-.6 1.4-1.4V9.5" />
    </svg>
  );
}
