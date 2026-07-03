'use client';

import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/utils/useIsMobile';

const articles = [
  {
    title: '第1条 本規約の目的',
    content: ['本規約は、トウコべ インターン（以下「本サービス」という）の学生会員（以下「あなた」という）の利用条件を定めるものです。本サービスを利用するすべての学生は、本規約に同意したものとみなされます。'],
  },
  {
    title: '第2条 定義',
    content: ['本規約で使用する以下の用語は、次の意味をもつものとします。'],
    bullets: [
      '「学生会員」：本サービスに登録し求人に応募する学生',
      '「企業会員」：本サービスに求人を掲載する法人または個人事業主',
      '「求人票」：企業会員が本サービス上に掲載する求人情報',
      '「内定」：企業会員が学生会員に対して採用予定者としての地位を与えることを通知したこと',
      '「採用成立」：学生会員が初回勤務（業務開始日から3営業日以上、給与支払い対象期間に含まれる実務業務に従事）を行ったことが当社によって確認されたこと',
      '「初回勤務」：業務開始日から3営業日以上、給与支払い対象期間に含まれ、研修・オンボーディング・実務業務に従事すること',
    ],
  },
  {
    title: '第3条 登録資格',
    content: [
      '本サービスに登録できるのは、日本国内の大学に在籍する学生（学部生・大学院生・専門学校生等を含む）に限ります。',
      '登録時には、正確なメールアドレスとプロフィール情報（氏名、学部・学年、スキル等）の入力が必須です。',
      'プロフィール入力率70%以上が登録条件となります。',
    ],
  },
  {
    title: '第4条 学生会員の責務',
    content: ['あなたは、本サービスを利用する過程において、以下の責務を負うものとします。'],
    bullets: [
      '登録するプロフィール（氏名、学部、成績、職務経歴等）の正確性と真実性',
      '応募時に提出するエントリーシートの虚偽記載がないこと',
      '企業との選考プロセスに誠実に参加すること（無断キャンセルを避ける等）',
      '企業からの内定を受けた際、その誠実な受け入れまたは明確な辞退を行うこと',
      '採用企業との間で雇用契約を締結する際、契約内容をよく確認し、法令遵守及び労働条件を理解すること',
    ],
  },
  {
    title: '第5条 禁止事項',
    content: ['あなたは、本サービスの利用において、以下の行為を行ってはいけません。'],
    bullets: [
      '虚偽のプロフィール情報を登録・報告すること（学年、成績、職務経歴、スキル等）',
      '他人になりすましたり、他人のアカウントを使用すること',
      '企業からのメッセージに対して、無視や無断キャンセルを繰り返すこと',
      '当社または企業・他の学生の個人情報を不正に利用すること',
      'ハラスメント、差別的言動、無礼な言動を行うこと',
      '本サービスへのサイバー攻撃、不正アクセス、データ破壊を行うこと',
      '法令に違反する行為（例：闇バイト、違法な副業等への応募）',
      '本サービスから取得した企業情報を営利目的で利用すること',
    ],
  },
  {
    title: '第6条 応募・選考プロセス',
    content: [
      'あなたは、掲載された求人に対して、本サービス上で直接応募することができます。また、企業からのスカウトを受け取ることができます。',
      '応募時に提出するエントリーシートや自己PR等は、虚偽なく正確に記載してください。企業による評価の基準となる重要な情報です。',
      '当社は、企業とあなたの日程調整を支援し、選考プロセスを円滑化するためのサービスを提供します。ただし、あなたと企業との選考プロセス自体の責任は企業に帰属します。',
    ],
  },
  {
    title: '第7条 企業の応募学生への対応期限',
    content: [
      '企業会員は、あなたからの応募を受け取った後、5営業日以内にメールまたは本サービスのメッセージ機能で直接連絡を行い、選考進捗（次のステップの案内、または不採用決定）を通知する義務があります。',
      '企業がこの期限内に連絡しない場合、あなたは当社に報告することができます。',
    ],
  },
  {
    title: '第8条 内定と採用成立の確認',
    content: [
      '企業からの内定通知は本サービス上で発行されます。あなたが本サービス上で内定を「受理」することで、「内定」が成立します。',
      '内定成立後、あなたが初回勤務（業務開始日から3営業日以上）を行ったことが当社によって確認された時点で、「採用成立」となります。',
      'あなたが内定を辞退する場合は、速やかに本サービス上で企業に辞退を通知し、当社にも報告してください。',
    ],
  },
  {
    title: '第9条 個人情報の取扱い',
    content: [
      '当社が取得するあなたの個人情報は、個人情報保護法（APPI）に基づき、適切に管理されます。詳細は別途「プライバシーポリシー」をご参照ください。',
      '個人情報漏洩等のインシデントが発生した場合、概ね72時間以内に個人情報保護委員会に報告し、あなたに通知します。',
    ],
  },
  {
    title: '第10条 個人情報提供の同意',
    content: ['本サービスを利用する際、あなたのプロフィール情報を本サービスの企業会員に提供され、スカウトメッセージを受け取り、求人に応募することに同意するものとします。'],
    subsections: [
      { label: '提供される情報', text: '氏名、連絡先（メールアドレス）、学部・学年、スキル、職務経歴（プロフィール欄の範囲内）、エントリーシート' },
      { label: '用途', text: 'スカウト対象の検索、スカウトメッセージ送信、採用選考' },
    ],
  },
  {
    title: '第11条 企業による個人情報の使用制限',
    content: [
      'あなたが本サービス上で企業会員に提供する個人情報は、採用活動の目的にのみ使用されることが義務付けられています。',
      '企業会員による採用活動以外の目的での利用（営業、マーケティング、他社への情報提供等）は禁止されています。',
      'あなたが企業会員による不正な個人情報利用を発見した場合、当社に報告することができます。',
    ],
  },
  {
    title: '第12条 当社の責任範囲',
    content: ['当社は、以下の事項について、合理的な管理体制を整備しますが、完全性は保証しません。'],
    bullets: [
      '本サービス上の求人情報・企業情報の正確性と完全性',
      '企業の労働条件、給与、職務内容等が実際と一致していることの検証',
      'プラットフォームのセキュリティと個人情報の保護',
      '採用企業との労働条件の相違、給与未払い等のトラブル（仲介支援は行います）',
      '内定承諾後の入社予定者の不履行に伴う企業側の損害',
    ],
  },
  {
    title: '第13条 アカウント管理',
    content: [
      'あなたは、本サービスのログイン情報（メールアドレス、パスワード）を厳格に管理し、他人に共有しないことを約束します。',
      '万が一パスワード等が漏洩した場合、速やかに当社に報告し、パスワード変更等の対応を行ってください。',
    ],
  },
  {
    title: '第14条 規約改正',
    content: [
      '当社は、法令改正またはサービス内容変更に伴い、本規約を随時改正することがあります。改正後の規約は本サービス上で掲載した時点で有効となります。',
      '改正規約に同意いただけない場合は、サービス利用を中止することができます。',
    ],
  },
  {
    title: '第15条 サービス利用終了',
    content: [
      'あなたは、いつでも本サービスの利用を終了し、アカウント削除を申請することができます。',
      'アカウント削除時、当社はあなたの個人情報を7営業日以内に完全削除します。',
    ],
  },
  {
    title: '第16条 相談窓口',
    content: [
      'メール：ru_matsumoto@manabiph.com',
      '営業時間：平日10:00–18:00（土日祝を除く）',
      '初期対応：受付から3営業日以内',
      '企業との採用トラブル、給与問題等については、まずは当社に相談してください。',
    ],
  },
  {
    title: '第17条 準拠法・管轄裁判所',
    content: ['本規約は日本法に準拠し、東京地方裁判所を管轄裁判所とします。'],
  },
];

