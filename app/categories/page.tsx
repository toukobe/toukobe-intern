'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/utils/useIsMobile';

const cats = [
  { name: 'コンサルティング', en: 'Consulting', desc: '戦略・経営・業務改善など幅広い領域で活躍できる。' },
  { name: '経営・企画', en: 'Management', desc: '事業戦略の立案から実行まで携われるポジション。' },
  { name: '金融・ファイナンス', en: 'Finance', desc: 'M&A・投資・ファンド運用など金融の最前線を経験。' },
  { name: 'マーケティング', en: 'Marketing', desc: 'グロースハック・ブランディング・SNS運用など。' },
  { name: 'エンジニア', en: 'Engineering', desc: 'Web・アプリ・インフラなどプロダクト開発に従事。' },
  { name: 'デザイナー', en: 'Design', desc: 'UI/UX・グラフィック・プロダクトデザインを担当。' },
  { name: '営業', en: 'Sales', desc: '法人営業・インサイドセールス・CSなど幅広い職種。' },
  { name: 'ライター・メディア', en: 'Media', desc: 'コンテンツ制作・編集・取材など情報発信に関わる。' },
  { name: '経理', en: 'Accounting', desc: '財務・経理・管理会計など数字を扱うポジション。' },
  { name: '人事・広報', en: 'HR / PR', desc: '採用・組織開発・広報PRなど人と会社をつなぐ仕事。' },
  { name: 'その他', en: 'Other', desc: '上記に当てはまらない多様な職種も掲載中。' },
];

export default function CategoriesPage() {
  const router = useRouter();
  const isMobile = useIsMobile();

  useEffect(() => {
    document.title = '職種一覧 | トウコべインターン';
    return () => { document.title = 'トウコべインターン | 難関大生に特化した長期インターン'; };
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#FBF8F4', fontFamily: "'Zen Kaku Gothic New', sans-serif", color: '#1C1813' }}>
      <link href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;700;900&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* NAV */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '14px 16px' : '16px 48px', background: 'rgba(255,255,255,.92)', borderBottom: '1px solid #EFE8DF', position: 'sticky', top: 0, zIndex: 50 }}>
        <img src="/toukobe-intern-logo.png" alt="トウコべインターン" style={{ height: 38, width: 'auto', cursor: 'pointer' }} onClick={() => router.push('/')} />
        <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', background: '#F2620C', borderRadius: 8, padding: '10px 22px', cursor: 'pointer' }} onClick={() => router.push('/auth/signup')}>無料で登録</span>
      </div>

      {/* HEADER */}
      <div style={{ background: 'linear-gradient(160deg,#FFF6EE,#FFEFE2)', padding: isMobile ? '40px 20px 36px' : '64px 48px 56px', textAlign: 'center' }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: '#F2620C', letterSpacing: '.18em', marginBottom: 12 }}>CATEGORIES</div>
        <h1 style={{ fontWeight: 900, fontSize: isMobile ? 28 : 42, margin: '0 0 14px' }}>職種一覧</h1>
        <p style={{ fontSize: 15, color: '#7A7268', margin: 0 }}>気になる職種から、長期インターンを探してみましょう。</p>
      </div>

      {/* GRID */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '32px 16px 48px' : '60px 48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(3,1fr)', gap: isMobile ? 12 : 20 }}>
          {cats.map((c) => (
            <div
              key={c.name}
              onClick={() => router.push(`/search?category=${encodeURIComponent(c.name)}`)}
              style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, padding: '28px 26px', cursor: 'pointer', transition: '.2s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#F2620C'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#EFE8DF'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 17 }}>{c.name}</div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: '#B6ADA2', marginTop: 4 }}>{c.en}</div>
                </div>
                <span style={{ width: 34, height: 34, borderRadius: '50%', background: '#FFF1E8', color: '#F2620C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>→</span>
              </div>
              <p style={{ fontSize: 13, color: '#7A7268', margin: 0, lineHeight: 1.7 }}>{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
