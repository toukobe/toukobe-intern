'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { useIsMobile } from '@/utils/useIsMobile';

function EyeIcon({ show }: { show: boolean }) {
  return show ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
  );
}

const S = {
  wrap: { minHeight: '100vh', background: 'linear-gradient(120deg,#1C1813 0%,#2A231B 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "var(--font-sans)" } as React.CSSProperties,
  card: { background: '#fff', borderRadius: 20, boxShadow: '0 24px 60px rgba(0,0,0,.3)', padding: '48px 44px', width: '100%', maxWidth: 440 } as React.CSSProperties,
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#57514A', marginBottom: 8 } as React.CSSProperties,
  input: { width: '100%', border: '1px solid #EFE8DF', borderRadius: 10, padding: '13px 16px', fontFamily: "var(--font-sans)", fontSize: 14, color: '#1C1813', outline: 'none', boxSizing: 'border-box' as const },
  btn: { width: '100%', background: '#F2620C', color: '#fff', border: 'none', borderRadius: 10, padding: '15px', fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 14px rgba(242,98,12,.28)' } as React.CSSProperties,
  err: { background: '#FFF1EE', border: '1px solid #FBCFBE', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#C2390A', marginBottom: 20 } as React.CSSProperties,
};

export default function CompanyLoginPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { document.title = '企業ログイン | トウコべインターン'; return () => { document.title = 'トウコべインターン'; }; }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message.includes('Email not confirmed')
          ? 'メールアドレスの確認が完了していません。登録時に届いた確認メールのリンクをクリックしてください'
          : 'メールアドレスまたはパスワードが正しくありません');
        return;
      }

      const { data: userType } = await supabase
        .from('user_types').select('user_type').eq('user_id', data.user.id).single();

      if (userType?.user_type === 'admin' || data.user.email === 'ru_matsumoto@manabiph.com') {
        router.push('/dashboard/admin');
      } else if (userType?.user_type === 'company') {
        router.push('/dashboard/company');
      } else if (!userType) {
        // 登録が途中で終わったアカウント: setupで種別登録から再開できる
        router.push('/auth/setup');
      } else {
        router.push('/');
      }
    } catch { setError('ログインに失敗しました'); }
    finally { setLoading(false); }
  };

  return (
    <div style={S.wrap}>
      <div style={{ ...S.card, padding: isMobile ? '32px 24px' : '48px 44px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/toukobe-intern-logo.png" alt="トウコべインターン" style={{ height: 44, width: 'auto', cursor: 'pointer' }} onClick={() => router.push('/')} />
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: '.3em', color: '#B59A86', marginTop: 4 }}>COMPANY LOGIN</div>
          <h1 style={{ fontWeight: 900, fontSize: 26, margin: '20px 0 6px' }}>企業ログイン</h1>
          <p style={{ fontSize: 13, color: '#938B81', margin: 0 }}>企業アカウントでサインインしてください</p>
        </div>

        {error && <div style={S.err}>{error}</div>}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>メールアドレス</label>
            <input style={S.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="company@example.com" required onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={S.label}>パスワード</label>
            <div style={{ position: 'relative' }}>
              <input
                style={{ ...S.input, paddingRight: 46 }}
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'}
                onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#938B81', padding: 0, display: 'flex', alignItems: 'center' }}
              >
                <EyeIcon show={showPw} />
              </button>
            </div>
          </div>
          <div style={{ textAlign: 'right', marginBottom: 20 }}>
            <span style={{ fontSize: 13, color: '#F2620C', cursor: 'pointer', fontWeight: 600 }} onClick={() => router.push('/auth/forgot-password')}>
              パスワードを忘れた方
            </span>
          </div>
          <button type="submit" disabled={loading} style={{ ...S.btn, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontSize: 13, color: '#57514A', margin: 0 }}>
            新規掲載をご希望の方は{' '}
            <span style={{ color: '#F2620C', fontWeight: 700, cursor: 'pointer' }} onClick={() => router.push('/forms/material')}>資料請求</span>
            {' '}／{' '}
            <span style={{ color: '#F2620C', fontWeight: 700, cursor: 'pointer' }} onClick={() => router.push('/forms/contact')}>お問い合わせ</span>
          </p>
          <p style={{ fontSize: 12, color: '#B6ADA2', margin: 0 }}>
            学生の方は{' '}
            <span style={{ color: '#F2620C', cursor: 'pointer' }} onClick={() => router.push('/auth/login')}>こちら</span>
          </p>
        </div>
      </div>
    </div>
  );
}
