'use client';

import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/utils/useIsMobile';
import SiteFooter from '@/components/SiteFooter';
import LegalDocBody, { useSiteDocument } from '@/components/LegalDocBody';

// 2026-07-11 差し替え済みの正式文面（プライバシーポリシー_修正版）。
// 管理者ページ（規約・ポリシータブ）で保存した文面があればそちらが優先表示される。
const DEFAULT_CONTENT = `
株式会社MANABI（以下「当社」といいます。）は、本ウェブサイト上で提供するサービス（以下「本サービス」といいます。）における、ユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます。）を定めます。

第1条（個人情報）
「個人情報」とは、個人情報保護法にいう「個人情報」を指すものとし、生存する個人に関する情報であって、氏名、生年月日、住所、電話番号、メールアドレス等により特定の個人を識別できる情報、及びマイナンバー、パスポート番号等の個人識別符号が含まれる情報をいいます。

第2条（個人情報の収集方法）
当社は、学生会員の登録・応募時に、氏名、メールアドレス、学年、学部、専攻、職務経歴、スキル、希望条件、自己紹介文、職務経歴書等をお尋ねします。また、企業会員の登録時に、企業名、所在地、担当者氏名、連絡先、求人情報等をお尋ねします。このほか、プラットフォーム上での応募履歴、検索履歴等の利用履歴、及びクッキー等の技術により情報を収集することがあります。

第3条（個人情報を収集・利用する目的）
当社が個人情報を収集・利用する目的は、次のとおりです。
① 学生会員に対する求人情報の提供、企業会員に対するプロフィール情報の提供その他学生会員と企業会員のマッチング機会の提供のため（スカウトメッセージの送信を含みます。）
② 本サービス上の応募状況並びに企業会員から報告された内定及び採用成立に関する記録の管理並びに関連する通知の送信のため（当社は選考の実施及び合否の判断には関与しません。）
③ 本サービスの提供、運営、改善及び新サービス開発のため
④ 法令遵守（反社会的勢力の排除、不正検知、本人確認等）のため
⑤ 利用状況の統計・分析及びお問い合わせへの対応のため
⑥ 上記利用目的に付随する目的のため

第4条（個人情報の第三者提供）
当社は、本人の同意を得ることなく個人情報を第三者に提供することはありません。学生会員の個人情報については、登録時にチェックボックスによる明示的な同意を得たうえで、氏名、連絡先、学部・学年、スキル、職務経歴等のプロフィール情報及びエントリーシートを、スカウトメッセージの送信及び選考のため企業会員に提供します。
雇用契約の締結及び給与支払いに必要な住所、生年月日等の情報は、当社を介さず、学生会員が企業会員に直接提供するものとし、当社はこれらの情報の取得及び第三者提供を行いません。
なお、裁判所・警察等の法令に基づく要求がある場合、人の生命・身体の保護に必要な場合、及び秘密保持契約を締結した業務委託先への提供については、本人の同意を得ることなく提供することがあります。
当社は、個人情報保護法に基づき、学生会員の個人情報を企業会員に提供した記録を作成し、法令に定める期間保存します。

第5条（個人情報の開示）
当社は、本人から個人情報の開示を求められたときは、本人に対し、遅滞なくこれを開示します。ただし、開示することにより本人又は第三者の権利利益を害するおそれがある場合その他法令に違反することとなる場合は、その全部又は一部を開示しないことがあり、開示しない決定をしたときは、その旨を遅滞なく通知します。

第6条（個人情報の訂正及び削除）
ユーザーは、当社の保有する自己の個人情報が誤った情報である場合には、当社が定める手続きにより、当社に対して個人情報の訂正、追加又は削除を請求することができます。当社は、その請求に理由があると判断した場合には、遅滞なく当該個人情報の訂正等を行い、その旨をユーザーに通知します。

第7条（個人情報の利用停止等）
当社は、本人から、個人情報が利用目的の範囲を超えて取り扱われている、又は不正の手段により取得されたものであるという理由により、その利用の停止又は消去を求められた場合には、遅滞なく必要な調査を行います。調査の結果、請求に理由があると判断したときは、遅滞なく利用停止等を行い、その旨をユーザーに通知します。

第8条（プライバシーポリシーの変更）
本ポリシーの内容は、法令その他本ポリシーに別段の定めのある事項を除いて、変更することができるものとします。ユーザーの権利利益に重要な影響を及ぼす変更を行う場合、当社は変更内容及び効力発生日を、事前に本ウェブサイト上での掲示その他相当な方法により周知します。軽微な変更については、当社が別途定める場合を除いて、本ウェブサイトに掲載したときから効力を生じるものとします。

第9条（お問い合わせ窓口）
本ポリシーに関するお問い合わせは、下記の窓口までお願いいたします。
メールアドレス：info@manabiph.com
当社ホームページに設置するお問い合わせフォームからもご連絡いただけます。

以上
制定日：2026年7月1日（v1.0）
トウコベ インターン
`;

export default function PrivacyPolicyPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  // 管理者ページで編集した文面があればそちらを表示する
  const { content: dbDoc, updatedAt: dbUpdated } = useSiteDocument('privacy-policy');

  return (
    <div style={{ minHeight: '100vh', background: '#FBF8F4', fontFamily: "var(--font-sans)", color: '#1C1813' }}>

      {/* NAV */}
      <div style={{ background: '#fff', borderBottom: '1px solid #EFE8DF', padding: isMobile ? '14px 16px' : '14px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <img src="/toukobe-intern-logo.png" alt="トウコべインターン" style={{ height: 38, width: 'auto', cursor: 'pointer' }} onClick={() => router.push('/')} />
        <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', background: '#F2620C', borderRadius: 8, padding: '10px 22px', cursor: 'pointer' }} onClick={() => router.push('/auth/signup')}>無料で登録</span>
      </div>

      {/* HEADER */}
      <div style={{ background: 'linear-gradient(160deg,#FFF6EE,#FFEFE2)', padding: isMobile ? '40px 20px 36px' : '64px 48px 56px', textAlign: 'center' }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: '#F2620C', letterSpacing: '.2em', marginBottom: 12 }}>PRIVACY POLICY</div>
        <h1 style={{ fontWeight: 900, fontSize: isMobile ? 26 : 38, margin: '0 0 12px' }}>プライバシーポリシー</h1>
        <p style={{ fontSize: 13, color: '#938B81', margin: 0, fontFamily: "var(--font-mono)" }}>
          {dbUpdated ? `最終更新：${new Date(dbUpdated).toLocaleDateString('ja-JP')}` : 'v1.0 ／ 制定日：2026年7月1日'}
        </p>
      </div>

      {/* BODY */}
      <div style={{ maxWidth: 820, margin: '0 auto', padding: isMobile ? '32px 16px 60px' : '60px 48px' }}>
        <LegalDocBody content={dbDoc || DEFAULT_CONTENT} isMobile={isMobile} />
      </div>

      <div style={{ marginTop: 40 }}>
        <SiteFooter />
      </div>
    </div>
  );
}
