import { describe, expect, it } from "vitest";
import {
  AXIS_LOCK_THRESHOLD_PX,
  SWIPE_MIN_DISTANCE_PX,
  detectHorizontalSwipe,
  getAdjacentTab,
  getTabTransitionDirection,
  resolveTouchAxis,
} from "./tab-swipe";

// S3タブシェルの実際の並び(layout.tsxのTAB_IDSと同じ)を使う
const TABS = ["packing", "todo", "itinerary", "log"] as const;
type TabId = (typeof TABS)[number];

describe("resolveTouchAxis", () => {
  it("移動量が閾値未満のうちは未確定(null)を返す", () => {
    expect(resolveTouchAxis(0, 0)).toBeNull();
    expect(resolveTouchAxis(AXIS_LOCK_THRESHOLD_PX - 1, 0)).toBeNull();
    expect(resolveTouchAxis(0, -(AXIS_LOCK_THRESHOLD_PX - 1))).toBeNull();
  });

  it("横移動が縦移動より大きければ horizontal と判定する", () => {
    expect(resolveTouchAxis(AXIS_LOCK_THRESHOLD_PX, 2)).toBe("horizontal");
    expect(resolveTouchAxis(-AXIS_LOCK_THRESHOLD_PX, 2)).toBe("horizontal");
  });

  it("縦移動が横移動以上なら vertical と判定する(縦スクロール優先)", () => {
    expect(resolveTouchAxis(2, AXIS_LOCK_THRESHOLD_PX)).toBe("vertical");
    expect(resolveTouchAxis(0, -AXIS_LOCK_THRESHOLD_PX)).toBe("vertical");
    // 同量ならスクロール側に倒す
    expect(resolveTouchAxis(AXIS_LOCK_THRESHOLD_PX, AXIS_LOCK_THRESHOLD_PX)).toBe("vertical");
  });
});

describe("detectHorizontalSwipe", () => {
  it("水平移動が閾値未満ならスワイプ不成立(null)", () => {
    expect(detectHorizontalSwipe(0, 0)).toBeNull();
    expect(detectHorizontalSwipe(-(SWIPE_MIN_DISTANCE_PX - 1), 0)).toBeNull();
    expect(detectHorizontalSwipe(SWIPE_MIN_DISTANCE_PX - 1, 0)).toBeNull();
  });

  it("左スワイプ(dx<0)は next、右スワイプ(dx>0)は prev", () => {
    expect(detectHorizontalSwipe(-SWIPE_MIN_DISTANCE_PX, 0)).toBe("next");
    expect(detectHorizontalSwipe(SWIPE_MIN_DISTANCE_PX, 0)).toBe("prev");
  });

  it("縦移動の割合が大きい斜めの動きはスワイプ扱いしない(縦スクロール誤爆防止)", () => {
    // dx=60 に対して dy=31 (> 60 * 0.5) は不成立
    expect(detectHorizontalSwipe(-60, 31)).toBeNull();
    expect(detectHorizontalSwipe(60, -31)).toBeNull();
    // dy=30 (= 60 * 0.5 ちょうど) までは成立
    expect(detectHorizontalSwipe(-60, 30)).toBe("next");
    expect(detectHorizontalSwipe(60, -30)).toBe("prev");
  });
});

describe("getAdjacentTab", () => {
  it("中間のタブでは前後のタブを返す", () => {
    expect(getAdjacentTab<TabId>(TABS, "todo", "next")).toBe("itinerary");
    expect(getAdjacentTab<TabId>(TABS, "todo", "prev")).toBe("packing");
  });

  it("端では何もしない(先頭のprev・末尾のnextはnull)", () => {
    expect(getAdjacentTab<TabId>(TABS, "packing", "prev")).toBeNull();
    expect(getAdjacentTab<TabId>(TABS, "log", "next")).toBeNull();
  });

  it("現在タブがnull・配列に無い場合はnull", () => {
    expect(getAdjacentTab<TabId>(TABS, null, "next")).toBeNull();
    expect(getAdjacentTab(["a", "b"], "c", "next")).toBeNull();
  });
});

describe("getTabTransitionDirection", () => {
  it("配列で後ろのタブへ進むと next、前へ戻ると prev", () => {
    expect(getTabTransitionDirection<TabId>(TABS, "packing", "todo")).toBe("next");
    expect(getTabTransitionDirection<TabId>(TABS, "packing", "log")).toBe("next");
    expect(getTabTransitionDirection<TabId>(TABS, "log", "itinerary")).toBe("prev");
    expect(getTabTransitionDirection<TabId>(TABS, "todo", "packing")).toBe("prev");
  });

  it("同一タブ・初回表示(from/toがnull)・不明なタブはアニメーション無し(null)", () => {
    expect(getTabTransitionDirection<TabId>(TABS, "todo", "todo")).toBeNull();
    expect(getTabTransitionDirection<TabId>(TABS, null, "todo")).toBeNull();
    expect(getTabTransitionDirection<TabId>(TABS, "todo", null)).toBeNull();
    expect(getTabTransitionDirection(["a", "b"], "a", "x")).toBeNull();
  });
});
