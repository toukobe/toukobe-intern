'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { useIsMobile } from '@/utils/useIsMobile';
import SkillsPicker from '@/components/SkillsPicker';
import { UNIVERSITIES, GRADES, BIRTH_YEARS, GRAD_YEARS, LANGUAGE_GROUPS, CERT_PLACEHOLDER } from '@/utils/profileOptions';

const FF = "var(--font-sans)";
const F = {
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#57514A', marginBottom: 8 } as React.CSSProperties,
  input: { width: '100%', border: '1px solid #EFE8DF', borderRadius: 10, padding: '12px 16px', fontFamily: FF, fontSize: 14, color: '#1C1813', outline: 'none', boxSizing: 'border-box' as const, background: '#fff' },
};
const sel = { ...F.input, appearance: 'none' as const };

export default function SignupProfilePage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  useEffect(() => { document.title = 'プロフィール設定 | トウコべインターン'; return () => { document.title = 'トウコべインターン'; }; }, []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isNewProfile, setIsNewProfile] = useState(false);
  const [formData, setFormData] = useState({
    last_name: '', first_name: '',
    birthY: '', birthM: '', birthD: '',
    university: '', department: '', grade: '', graduation_year: '',
    is_tutor: false,
    university_email: '', contact_email: '',
    certifications: '', experience: '',
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth/login'); return; }
      setUserId(session.user.id);

      const { data } = await supabase
        .from('student_profiles').select('*').eq('user_id', session.user.id).maybeSingle();
      if (!data) setIsNewProfile(true);
      const [by, bm, bd] = (data?.birth_date || '').split('-');
      setFormData(prev => ({
        ...prev,
        contact_email: session.user.email || '',
        university_email: session.user.email || '',
        ...(data ? {
          last_name: data.last_name || '',
          first_name: data.first_name || '',
          birthY: by || '', birthM: bm ? String(Number(bm)) : '', birthD: bd ? String(Number(bd)) : '',
          university: data.university || '',
          department: data.department || '',
          grade: data.grade || '',
          graduation_year: data.graduation_year || '',
          is_tutor: !!data.is_tutor,
          university_email: data.university_email || session.user.email || '',
          contact_email: data.contact_email || session.user.email || '',
          certifications: data.certifications || '',
          experience: data.experience || '',
        } : {}),
      }));
      if (data?.skills?.length) setSkills(data.skills);
      if (data?.languages?.length) setLanguages(data.languages);
      setLoading(false);
    }
    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    if (!formData.birthY || !formData.birthM || !formData.birthD) { setError('生年月日を選択してください'); return; }
    setSaving(true); setError(null);
    try {
      // user_types はRLSがINSERTのみ許可（UPDATE不可）のため upsert は使えない。
      // また重複行を作らないよう、既存行が無いときだけINSERTする
      const { data: existingTypes } = await supabase.from('user_types')
        .select('id').eq('user_id', userId).limit(1);
      if (!existingTypes || existingTypes.length === 0) {
        const { error: typeError } = await supabase.from('user_types')
          .insert([{ user_id: userId, user_type: 'student', company_id: null }]);
        if (typeError && typeError.code !== '23505') throw typeError;
      }

      const fullName = `${formData.last_name} ${formData.first_name}`.trim();
      const birth_date = `${formData.birthY}-${String(formData.birthM).padStart(2, '0')}-${String(formData.birthD).padStart(2, '0')}`;

      const payload: Record<string, unknown> = {
        user_id: userId,
        last_name: formData.last_name,
        first_name: formData.first_name,
        name: fullName,
        birth_date,
        university: formData.university,
        department: formData.department || null,
        grade: formData.grade,
        graduation_year: formData.graduation_year || null,
        is_tutor: formData.is_tutor,
        university_email: formData.university_email,
        contact_email: formData.contact_email,
        skills,
        languages,
        certifications: formData.certifications || null,
        experience: formData.experience,
      };

      let { error: profileError } = await supabase.from('student_profiles').upsert(payload, { onConflict: 'user_id' });
      // 新カラム未追加の環境（マイグレーション未実行）では既存カラムのみで保存する
      if (profileError && /column/i.test(profileError.message)) {
        const { graduation_year, is_tutor, university_email, languages: _l, certifications, ...base } = payload;
        ({ error: profileError } = await supabase.from('student_profiles').upsert(base, { onConflict: 'user_id' }));
      }
      if (profileError) throw profileError;

      // ウェルカムメール送信（初回登録時のみ、fire and forget）
      const { data: { session } } = await supabase.auth.getSession();
      if (isNewProfile && session?.user?.email) {
        fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ type: 'student_welcome', to: session.user.email, studentName: fullName }),
        }).catch(console.error);
      }

      const redirect = new URLSearchParams(window.location.search).get('redirect');
      router.push(redirect || '/dashboard/student');
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
              <input style={F.input} value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} placeholder="山田" required />
            </div>
            <div>
              <label style={F.label}>名 <span style={{ color: '#F2620C' }}>*</span></label>
              <input style={F.input} value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} placeholder="太郎" required />
            </div>
          </div>

          {/* 生年月日（ドロップダウン） */}
          <div>
            <label style={F.label}>生年月日 <span style={{ color: '#F2620C' }}>*</span></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', gap: 8 }}>
              <select style={sel} value={formData.birthY} onChange={e => setFormData({ ...formData, birthY: e.target.value })} required>
                <option value="">年</option>
                {BIRTH_YEARS.map(y => <option key={y} value={y}>{y}年</option>)}
              </select>
              <select style={sel} value={formData.birthM} onChange={e => setFormData({ ...formData, birthM: e.target.value })} required>
                <option value="">月</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}月</option>)}
              </select>
              <select style={sel} value={formData.birthD} onChange={e => setFormData({ ...formData, birthD: e.target.value })} required>
                <option value="">日</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}日</option>)}
              </select>
            </div>
          </div>

          {/* 大学・学部 */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            <div>
              <label style={F.label}>大学 <span style={{ color: '#F2620C' }}>*</span></label>
              <select style={sel} value={formData.university} onChange={e => setFormData({ ...formData, university: e.target.value })} required>
                <option value="">選択してください</option>
                {UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
                {formData.university && !UNIVERSITIES.includes(formData.university) && <option value={formData.university}>{formData.university}</option>}
              </select>
            </div>
            <div>
              <label style={F.label}>学部・学科 <span style={{ color: '#F2620C' }}>*</span></label>
              <input style={F.input} value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} placeholder="経済学部 経済学科" required />
            </div>
          </div>

          {/* 学年・卒業予定年 */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            <div>
              <label style={F.label}>学年 <span style={{ color: '#F2620C' }}>*</span></label>
              <select style={sel} value={formData.grade} onChange={e => setFormData({ ...formData, grade: e.target.value })} required>
                <option value="">選択してください</option>
                {GRADES.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label style={F.label}>卒業予定年（就職予定年） <span style={{ color: '#F2620C' }}>*</span></label>
              <select style={sel} value={formData.graduation_year} onChange={e => setFormData({ ...formData, graduation_year: e.target.value })} required>
                <option value="">選択してください</option>
                {GRAD_YEARS.map(y => <option key={y} value={y}>{y}年</option>)}
              </select>
            </div>
          </div>

          {/* 講師登録チェック */}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#FBF8F4', border: '1px solid #EFE8DF', borderRadius: 10, padding: '14px 16px', cursor: 'pointer' }}>
            <input type="checkbox" checked={formData.is_tutor} onChange={e => setFormData({ ...formData, is_tutor: e.target.checked })} style={{ width: 18, height: 18, marginTop: 1, accentColor: '#F2620C', flexShrink: 0 }} />
            <span style={{ fontSize: 13.5, color: '#3A352F', lineHeight: 1.6 }}>トウコべ・キョウコべの講師登録をしています</span>
          </label>

          {/* 大学メール（在学確認用） */}
          <div>
            <label style={F.label}>大学メールアドレス <span style={{ color: '#F2620C' }}>*</span></label>
            <input type="email" style={F.input} value={formData.university_email} onChange={e => setFormData({ ...formData, university_email: e.target.value })} placeholder="example@univ.ac.jp" required />
            <p style={{ fontSize: 12, color: '#938B81', margin: '6px 0 0' }}>在学確認用に使用します。大学発行のメールアドレスをご入力ください。</p>
          </div>

          {/* 連絡用メール */}
          <div>
            <label style={F.label}>連絡用メールアドレス <span style={{ color: '#F2620C' }}>*</span></label>
            <input type="email" style={F.input} value={formData.contact_email} onChange={e => setFormData({ ...formData, contact_email: e.target.value })} placeholder="example@example.com" required />
            <p style={{ fontSize: 12, color: '#938B81', margin: '6px 0 0' }}>企業からの選考連絡・面接案内がこのアドレスに届きます。上の大学メールと同じでも構いません。</p>
          </div>

          {/* 語学 */}
          <div>
            <label style={F.label}>語学（当てはまるものをタップ）</label>
            <SkillsPicker value={languages} onChange={setLanguages} groups={LANGUAGE_GROUPS} addPlaceholder="その他の言語を入力して追加" />
          </div>

          {/* その他スキル */}
          <div>
            <label style={F.label}>その他スキル（当てはまるものをタップ）</label>
            <SkillsPicker value={skills} onChange={setSkills} />
          </div>

          {/* 資格・検定 */}
          <div>
            <label style={F.label}>資格・検定（級・スコアも記入できます）</label>
            <textarea style={{ ...F.input, resize: 'vertical' }} value={formData.certifications} onChange={e => setFormData({ ...formData, certifications: e.target.value })} placeholder={CERT_PLACEHOLDER} rows={4} />
            <p style={{ fontSize: 12, color: '#938B81', margin: '6px 0 0' }}>1行に1つずつ記入してください（例：TOEIC 850点、簿記2級 など）。</p>
          </div>

          {/* 経歴 */}
          <div>
            <label style={F.label}>経歴・自己紹介</label>
            <textarea style={{ ...F.input, resize: 'vertical' }} value={formData.experience} onChange={e => setFormData({ ...formData, experience: e.target.value })} placeholder="あなたの経歴や自己紹介を入力してください" rows={4} />
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
