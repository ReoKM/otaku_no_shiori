"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { clampIndexToGroupRange, computeDropIndex, moveIdToIndex } from "./drag-sort";

const DEFAULT_LONG_PRESS_MS = 300;
/** 長押し判定中にこのpx以上ポインターが動いたら「スクロール」とみなしドラッグ開始をキャンセルする。 */
const MOVE_CANCEL_THRESHOLD_PX = 8;

export interface UseDragSortOptions {
  /** 現在の表示順のid配列(持ち物=items、TODOはsortedTodosのid列)。 */
  ids: string[];
  /**
   * 指定時、ドラッグ移動を同じグループ内に制限する(TODOのグループ境界用)。
   * `ids`内でグループごとに連続している前提(呼び出し側のソート済み配列)。
   */
  groupKeyOf?: (id: string) => string;
  /** ドラッグ確定時に新しい並び順(全件のid配列)を渡して呼ばれる。並びが変化しない場合は呼ばれない。 */
  onDrop: (newOrder: string[]) => void;
  longPressMs?: number;
}

export interface UseDragSortResult {
  /** 現在の表示順(ドラッグ中は暫定的な並びに差し替わる)。 */
  order: string[];
  /** ドラッグ中の行id(ドラッグ中でなければnull)。 */
  draggingId: string | null;
  /** 行のルート要素に付ける ref コールバック(矩形計測用)。 */
  registerRow: (id: string) => (el: HTMLElement | null) => void;
  /** ドラッグハンドル(≡ボタン)に付ける onPointerDown ハンドラ。 */
  onHandlePointerDown: (id: string) => (e: React.PointerEvent<HTMLElement>) => void;
}

/**
 * S3a/S3b並べ替えモードの共有フック。ドラッグハンドルを約300ms長押しした後、
 * ポインター移動に追従して挿入位置を計算し、離した時点で確定した並び順を`onDrop`へ渡す。
 * 新規npm依存を避けるため、HTML5 Drag&DropではなくPointer Eventsのみで実装する
 * (Drag&Dropはモバイルブラウザで実質使えないため)。
 *
 * ドラッグ中の「確定した並び順」は`beginDrag`のクロージャ内ローカル変数で追跡する
 * (pointerup時点で読む値が常に最新であることを保証するため。Reactステートを
 * イベントリスナー内で読むとクロージャが古い値を参照する可能性がある)。
 * レンダリング用の表示状態(`order`/`draggingId`)はuseStateのみで管理し、
 * レンダー中にref(`.current`)を読まないようにする(react-hooks/refsルール対応)。
 */
export function useDragSort({
  ids,
  groupKeyOf,
  onDrop,
  longPressMs = DEFAULT_LONG_PRESS_MS,
}: UseDragSortOptions): UseDragSortResult {
  const idsRef = useRef(ids);
  useEffect(() => {
    idsRef.current = ids;
  }, [ids]);

  const rowRefs = useRef(new Map<string, HTMLElement>());
  const cleanupRef = useRef<(() => void) | null>(null);

  const [dragId, setDragId] = useState<string | null>(null);
  const [visualOrder, setVisualOrder] = useState<string[] | null>(null);

  // アンマウント時、ドラッグ中であればグローバルリスナーを確実に外す。
  useEffect(() => {
    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, []);

  // idごとのrefコールバックをキャッシュする(呼び出し側は`registerRow(id)`をレンダーのたびに
  // 呼ぶため、キャッシュ無しだと関数の参照が毎回変わりReactが不要なdetach/attachを繰り返す。
  // ドラッグ中はポインター移動のたびに再レンダーされるため、この無駄を避ける)。
  const registerRowCache = useRef(new Map<string, (el: HTMLElement | null) => void>());
  const registerRow = useCallback((id: string) => {
    const cached = registerRowCache.current.get(id);
    if (cached) {
      return cached;
    }
    const fn = (el: HTMLElement | null) => {
      if (el) {
        rowRefs.current.set(id, el);
      } else {
        rowRefs.current.delete(id);
        registerRowCache.current.delete(id);
      }
    };
    registerRowCache.current.set(id, fn);
    return fn;
  }, []);

  const beginDrag = useCallback(
    (id: string) => {
      // ドラッグセッション中の「確定した並び順」。pointerup時点でこの値を読むため、
      // Reactステート(非同期更新)ではなくこのクロージャ内ローカル変数を正とする。
      let currentOrder = idsRef.current;
      setDragId(id);
      setVisualOrder(currentOrder);

      function onPointerMove(e: PointerEvent) {
        const others = idsRef.current.filter((otherId) => otherId !== id);
        const otherRects = others
          .map((otherId) => {
            const el = rowRefs.current.get(otherId);
            if (!el) {
              return null;
            }
            const rect = el.getBoundingClientRect();
            return { id: otherId, top: rect.top, height: rect.height };
          })
          .filter((r): r is { id: string; top: number; height: number } => r !== null);

        let dropIndex = computeDropIndex(otherRects, e.clientY);
        if (groupKeyOf) {
          dropIndex = clampIndexToGroupRange(others, groupKeyOf, groupKeyOf(id), dropIndex);
        }
        currentOrder = moveIdToIndex(idsRef.current, id, dropIndex);
        setVisualOrder(currentOrder);
      }

      function cleanup() {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("pointercancel", onPointerCancel);
        cleanupRef.current = null;
      }

      function finish(commit: boolean) {
        cleanup();
        setDragId(null);
        setVisualOrder(null);
        if (commit) {
          const original = idsRef.current;
          const changed =
            currentOrder.length !== original.length || currentOrder.some((oid, i) => oid !== original[i]);
          if (changed) {
            onDrop(currentOrder);
          }
        }
      }

      function onPointerUp() {
        finish(true);
      }

      function onPointerCancel() {
        finish(false);
      }

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerCancel);
      cleanupRef.current = cleanup;
    },
    [groupKeyOf, onDrop],
  );

  const onHandlePointerDown = useCallback(
    (id: string) => (e: React.PointerEvent<HTMLElement>) => {
      if (e.pointerType === "mouse" && e.button !== 0) {
        return;
      }
      const startX = e.clientX;
      const startY = e.clientY;

      function detach() {
        window.clearTimeout(timer);
        window.removeEventListener("pointermove", onPreMove);
        window.removeEventListener("pointerup", onPreEnd);
        window.removeEventListener("pointercancel", onPreEnd);
      }

      function onPreMove(ev: PointerEvent) {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        if (Math.hypot(dx, dy) > MOVE_CANCEL_THRESHOLD_PX) {
          detach();
        }
      }

      function onPreEnd() {
        detach();
      }

      const timer = window.setTimeout(() => {
        detach();
        beginDrag(id);
      }, longPressMs);

      window.addEventListener("pointermove", onPreMove);
      window.addEventListener("pointerup", onPreEnd);
      window.addEventListener("pointercancel", onPreEnd);
    },
    [beginDrag, longPressMs],
  );

  return {
    order: visualOrder ?? ids,
    draggingId: dragId,
    registerRow,
    onHandlePointerDown,
  };
}
