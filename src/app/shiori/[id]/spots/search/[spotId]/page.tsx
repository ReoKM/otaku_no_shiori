import { SpotSearchDetail } from "@/components/spots-search/SpotSearchDetail";
import { getSeedSpotById } from "@/lib/seed-spots";

/**
 * S4 スポット検索(詳細画面)。
 * 参照: docs/design/screens/S4_スポット検索.md「詳細画面」
 *
 * `spotId`は同梱シードJSON側の`seed-`プレフィックス付きID(UGCスポットはS4の対象外)。
 * `q`/`category`は一覧画面から引き継いだ検索条件で、戻るボタンの遷移先に使う。
 */
export default async function SpotSearchDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; spotId: string }>;
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { id, spotId } = await params;
  const sp = await searchParams;
  const spot = getSeedSpotById(spotId);

  const query = new URLSearchParams();
  if (sp.q) {
    query.set("q", sp.q);
  }
  if (sp.category) {
    query.set("category", sp.category);
  }
  const qs = query.toString();
  const backQueryString = qs ? `?${qs}` : "";

  if (!spot) {
    // 直接URLアクセス等で存在しないspotIdが渡された場合(不正データ・仮置き)。
    return (
      <div className="flex flex-1 flex-col items-center gap-3 px-4 py-10 text-center">
        <p className="text-red-600">このスポットは見つかりませんでした</p>
        <a href={`/shiori/${id}/spots/search`} className="h-11 px-4 text-pink-500">
          一覧に戻る
        </a>
      </div>
    );
  }

  return <SpotSearchDetail shioriId={id} spot={spot} backQueryString={backQueryString} />;
}
