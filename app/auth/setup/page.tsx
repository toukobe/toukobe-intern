'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { useIsMobile } from '@/utils/useIsMobile';
import { LEGAL_VERSION } from '@/utils/legal';

// メール確認後の初回ログイン時などに、user_types 未登録のアカウントの登録を完了させるページ。
// 新規登録は学生専用（企業アカウントは運営が管理者ページから発行する）。

const S = {
  wrap: { minHeight: '100vh', background: 'linear-gradient(160deg,#FFF6EE 0%,#FFEFE2 55%,#FFE7D4 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "var(--font-sans)" } as React.CSSProperties,
  card: { background: '#fff', borderRadius: 20, boxShadow: '0 24px 60px rgba(28,24,19,.12)', padding: '48px 44px', width: '100%', maxWidth: 480 } as React.CSSProperties,
};

export default function SetupPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/auth/login'); return; }
      setUserId(session.user.id);
      setUserEmail(session.user.email || '');
    });
  }, [router]);

  const handleStudent = async () => {
    if (!userId) return;
    if (!agreed) { setError('利用規約とプライバシーポリシーに同意してください'); return; }
    setLoading(true);
    setError(null);
    // 同意記録（日時・規約バージョン）を含めてINSERT。カラム未追加の環境では基本項目のみで再試行。
    const consent = { agreed_terms_at: new Date().toISOString(), terms_version: LEGAL_VERSION };
    let { error: insertError } = await supabase.from('user_types').insert([{ user_id: userId, user_type: 'student', company_id: null, ...consent }]);
    if (insertError && /column/i.test(insertError.message)) {
      ({ error: insertError } = await supabase.from('user_types').insert([{ user_id: userId, user_type: 'student', company_id: null }]));
    }
    if (insertError) { setError('登録に失敗しました。もう一度お試しください。'); setLoading(false); return; }
    // プロフィール入力は必須（Google登録でもここを通る）
    router.push('/auth/signup-profile');
  };

  return (
    <div style={S.wrap}>
      <div style={{ ...S.card, padding: isMobile ? '32px 24px' : '48px 44px' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img src="/toukobe-intern-logo.png" alt="トウコべインターン" style={{ height: 44 }} />
          <h1 style={{ fontWeight: 900, fontSize: 24, margin: '20px 0 8px' }}>登録を完了する</h1>
          <p style={{ fontSize: 13, color: '#938B81', margin: 0 }}>{userEmail}</p>
        </div>
        {error && <div style={{ background: '#FFF1EE', border: '1px solid #FBCFBE', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#C2390A', marginBottom: 20 }}>{error}</div>}
        {/* 利用規約・プライバシーポリシー同意（Google初回ログインはsignupページを通らないためここでも必須） */}
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#FBF8F4', border: '1px solid #EFE8DF', borderRadius: 10, padding: '12px 14px', cursor: 'pointer', marginBottom: 16 }}>
          <input type="checkbox" checked={agreed} onChange={e => { setAgreed(e.target.checked); if (e.target.checked) setError(null); }} style={{ width: 18, height: 18, marginTop: 1, accentColor: '#F2620C', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: '#3A352F', lineHeight: 1.7 }}>
            <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: '#F2620C', fontWeight: 700 }}>利用規約</a>
            {' '}と{' '}
            <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: '#F2620C', fontWeight: 700 }}>プライバシーポリシー</a>
            {' '}に同意します <span style={{ color: '#F2620C' }}>*</span>
          </span>
        </label>
        {!agreed && (
          <p style={{ fontSize: 12, color: '#938B81', margin: '-8px 0 16px', paddingLeft: 2 }}>
            ※ 登録の完了には利用規約とプライバシーポリシーへの同意が必要です。
          </p>
        )}
        <button onClick={handleStudent} disabled={loading || !agreed}
          style={{ width: '100%', border: '1.5px solid #EFE8DF', borderRadius: 14, padding: '24px', textAlign: 'left', background: '#fff', cursor: loading || !agreed ? 'not-allowed' : 'pointer', opacity: loading || !agreed ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 20 }}
          onMouseEnter={e => { if (loading || !agreed) return; e.currentTarget.style.borderColor = '#F2620C'; e.currentTarget.style.background = '#FFF8F5'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#EFE8DF'; e.currentTarget.style.background = '#fff'; }}
        >
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#FFF1E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>🎓</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{loading ? '登録中...' : '学生として登録を完了する'}</div>
            <div style={{ fontSize: 13, color: '#938B81' }}>インターン求人を探す・応募する</div>
          </div>
          <span style={{ marginLeft: 'auto', color: '#F2620C', fontSize: 18 }}>→</span>
        </button>
        <p style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: '#B6ADA2', lineHeight: 1.8 }}>
          企業アカウントは運営が発行しています。<br />
          求人掲載をご希望の企業の方は{' '}
          <span style={{ color: '#F2620C', cursor: 'pointer' }} onClick={() => router.push('/for-companies')}>企業の方へ</span>
          {' '}からご連絡ください。
        </p>
      </div>
    </div>
  );
}
