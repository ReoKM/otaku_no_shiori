import type { ReactNode } from "react";

/**
 * S3d LogDateGroup(日付グループ見出し)。
 * 参照: docs/design/screens/S3d_ログ.md「LogDateGroup(日付グループ見出し)」
 */
interface LogDateGroupProps {
  label: string;
  children: ReactNode;
}

export function LogDateGroup({ label, children }: LogDateGroupProps) {
  return (
    <div className="px-4 py-3">
      <h3 className="mb-2 text-lg font-bold text-neutral-900">{label}</h3>
      {children}
    </div>
  );
}
