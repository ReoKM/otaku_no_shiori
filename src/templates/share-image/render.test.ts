/**
 * 共有画像テンプレート(simple/nigiyaka)のユニットテスト。
 *
 * 構成:
 *  1. `SimpleTemplate`/`NigiyakaTemplate`(Reactエレメントを組み立てるだけの純粋関数)のテスト。
 *     - タイトル・ロゴ(サービス名)・URLが必ず含まれること
 *     - 旅程ダイジェスト/持ち物・スポットの表示件数の上限
 *     - 写真0〜4枚の扱い(0枚で壊れない・3枚まで・4枚目は無視)
 *     satoriを介さずReactエレメントを直接検査するため、ネットワークなしで高速に実行できる。
 *
 *  2. `renderShareImageToSvg`(satori本体を使う統合テスト)。
 *     フォントは`fonts.ts`の実装(Google Fontsからの動的サブセット取得)をそのまま使うため、
 *     このテストブロックは実ネットワーク通信を伴う(Netlify Functions/GitHub Actionsのような
 *     アウトバウンド疎通がある環境が前提。オフライン環境では失敗する点に留意)。
 */
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderShareImageToSvg } from "./render";
import { NigiyakaTemplate } from "./nigiyaka";
import { SimpleTemplate } from "./simple";
import { DEFAULT_SERVICE_NAME, DEFAULT_SERVICE_URL, type ShareImageProps } from "./types";

type TemplateFn = (props: ShareImageProps) => ReactElement;

const NETWORK_TEST_TIMEOUT_MS = 20_000;

/** 10文字のタイトル */
const TITLE_SHORT = "初めての遠征のしおり";
/** 40文字(F7完了条件「30文字でも崩れない」の確認用。TITLE_SHORTの文字だけで構成し追加のグリフ調達を不要にする) */
const TITLE_LONG = TITLE_SHORT.repeat(4);

/** 1x1pxの透明PNG。実際のユーザー写真の代わりに使うダミーデータ */
const DUMMY_PHOTO_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

const BASE_PROPS: ShareImageProps = {
  templateId: "simple",
  title: TITLE_SHORT,
  dateRangeLabel: "2026/08/01 - 2026/08/03",
  tripType: "live",
  itineraryDigest: [
    { label: "1日目 12:00", text: "会場入り" },
    { label: "1日目 18:00", text: "開演" },
    { label: "2日目 10:00", text: "解散" },
    { label: "3日目 09:00", text: "帰宅" }, // 4件目: テンプレ側は先頭3件までしか表示しない
  ],
  // 5件目「トレカケース」: テンプレ側は先頭4件までしか表示しない
  highlightItems: ["ペンライト", "うちわ", "モバイルバッテリー", "推しタオル", "トレカケース"],
  photos: [],
};

const TEMPLATES: Array<[string, TemplateFn]> = [
  ["simple", SimpleTemplate],
  ["nigiyaka", NigiyakaTemplate],
];

/** Reactエレメントツリーから文字テキストだけを再帰的に集める(satoriに渡す前の構造を直接検証する) */
function collectText(node: ReactNode, acc: string[] = []): string[] {
  if (node === null || node === undefined || typeof node === "boolean") {
    return acc;
  }
  if (typeof node === "string" || typeof node === "number") {
    acc.push(String(node));
    return acc;
  }
  if (Array.isArray(node)) {
    for (const child of node) {
      collectText(child as ReactNode, acc);
    }
    return acc;
  }
  if (isValidElement(node)) {
    // 関数コンポーネント(LogoUrlBar/Chip等)はpropsから内部でテキストを生成するため、
    // 純粋関数として実行して展開する(satoriテンプレは副作用なしの前提)。
    if (typeof node.type === "function") {
      collectText((node.type as (p: unknown) => ReactNode)(node.props), acc);
      return acc;
    }
    const props = node.props as { children?: ReactNode };
    collectText(props.children, acc);
  }
  return acc;
}

/** Reactエレメントツリーからimg要素のsrcだけを再帰的に集める(写真の反映確認用) */
function collectImageSrcs(node: ReactNode, acc: string[] = []): string[] {
  if (node === null || node === undefined || typeof node === "boolean") {
    return acc;
  }
  if (typeof node === "string" || typeof node === "number") {
    return acc;
  }
  if (Array.isArray(node)) {
    for (const child of node) {
      collectImageSrcs(child as ReactNode, acc);
    }
    return acc;
  }
  if (isValidElement(node)) {
    if (node.type === "img") {
      const src = (node.props as { src?: string }).src;
      if (src) {
        acc.push(src);
      }
    }
    // 関数コンポーネント(PhotoRow等)内のimgも展開して収集する(collectTextと同じ理由)。
    if (typeof node.type === "function") {
      collectImageSrcs((node.type as (p: unknown) => ReactNode)(node.props), acc);
      return acc;
    }
    const props = node.props as { children?: ReactNode };
    collectImageSrcs(props.children, acc);
  }
  return acc;
}

