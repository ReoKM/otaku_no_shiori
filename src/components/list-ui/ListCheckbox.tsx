import { CheckMark } from "./icons";

interface ListCheckboxProps {
  checked: boolean;
}

/**
 * リスト行の左端に置く角丸チェックボックス(26px)の見た目。
 * 参照: docs/design/screens/S3a_持ち物.md「PackingRow」
 *
 * 行全体がトグルボタンになっているため、この要素自体はフォーカスを取らない見た目専用の部品。
 * 44×44pxのタップ領域は行側で確保する。
 */
export function ListCheckbox({ checked }: ListCheckboxProps) {
  return (
    <span className="-ml-2.5 grid h-11 w-11 flex-none place-items-center">
      <span
        className={`grid h-6.5 w-6.5 place-items-center rounded-lg transition-colors duration-150 ${
          checked ? "bg-sakura" : "border-2 border-ink-faint bg-white"
        }`}
      >
        {checked && <CheckMark />}
      </span>
    </span>
  );
}
