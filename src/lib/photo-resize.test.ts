import { describe, expect, it } from "vitest";
import { DEFAULT_MAX_DIMENSION, computeResizedDimensions } from "./photo-resize";

describe("computeResizedDimensions", () => {
  it("長辺が上限以下ならリサイズしない(そのまま返す)", () => {
    expect(computeResizedDimensions({ width: 800, height: 600 })).toEqual({
      width: 800,
      height: 600,
    });
  });

  it("長辺がちょうど上限と同じならリサイズしない", () => {
    expect(computeResizedDimensions({ width: 1600, height: 1200 })).toEqual({
      width: 1600,
      height: 1200,
    });
  });

  it("横長の画像は幅を基準に長辺1600pxへ縮小し、アスペクト比を維持する", () => {
    expect(computeResizedDimensions({ width: 3200, height: 1600 })).toEqual({
      width: 1600,
      height: 800,
    });
  });

  it("縦長の画像は高さを基準に長辺1600pxへ縮小し、アスペクト比を維持する", () => {
    expect(computeResizedDimensions({ width: 1600, height: 3200 })).toEqual({
      width: 800,
      height: 1600,
    });
  });

  it("正方形の画像も長辺基準で縮小される", () => {
    expect(computeResizedDimensions({ width: 4000, height: 4000 })).toEqual({
      width: 1600,
      height: 1600,
    });
  });

  it("端数が出る場合は四捨五入する", () => {
    // 3000x2000 -> scale = 1600/3000 = 0.5333... -> height = 2000*0.5333 = 1066.67 -> 1067
    expect(computeResizedDimensions({ width: 3000, height: 2000 })).toEqual({
      width: 1600,
      height: 1067,
    });
  });

  it("maxDimensionを明示的に指定できる", () => {
    expect(computeResizedDimensions({ width: 2000, height: 1000 }, 1000)).toEqual({
      width: 1000,
      height: 500,
    });
  });

  it("既定のmaxDimensionは1600である", () => {
    expect(DEFAULT_MAX_DIMENSION).toBe(1600);
  });
});
