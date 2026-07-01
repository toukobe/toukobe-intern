'use client';

import { useEffect, useState } from 'react';

export default function MobileBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('mobile-banner-dismissed');
    if (!dismissed && window.innerWidth < 768) {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    sessionStorage.setItem('mobile-banner-dismissed', '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(28,24,19,.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, fontFamily: "'Zen Kaku Gothic New', sans-serif",
    }}>
      <div style={{
        background: '#fff', borderRadius: 18,
        padding: '32px 28px', maxWidth: 340, width: '100%',
        boxShadow: '0 24px 60px rgba(0,0,0,.2)', textAlign: 'center',
      }}>
        <div style={{ fontSize: 36, marginBottom: 14 }}>💻</div>
        <h2 style={{ fontWeight: 900, fontSize: 18, margin: '0 0 10px', color: '#1C1813' }}>
          PC閲覧推奨
        </h2>
        <p style={{ fontSize: 13, color: '#57514A', lineHeight: 1.8, margin: '0 0 24px' }}>
          このサービスはPC・タブレットでのご利用を推奨しています。スマートフォンでは一部表示が崩れる場合があります。
        </p>
        <button
          onClick={dismiss}
          style={{
            width: '100%', background: '#F2620C', color: '#fff',
            border: 'none', borderRadius: 10, padding: '13px',
            fontFamily: "'Zen Kaku Gothic New', sans-serif",
            fontWeight: 700, fontSize: 15, cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(242,98,12,.28)',
          }}
        >
          OK、このまま続ける
        </button>
      </div>
    </div>
  );
}
