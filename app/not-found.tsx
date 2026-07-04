import Link from 'next/link';

export const metadata = {
  title: 'ページが見つかりません | トウコべインターン',
};

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#FFF7F0', fontFamily: 'var(--font-sans)', color: '#1C1813', padding: '40px 20px', textAlign: 'center' }}>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, letterSpacing: '.25em', color: '#C2530A', fontWeight: 700, margin: '0 0 12px' }}>404 NOT FOUND</p>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 14px', lineHeight: 1.5 }}>お探しのページが見つかりません</h1>
      <p style={{ fontSize: 14, lineHeight: 2, color: '#57514A', margin: '0 0 32px' }}>
        URLが変更されたか、ページが削除された可能性があります。<br />
        お手数ですが、トップページからお探しください。
      </p>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/" style={{ fontSize: 14, fontWeight: 700, color: '#fff', background: '#F2620C', borderRadius: 6, padding: '11px 26px', textDecoration: 'none' }}>トップページへ</Link>
        <Link href="/search" style={{ fontSize: 14, fontWeight: 700, color: '#F2620C', background: '#fff', border: '1px solid #F2620C', borderRadius: 6, padding: '11px 26px', textDecoration: 'none' }}>求人を探す</Link>
      </div>
    </div>
  );
}
