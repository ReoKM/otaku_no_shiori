"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** トーストを自動的に閉じるまでの時間(ms)。 */
const AUTO_DISMISS_MS = 5000;

interface UndoState<T> {
  message: string;
  payload: T;
}

export interface UseUndoToastResult<T> {
  /** 表示中のトースト(無ければnull)。 */
  toast: UndoState<T> | null;
  /** トーストを表示する。取り消し時に復元したいデータを`payload`に渡す。 */
  show: (message: string, payload: T) => void;
  /** 「元に戻す」押下時に呼ぶ。復元対象のpayloadを返し、トーストを閉じる。 */
  undo: () => T | null;
  /** トーストを閉じる(取り消さない)。 */
  dismiss: () => void;
}

/**
 * 削除の取り消しトーストの状態管理。
 * 参照: docs/design/screens/S3a_持ち物.md「削除の取り消し」
 *
 * 表示から5秒で自動的に閉じる。連続で削除した場合は最後の1件のみが取り消し対象になる
 * (タイマーを張り直し、直前のpayloadは破棄する)。
 */
export function useUndoToast<T>(): UseUndoToastResult<T> {
  const [toast, setToast] = useState<UndoState<T> | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // `undo()`は押下したその場で復元対象を返す必要がある。setStateの更新関数は
  // レンダーフェーズで呼ばれ同期的に値を取り出せないため、payloadをrefに写して持つ。
  const payloadRef = useRef<T | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // アンマウント後にsetStateが走らないようタイマーを片付ける
  useEffect(() => clearTimer, [clearTimer]);

  const show = useCallback(
    (message: string, payload: T) => {
      clearTimer();
      payloadRef.current = payload;
      setToast({ message, payload });
      timerRef.current = setTimeout(() => {
        payloadRef.current = null;
        setToast(null);
        timerRef.current = null;
      }, AUTO_DISMISS_MS);
    },
    [clearTimer],
  );

  const dismiss = useCallback(() => {
    clearTimer();
    payloadRef.current = null;
    setToast(null);
  }, [clearTimer]);

  const undo = useCallback((): T | null => {
    clearTimer();
    const restored = payloadRef.current;
    payloadRef.current = null;
    setToast(null);
    return restored;
  }, [clearTimer]);

  return { toast, show, undo, dismiss };
}
