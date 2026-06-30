'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

const S = {
  wrap: { minHeight: '100vh', background: 'linear-gradient(160deg,#FFF6EE 0%,#FFEFE2 55%,#FFE7D4 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Zen Kaku Gothic New',sans-serif" } as React.CSSProperties,
  card: { background: '#fff', borderRadius: 20, boxShadow: '0 24px 60px rgba(28,24,19,.12)', padding: '48px 44px', width: '100%', maxWidth: 480 } as React.CSSProperties,
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#57514A', marginBottom: 8 } as React.CSSProperties,
  input: { width: '100%', border: '1px solid #EFE8DF', borderRadius: 10, padding: '13px 16px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontSize: 14, color: '#1C1813', outline: 'none', boxSizing: 'border-box' as const },
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

export default function SignupPage() {
  const router = useRouter();
  const [userType, setUserType] = useState<'student' | 'company' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifyStep, setVerifyStep] = useState(false);

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) { setError('Googleログインに失敗しました'); setLoading(false); }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) { setError('パスワードが一致しません'); return; }
    if (password.length < 6) { setError('パスワードは6文字以上で設定してください'); return; }
    setLoading(true);
    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (signupError) { setError(signupError.message); return; }
      if (!data.user) { setError('ユーザー作成に失敗しました'); return; }

      let companyId = null;
      if (userType === 'company') {
        const { data: companyData, error: companyError } = await supabase
          .from('companies').insert([{ company_name: companyName, industry, contact_email: contactEmail }]).select().single();
        if (companyError) { setError('企業情報の作成に失敗しました'); return; }
        companyId = companyData.id;
      }

      await supabase.from('user_types').insert([{ user_id: data.user.id, user_type: userType, company_id: companyId }]);

      if (userType === 'student') {
        // Check if email confirmation is needed
        // If session is null after signup, email confirmation is required
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setVerifyStep(true);
          return;
        }
        router.push('/dashboard/student');
      } else {
        router.push('/dashboard/company');
      }
    } catch { setError('登録に失敗しました'); }
    finally { setLoading(false); }
  };

  // Email verification waiting screen
  if (verifyStep) return (
    <div style={S.wrap}>
      <link href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;700;900&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <div style={S.card}>
        <div style={{ textAlign: 'center' }}>
          <img src="/toukobe-intern-logo.png" alt="トウコべインターン" style={{ height: 44, marginBottom: 24 }} />
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#FFF1E8', border: '2px solid #FBD5C0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>✉️</div>
          <h2 style={{ fontWeight: 900, fontSize: 22, marginBottom: 12 }}>メールを確認してください</h2>
          <p style={{ fontSize: 14, color: '#57514A', lineHeight: 1.8, marginBottom: 8 }}>
            <strong>{email}</strong> に確認メールを送信しました。
          </p>
          <p style={{ fontSize: 14, color: '#57514A', lineHeight: 1.8, marginBottom: 24 }}>
            メール内のリンクをクリックして登録を完了してください。
          </p>
          <p style={{ fontSize: 12, color: '#938B81', marginBottom: 28 }}>メールが届かない場合は迷惑メールフォルダをご確認ください。</p>
          <button onClick={() => router.push('/auth/login')} style={{ background: '#F2620C', color: '#fff', border: 'none', borderRadius: 10, padding: '13px 32px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            ログインページへ
          </button>
        </div>
      </div>
    </div>
  );

  // Type selection screen
  if (!userType) return (
    <div style={S.wrap}>
      <link href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;700;900&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <div style={S.card}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <img src="/toukobe-intern-logo.png" alt="トウコべインターン" style={{ height: 44, width: 'auto', cursor: 'pointer' }} onClick={() => router.push('/')} />
          <h1 style={{ fontWeight: 900, fontSize: 26, margin: '20px 0 8px' }}>新規登録</h1>
          <p style={{ fontSize: 13, color: '#938B81', margin: 0 }}>アカウントタイプを選択してください</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <button onClick={() => setUserType('student')}
            style={{ border: '1.5px solid #EFE8DF', borderRadius: 14, padding: '24px', textAlign: 'left', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 20, transition: '.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#F2620C'; e.currentTarget.style.background = '#FFF8F5'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#EFE8DF'; e.currentTarget.style.background = '#fff'; }}
          >
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#FFF1E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>🎓</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>学生として登録</div>
              <div style={{ fontSize: 13, color: '#938B81' }}>インターン求人を探す・応募する</div>
            </div>
            <span style={{ marginLeft: 'auto', color: '#F2620C', fontSize: 18 }}>→</span>
          </button>
          <button onClick={() => setUserType('company')}
            style={{ border: '1.5px solid #EFE8DF', borderRadius: 14, padding: '24px', textAlign: 'left', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 20, transition: '.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#F2620C'; e.currentTarget.style.background = '#FFF8F5'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#EFE8DF'; e.currentTarget.style.background = '#fff'; }}
          >
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#FFF1E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>🏢</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>企業として登録</div>
              <div style={{ fontSize: 13, color: '#938B81' }}>インターン求人を掲載・採用する</div>
            </div>
            <span style={{ marginLeft: 'auto', color: '#F2620C', fontSize: 18 }}>→</span>
          </button>
        </div>
        <p style={{ marginTop: 28, textAlign: 'center', fontSize: 13, color: '#938B81' }}>
          すでにアカウントがありますか？{' '}
          <span style={{ color: '#F2620C', fontWeight: 700, cursor: 'pointer' }} onClick={() => router.push('/auth/login')}>ログイン</span>
        </p>
      </div>
    </div>
  );

  return (
    <div style={S.wrap}>
      <link href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;700;900&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <div style={S.card}>
        <div style={{ marginBottom: 28 }}>
          <span style={{ fontSize: 13, color: '#F2620C', cursor: 'pointer', fontWeight: 600 }} onClick={() => setUserType(null)}>← 戻る</span>
        </div>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img src="/toukobe-intern-logo.png" alt="トウコべインターン" style={{ height: 44, width: 'auto', cursor: 'pointer' }} onClick={() => router.push('/')} />
          <h1 style={{ fontWeight: 900, fontSize: 24, margin: '16px 0 6px' }}>
            {userType === 'student' ? '学生として登録' : '企業として登録'}
          </h1>
          <p style={{ fontSize: 13, color: '#938B81', margin: 0 }}>アカウントを作成してください</p>
        </div>

        {/* Google signup — students only */}
        {userType === 'student' && (
          <>
            <button onClick={handleGoogleSignup} disabled={loading}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: '#fff', border: '1px solid #EFE8DF', borderRadius: 10, padding: '13px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontSize: 14, fontWeight: 600, color: '#1C1813', cursor: 'pointer', marginBottom: 4, opacity: loading ? 0.6 : 1 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Googleで登録（メール認証不要）
            </button>
            <div style={S.divider}>
              <div style={{ flex: 1, height: 1, background: '#EFE8DF' }} />
              <span style={{ fontSize: 12, color: '#B6ADA2' }}>またはメールで登録</span>
              <div style={{ flex: 1, height: 1, background: '#EFE8DF' }} />
            </div>
          </>
        )}

        {error && <div style={S.err}>{error}</div>}

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {userType === 'company' && (
            <>
              <div>
                <label style={S.label}>企業名 <span style={{ color: '#F2620C' }}>*</span></label>
                <input style={S.input} type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="例：株式会社ABC" required onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} />
              </div>
              <div>
                <label style={S.label}>業種 <span style={{ color: '#F2620C' }}>*</span></label>
                <input style={S.input} type="text" value={industry} onChange={e => setIndustry(e.target.value)} placeholder="例：コンサルティング" required onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} />
              </div>
              <div>
                <label style={S.label}>企業メールアドレス <span style={{ color: '#F2620C' }}>*</span></label>
                <input style={S.input} type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="hr@company.com" required onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} />
              </div>
              <div style={{ height: 1, background: '#EFE8DF' }} />
            </>
          )}
          <div>
            <label style={S.label}>ログイン用メールアドレス <span style={{ color: '#F2620C' }}>*</span></label>
            <input style={S.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@example.com" required onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} />
          </div>
          <div>
            <label style={S.label}>パスワード <span style={{ color: '#F2620C' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <input style={{ ...S.input, paddingRight: 46 }} type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••（6文字以上）" required onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} />
              <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#938B81', padding: 0, display: 'flex' }}><EyeIcon show={showPw} /></button>
            </div>
          </div>
          <div>
            <label style={S.label}>パスワード（確認） <span style={{ color: '#F2620C' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <input style={{ ...S.input, paddingRight: 46 }} type={showCf ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" required onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} />
              <button type="button" onClick={() => setShowCf(!showCf)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#938B81', padding: 0, display: 'flex' }}><EyeIcon show={showCf} /></button>
            </div>
          </div>
          <button type="submit" disabled={loading} style={{ ...S.btn, marginTop: 8, opacity: loading ? 0.7 : 1 }}>
            {loading ? '登録中...' : '登録する'}
          </button>
        </form>

        <p style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: '#938B81' }}>
          すでにアカウントがありますか？{' '}
          <span style={{ color: '#F2620C', fontWeight: 700, cursor: 'pointer' }} onClick={() => router.push('/auth/login')}>ログイン</span>
        </p>
      </div>
    </div>
  );
}
