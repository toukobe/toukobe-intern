'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/utils/useIsMobile';
import SiteFooter from '@/components/SiteFooter';

const steps = [
  {
    no: '01',
    title: '無料で会員登録',
    desc: 'メールアドレスまたはGoogleアカウントで簡単登録。在籍大学・学年・希望職種などのプロフィールを入力するだけです。',
    note: '所要時間：約3分',
  },
  {
    no: '02',
    title: '求人を検索・閲覧',
    desc: '職種・勤務地・働き方（週2〜・フルリモートなど）で絞り込み。気になる求人の詳細・給与・選考フローを確認できます。',
    note: '掲載求人数：480社以上',
  },
  {
    no: '03',
    title: '気になる求人に応募',
    desc: 'ワンクリックで応募。企業からの連絡は登録した連絡先メールアドレスに届くので見逃しがありません。',
    note: '最短当日に返信あり',
  },
  {
    no: '04',
    title: '面接・選考',
    desc: '企業と日程調整のうえ面接へ。オンライン面接対応の企業も多く、全国どこからでも選考に参加できます。',
    note: 'オンライン対応多数',
  },
  {
    no: '05',
    title: 'インターンスタート',
    desc: '内定後、最短2週間で就業開始。',
    note: '平均マッチング：2週間',
  },
];

const faqs = [
  { q: '登録に費用はかかりますか？', a: '学生の方は完全無料でご利用いただけます。登録から応募まですべて無料です。' },
  { q: '難関大生以外でも登録できますか？', a: '現在は難関大生（東大・京大・一橋・東京科学大・早慶など）を対象としています。詳しくはお問い合わせください。' },
  { q: '週何日から働けますか？', a: '週2日〜対応している求人も多数あります。授業・サークルとの両立も可能です。' },
];

export default function HowItWorksPage() {
  const router = useRouter();
  const isMobile = useIsMobile();

  useEffect(() => {
    document.title = 'ご利用の流れ | トウコべインターン';
    return () => { document.title = 'トウコべインターン | 難関大生に特化した長期インターン'; };
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: "var(--font-sans)", color: '#1C1813' }}>

      {/* NAV */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '14px 16px' : '16px 48px', background: 'rgba(255,255,255,.92)', borderBottom: '1px solid #EFE8DF', position: 'sticky', top: 0, zIndex: 50 }}>
        <img src="/toukobe-intern-logo.png" alt="トウコべインターン" style={{ height: 38, width: 'auto', cursor: 'pointer' }} onClick={() => router.push('/')} />
        <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', background: '#F2620C', borderRadius: 8, padding: '10px 22px', cursor: 'pointer' }} onClick={() => router.push('/auth/signup')}>無料で登録</span>
      </div>

      {/* HEADER */}
      <div style={{ background: 'linear-gradient(160deg,#FFF6EE,#FFEFE2)', padding: isMobile ? '40px 20px 36px' : '64px 48px 56px', textAlign: 'center' }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: '#F2620C', letterSpacing: '.18em', marginBottom: 12 }}>HOW IT WORKS</div>
        <h1 style={{ fontWeight: 900, fontSize: isMobile ? 28 : 42, margin: '0 0 14px' }}>ご利用の流れ</h1>
        <p style={{ fontSize: 15, color: '#7A7268', margin: 0 }}>登録から就業開始まで、最短2週間。</p>
      </div>

      {/* STEPS */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: isMobile ? '40px 16px' : '72px 48px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {steps.map((s, i) => (
            <div key={s.no} style={{ display: 'flex', gap: 32, position: 'relative' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#F2620C', color: '#fff', fontWeight: 900, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 14px rgba(242,98,12,.3)', fontFamily: "var(--font-mono)" }}>{s.no}</div>
                {i < steps.length - 1 && <div style={{ width: 2, flex: 1, background: '#EFE8DF', margin: '8px 0' }} />}
              </div>
              <div style={{ paddingBottom: i < steps.length - 1 ? 48 : 0, paddingTop: 10, flex: 1 }}>
                <h3 style={{ fontWeight: 700, fontSize: 20, margin: '0 0 10px' }}>{s.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.9, color: '#57514A', margin: '0 0 10px' }}>{s.desc}</p>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: '#F2620C', background: '#FFF1E8', padding: '4px 10px', borderRadius: 6 }}>{s.note}</span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', marginTop: 72, padding: isMobile ? '32px 20px' : '52px', background: 'linear-gradient(160deg,#FFF6EE,#FFEFE2)', borderRadius: 24 }}>
          <h2 style={{ fontWeight: 900, fontSize: isMobile ? 22 : 28, margin: '0 0 14px' }}>まずは無料で登録してみよう</h2>
          <p style={{ fontSize: 14, color: '#7A7268', margin: '0 0 28px' }}>3分で登録完了。難関大生限定の求人にアクセスできます。</p>
          <button onClick={() => router.push('/auth/signup')} style={{ background: '#F2620C', color: '#fff', border: 'none', padding: '16px 48px', borderRadius: 12, fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 16, cursor: 'pointer', boxShadow: '0 4px 14px rgba(242,98,12,.3)' }}>
            無料で登録する
          </button>
        </div>

        {/* FAQ */}
        <div style={{ marginTop: 72 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: '#F2620C', letterSpacing: '.18em', marginBottom: 12, textAlign: 'center' }}>FAQ</div>
          <h2 style={{ fontWeight: 900, fontSize: isMobile ? 22 : 28, margin: '0 0 36px', textAlign: 'center' }}>よくある質問</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {faqs.map((f, i) => (
              <div key={i} style={{ background: '#FBF8F4', border: '1px solid #EFE8DF', borderRadius: 14, padding: '24px 28px' }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10, display: 'flex', gap: 12 }}>
                  <span style={{ color: '#F2620C', flexShrink: 0 }}>Q.</span>{f.q}
                </div>
                <div style={{ fontSize: 14, color: '#57514A', lineHeight: 1.8, display: 'flex', gap: 12 }}>
                  <span style={{ color: '#B6ADA2', flexShrink: 0 }}>A.</span>{f.a}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
