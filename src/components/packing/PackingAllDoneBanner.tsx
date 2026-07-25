import { CheckMark } from "@/components/list-ui/icons";

/**
 * S3a 全件チェック済みのときだけ出す達成メッセージ。
 * 参照: docs/design/screens/S3a_持ち物.md「準備状況カード」
 */
export function PackingAllDoneBanner() {
  return (
    <div className="mt-3 flex items-center gap-2 rounded-xl bg-sakura-soft px-4 py-3">
      <span aria-hidden="true" className="grid h-5 w-5 flex-none place-items-center rounded-full bg-sakura">
        <CheckMark small />
      </span>
      <span className="text-sm font-bold text-sakura-ink">準備完了!忘れ物ゼロです</span>
    </div>
  );
}
