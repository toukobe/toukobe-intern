'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

const S = {
  wrap: { minHeight: '100vh', background: 'linear-gradient(120deg,#1C1813 0%,#2A231B 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Zen Kaku Gothic New',sans-serif" } as React.CSSProperties,
  card: { background: '#fff', borderRadius: 20, boxShadow: '0 24px 60px rgba(0,0,0,.3)', padding: '48px 44px', width: '100%', maxWidth: 440 } as React.CSSProperties,
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#57514A', marginBottom: 8 } as React.CSSProperties,
  input: { width: '100%', border: '1px solid #EFE8DF', borderRadius: 10, padding: '13px 16px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontSize: 14, color: '#1C1813', outline: 'none', boxSizing: 'border-box' as const },
  btn: { width: '100%', background: '#F2620C', color: '#fff', border: 'none', borderRadius: 10, padding: '15px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 14px rgba(242,98,12,.28)' } as React.CSSProperties,
  err: { background: '#FFF1EE', border: '1px solid #FBCFBE', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#C2390A', marginBottom: 20 } as React.CSSProperties,
};

export default function CompanyLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) { setError('メールアドレスまたはパスワードが正しくありません'); return; }

      const { data: userType } = await supabase
        .from('user_types').select('user_type').eq('user_id', data.user.id).single();

      if (userType?.user_type === 'admin' || data.user.email === 'ru_matsumoto@manabiph.com') {
        router.push('/dashboard/admin');
      } else if (userType?.user_type === 'company') {
        router.push('/dashboard/company');
      } else {
        router.push('/');
      }
    } catch { setError('ログインに失敗しました'); }
    finally { setLoading(false); }
  };

  return (
    <div style={S.wrap}>
      <link href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;700;900&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <div style={S.card}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/toukobe-intern-logo.png" alt="トウコべインターン" style={{ height: 44, width: 'auto', cursor: 'pointer' }} onClick={() => router.push('/')} />
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, letterSpacing: '.3em', color: '#B59A86', marginTop: 4 }}>COMPANY LOGIN</div>
          <h1 style={{ fontWeight: 900, fontSize: 26, margin: '20px 0 6px' }}>企業ログイン</h1>
          <p style={{ fontSize: 13, color: '#938B81', margin: 0 }}>企業アカウントでサインインしてください</p>
        </div>

        {error && <div style={S.err}>{error}</div>}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>メールアドレス</label>
            <input style={S.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="company@example.com" required onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} />
          </div>
          <div style={{ marginBottom: 28 }}>
            <label style={S.label}>パスワード</label>
            <input style={S.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} />
          </div>
          <button type="submit" disabled={loading} style={{ ...S.btn, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: '#B6ADA2', margin: 0 }}>
            学生の方は{' '}
            <span style={{ color: '#F2620C', cursor: 'pointer' }} onClick={() => router.push('/auth/login')}>こちら</span>
          </p>
        </div>
      </div>
    </div>
  );
}
