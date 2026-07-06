'use client';

import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/utils/useIsMobile';

const articles = [
  {
    title: '第1条 個人情報の定義',
    content: [
      '本ポリシーにおいて「個人情報」とは、個人情報の保護に関する法律（令和2年改正個人情報保護法、以下「APPI」という）に規定する個人情報をいい、生存する個人に関する情報で、以下に該当するものをいいます。',
    ],
    bullets: [
      '氏名、生年月日、住所、電話番号、メールアドレス等により特定の個人を識別できるもの',
      '個人識別符号が含まれるもの（マイナンバー、パスポート番号、運転免許証番号等）',
    ],
  },
  {
    title: '第2条 個人情報の収集',
    content: ['当社は、本サービスの運営に必要な範囲内で、以下の個人情報を収集します。'],
    subsections: [
      {
        label: '学生会員から収集する情報',
        text: '氏名、メールアドレス、学年、学部、専攻、学籍番号、卒業予定年月、過去のインターン経歴、職務内容、就業期間、プログラミング言語、言語スキル、資格、希望職種、希望勤務地、希望給与、自己紹介文、職務経歴書、ポートフォリオへのリンク、プラットフォーム上での応募履歴、スカウト受信履歴、面接日程調整履歴、およびプロフィール入力率等の利用履歴',
      },
      {
        label: '企業会員から収集する情報',
        text: '企業名、本社所在地、設立年月日、代表者名、業種、従業員数、担当者氏名、職位、メールアドレス、電話番号、住所、求人情報（職種、給与、勤務地、職務内容、応募要件等）、応募学生の評価、面接日程、内定通知、採用者情報、およびプラットフォーム上での利用履歴',
      },
      {
        label: '収集方法',
        text: '利用者の登録または入力時の情報、プラットフォーム上での行動記録（応募履歴、検索履歴等）、クッキー及び類似技術（ローカルストレージ、セッションストレージ等）',
      },
    ],
  },
  {
    title: '第3条 個人情報の利用目的',
    content: ['当社は、収集した個人情報を、以下の目的で利用します。'],
    subsections: [
      {
        label: '学生会員に対する利用目的',
        text: '企業とのマッチング及び仲介、スカウトメッセージの送信、選考支援（面接日程調整、選考進捗通知等）、内定確認、サービスの提供・改善・最適化、法令遵守（反社会的勢力チェック、不正検知、年齢確認等）、利用統計・分析、マーケティング及び新サービス開発',
      },
      {
        label: '企業会員に対する利用目的',
        text: '求人掲載・管理、応募学生のスカウト及び募集、選考管理（応募学生の評価、面接日程調整）、採用管理、サービスの提供・改善・最適化、法令遵守（反社会的勢力チェック、不正検知等）、利用統計・分析、マーケティング及び新サービス開発',
      },
    ],
  },
  {
    title: '第4条 個人情報の第三者提供',
    content: ['当社は、本人の同意なく個人情報を第三者に提供することはありません。ただし、以下の場合は除きます。'],
    subsections: [
      {
        label: '4.1 学生会員の企業会員への提供',
        text: '学生会員は、本サービスに登録する際、チェックボックスで明示的に同意するものとします。提供される情報：氏名、連絡先（メールアドレス）、学部・学年、スキル、職務経歴（プロフィール欄の範囲内）、エントリーシート。用途：スカウト対象の検索、スカウトメッセージ送信、採用選考',
      },
      {
        label: '4.2 その他の第三者提供',
        text: '裁判所の命令、警察からの照会、その他の法令に基づく要求がある場合、人命や身体の保護が必要な緊急時、クラウドホスティング、メール配信、決済処理等の業務委託先への提供（委託先との秘密保持契約により個人情報の厳格な保護を確保）',
      },
    ],
  },
  {
    title: '第5条 個人情報の保有期間',
    content: ['当社は、以下の期間、個人情報を保有します。'],
    bullets: [
      '登録プロフィール情報：アカウント削除時まで。削除後は7営業日以内に完全削除',
      '選考・マッチング履歴：採用成立から3年間（税務・労務確認のため）',
      'ログ・アクセス記録：180日間（サイバーセキュリティ対応のため）',
    ],
  },
  {
    title: '第6条 個人情報のセキュリティ管理',
    content: ['当社は、個人情報を安全に管理するため、以下の対策を実施します。'],
    subsections: [
      {
        label: '技術的対策',
        text: 'データベースの暗号化（AES-256）、通信の暗号化（SSL/TLS）、アクセス制限（MFA）、定期的なセキュリティ監査',
      },
      {
        label: '組織的対策',
        text: '個人情報取扱担当者の配置、従業員教育・研修（年2回以上）、情報セキュリティポリシーの策定・遵守、第三者委託先のセキュリティ確認',
      },
    ],
  },
  {
    title: '第7条 利用者の権利',
    content: [
      '本人は、開示請求、訂正・追加、削除・利用停止請求の権利を有します。',
      '当社は、これらの請求を受けてから30日以内に対応し、その旨を本人に通知します。',
    ],
  },
  {
    title: '第8条 個人情報漏洩時の対応',
    content: ['個人情報漏洩が発生した場合、当社は以下の対応を実施します。'],
    bullets: [
      '直ちに状況を把握し、拡大防止措置を実施',
      '概ね72時間以内に個人情報保護委員会に報告',
      '影響を受けた利用者に対して速やかに連絡',
      '原因調査と再発防止策の実施、及び体制改善',
    ],
  },
  {
    title: '第9条 企業会員による個人情報の不正利用時の対応',
    content: ['企業会員が本プラットフォーム上で取得する学生会員の個人情報を、採用活動以外の目的で利用した場合、以下の対応を実施します。'],
    bullets: [
      '学生会員からの報告',
      '当社による調査・対応（事実確認調査7営業日以内、段階的措置：警告、求人掲載停止、アカウント停止、契約解除）',
      '学生会員への通知',
      '損害賠償（両者間での和解支援）',
    ],
  },
  {
    title: '第10条 法令改正への対応',
    content: ['当社は、個人情報保護法その他の関連法令の改正に対応し、本ポリシーを随時更新します。'],
  },
  {
    title: '第11条 お問い合わせ窓口',
    content: [
      'メール：ru_matsumoto@manabiph.com',
      '営業時間：平日10:00–18:00（土日祝を除く）',
    ],
  },
  {
    title: '第12条 プライバシーポリシーについて',
    content: ['本プライバシーポリシーは、トウコべ インターンの利用規約（企業版・学生版）の一部として運用されます。'],
  },
];

export default function PrivacyPolicyPage() {
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
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: '#F2620C', letterSpacing: '.2em', marginBottom: 12 }}>PRIVACY POLICY</div>
        <h1 style={{ fontWeight: 900, fontSize: isMobile ? 26 : 38, margin: '0 0 12px' }}>プライバシーポリシー</h1>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
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
                {a.subsections && a.subsections.map((s, i) => (
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
          <p style={{ fontWeight: 700, fontSize: 14, color: '#1C1813' }}>トウコべ インターン</p>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ background: '#15110D', padding: '32px 48px', marginTop: 40, textAlign: 'center' }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: '#665D53', margin: 0 }}>© 2026 トウコべインターン. All rights reserved.</p>
      </div>
    </div>
  );
}
