'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/utils/useIsMobile';

// 公開前（prelaunch）モードで一般訪問者に表示する「準備中」ページ。
// 学生登録・企業の方へ（登録導線）・ログインのみに進める。
export default function ComingSoonPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  useEffect(() => { document.title = '準備中 | トウコべインターン'; return () => { document.title = 'トウコべインターン'; }; }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#FFF6EE 0%,#FFEFE2 55%,#FFE7D4 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '24px 16px' : '48px 24px', fontFamily: 'var(--font-sans)', color: '#1C1813' }}>
      <div style={{ width: '100%', maxWidth: 520, background: '#fff', borderRadius: 20, boxShadow: '0 24px 60px rgba(28,24,19,.12)', padding: isMobile ? '36px 24px' : '52px 48px', textAlign: 'center' }}>
        <img src="/toukobe-intern-logo.png" alt="トウコべインターン" style={{ height: 44, width: 'auto', margin: '0 auto 24px', display: 'block' }} />
        <div style={{ display: 'inline-block', background: '#FFF1E8', border: '1px solid rgba(242,98,12,.3)', borderRadius: 999, padding: '5px 16px', fontSize: 12, fontWeight: 700, color: '#F2620C', marginBottom: 18 }}>COMING SOON</div>
        <h1 style={{ fontWeight: 900, fontSize: isMobile ? 22 : 28, margin: '0 0 14px' }}>ただいま公開準備中です</h1>
        <p style={{ fontSize: 14, color: '#57514A', lineHeight: 1.9, margin: '0 0 32px' }}>
          難関大生に特化した長期インターンマッチング「トウコべインターン」は、まもなくサービスを開始します。<br />
          学生の方・企業の方は、今のうちに登録いただけます。
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={() => router.push('/auth/signup')}
            style={{ width: '100%', background: '#F2620C', color: '#fff', border: 'none', borderRadius: 12, padding: '16px', fontFamily: 'var(--font-sans)', fontWeight: 900, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 14px rgba(242,98,12,.28)' }}
          >
            🎓 学生として登録する
          </button>
          <button
            onClick={() => router.push('/for-companies')}
            style={{ width: '100%', background: '#fff', color: '#F2620C', border: '1.5px solid #F2620C', borderRadius: 12, padding: '15px', fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}
          >
            🏢 企業の方へ（求人掲載のご相談）
          </button>
        </div>

        <p style={{ marginTop: 24, fontSize: 13, color: '#938B81' }}>
          すでにアカウントをお持ちの方は{' '}
          <span style={{ color: '#F2620C', fontWeight: 700, cursor: 'pointer' }} onClick={() => router.push('/auth/login')}>ログイン</span>
        </p>
      </div>
    </div>
  );
}
