import type { ReactNode } from "react";

/**
 * S3d LogDateGroup(日付グループ見出し)。
 * 参照: docs/design/screens/S3d_ログ.md「LogDateGroup(日付グループ見出し)」
 *
 * 見出しは旅程タブの日見出しと同じ字送り。右に枚数を添える。
 */
interface LogDateGroupProps {
  label: string;
  count: number;
  children: ReactNode;
}

export function LogDateGroup({ label, count, children }: LogDateGroupProps) {
  return (
    <div className="mt-5.5 first:mt-0">
      <div className="flex items-baseline gap-2.5 px-0.5 pb-2.5">
        <h3 className="text-[15px] font-black text-ink">{label}</h3>
        <span className="text-xs font-medium text-ink-muted">{count}枚</span>
      </div>
      {children}
    </div>
  );
}
