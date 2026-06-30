'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/utils/supabase';

const S = {
  wrap: { minHeight: '100vh', background: 'linear-gradient(160deg,#FFF6EE 0%,#FFEFE2 55%,#FFE7D4 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Zen Kaku Gothic New',sans-serif" } as React.CSSProperties,
  card: { background: '#fff', borderRadius: 20, boxShadow: '0 24px 60px rgba(28,24,19,.12)', padding: '48px 44px', width: '100%', maxWidth: 440 } as React.CSSProperties,
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#57514A', marginBottom: 8 } as React.CSSProperties,
  input: { width: '100%', border: '1px solid #EFE8DF', borderRadius: 10, padding: '13px 16px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontSize: 14, color: '#1C1813', outline: 'none', boxSizing: 'border-box' as const, transition: 'border-color .2s' },
  btn: { width: '100%', background: '#F2620C', color: '#fff', border: 'none', borderRadius: 10, padding: '15px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 14px rgba(242,98,12,.28)' } as React.CSSProperties,
  err: { background: '#FFF1EE', border: '1px solid #FBCFBE', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#C2390A', marginBottom: 20 } as React.CSSProperties,
  divider: { display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0' } as React.CSSProperties,
};

function EyeIcon({ show }: { show: boolean }) {
  return show ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || null;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    const callbackUrl = redirectTo
      ? `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`
      : `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl },
    });
    if (error) { setError('Googleログインに失敗しました'); setLoading(false); }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError('メールアドレスまたはパスワードが正しくありません'); return; }

      // Redirect to appropriate dashboard
      const { data: ut } = await supabase.from('user_types').select('user_type').eq('user_id', data.user.id).maybeSingle();
      if (!ut) { router.push('/auth/setup'); return; }
      if (ut.user_type === 'company') { router.push('/dashboard/company'); }
      else if (ut.user_type === 'student') { router.push(redirectTo || '/dashboard/student'); }
      else if (data.user.email === 'ru_matsumoto@manabiph.com') { router.push('/dashboard/admin'); }
      else { router.push('/'); }
    } catch { setError('ログインに失敗しました'); }
    finally { setLoading(false); }
  };

  return (
    <div style={S.wrap}>
      <link href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;700;900&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <div style={S.card}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/toukobe-intern-logo.png" alt="トウコべインターン" style={{ height: 44, width: 'auto', cursor: 'pointer' }} onClick={() => router.push('/')} />
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, letterSpacing: '.3em', color: '#B59A86', marginTop: 4 }}>STUDENT LOGIN</div>
          <h1 style={{ fontWeight: 900, fontSize: 26, margin: '20px 0 6px' }}>ログイン</h1>
          <p style={{ fontSize: 13, color: '#938B81', margin: 0 }}>アカウントにサインインしてください</p>
        </div>

        {/* Google */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: '#fff', border: '1px solid #EFE8DF', borderRadius: 10, padding: '13px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontSize: 14, fontWeight: 600, color: '#1C1813', cursor: 'pointer', marginBottom: 4, opacity: loading ? 0.6 : 1 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Googleでログイン
        </button>

        <div style={S.divider}>
          <div style={{ flex: 1, height: 1, background: '#EFE8DF' }} />
          <span style={{ fontSize: 12, color: '#B6ADA2' }}>または</span>
          <div style={{ flex: 1, height: 1, background: '#EFE8DF' }} />
        </div>

        {error && <div style={S.err}>{error}</div>}

        <form onSubmit={handleEmailLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>メールアドレス</label>
            <input style={S.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@university.ac.jp" required onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} />
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

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: '#938B81', margin: '0 0 12px' }}>
            アカウントがまだありませんか？{' '}
            <span style={{ color: '#F2620C', fontWeight: 700, cursor: 'pointer' }} onClick={() => router.push('/auth/signup')}>無料で登録</span>
          </p>
          <p style={{ fontSize: 12, color: '#B6ADA2', margin: 0 }}>
            企業の方は{' '}
            <span style={{ color: '#F2620C', cursor: 'pointer' }} onClick={() => router.push('/auth/company-login')}>こちら</span>
          </p>
        </div>
      </div>
    </div>
  );
}
export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}