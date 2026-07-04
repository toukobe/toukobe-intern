'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#FFF7F0', fontFamily: 'var(--font-sans)', color: '#1C1813', padding: '40px 20px', textAlign: 'center' }}>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, letterSpacing: '.25em', color: '#C2530A', fontWeight: 700, margin: '0 0 12px' }}>ERROR</p>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 14px', lineHeight: 1.5 }}>エラーが発生しました</h1>
      <p style={{ fontSize: 14, lineHeight: 2, color: '#57514A', margin: '0 0 32px' }}>
        申し訳ありません。ページの表示中に問題が発生しました。<br />
        再試行しても解決しない場合は、時間をおいてお試しください。
      </p>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={() => reset()} style={{ fontSize: 14, fontWeight: 700, color: '#fff', background: '#F2620C', border: 'none', borderRadius: 6, padding: '11px 26px', cursor: 'pointer', fontFamily: 'inherit' }}>再試行する</button>
        <button onClick={() => router.push('/')} style={{ fontSize: 14, fontWeight: 700, color: '#F2620C', background: '#fff', border: '1px solid #F2620C', borderRadius: 6, padding: '11px 26px', cursor: 'pointer', fontFamily: 'inherit' }}>トップページへ</button>
      </div>
    </div>
  );
}
