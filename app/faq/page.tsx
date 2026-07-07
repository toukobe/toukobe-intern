'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/utils/useIsMobile';
import SiteFooter from '@/components/SiteFooter';

const FF = "var(--font-sans)";
const MONO = "var(--font-mono)";

const faqs = [
  {
    category: '学生向け',
    items: [
      {
        q: '登録は無料ですか？',
        a: 'はい、学生の方は完全無料でご利用いただけます。登録料・成功報酬など一切費用はかかりません。',
      },
      {
        q: 'どんな学生が登録できますか？',
        a: '難関大学（東京大学・京都大学・一橋大学・東京科学大学・早稲田大学・慶應義塾大学など）に在籍中または卒業済みの方を対象としています。',
      },
      {
        q: '応募から採用までどれくらいかかりますか？',
        a: '企業によって異なりますが、平均2週間程度でインターン開始まで進む場合があります。書類選考・面接のフローは企業ごとに異なります。',
      },
      {
        q: '複数の求人に応募できますか？',
        a: 'はい、複数の求人に同時に応募できます。ただし同じ求人への重複応募はできません。',
      },
      {
        q: 'プロフィールは後から編集できますか？',
        a: 'はい、マイページからいつでも編集できます。企業に応募する前に、大学・学部学科・学年・スキルをできるだけ詳しく入力しておくと選考がスムーズです。',
      },
      {
        q: 'インターンの期間や週の稼働日数はどれくらいですか？',
        a: '求人によって異なります。多くは週2〜4日、3ヶ月〜1年以上の長期が中心です。各求人の詳細ページでご確認ください。',
      },
    ],
  },
  {
    category: '企業向け',
    items: [
      {
        q: '料金体系を教えてください。',
        a: '月額定額制です。掲載件数・応募数に関わらず定額でご利用いただけます。詳しくは資料請求フォームよりお問い合わせください。',
      },
      {
        q: '求人を掲載するまでどれくらいかかりますか？',
        a: 'お申し込みから最短当日掲載が可能です。担当者がヒアリングのうえ、求人票を作成します。',
      },
      {
        q: 'どんな学生が登録していますか？',
        a: '東大・京大・一橋・東京科学大・早慶などの難関大生が中心です。コンサル・金融・エンジニアなど様々な職種に対応した学生が登録しています。',
      },
      {
        q: '採用が決まった場合に追加費用はかかりますか？',
        a: '追加費用は一切ありません。月額定額制のため、何名採用されても追加費用は発生しません。',
      },
      {
        q: '応募者の管理はどこで行いますか？',
        a: '企業ダッシュボードから応募者一覧・ステータス管理が行えます。応募者への選考連絡は、応募者が登録した連絡先メールアドレス宛に直接行えます。',
      },
    ],
  },
  {
    category: 'アカウント・その他',
    items: [
      {
        q: 'パスワードを忘れた場合はどうすればいいですか？',
        a: 'ログイン画面の「パスワードを忘れた方はこちら」からパスワード再設定メールを送信できます。',
      },
      {
        q: '退会したい場合はどうすればいいですか？',
        a: '学生の方はマイページのプロフィールタブ最下部にある「退会をご希望の方はこちら」からいつでも退会できます。退会するとプロフィール・応募履歴・お気に入りはすべて削除され、元に戻せません。企業アカウントの退会はお問い合わせフォームよりご連絡ください。',
      },
      {
        q: '個人情報はどのように管理されますか？',
        a: 'プライバシーポリシーに基づき適切に管理しています。第三者への提供は応募先企業への情報提供のみであり、その他の目的には使用しません。',
      },
    ],
  },
];

export default function FaqPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

  const toggle = (key: string) => setOpenMap(prev => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    document.title = 'よくある質問（FAQ） | トウコべインターン';
    return () => { document.title = 'トウコべインターン | 難関大生に特化した長期インターン'; };
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#FBF8F4', fontFamily: FF, color: '#1C1813' }}>

      {/* NAV */}
      <div style={{ background: 'rgba(255,255,255,.95)', borderBottom: '1px solid #EFE8DF', padding: isMobile ? '14px 16px' : '14px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <img src="/toukobe-intern-logo.png" alt="トウコべインターン" style={{ height: 36, cursor: 'pointer' }} onClick={() => router.push('/')} />
        <button onClick={() => router.push('/auth/signup')} style={{ background: '#F2620C', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontFamily: FF, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          無料で登録
        </button>
      </div>

      {/* HERO */}
      <div style={{ background: 'linear-gradient(160deg,#FFF6EE,#FFEFE2)', padding: '56px 24px 48px', textAlign: 'center' }}>
        <div style={{ fontFamily: MONO, fontSize: 12, color: '#F2620C', letterSpacing: '.18em', marginBottom: 12 }}>FAQ</div>
        <h1 style={{ fontWeight: 900, fontSize: isMobile ? 26 : 34, margin: '0 0 12px' }}>よくある質問</h1>
        <p style={{ fontSize: 14, color: '#57514A', margin: 0 }}>お問い合わせの前にご確認ください</p>
      </div>

      {/* FAQ LIST */}
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '48px 24px 80px' }}>
        {faqs.map(section => (
          <div key={section.category} style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <span style={{ width: 4, height: 22, background: '#F2620C', borderRadius: 2, display: 'inline-block', flexShrink: 0 }} />
              <h2 style={{ fontWeight: 900, fontSize: 18, margin: 0 }}>{section.category}</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {section.items.map((item, i) => {
                const key = `${section.category}-${i}`;
                const isOpen = !!openMap[key];
                return (
                  <div
                    key={key}
                    style={{ background: '#fff', border: `1px solid ${isOpen ? '#F2620C' : '#EFE8DF'}`, borderRadius: 12, overflow: 'hidden', transition: 'border-color .2s' }}
                  >
                    <button
                      onClick={() => toggle(key)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '18px 22px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: FF }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 13, color: '#F2620C', flexShrink: 0, lineHeight: 1.6 }}>Q.</span>
                        <span style={{ fontWeight: 700, fontSize: 15, color: '#1C1813', lineHeight: 1.6 }}>{item.q}</span>
                      </div>
                      <span style={{ color: '#F2620C', fontSize: 18, fontWeight: 700, flexShrink: 0, transform: isOpen ? 'rotate(45deg)' : 'none', transition: 'transform .2s', lineHeight: 1 }}>＋</span>
                    </button>
                    {isOpen && (
                      <div style={{ padding: '0 22px 20px 22px', display: 'flex', gap: 12 }}>
                        <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 13, color: '#938B81', flexShrink: 0, lineHeight: 1.8 }}>A.</span>
                        <p style={{ fontSize: 14, color: '#57514A', lineHeight: 1.85, margin: 0 }}>{item.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* CTA */}
        <div style={{ background: 'linear-gradient(120deg,#1C1813,#2A231B)', borderRadius: 18, padding: '40px 36px', textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: '#C9C0B6', margin: '0 0 8px' }}>解決しない場合はお気軽にご連絡ください</p>
          <h3 style={{ fontWeight: 900, fontSize: 22, color: '#fff', margin: '0 0 24px' }}>お問い合わせはこちら</h3>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={() => router.push('/auth/signup')} style={{ background: '#F2620C', color: '#fff', border: 'none', borderRadius: 10, padding: '13px 32px', fontFamily: FF, fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 14px rgba(242,98,12,.3)' }}>
              学生登録（無料）
            </button>
            <button onClick={() => router.push('/forms/contact')} style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,.3)', borderRadius: 10, padding: '13px 32px', fontFamily: FF, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              企業の方はこちら
            </button>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
