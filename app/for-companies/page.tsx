'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/utils/useIsMobile';

const features = [
  { title: '月額定額制', desc: 'シンプルな月額プランで何件でも求人掲載可能。予算を固定したまま採用活動を続けられます。' },
  { title: '難関大生に特化', desc: '東大・京大・一橋・東京科学大・早慶などの学生が登録。地頭の高い人材へダイレクトにリーチできます。' },
  { title: '最短2週間でマッチング', desc: '登録から平均2週間でインターン生のアサインが完了。スピーディに即戦力を確保できます。' },
  { title: '採用管理ダッシュボード', desc: '応募者の一覧・ステータス管理をWeb上で完結。応募者の連絡先メールにそのまま連絡でき、工数を削減できます。' },
];

const flow = [
  { no: '01', title: '資料請求・お問い合わせ', desc: '下記フォームよりお気軽にご連絡ください。担当者より1営業日以内にご連絡します。' },
  { no: '02', title: 'オンライン説明会', desc: 'サービス概要・料金・掲載フローをご説明します。所要時間は約30分です。' },
  { no: '03', title: '求人票の作成', desc: '担当者がヒアリングをもとに求人票の作成をサポートします。最短当日掲載も可能です。' },
  { no: '04', title: 'マッチング・採用', desc: '応募が来たらダッシュボードで確認・面接調整。内定後、最短2週間で就業開始。' },
];

