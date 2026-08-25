import type { Metadata } from "next";
import Link from "next/link";

/*
 * 利用規約(F: 公開準備、W3タスク4)。
 * 注意: この法務文書はドラフトであり、公開前にオーナーの承認が必須
 * (CLAUDE.md「オーナーへのエスカレーション」の権利・法務事項)。
 * 運営者名・制定日は2026-08-23にオーナー確認済み(運営者名「オタクのしおり運営事務局」、
 * 制定日はリリース予定日2026-08-24)。お問い合わせ窓口は未確定のため引き続き「準備中」。
 */

export const metadata: Metadata = {
  title: "利用規約 | オタクのしおり",
  description: "オタクのしおりの利用規約です。サービスの利用条件・禁止事項・免責事項について定めています。",
};

const sectionClass = "flex flex-col gap-2";
const headingClass = "text-base font-bold text-neutral-900";
const bodyClass = "text-sm leading-relaxed text-neutral-700";
const listClass = "list-disc flex flex-col gap-1 pl-5 text-sm leading-relaxed text-neutral-700";

export default function TermsPage() {
  return (
    <div className="flex flex-1 flex-col bg-neutral-50">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white px-4 py-4">
        <Link href="/" className="text-sm text-pink-500">
          ← ホームへ戻る
        </Link>
        <h1 className="mt-1 text-xl font-bold text-neutral-900">利用規約</h1>
      </header>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6">
        <p className={bodyClass}>
          この利用規約(以下「本規約」)は、「オタクのしおり」(以下「本サービス」)の利用条件を定めるものです。利用者のみなさま(以下「ユーザー」)には、本規約に同意のうえ本サービスをご利用いただきます。
        </p>

        <section className={sectionClass}>
          <h2 className={headingClass}>第1条(適用)</h2>
          <p className={bodyClass}>
            本規約は、ユーザーと本サービス運営者(以下「運営者」)との間の本サービスの利用に関わる一切の関係に適用されます。
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>第2条(利用条件)</h2>
          <ul className={listClass}>
            <li>本サービスは、アカウント登録なしで無料で利用できます。</li>
            <li>
              ユーザーが作成したデータ(しおり・持ち物・TODO・旅程・スポット・写真)は、現時点ではユーザーの端末内(ブラウザのIndexedDB等)にのみ保存され、運営者のサーバーには送信・保存されません。
            </li>
            <li>
              端末やブラウザの変更、ブラウザのデータ消去(閲覧履歴・サイトデータの削除等)により、保存したデータは失われます。データの保全はユーザーの責任で行ってください。
            </li>
          </ul>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>第3条(禁止事項)</h2>
          <p className={bodyClass}>ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
          <ul className={listClass}>
            <li>法令または公序良俗に違反する行為</li>
            <li>第三者の著作権・肖像権・プライバシーその他の権利を侵害する行為(権利者の許諾のない画像の利用を含む)</li>
            <li>本サービスの運営を妨害する行為、サーバーやネットワークに過度な負荷をかける行為</li>
            <li>本サービスを通じて生成したコンテンツを、第三者を誹謗中傷する目的で利用する行為</li>
            <li>その他、運営者が不適切と判断する行為</li>
          </ul>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>第4条(無保証・免責)</h2>
          <ul className={listClass}>
            <li>
              本サービスは現状有姿で提供され、運営者は、本サービスに事実上または法律上の瑕疵(安全性・信頼性・正確性・完全性・特定の目的への適合性等)がないことを保証しません。
            </li>
            <li>
              運営者は、本サービスの利用または利用不能により生じたいかなる損害(データの消失を含む)についても、運営者の故意または重過失による場合を除き、責任を負いません。
            </li>
            <li>
              本サービスに掲載されるスポット情報等は正確性を保証するものではありません。施設の営業状況・マナー等は現地のルールに従ってください。
            </li>
            <li>運営者は、事前の予告なく本サービスの内容の変更・提供の中断・終了を行うことがあります。</li>
          </ul>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>第5条(広告)</h2>
          <p className={bodyClass}>
            本サービスには、今後Google AdSense等の第三者配信の広告が掲載される場合があります。広告に関する情報の取り扱いはプライバシーポリシーをご確認ください。
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>第6条(規約の変更)</h2>
          <p className={bodyClass}>
            運営者は、必要と判断した場合、ユーザーへの個別通知なく本規約を変更できるものとします。変更後の規約は、本ページに掲載した時点から効力を生じます。変更後に本サービスの利用を継続した場合、変更後の規約に同意したものとみなします。
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>第7条(準拠法・裁判管轄)</h2>
          <p className={bodyClass}>
            本規約の解釈にあたっては日本法を準拠法とします。本サービスに関して紛争が生じた場合には、運営者の所在地を管轄する裁判所を第一審の専属的合意管轄裁判所とします。
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>運営者情報・お問い合わせ</h2>
          <p className={bodyClass}>運営者: オタクのしおり運営事務局</p>
          <p className={bodyClass}>お問い合わせ窓口: (準備中)</p>
        </section>

        <p className="text-xs text-neutral-400">制定日: 2026年8月24日</p>

        <nav className="border-t border-neutral-200 pt-4">
          <Link href="/privacy" className="text-sm text-pink-500">
            プライバシーポリシー
          </Link>
        </nav>
      </main>
    </div>
  );
}
