import Link from "next/link";

interface LogShareCardProps {
  shioriId: string;
}

/**
 * S3d 記録タブ下部の共有画像への導線カード。
 * 参照: docs/design/screens/S3d_ログ.md「共有導線カード」
 *
 * ヘッダーの共有アイコンはアイコン単体で意味が伝わりにくいため、
 * 写真を見終えた位置に文言つきの導線を置く(S5への入口はこの2つ)。
 */
export function LogShareCard({ shioriId }: LogShareCardProps) {
  return (
    <section className="mt-6 rounded-2xl border border-paper-border bg-paper-surface p-4">
      <p className="text-sm font-bold text-ink-strong">しおりを共有する</p>
      <p className="mt-1.5 text-[12.5px]/[1.7] text-ink-sub">
        記録した写真とメモから、1枚の共有画像を作れます。
      </p>
      <Link
        href={`/shiori/${shioriId}/share`}
        className="mt-3 flex min-h-12 w-full items-center justify-center rounded-xl bg-sakura text-[14.5px] font-bold text-white"
      >
        共有画像を作る
      </Link>
    </section>
  );
}
