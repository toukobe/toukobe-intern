'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

const S = {
  wrap: { minHeight: '100vh', background: 'linear-gradient(160deg,#FFF6EE 0%,#FFEFE2 55%,#FFE7D4 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Zen Kaku Gothic New',sans-serif" } as React.CSSProperties,
  card: { background: '#fff', borderRadius: 20, boxShadow: '0 24px 60px rgba(28,24,19,.12)', padding: '48px 44px', width: '100%', maxWidth: 440 } as React.CSSProperties,
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#57514A', marginBottom: 8 } as React.CSSProperties,
  input: { width: '100%', border: '1px solid #EFE8DF', borderRadius: 10, padding: '13px 16px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontSize: 14, color: '#1C1813', outline: 'none', boxSizing: 'border-box' as const },
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) {
      setError('メール送信に失敗しました。アドレスを確認してください。');
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div style={S.wrap}>
      <link href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;700;900&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <div style={S.card}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/toukobe-intern-logo.png" alt="トウコべインターン" style={{ height: 44, cursor: 'pointer' }} onClick={() => router.push('/')} />
          <h1 style={{ fontWeight: 900, fontSize: 24, margin: '20px 0 6px' }}>パスワードをリセット</h1>
          <p style={{ fontSize: 13, color: '#938B81', margin: 0 }}>登録メールアドレスに再設定リンクを送信します</p>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#F0FDF4', border: '2px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>✉️</div>
            <h2 style={{ fontWeight: 900, fontSize: 20, marginBottom: 12 }}>メールを送信しました</h2>
            <p style={{ fontSize: 14, color: '#57514A', lineHeight: 1.8, marginBottom: 28 }}>
              <strong>{email}</strong> にパスワード再設定リンクを送信しました。<br />
              メールを確認してリンクをクリックしてください。
            </p>
            <p style={{ fontSize: 12, color: '#938B81', marginBottom: 24 }}>メールが届かない場合は迷惑メールフォルダをご確認ください。</p>
            <button onClick={() => router.push('/auth/login')} style={{ background: '#F2620C', color: '#fff', border: 'none', borderRadius: 10, padding: '13px 32px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              ログインページへ
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div style={{ background: '#FFF1EE', border: '1px solid #FBCFBE', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#C2390A', marginBottom: 20 }}>
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 24 }}>
                <label style={S.label}>登録したメールアドレス</label>
                <input
                  style={S.input}
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="example@university.ac.jp"
                  required
                  onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'}
                  onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'}
                />
              </div>
              <button type="submit" disabled={loading} style={{ width: '100%', background: '#F2620C', color: '#fff', border: 'none', borderRadius: 10, padding: '15px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 700, fontSize: 15, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
                {loading ? '送信中...' : 'リセットメールを送信'}
              </button>
            </form>
            <p style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: '#938B81' }}>
              <span style={{ color: '#F2620C', fontWeight: 700, cursor: 'pointer' }} onClick={() => router.push('/auth/login')}>← ログインに戻る</span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
