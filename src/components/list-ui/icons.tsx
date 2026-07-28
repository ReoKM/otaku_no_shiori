/**
 * 持ち物・やること・旅程・記録タブで共有するアイコン。
 * 参照: docs/design/tokens.md
 *
 * 線は`currentColor`で描き、色は親要素の`text-*`で指定する。
 * すべて装飾目的のため`aria-hidden`を付け、意味はボタン側のラベルで伝える。
 */

interface IconProps {
  size?: number;
}

/** ＋(追加) */
export function PlusIcon({ size = 18 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M9 3.6v10.8" />
      <path d="M3.6 9h10.8" />
    </svg>
  );
}

/** 段違いの3本線(並べ替え) */
export function SortIcon({ size = 15 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M2.5 4h11" />
      <path d="M4.5 8h7" />
      <path d="M6.5 12h3" />
    </svg>
  );
}

/** 縦三点(その他メニュー) */
export function MoreIcon({ size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M9 4.2v.01" />
      <path d="M9 9v.01" />
      <path d="M9 13.8v.01" />
    </svg>
  );
}

/**
 * チェックマーク(チェック済みボックス・達成バッジの中身)。
 * `small`は20px以下の丸バッジ用の一回り小さい寸法。
 */
export function CheckMark({ small = false }: { small?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={
        small
          ? "-mt-[2px] block h-1 w-[9px] -rotate-45 border-b-2 border-l-2 border-white"
          : "-mt-[3px] block h-[5px] w-[11px] -rotate-45 border-b-[2.5px] border-l-[2.5px] border-white"
      }
    />
  );
}
