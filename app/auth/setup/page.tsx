'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { useIsMobile } from '@/utils/useIsMobile';

const S = {
  wrap: { minHeight: '100vh', background: 'linear-gradient(160deg,#FFF6EE 0%,#FFEFE2 55%,#FFE7D4 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Zen Kaku Gothic New',sans-serif" } as React.CSSProperties,
  card: { background: '#fff', borderRadius: 20, boxShadow: '0 24px 60px rgba(28,24,19,.12)', padding: '48px 44px', width: '100%', maxWidth: 480 } as React.CSSProperties,
};

export default function SetupPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [step, setStep] = useState<'pick' | 'company'>('pick');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/auth/login'); return; }
      setUserId(session.user.id);
      setUserEmail(session.user.email || '');
    });
  }, [router]);

  const handleStudent = async () => {
    if (!userId) return;
    setLoading(true);
    await supabase.from('user_types').insert([{ user_id: userId, user_type: 'student', company_id: null }]);
    router.push('/dashboard/student');
  };

  const handleCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setLoading(true);
    const { data: c } = await supabase.from('companies').insert([{ company_name: companyName, industry, contact_email: userEmail }]).select().single();
    if (c) {
      await supabase.from('user_types').insert([{ user_id: userId, user_type: 'company', company_id: c.id }]);
      router.push('/dashboard/company');
    }
    setLoading(false);
  };

  if (step === 'company') return (
    <div style={S.wrap}>
      <link href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;700;900&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <div style={{ ...S.card, padding: isMobile ? '32px 24px' : '48px 44px' }}>
        <span style={{ fontSize: 13, color: '#F2620C', cursor: 'pointer', fontWeight: 600 }} onClick={() => setStep('pick')}>← 戻る</span>
        <div style={{ textAlign: 'center', marginTop: 20, marginBottom: 32 }}>
          <img src="/toukobe-intern-logo.png" alt="トウコべインターン" style={{ height: 44 }} />
          <h1 style={{ fontWeight: 900, fontSize: 24, margin: '16px 0 6px' }}>企業情報を入力</h1>
          <p style={{ fontSize: 13, color: '#938B81', margin: 0 }}>あとでダッシュボードから変更できます</p>
        </div>
        <form onSubmit={handleCompany} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#57514A', marginBottom: 8 }}>企業名 *</label>
            <input style={{ width: '100%', border: '1px solid #EFE8DF', borderRadius: 10, padding: '13px 16px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontSize: 14, outline: 'none', boxSizing: 'border-box' as const }} value={companyName} onChange={e => setCompanyName(e.target.value)} required placeholder="例：株式会社ABC" onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#57514A', marginBottom: 8 }}>業種 *</label>
            <input style={{ width: '100%', border: '1px solid #EFE8DF', borderRadius: 10, padding: '13px 16px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontSize: 14, outline: 'none', boxSizing: 'border-box' as const }} value={industry} onChange={e => setIndustry(e.target.value)} required placeholder="例：コンサルティング" onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} />
          </div>
          <button type="submit" disabled={loading} style={{ background: '#F2620C', color: '#fff', border: 'none', borderRadius: 10, padding: '15px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 700, fontSize: 15, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? '登録中...' : '企業アカウントを作成'}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div style={S.wrap}>
      <link href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;700;900&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <div style={{ ...S.card, padding: isMobile ? '32px 24px' : '48px 44px' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <img src="/toukobe-intern-logo.png" alt="トウコべインターン" style={{ height: 44 }} />
          <h1 style={{ fontWeight: 900, fontSize: 24, margin: '20px 0 8px' }}>アカウントタイプを選択</h1>
          <p style={{ fontSize: 13, color: '#938B81', margin: 0 }}>どちらとして利用しますか？</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <button onClick={handleStudent} disabled={loading}
            style={{ border: '1.5px solid #EFE8DF', borderRadius: 14, padding: '24px', textAlign: 'left', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 20 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#F2620C'; e.currentTarget.style.background = '#FFF8F5'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#EFE8DF'; e.currentTarget.style.background = '#fff'; }}
          >
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#FFF1E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🎓</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>学生として利用</div>
              <div style={{ fontSize: 13, color: '#938B81' }}>インターン求人を探す・応募する</div>
            </div>
            <span style={{ marginLeft: 'auto', color: '#F2620C', fontSize: 18 }}>→</span>
          </button>
          <button onClick={() => setStep('company')} disabled={loading}
            style={{ border: '1.5px solid #EFE8DF', borderRadius: 14, padding: '24px', textAlign: 'left', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 20 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#F2620C'; e.currentTarget.style.background = '#FFF8F5'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#EFE8DF'; e.currentTarget.style.background = '#fff'; }}
          >
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#FFF1E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🏢</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>企業として利用</div>
              <div style={{ fontSize: 13, color: '#938B81' }}>インターン求人を掲載・採用する</div>
            </div>
            <span style={{ marginLeft: 'auto', color: '#F2620C', fontSize: 18 }}>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
