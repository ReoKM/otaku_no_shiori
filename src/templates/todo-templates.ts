/**
 * F3 TODOテンプレート。
 * 参照: docs/01_service_spec.md「F3. TODOリスト」/ docs/design/screens/S3b_TODO.md
 *
 * F2(持ち物)と異なり、F3の仕様には遠征タイプ別テンプレの記載が無いため、
 * 遠征タイプに依らず共通1種として扱う(仮置き。詳細はS3b_TODO.md「不明点・仮置き」参照)。
 * 期限日はすべて未設定で投入する。
 */
import { createTodo } from "@/lib/guest-store";
import type { Todo } from "@/types/shiori";

export const TODO_TEMPLATE_LABELS = [
  "チケット申込",
  "当落確認",
  "チケット発券",
  "ホテル予約",
  "交通手配",
  "遠征資金の準備",
] as const;

/**
 * 指定しおりにテンプレートTODO一式(期限日未設定)を`sort_order`0番から追加する。
 * 戻り値は作成したTodoを追加順(sort_order昇順)で返す。
 */
export async function seedTodoTemplate(shioriId: string): Promise<Todo[]> {
  const created: Todo[] = [];
  for (let i = 0; i < TODO_TEMPLATE_LABELS.length; i += 1) {
    const todo = await createTodo({
      shiori_id: shioriId,
      label: TODO_TEMPLATE_LABELS[i],
      sort_order: i,
    });
    created.push(todo);
  }
  return created;
}
