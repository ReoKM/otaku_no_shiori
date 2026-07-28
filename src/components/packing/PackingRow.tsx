"use client";

import { ListCheckbox } from "@/components/list-ui/ListCheckbox";
import { MoreIcon } from "@/components/list-ui/icons";
import type { PackingItem } from "@/types/shiori";

interface PackingRowProps {
  item: PackingItem;
  /** 追加直後の行はハイライトを一度だけ流す。 */
  flash: boolean;
  onToggleCheck: (id: string) => void;
  onOpenMenu: (item: PackingItem) => void;
}

/**
 * S3a PackingRow(持ち物リストの1行、高さ68px)。
 * 参照: docs/design/screens/S3a_持ち物.md「PackingRow」
 *
 * 行全体をタップするとチェックが切り替わる。名前の編集・削除は右端の「…」から開く
 * 行メニューシート(`RowActionSheet`)に集約する。
 * 「…」はチェック切替のボタンの内側に置けないため、行はbuttonにせずdiv+role="button"にせず、
 * チェック用のbuttonを行いっぱいに広げ、「…」をその隣に独立して置く構成にしている。
 */
export function PackingRow({ item, flash, onToggleCheck, onOpenMenu }: PackingRowProps) {
  return (
    <div
      className={`flex min-h-17 items-center border-t border-paper-divider bg-paper-surface first:border-t-0 ${
        flash ? "animate-[paper-flash_1.2s_ease]" : ""
      }`}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={item.is_checked}
        onClick={() => onToggleCheck(item.id)}
        className="flex min-h-17 min-w-0 flex-1 items-center gap-3 py-1 pl-4 text-left"
      >
        <ListCheckbox checked={item.is_checked} />
        <span
          className={`line-clamp-2 min-w-0 flex-1 text-base/[1.4] ${
            item.is_checked
              ? "font-normal text-ink-done line-through decoration-[rgba(167,158,147,0.75)]"
              : "font-medium text-ink"
          }`}
        >
          {item.label}
        </span>
        {item.is_checked && (
          <span className="flex-none text-[11px] font-bold tracking-[0.06em] text-ink-faint">済</span>
        )}
      </button>
      <button
        type="button"
        aria-label={`${item.label}の編集・削除`}
        onClick={() => onOpenMenu(item)}
        className="flex h-11 w-11 flex-none items-center justify-center text-ink-faint"
      >
        <MoreIcon />
      </button>
    </div>
  );
}
