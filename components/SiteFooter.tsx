'use client';

import Link from 'next/link';
import { useIsMobile } from '@/utils/useIsMobile';

const linkStyle = { cursor: 'pointer', color: '#B8AFA4', textDecoration: 'none' } as const;

export default function SiteFooter() {
  const isMobile = useIsMobile();
  return (
    <div style={{ background: '#15110D', fontFamily: 'var(--font-sans)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '40px 20px 24px' : '52px 48px 30px' }}>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', gap: isMobile ? 32 : 40, paddingBottom: isMobile ? 28 : 36, borderBottom: '1px solid #2C2620' }}>
          <div style={{ maxWidth: 320 }}>
            <div style={{ fontWeight: 700, fontSize: isMobile ? 16 : 18, color: '#fff', marginBottom: 12 }}>トウコべインターン</div>
            <p style={{ fontSize: 13, lineHeight: 1.9, color: '#8E857B', margin: 0 }}>難関大生のキャリア形成を支える、長期インターン求人プラットフォーム。</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,auto)', gap: 0, alignItems: 'start' }}>
            <div style={{ marginRight: isMobile ? 0 : 64 }}>
              <div style={{ fontSize: 12, color: '#7D746A', marginBottom: 14 }}>学生の方</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11, fontSize: 13 }}>
                <Link href="/search" className="nav-link" style={linkStyle}>求人検索</Link>
                <Link href="/how-it-works" className="nav-link" style={linkStyle}>使い方</Link>
                <Link href="/faq" className="nav-link" style={linkStyle}>よくある質問</Link>
              </div>
            </div>
            <div style={{ marginRight: isMobile ? 0 : 64 }}>
              <div style={{ fontSize: 12, color: '#7D746A', marginBottom: 14 }}>企業の方</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11, fontSize: 13 }}>
                <Link href="/for-companies" className="nav-link" style={linkStyle}>資料請求</Link>
                <Link href="/forms/contact" className="nav-link" style={linkStyle}>お問い合わせ</Link>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#7D746A', marginBottom: 14 }}>運営</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11, fontSize: 13 }}>
                <a href="https://www.manabiph.com/" target="_blank" rel="noopener noreferrer" className="nav-link" style={linkStyle}>運営会社</a>
                <Link href="/privacy-policy" className="nav-link" style={linkStyle}>プライバシーポリシー</Link>
                <Link href="/terms" className="nav-link" style={linkStyle}>利用規約</Link>
              </div>
            </div>
          </div>
        </div>
        <div style={{ paddingTop: 20, fontSize: 11, color: '#665D53' }}>© 2026 トウコべインターン</div>
      </div>
    </div>
  );
}
