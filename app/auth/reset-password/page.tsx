'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

const S = {
  wrap: { minHeight: '100vh', background: 'linear-gradient(160deg,#FFF6EE 0%,#FFEFE2 55%,#FFE7D4 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Zen Kaku Gothic New',sans-serif" } as React.CSSProperties,
  card: { background: '#fff', borderRadius: 20, boxShadow: '0 24px 60px rgba(28,24,19,.12)', padding: '48px 44px', width: '100%', maxWidth: 440 } as React.CSSProperties,
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#57514A', marginBottom: 8 } as React.CSSProperties,
  input: { width: '100%', border: '1px solid #EFE8DF', borderRadius: 10, padding: '13px 16px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontSize: 14, color: '#1C1813', outline: 'none', boxSizing: 'border-box' as const },
};

function EyeIcon({ show }: { show: boolean }) {
  return show ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase handles the hash fragment automatically on load
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });
    // Also check existing session (in case already loaded)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('パスワードが一致しません'); return; }
    if (password.length < 6) { setError('パスワードは6文字以上で設定してください'); return; }
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setError('パスワードの更新に失敗しました'); setLoading(false); return; }
    setDone(true);
    setLoading(false);
  };

  if (!ready) return (
    <div style={S.wrap}>
      <div style={{ textAlign: 'center', color: '#57514A' }}>リンクを確認中...</div>
    </div>
  );

  return (
    <div style={S.wrap}>
      <link href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;700;900&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <div style={S.card}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/toukobe-intern-logo.png" alt="トウコべインターン" style={{ height: 44, cursor: 'pointer' }} onClick={() => router.push('/')} />
          <h1 style={{ fontWeight: 900, fontSize: 24, margin: '20px 0 6px' }}>新しいパスワードを設定</h1>
        </div>

        {done ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
            <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>パスワードを更新しました</p>
            <button onClick={() => router.push('/auth/login')} style={{ background: '#F2620C', color: '#fff', border: 'none', borderRadius: 10, padding: '13px 32px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 700, fontSize: 14, cursor: 'pointer', marginTop: 16 }}>
              ログインする
            </button>
          </div>
        ) : (
          <>
            {error && <div style={{ background: '#FFF1EE', border: '1px solid #FBCFBE', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#C2390A', marginBottom: 20 }}>{error}</div>}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={S.label}>新しいパスワード</label>
                <div style={{ position: 'relative' }}>
                  <input style={{ ...S.input, paddingRight: 46 }} type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••（6文字以上）" required onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} />
                  <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#938B81', padding: 0, display: 'flex' }}><EyeIcon show={showPw} /></button>
                </div>
              </div>
              <div>
                <label style={S.label}>パスワード（確認）</label>
                <div style={{ position: 'relative' }}>
                  <input style={{ ...S.input, paddingRight: 46 }} type={showCf ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" required onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} />
                  <button type="button" onClick={() => setShowCf(!showCf)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#938B81', padding: 0, display: 'flex' }}><EyeIcon show={showCf} /></button>
                </div>
              </div>
              <button type="submit" disabled={loading} style={{ background: '#F2620C', color: '#fff', border: 'none', borderRadius: 10, padding: '15px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 700, fontSize: 15, cursor: 'pointer', opacity: loading ? 0.7 : 1, marginTop: 8 }}>
                {loading ? '更新中...' : 'パスワードを更新する'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