export default function TermsPage() {
  const router = useRouter();
  const isMobile = useIsMobile();

  return (
    <div style={{ minHeight: '100vh', background: '#FBF8F4', fontFamily: "var(--font-sans)", color: '#1C1813' }}>

      {/* NAV */}
      <div style={{ background: '#fff', borderBottom: '1px solid #EFE8DF', padding: isMobile ? '14px 16px' : '14px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <img src="/toukobe-intern-logo.png" alt="トウコべインターン" style={{ height: 38, width: 'auto', cursor: 'pointer' }} onClick={() => router.push('/')} />
        <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', background: '#F2620C', borderRadius: 8, padding: '10px 22px', cursor: 'pointer' }} onClick={() => router.push('/auth/signup')}>無料で登録</span>
      </div>

      {/* HEADER */}
      <div style={{ background: 'linear-gradient(160deg,#FFF6EE,#FFEFE2)', padding: isMobile ? '40px 20px 36px' : '64px 48px 56px', textAlign: 'center' }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: '#F2620C', letterSpacing: '.2em', marginBottom: 12 }}>TERMS OF SERVICE</div>
        <h1 style={{ fontWeight: 900, fontSize: isMobile ? 26 : 38, margin: '0 0 12px' }}>利用規約（学生版）</h1>
        <p style={{ fontSize: 13, color: '#938B81', margin: 0, fontFamily: "var(--font-mono)" }}>v1.0 ／ 制定日：2026年7月1日</p>
      </div>

      {/* BODY */}
      <div style={{ maxWidth: 820, margin: '0 auto', padding: isMobile ? '32px 16px 60px' : '60px 48px' }}>

        {/* TOC */}
        <div style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, padding: isMobile ? '20px 16px' : '28px 32px', marginBottom: 48 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: '#F2620C', letterSpacing: '.14em', marginBottom: 14 }}>TABLE OF CONTENTS</div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '8px 24px' }}>
            {articles.map((a) => (
              <a key={a.title} href={`#${a.title}`} style={{ fontSize: 13, color: '#57514A', textDecoration: 'none', display: 'flex', gap: 8, alignItems: 'baseline' }}>
                <span style={{ color: '#F2620C', fontFamily: "var(--font-mono)", fontSize: 11, flexShrink: 0 }}>→</span>
                {a.title}
              </a>
            ))}
          </div>
        </div>

        {/* ARTICLES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {articles.map((a) => (
            <div key={a.title} id={a.title} style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, padding: isMobile ? '20px 16px' : '32px 36px' }}>
              <h2 style={{ fontWeight: 900, fontSize: 18, margin: '0 0 18px', paddingBottom: 14, borderBottom: '2px solid #F2620C', display: 'inline-block' }}>{a.title}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {a.content.map((p, i) => (
                  <p key={i} style={{ fontSize: 14, lineHeight: 1.9, color: '#3A352F', margin: 0 }}>{p}</p>
                ))}
                {a.bullets && (
                  <ul style={{ margin: '4px 0 0', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {a.bullets.map((b, i) => (
                      <li key={i} style={{ fontSize: 14, lineHeight: 1.8, color: '#57514A' }}>{b}</li>
                    ))}
                  </ul>
                )}
                {(a as any).subsections && (a as any).subsections.map((s: any, i: number) => (
                  <div key={i} style={{ background: '#FBF8F4', borderRadius: 10, padding: '16px 20px', marginTop: 4 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#F2620C', marginBottom: 8 }}>{s.label}</div>
                    <p style={{ fontSize: 14, lineHeight: 1.85, color: '#57514A', margin: 0 }}>{s.text}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 60, paddingTop: 40, borderTop: '1px solid #EFE8DF' }}>
          <p style={{ fontSize: 13, color: '#938B81' }}>以上</p>
          <p style={{ fontSize: 13, color: '#938B81' }}>制定日：2026年7月1日</p>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#1C1813' }}>トウコべ インターン 運営事務局</p>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ background: '#15110D', padding: '32px 48px', marginTop: 40, textAlign: 'center' }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: '#665D53', margin: 0 }}>© 2026 トウコべインターン. All rights reserved.</p>
      </div>
    </div>
  );
}
