"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { ShioriDetailHeader } from "@/components/shiori-detail/ShioriDetailHeader";
import { TabBar, type ShioriTabId } from "@/components/shiori-detail/TabBar";
import { formatDateRange } from "@/lib/format-date";
import { getShiori } from "@/lib/guest-store";
import {
  detectHorizontalSwipe,
  getAdjacentTab,
  getTabTransitionDirection,
  resolveTouchAxis,
  type SwipeDirection,
  type TouchAxis,
} from "@/lib/tab-swipe";
import type { Shiori } from "@/types/shiori";

/**
 * S3 しおり詳細(タブシェル共通)。
 * 参照: docs/design/screens/S3_しおり詳細.md
 *
 * 2026-07 UI刷新(「ノートを開いている」操作感):
 * - タブバーは画面下部固定(TabBar.tsx参照)。コンテンツは`--s3-tabbar-height`分の下パディングで逃がす
 * - コンテンツ左端にスパイラルノートの綴じリング(`.s3-note-binding`、fixedでスクロール非追従)
 * - コンテンツ本体は「紙」(`.s3-paper`)として浮かせ、タブ切り替え時に
 *   軽いページめくり(スライド+わずかなrotateY)アニメーションを付ける
 * - コンテンツ領域の左右スワイプでタブ移動(判定ロジックは`src/lib/tab-swipe.ts`)
 */
type LoadState = "loading" | "ready" | "not-found";

const TAB_IDS: ShioriTabId[] = ["packing", "todo", "itinerary", "log"];

function resolveActiveTab(pathname: string, shioriId: string): ShioriTabId | null {
  const prefix = `/shiori/${shioriId}/`;
  if (!pathname.startsWith(prefix)) {
    return null;
  }
  const rest = pathname.slice(prefix.length).split("/")[0];
  return TAB_IDS.find((tab) => tab === rest) ?? null;
}

/** 追跡中タッチの状態。axisは一度確定したら以後固定(縦スクロール開始後の横流れを無視するため)。 */
interface TouchTracking {
  x: number;
  y: number;
  identifier: number;
  axis: TouchAxis | null;
}

