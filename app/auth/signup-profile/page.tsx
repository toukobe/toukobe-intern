'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { useIsMobile } from '@/utils/useIsMobile';

const FF = "'Zen Kaku Gothic New', sans-serif";
const F = {
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#57514A', marginBottom: 8 } as React.CSSProperties,
  input: { width: '100%', border: '1px solid #EFE8DF', borderRadius: 10, padding: '12px 16px', fontFamily: FF, fontSize: 14, color: '#1C1813', outline: 'none', boxSizing: 'border-box' as const, background: '#fff' },
};

export default function SignupProfilePage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  useEffect(() => { document.title = 'プロフィール設定 | トウコべインターン'; return () => { document.title = 'トウコべインターン'; }; }, []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    last_name: '', first_name: '', birth_date: '',
    university: '', department: '', grade: '', skills: '', experience: '',
    contact_email: '',
  });

  const GRADES = ['学部1年生','学部2年生','学部3年生','学部4年生','修士1年生','修士2年生','博士1年生','博士2年生','博士3年生','卒業済み','その他'];

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth/login'); return; }
      setUserId(session.user.id);

      const { data } = await supabase
        .from('student_profiles').select('*').eq('user_id', session.user.id).maybeSingle();
      setFormData(prev => ({
        ...prev,
        contact_email: session.user.email || '',
        ...(data ? {
          last_name: data.last_name || '',
          first_name: data.first_name || '',
          birth_date: data.birth_date || '',
          university: data.university || '',
          department: data.department || '',
          grade: data.grade || '',
          skills: (data.skills || []).join(', '),
          experience: data.experience || '',
          contact_email: data.contact_email || session.user.email || '',
        } : {}),
      }));
      setLoading(false);
    }
    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSaving(true); setError(null);
    try {
      const { error: typeError } = await supabase.from('user_types')
        .upsert({ user_id: userId, user_type: 'student' }, { onConflict: 'user_id' });
      if (typeError) throw typeError;

      const skills = formData.skills.split(',').map(s => s.trim()).filter(Boolean);
      const fullName = `${formData.last_name} ${formData.first_name}`.trim();

      const { error: profileError } = await supabase.from('student_profiles')
        .upsert({
          user_id: userId,
          last_name: formData.last_name,
          first_name: formData.first_name,
          name: fullName,
          birth_date: formData.birth_date || null,
          university: formData.university,
          department: formData.department || null,
          grade: formData.grade,
          skills,
          experience: formData.experience,
          contact_email: formData.contact_email,
        }, { onConflict: 'user_id' });
      if (profileError) throw profileError;

      // ウェルカムメール送信（初回登録時のみ、fire and forget）
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'student_welcome',
            to: session.user.email,
            studentName: fullName,
          }),
        }).catch(console.error);
      }

      router.push('/');
    } catch (err) {
      setError('プロフィール保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FBF8F4', fontFamily: FF }}>
      <div style={{ width: 36, height: 36, border: '2.5px solid #F2620C', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#FFF6EE 0%,#FFEFE2 55%,#FFE7D4 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '20px 12px' : '32px 24px', fontFamily: FF }}>
      <link href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;700;900&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 24px 60px rgba(28,24,19,.12)', padding: isMobile ? '32px 24px' : '48px 44px', width: '100%', maxWidth: 520 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/toukobe-intern-logo.png" alt="トウコべインターン" style={{ height: 40, width: 'auto', cursor: 'pointer' }} onClick={() => router.push('/')} />
          <h1 style={{ fontWeight: 900, fontSize: 24, margin: '20px 0 6px' }}>プロフィール設定</h1>
          <p style={{ fontSize: 13, color: '#938B81', margin: 0 }}>あなたの情報を入力してください。後から編集できます。</p>
        </div>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
            <p style={{ color: '#B91C1C', fontSize: 13, margin: 0 }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* 姓名 */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            <div>
              <label style={F.label}>姓 <span style={{ color: '#F2620C' }}>*</span></label>
              <input style={F.input} value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} placeholder="山田" required
                onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'}
                onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} />
            </div>
            <div>
              <label style={F.label}>名 <span style={{ color: '#F2620C' }}>*</span></label>
              <input style={F.input} value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} placeholder="太郎" required
                onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'}
                onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} />
            </div>
          </div>

          {/* 生年月日 */}
          <div>
            <label style={F.label}>生年月日 <span style={{ color: '#F2620C' }}>*</span></label>
            <input type="date" style={F.input} value={formData.birth_date} onChange={e => setFormData({ ...formData, birth_date: e.target.value })} required
              onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'}
              onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} />
          </div>

          {/* 大学・学部 */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            <div>
              <label style={F.label}>大学 <span style={{ color: '#F2620C' }}>*</span></label>
              <input style={F.input} value={formData.university} onChange={e => setFormData({ ...formData, university: e.target.value })} placeholder="○○大学" required
                onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'}
                onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} />
            </div>
            <div>
              <label style={F.label}>学部・学科 <span style={{ color: '#F2620C' }}>*</span></label>
              <input style={F.input} value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} placeholder="経済学部 経済学科" required
                onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'}
                onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} />
            </div>
          </div>

          {/* 学年 */}
          <div>
            <label style={F.label}>学年 <span style={{ color: '#F2620C' }}>*</span></label>
            <select style={{ ...F.input, appearance: 'none' as const }} value={formData.grade} onChange={e => setFormData({ ...formData, grade: e.target.value })} required>
              <option value="">選択してください</option>
              {GRADES.map(g => <option key={g}>{g}</option>)}
            </select>
          </div>

          {/* 連絡用メール */}
          <div>
            <label style={F.label}>連絡用メールアドレス <span style={{ color: '#F2620C' }}>*</span></label>
            <input type="email" style={F.input} value={formData.contact_email} onChange={e => setFormData({ ...formData, contact_email: e.target.value })} placeholder="example@university.ac.jp" required
              onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'}
              onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} />
            <p style={{ fontSize: 12, color: '#938B81', margin: '6px 0 0' }}>企業からの選考連絡・面接案内がこのアドレスに届きます</p>
          </div>

          {/* スキル */}
          <div>
            <label style={F.label}>スキル（カンマ区切り）</label>
            <input style={F.input} value={formData.skills} onChange={e => setFormData({ ...formData, skills: e.target.value })} placeholder="Python, Excel, 英語"
              onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'}
              onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} />
          </div>

          {/* 経歴 */}
          <div>
            <label style={F.label}>経歴・自己紹介</label>
            <textarea style={{ ...F.input, resize: 'vertical' }} value={formData.experience} onChange={e => setFormData({ ...formData, experience: e.target.value })} placeholder="あなたの経歴や自己紹介を入力してください" rows={4}
              onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = '#F2620C'}
              onBlur={e => (e.target as HTMLTextAreaElement).style.borderColor = '#EFE8DF'} />
          </div>

          <button type="submit" disabled={saving}
            style={{ background: saving ? '#D9B99B' : '#F2620C', color: '#fff', border: 'none', borderRadius: 12, padding: '15px', fontFamily: FF, fontWeight: 900, fontSize: 15, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(242,98,12,.28)', marginTop: 4 }}>
            {saving ? '保存中...' : 'プロフィールを保存'}
          </button>
        </form>

        <p style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: '#B6ADA2' }}>後からいつでも編集できます</p>
      </div>
    </div>
  );
}
