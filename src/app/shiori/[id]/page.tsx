import { redirect } from "next/navigation";

/**
 * `/shiori/[id]` へのアクセスはデフォルトタブ(持ち物)へリダイレクトする。
 * 参照: docs/design/screens/S1_ホーム一覧.md「ShioriCard」タップ時の挙動
 */
export default async function ShioriIndexPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/shiori/${id}/packing`);
}
