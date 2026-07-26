import type { Metadata, Viewport } from "next";
import { Zen_Kaku_Gothic_New } from "next/font/google";
import Script from "next/script";
import { ServiceWorkerRegistration } from "@/components/common/ServiceWorkerRegistration";
import "./globals.css";

// 紙テイストUIの本文フォント。参照: docs/design/tokens.md「4. タイポグラフィトークン」
//
// `subsets`はあえて指定しない。next/fontが持つこのファミリのサブセット一覧は
// cyrillic/latin/latin-extのみで`japanese`が無く、指定すると日本語グリフが
// 一切含まれずシステムフォントにフォールバックしてしまうため。
// 未指定にするとGoogle Fontsが全unicode-range(日本語約110分割を含む)を返し、
// next/fontがそれらを自己ホストする。
//
// あわせて`preload: false`にする。全チャンクを先読みすると初回表示が大きく重くなるため、
// ブラウザに実際に必要な範囲だけ取得させる(無料枠ガードレールの観点でも先読みは避ける)。
const zenKaku = Zen_Kaku_Gothic_New({
  variable: "--font-zen-kaku",
  weight: ["400", "500", "700", "900"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "オタクのしおり | 遠征のすべてを、1冊のしおりに。",
  description:
    "ライブ・イベント・聖地巡礼などオタクの遠征準備を1冊の「しおり」に。持ち物リスト・やること・旅程・行きたいスポット・写真の記録が、登録なしで無料で使える遠征ツールです。",
  manifest: "/manifest.webmanifest",
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
      className={`${zenKaku.variable} h-full antialiased`}
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