describe.each(TEMPLATES)("%sテンプレート(Reactエレメント構造)", (_templateName, Template) => {
  it("タイトル・サービス名・共有URL(?via=share付き)を必ず含む", () => {
    const text = collectText(Template(BASE_PROPS)).join("");
    expect(text).toContain(TITLE_SHORT);
    expect(text).toContain(DEFAULT_SERVICE_NAME);
    expect(text).toContain(DEFAULT_SERVICE_URL);
    expect(DEFAULT_SERVICE_URL).toContain("?via=share");
  });

  it("serviceName/serviceUrlをPropsで上書きできる", () => {
    const text = collectText(
      Template({
        ...BASE_PROPS,
        serviceName: "Otaku Shiori Test",
        serviceUrl: "https://example.com/?via=share",
      }),
    ).join("");
    expect(text).toContain("Otaku Shiori Test");
    expect(text).toContain("https://example.com/?via=share");
  });

  it("30文字を超える長文タイトルでも要素構築が壊れない", () => {
    expect(TITLE_LONG.length).toBeGreaterThanOrEqual(30);
    const text = collectText(Template({ ...BASE_PROPS, title: TITLE_LONG })).join("");
    expect(text).toContain(TITLE_LONG);
  });

  it("旅程ダイジェストは先頭3件のみ表示する", () => {
    const text = collectText(Template(BASE_PROPS)).join("");
    expect(text).toContain("会場入り");
    expect(text).toContain("開演");
    expect(text).toContain("解散");
    expect(text).not.toContain("帰宅"); // 4件目は表示しない
  });

  it("持ち物・スポットは先頭4件のみ表示する", () => {
    const text = collectText(Template(BASE_PROPS)).join("");
    expect(text).toContain("ペンライト");
    expect(text).toContain("うちわ");
    expect(text).toContain("モバイルバッテリー");
    expect(text).toContain("推しタオル");
    expect(text).not.toContain("トレカケース"); // 5件目は表示しない
  });

  it("写真0枚でも要素構築が壊れず、img要素を含まない", () => {
    expect(() => collectImageSrcs(Template({ ...BASE_PROPS, photos: [] }))).not.toThrow();
    expect(collectImageSrcs(Template({ ...BASE_PROPS, photos: [] }))).toHaveLength(0);
  });

  it("写真は最大3枚まで表示し、4枚目以降は無視する", () => {
    const photos = [1, 2, 3, 4].map((n) => ({ dataUrl: `${DUMMY_PHOTO_DATA_URL}#${n}` }));
    const srcs = collectImageSrcs(Template({ ...BASE_PROPS, photos }));
    expect(srcs).toHaveLength(3);
    expect(srcs).toEqual([`${DUMMY_PHOTO_DATA_URL}#1`, `${DUMMY_PHOTO_DATA_URL}#2`, `${DUMMY_PHOTO_DATA_URL}#3`]);
  });
});

describe("renderShareImageToSvg(satori統合・実ネットワーク経由でNoto Sans JPを取得)", () => {
  const cases: Array<[templateId: "simple" | "nigiyaka", label: string, props: ShareImageProps]> = [
    ["simple", "基本Props(写真なし)", { ...BASE_PROPS, templateId: "simple" }],
    ["simple", "長文タイトル(30文字超)", { ...BASE_PROPS, templateId: "simple", title: TITLE_LONG }],
    [
      "simple",
      "写真あり(3枚)",
      {
        ...BASE_PROPS,
        templateId: "simple",
        photos: [
          { dataUrl: DUMMY_PHOTO_DATA_URL },
          { dataUrl: DUMMY_PHOTO_DATA_URL },
          { dataUrl: DUMMY_PHOTO_DATA_URL },
        ],
      },
    ],
    ["nigiyaka", "基本Props(写真なし)", { ...BASE_PROPS, templateId: "nigiyaka" }],
    ["nigiyaka", "長文タイトル(30文字超)", { ...BASE_PROPS, templateId: "nigiyaka", title: TITLE_LONG }],
    [
      "nigiyaka",
      "写真あり(1枚)",
      { ...BASE_PROPS, templateId: "nigiyaka", photos: [{ dataUrl: DUMMY_PHOTO_DATA_URL }] },
    ],
  ];

  it.each(cases)(
    "%s / %s は1080x1920のSVG文字列を返す",
    async (_templateId, _label, props) => {
      const svg = await renderShareImageToSvg(props);
      expect(typeof svg).toBe("string");
      expect(svg.startsWith("<svg")).toBe(true);
      expect(svg).toContain('width="1080"');
      expect(svg).toContain('height="1920"');
      if (props.photos.length > 0) {
        expect(svg).toContain("<image");
      }
    },
    NETWORK_TEST_TIMEOUT_MS,
  );
});
