import type { ReactNode } from "react";

/**
 * S3d LogPhotoGrid(写真グリッド)。
 * 参照: docs/design/screens/S3d_ログ.md「LogPhotoGrid(写真グリッド)」
 * 3列グリッド(列間・行間space-2)。
 */
export function LogPhotoGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-3 gap-2">{children}</div>;
}
