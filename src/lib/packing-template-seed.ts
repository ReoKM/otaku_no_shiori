/**
 * F2 持ち物テンプレートの自動投入ロジック。
 * 参照: docs/design/screens/S3a_持ち物.md「前提: テンプレ自動投入のタイミング」
 *
 * 「0件かどうか」だけでは"初回"と"全削除後"を区別できないため、しおりごとの
 * 投入済みフラグを別途保持する必要がある(アーキテクト確定仕様)。
 * guest-store.ts(IndexedDB)のスキーマは変更せず、localStorageで代替する(仮置き。
 * 完了報告に明記)。localStorageが使えない環境(プライベートブラウジング等)では
 * 常に「未投入」扱いにフォールバックする。
 */
import { createPackingItem } from "./guest-store";
// 相対パスでimportする(vitest.config.tsに"@/"エイリアスのresolve設定が無いため。
// 型のみimportは型消去されテスト実行に影響しないが、この関数は値としてimportするため注意)。
import { getPackingTemplateItems } from "../templates/packing-templates";
import type { PackingItem, TripType } from "@/types/shiori";

const STORAGE_KEY_PREFIX = "packing-template-seeded:";

function getStorage(): Pick<Storage, "getItem" | "setItem"> | null {
  try {
    if (typeof globalThis.localStorage === "undefined") {
      return null;
    }
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

/** 指定しおりのテンプレートが投入済みかどうか。 */
export function isPackingTemplateSeeded(shioriId: string): boolean {
  return getStorage()?.getItem(`${STORAGE_KEY_PREFIX}${shioriId}`) === "true";
}

/** 指定しおりのテンプレート投入済みフラグを立てる。 */
export function markPackingTemplateSeeded(shioriId: string): void {
  getStorage()?.setItem(`${STORAGE_KEY_PREFIX}${shioriId}`, "true");
}

/**
 * shioriのtrip_typeに対応するテンプレート項目一式を sort_order 0番から追加し、
 * 投入済みフラグを立てる。呼び出し側(初回自動投入・EmptyPackingの手動追加)で
 * 追加後のリストを再取得すること。
 */
export async function seedPackingTemplate(
  shioriId: string,
  tripType: TripType,
): Promise<PackingItem[]> {
  const labels = getPackingTemplateItems(tripType);
  const created: PackingItem[] = [];
  for (let i = 0; i < labels.length; i += 1) {
    // sort_orderを明示指定して挿入順を保証するため直列実行する(テンプレは最大8件程度)。
    const item = await createPackingItem({
      shiori_id: shioriId,
      label: labels[i],
      sort_order: i,
    });
    created.push(item);
  }
  markPackingTemplateSeeded(shioriId);
  return created;
}
