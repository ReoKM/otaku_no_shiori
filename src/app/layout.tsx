import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { ServiceWorkerRegistration } from "@/components/common/ServiceWorkerRegistration";
import "./globals.css";

// 本文フォントはWebフォントを使わず端末のシステムフォントに任せる
// (2026-08-07オーナー判断。フォントスタックは globals.css の `--font-sans`)。
//
// 以前は next/font で Zen Kaku Gothic New を読み込んでいたが、日本語は
// Google Fonts が unicode-range を121分割で返すため、4ウェイト分で
// @font-face 485個・woff2 484ファイル(5.4MB)が生成されていた。
// 結果、描画をブロックするCSSが gzip 128KB、トップ画面の実文字列だけで
// フォント84リクエスト/750KBを要求し、初回表示が重い直接原因になっていた。
// 日本語は文字が unicode-range 全域に散るため `preload: false` では回避できない。
//
// Webフォントを再導入する場合は、この分割の問題を必ず先に解決すること
// (見出し限定・単一ウェイト、またはサブセット済みフォントの self-host)。

export const metadata: Metadata = {
  title: "オタクのしおり | 遠征のすべてを、1冊のしおりに。",
  description:
    "ライブ・イベント・聖地巡礼などオタクの遠征準備を1冊の「しおり」に。持ち物リスト・やること・旅程・行きたいスポット・写真の記録が、登録なしで無料で使える遠征ツールです。",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    // iOS Safari(ホーム画面追加)はSVGアイコン非対応のためPNGを別途指定する
    apple: "/apple-touch-icon.png",
  },
};

// theme_colorはUIの差し色 color-sakura と揃える(manifest.webmanifestと同値)
export const viewport: Viewport = {
  themeColor: "#D6146F",
};

// 計測スタブ: NEXT_PUBLIC_GA_IDが設定されており、かつ測定IDとして妥当な形式
// (英数字とハイフンのみ)の場合のみGA4を読み込む。値はインラインスクリプトへ埋め込むため、
// 想定外の文字列を弾いてスクリプトインジェクションを防ぐ(多層防御)。
// 未設定なら一切何も読み込まない(計測ツールの最終選定・アカウント作成はオーナー判断)。
const rawGaId = process.env.NEXT_PUBLIC_GA_ID;
const gaId = rawGaId && /^[A-Za-z0-9-]+$/.test(rawGaId) ? rawGaId : undefined;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        {children}
        <ServiceWorkerRegistration />
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