export default function ShioriDetailLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ id: string }>();
  const shioriId = params.id;
  const pathname = usePathname();
  const router = useRouter();

  // ロード結果を「どのidのものか」ごと保持する。
  // 別のしおりidへ遷移した直後は loaded.id !== shioriId となりローディング表示に戻るため、
  // 前のしおりのタイトル・日程が一瞬表示される不整合が起きない
  // (effect本体でのsetStateリセットを避けつつ同じ効果を得るための形)。
  const [loaded, setLoaded] = useState<{
    id: string;
    state: Exclude<LoadState, "loading">;
    shiori: Shiori | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    getShiori(shioriId)
      .then((found) => {
        if (cancelled) {
          return;
        }
        if (found) {
          setLoaded({ id: shioriId, state: "ready", shiori: found });
        } else {
          setLoaded({ id: shioriId, state: "not-found", shiori: null });
        }
      })
      .catch(() => {
        // guest-store読込に失敗した場合もS3仕様に定義された「見つからない」表示にフォールバックする(仮置き)。
        if (!cancelled) {
          setLoaded({ id: shioriId, state: "not-found", shiori: null });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [shioriId]);

  const current = loaded && loaded.id === shioriId ? loaded : null;
  const state: LoadState = current ? current.state : "loading";
  const shiori = current?.shiori ?? null;

  const activeTab = resolveActiveTab(pathname, shioriId);
  const dateRange = shiori ? formatDateRange(shiori.start_date, shiori.end_date) : null;

  // ページめくり方向: 直前に表示していたタブとの位置関係から決める。
  // レンダー中の条件付きsetState(Reactの「propsが変わったらstateを調整する」公式パターン)で、
  // タブが切り替わった瞬間のレンダーで方向を確定させる(effectだと1フレーム遅れるため)。
  const [turn, setTurn] = useState<{ tab: ShioriTabId | null; direction: SwipeDirection | null }>(
    () => ({ tab: activeTab, direction: null }),
  );
  if (turn.tab !== activeTab) {
    setTurn({
      tab: activeTab,
      direction: getTabTransitionDirection(TAB_IDS, turn.tab, activeTab),
    });
  }

  // スワイプ追跡(レンダーに影響しないのでref)。
  const touchRef = useRef<TouchTracking | null>(null);

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    // 2本目以降の指が触れたら(ピンチ等)追跡を破棄する
    if (event.touches.length !== 1) {
      touchRef.current = null;
      return;
    }
    // 並べ替えドラッグ中の行・ハンドル(touch-none指定の要素)上のタッチは
    // 独自ジェスチャーを持つためスワイプ対象にしない
    if (event.target instanceof Element && event.target.closest(".touch-none")) {
      touchRef.current = null;
      return;
    }
    const touch = event.touches[0];
    touchRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      identifier: touch.identifier,
      axis: null,
    };
  }

  function handleTouchMove(event: React.TouchEvent<HTMLDivElement>) {
    const tracking = touchRef.current;
    if (!tracking || tracking.axis !== null) {
      return;
    }
    const touch = Array.from(event.touches).find((t) => t.identifier === tracking.identifier);
    if (!touch) {
      return;
    }
    // 最初にまとまった移動が起きた時点で軸を確定する。
    // vertical確定後はtouchendでスワイプ判定しない(縦スクロールとの誤爆防止)
    tracking.axis = resolveTouchAxis(touch.clientX - tracking.x, touch.clientY - tracking.y);
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    const tracking = touchRef.current;
    touchRef.current = null;
    if (!tracking || tracking.axis === "vertical" || !activeTab) {
      return;
    }
    const touch = Array.from(event.changedTouches).find(
      (t) => t.identifier === tracking.identifier,
    );
    if (!touch) {
      return;
    }
    const direction = detectHorizontalSwipe(touch.clientX - tracking.x, touch.clientY - tracking.y);
    if (!direction) {
      return;
    }
    // 端(先頭packingより前・末尾logより後ろ)ではnullが返り、何もしない
    const targetTab = getAdjacentTab(TAB_IDS, activeTab, direction);
    if (targetTab) {
      router.push(`/shiori/${shioriId}/${targetTab}`);
    }
  }

  function handleTouchCancel() {
    touchRef.current = null;
  }

  // S4(スポット検索 `/shiori/[id]/spots/...`)/S5(共有画像 `/shiori/[id]/share`)は
  // 独自のヘッダー・戻る導線を持つ専用画面のため、このレイアウトのタブシェル
  // (ヘッダー+タブバー)を適用しない。
  // 参照: docs/design/screens/S4_スポット検索.md「レイアウト」(一覧画面ヘッダー/詳細画面ヘッダー)、
  // docs/design/screens/S5_共有画像プレビュー.md「レイアウト」(専用ヘッダー「共有画像を作る」)
  if (
    pathname.startsWith(`/shiori/${shioriId}/spots`) ||
    pathname.startsWith(`/shiori/${shioriId}/share`)
  ) {
    return <>{children}</>;
  }

  const turnClass =
    turn.direction === "next"
      ? "s3-page-turn-next"
      : turn.direction === "prev"
        ? "s3-page-turn-prev"
        : "";

  return (
    <div className="flex min-h-full flex-1 flex-col bg-neutral-100">
      <ShioriDetailHeader
        loading={state === "loading"}
        title={state === "not-found" ? "しおりが見つかりません" : (shiori?.title ?? "")}
        dateRange={dateRange}
        shareHref={state === "ready" ? `/shiori/${shioriId}/share` : undefined}
      />
      {/* ノートの綴じリング(スクロールしても動かない)。装飾のみ */}
      <div aria-hidden className="s3-note-binding" />
      <div
        className="flex flex-1 flex-col pb-[var(--s3-tabbar-height)] pl-6 pr-1.5"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
        {/* 紙(ページ)。keyをタブ単位にし、切り替え時にページめくりアニメーションを再生する */}
        <div key={activeTab ?? "shell"} className={`s3-paper relative flex flex-1 flex-col ${turnClass}`}>
          {state === "not-found" ? (
            <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
              <p className="text-red-600">このしおりは見つかりませんでした</p>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="h-11 rounded-lg border border-pink-500 px-4 text-pink-500"
              >
                一覧に戻る
              </button>
            </div>
          ) : (
            children
          )}
        </div>
      </div>
      <TabBar shioriId={shioriId} activeTab={activeTab} disabled={state === "loading"} />
    </div>
  );
}