export default function ForCompaniesPage() {
  const router = useRouter();
  const isMobile = useIsMobile();

  useEffect(() => {
    document.title = '企業の方へ | トウコべインターン';
    return () => { document.title = 'トウコべインターン | 難関大生に特化した長期インターン'; };
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: "var(--font-sans)", color: '#1C1813' }}>

      {/* NAV */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '14px 16px' : '16px 48px', background: 'rgba(255,255,255,.92)', borderBottom: '1px solid #EFE8DF', position: 'sticky', top: 0, zIndex: 50 }}>
        <img src="/toukobe-intern-logo.png" alt="トウコべインターン" style={{ height: 38, width: 'auto', cursor: 'pointer' }} onClick={() => router.push('/')} />
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <span style={{ fontSize: 14, color: '#3A352F', fontWeight: 500, cursor: 'pointer' }} onClick={() => router.push('/auth/company-login')}>企業ログイン</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', background: '#F2620C', borderRadius: 8, padding: '10px 22px', cursor: 'pointer' }} onClick={() => router.push('/forms/material')}>資料請求</span>
        </div>
      </div>

      {/* HERO */}
      <div style={{ background: 'linear-gradient(120deg,#1C1813 0%,#2A231B 100%)', padding: isMobile ? '60px 20px 52px' : '88px 48px 80px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -80, top: -80, width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle,rgba(242,98,12,.3) 0%,rgba(242,98,12,0) 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 700, margin: '0 auto' }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: '#FBA94C', letterSpacing: '.18em', marginBottom: 14 }}>FOR COMPANIES</div>
          <h1 style={{ fontWeight: 900, fontSize: isMobile ? 30 : 48, color: '#fff', margin: '0 0 20px', lineHeight: 1.35 }}>難関大生に、<br />ダイレクトに出会う。</h1>
          <p style={{ fontSize: 16, color: '#C9C0B6', margin: '0 0 40px', lineHeight: 1.8 }}>東大・京大・早慶などの優秀な学生が集まる長期インターンプラットフォームです。</p>
          <button onClick={() => router.push('/forms/material')} style={{ background: '#F2620C', color: '#fff', border: 'none', padding: '18px 52px', borderRadius: 12, fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 16, cursor: 'pointer', boxShadow: '0 6px 18px rgba(242,98,12,.4)' }}>
            資料を請求する
          </button>
        </div>
      </div>

      {/* FEATURES */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '48px 16px' : '76px 48px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: '#F2620C', letterSpacing: '.18em', marginBottom: 12 }}>FEATURES</div>
          <h2 style={{ fontWeight: 900, fontSize: isMobile ? 24 : 32, margin: 0 }}>選ばれる理由</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: 24 }}>
          {features.map((f, i) => (
            <div key={i} style={{ background: '#FBF8F4', border: '1px solid #EFE8DF', borderRadius: 16, padding: '32px 30px' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#F2620C', color: '#fff', fontWeight: 900, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18, fontFamily: "var(--font-mono)" }}>0{i + 1}</div>
              <h3 style={{ fontWeight: 700, fontSize: 19, margin: '0 0 10px' }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: '#57514A', lineHeight: 1.85, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FLOW */}
      <div style={{ background: '#FBF8F4', padding: isMobile ? '48px 16px' : '76px 48px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: '#F2620C', letterSpacing: '.18em', marginBottom: 12 }}>FLOW</div>
            <h2 style={{ fontWeight: 900, fontSize: isMobile ? 24 : 32, margin: 0 }}>掲載までの流れ</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {flow.map((s, i) => (
              <div key={s.no} style={{ display: 'flex', gap: 28 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#F2620C', color: '#fff', fontWeight: 900, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: "var(--font-mono)" }}>{s.no}</div>
                  {i < flow.length - 1 && <div style={{ width: 2, flex: 1, background: '#EFE8DF', margin: '8px 0' }} />}
                </div>
                <div style={{ paddingBottom: i < flow.length - 1 ? 40 : 0, paddingTop: 8, flex: 1 }}>
                  <h3 style={{ fontWeight: 700, fontSize: 18, margin: '0 0 8px' }}>{s.title}</h3>
                  <p style={{ fontSize: 14, color: '#57514A', lineHeight: 1.85, margin: 0 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: isMobile ? '48px 16px' : '76px 48px', textAlign: 'center' }}>
        <h2 style={{ fontWeight: 900, fontSize: isMobile ? 22 : 30, margin: '0 0 14px' }}>まずはお気軽にご相談ください</h2>
        <p style={{ fontSize: 15, color: '#7A7268', margin: '0 0 36px' }}>担当者が丁寧にご説明します。</p>

        {/* 3 form cards */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 16, maxWidth: 860, margin: '0 auto 32px' }}>
          <div style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, padding: '28px 24px', textAlign: 'left' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#C2390A', background: '#FFF1E8', borderRadius: 999, padding: '3px 10px', display: 'inline-block', marginBottom: 12 }}>早期申し込み</div>
            <h3 style={{ fontWeight: 700, fontSize: 16, margin: '0 0 8px' }}>契約フォーム（早期）</h3>
            <p style={{ fontSize: 13, color: '#7A7268', lineHeight: 1.7, margin: '0 0 20px' }}>早期割引プランをご希望の方はこちらからお申し込みください。</p>
            <button onClick={() => router.push('/forms/early')} style={{ width: '100%', background: '#1C1813', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>申し込む →</button>
          </div>
          <div style={{ background: '#fff', border: '2px solid #F2620C', borderRadius: 16, padding: '28px 24px', textAlign: 'left', position: 'relative' }}>
            <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#F2620C', color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 999, padding: '3px 14px', whiteSpace: 'nowrap' }}>通常プラン</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#1D4ED8', background: '#EFF6FF', borderRadius: 999, padding: '3px 10px', display: 'inline-block', marginBottom: 12 }}>通常申し込み</div>
            <h3 style={{ fontWeight: 700, fontSize: 16, margin: '0 0 8px' }}>契約フォーム（通常）</h3>
            <p style={{ fontSize: 13, color: '#7A7268', lineHeight: 1.7, margin: '0 0 20px' }}>通常プランでの掲載をご希望の方はこちらからお申し込みください。</p>
            <button onClick={() => router.push('/forms/normal')} style={{ width: '100%', background: '#F2620C', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 14px rgba(242,98,12,.3)' }}>申し込む →</button>
          </div>
          <div style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, padding: '28px 24px', textAlign: 'left' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#15803D', background: '#F0FDF4', borderRadius: 999, padding: '3px 10px', display: 'inline-block', marginBottom: 12 }}>まずは資料から</div>
            <h3 style={{ fontWeight: 700, fontSize: 16, margin: '0 0 8px' }}>資料請求フォーム</h3>
            <p style={{ fontSize: 13, color: '#7A7268', lineHeight: 1.7, margin: '0 0 20px' }}>料金・掲載フロー・事例資料をご送付します。まずはここから。</p>
            <button onClick={() => router.push('/forms/material')} style={{ width: '100%', background: '#fff', color: '#1C1813', border: '1px solid #EFE8DF', borderRadius: 10, padding: '12px', fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>資料を請求する →</button>
          </div>
        </div>

        <button onClick={() => router.push('/auth/company-login')} style={{ background: 'transparent', color: '#938B81', border: 'none', padding: '10px 0', fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14, cursor: 'pointer', textDecoration: 'underline' }}>
          すでにアカウントをお持ちの方はこちら
        </button>
      </div>
    </div>
  );
}
