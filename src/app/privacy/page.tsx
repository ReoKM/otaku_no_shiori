import type { Metadata } from "next";
import Link from "next/link";

/*
 * プライバシーポリシー(F: 公開準備、W3タスク4)。
 * 注意: この法務文書はドラフトであり、公開前にオーナーの承認が必須
 * (CLAUDE.md「オーナーへのエスカレーション」の権利・法務事項)。
 * 運営者情報・連絡先・制定日はオーナー確認後に確定する。
 */

export const metadata: Metadata = {
  title: "プライバシーポリシー | オタクのしおり",
  description:
    "オタクのしおりのプライバシーポリシーです。データの保存場所・アクセス解析・広告に関する情報の取り扱いについて説明しています。",
};

const sectionClass = "flex flex-col gap-2";
const headingClass = "text-base font-bold text-neutral-900";
const bodyClass = "text-sm leading-relaxed text-neutral-700";
const listClass = "list-disc flex flex-col gap-1 pl-5 text-sm leading-relaxed text-neutral-700";

export default function PrivacyPage() {
  return (
    <div className="flex flex-1 flex-col bg-neutral-50">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white px-4 py-4">
        <Link href="/" className="text-sm text-pink-500">
          ← ホームへ戻る
        </Link>
        <h1 className="mt-1 text-xl font-bold text-neutral-900">プライバシーポリシー</h1>
      </header>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6">
        <p className={bodyClass}>
          「オタクのしおり」(以下「本サービス」)は、ユーザーの情報の取り扱いについて、以下のとおりプライバシーポリシー(以下「本ポリシー」)を定めます。
        </p>

        <section className={sectionClass}>
          <h2 className={headingClass}>1. 作成データの保存場所</h2>
          <ul className={listClass}>
            <li>
              ユーザーが本サービスで作成したデータ(しおり・持ち物・TODO・旅程・スポット・写真)は、現時点ではすべてユーザーの端末内(ブラウザのIndexedDB等)にのみ保存されます。これらのデータが運営者のサーバーへ送信・保存されることはありません。
            </li>
            <li>
              そのため運営者は、ユーザーが作成したしおりの内容や写真を閲覧・取得できません。一方で、端末やブラウザの変更、ブラウザのデータ消去により保存データは失われ、運営者はこれを復元できません。
            </li>
          </ul>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>2. 共有画像の生成時の一時的な処理</h2>
          <p className={bodyClass}>
            しおりの共有画像を生成する際、画像の合成処理のため、しおりの一部データ(タイトル・日程・選択した写真等)が運営者のサーバー(サーバーレス関数)へ一時的に送信されます。送信されたデータは共有画像の生成にのみ使用し、生成処理の完了後にサーバーへ保存・保持されることはありません。
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>3. アクセス解析</h2>
          <p className={bodyClass}>
            本サービスは、サービス改善のためにアクセス解析ツール(Google Analytics 4等)を導入する場合があります。アクセス解析ツールはCookie等を使用して匿名のトラフィックデータを収集します。導入する際は、収集する情報の内容・オプトアウト方法を本ポリシーに追記して更新します。
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>4. 広告</h2>
          <p className={bodyClass}>
            本サービスは、今後Google AdSense等の第三者配信の広告サービスを利用する予定があります。広告配信事業者は、ユーザーの興味に応じた広告を表示するためにCookie等を使用することがあります。広告を掲載する際は、利用する広告サービス・Cookieの無効化方法を本ポリシーに追記して更新します。
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>5. 免責</h2>
          <p className={bodyClass}>
            端末内に保存されたデータの消失について、運営者は責任を負いません。詳細は
            <Link href="/terms" className="text-pink-500">
              利用規約
            </Link>
            をご確認ください。
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>6. 本ポリシーの変更</h2>
          <p className={bodyClass}>
            本ポリシーの内容は、法令の変更やサービス内容の変更(アクセス解析・広告の導入等)に応じて、ユーザーへの個別通知なく変更されることがあります。変更後のポリシーは、本ページに掲載した時点から効力を生じます。
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>7. 運営者情報・お問い合わせ</h2>
          <p className={bodyClass}>(準備中)</p>
        </section>

        <p className="text-xs text-neutral-400">制定日: (準備中)</p>

        <nav className="border-t border-neutral-200 pt-4">
          <Link href="/terms" className="text-sm text-pink-500">
            利用規約
          </Link>
        </nav>
      </main>
    </div>
  );
}
