'use client';

import { useEffect } from 'react';
import { useIsMobile } from '@/utils/useIsMobile';

// メンテナンス（maintenance）モードで一般訪問者に表示するページ。
export default function MaintenancePage() {
  const isMobile = useIsMobile();
  useEffect(() => { document.title = 'メンテナンス中 | トウコべインターン'; return () => { document.title = 'トウコべインターン'; }; }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#FFF6EE 0%,#FFEFE2 55%,#FFE7D4 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '24px 16px' : '48px 24px', fontFamily: 'var(--font-sans)', color: '#1C1813' }}>
      <div style={{ width: '100%', maxWidth: 480, background: '#fff', borderRadius: 20, boxShadow: '0 24px 60px rgba(28,24,19,.12)', padding: isMobile ? '36px 24px' : '52px 48px', textAlign: 'center' }}>
        <img src="/toukobe-intern-logo.png" alt="トウコべインターン" style={{ height: 40, width: 'auto', margin: '0 auto 24px', display: 'block' }} />
        <div style={{ fontSize: 40, marginBottom: 12 }}>🛠️</div>
        <h1 style={{ fontWeight: 900, fontSize: isMobile ? 22 : 26, margin: '0 0 14px' }}>ただいまメンテナンス中です</h1>
        <p style={{ fontSize: 14, color: '#57514A', lineHeight: 1.9, margin: 0 }}>
          サービス改善のため、一時的に停止しています。<br />
          ご不便をおかけしますが、しばらく経ってから再度お試しください。
        </p>
        <p style={{ marginTop: 24, fontSize: 12, color: '#B6ADA2' }}>お問い合わせ：info@manabiph.com</p>
      </div>
    </div>
  );
}
