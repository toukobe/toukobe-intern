'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

const JOB_CATEGORIES = ['コンサルティング','経営・企画','金融・ファイナンス','マーケティング','エンジニア','デザイナー','営業','ライター・メディア','経理','人事・広報','事務・アシスタント','その他'];
const WORK_DAYS = ['週2から','週3から','週4から'];
const WORK_CONDITIONS = ['フルリモート','一部リモート','フレックス勤務','土日勤務可'];
const JOB_FEATURES = ['未経験OK','交通費支給','服装髪型自由'];

const F = {
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#57514A', marginBottom: 8 } as React.CSSProperties,
  input: { width: '100%', border: '1px solid #EFE8DF', borderRadius: 10, padding: '12px 16px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontSize: 14, color: '#1C1813', outline: 'none', boxSizing: 'border-box' as const, background: '#fff' },
  section: { background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, padding: '28px 32px', marginBottom: 20 } as React.CSSProperties,
  sectionTitle: { fontWeight: 900, fontSize: 16, color: '#1C1813', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid #EFE8DF', display: 'block' } as React.CSSProperties,
};

export default function PostJobPage() {
  const router = useRouter();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    job_title: '', salary: '', location: '', job_description: '', requirements: '',
    job_categories: [] as string[], work_days: [] as string[], work_conditions: [] as string[], job_features: [] as string[],
  });

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth/company-login'); return; }
      const { data: userType } = await supabase.from('user_types').select('company_id').eq('user_id', session.user.id).single();
      if (!userType?.company_id) { router.push('/auth/company-login'); return; }
      setCompanyId(userType.company_id);
      setLoading(false);
    }
    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      if (!companyId) return;
      const { error: jobError } = await supabase.from('jobs').insert([{
        company_id: companyId, ...formData, status: 'pending',
      }]);
      if (jobError) throw jobError;
      alert('求人を投稿しました！');
      router.push('/dashboard/company');
    } catch (err) {
      setError('求人投稿に失敗しました: ' + (err as any).message);
    } finally {
      setSaving(false);
    }
  };

  const toggle = (field: 'job_categories'|'work_days'|'work_conditions'|'job_features', val: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(val) ? prev[field].filter(v => v !== val) : [...prev[field], val],
    }));
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FBF8F4', fontFamily: "'Zen Kaku Gothic New',sans-serif" }}>
      <div style={{ color: '#57514A' }}>読み込み中...</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#FBF8F4', fontFamily: "'Zen Kaku Gothic New',sans-serif", color: '#1C1813' }}>
      <link href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;700;900&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* NAV */}
      <div style={{ background: '#fff', borderBottom: '1px solid #EFE8DF', padding: '14px 48px', display: 'flex', alignItems: 'center', gap: 16, position: 'sticky', top: 0, zIndex: 50 }}>
        <img src="/toukobe-intern-logo.png" alt="トウコべインターン" style={{ height: 34, width: 'auto', cursor: 'pointer' }} onClick={() => router.push('/')} />
        <div style={{ width: 1, height: 20, background: '#EFE8DF' }} />
        <span style={{ fontSize: 13, color: '#F2620C', fontWeight: 700, cursor: 'pointer' }} onClick={() => router.push('/dashboard/company')}>← ダッシュボードに戻る</span>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 48px 80px' }}>
        {/* HEADER */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#F2620C', letterSpacing: '.18em', marginBottom: 10 }}>POST JOB</div>
          <h1 style={{ fontWeight: 900, fontSize: 30, margin: 0 }}>求人を投稿</h1>
          <p style={{ fontSize: 13, color: '#938B81', marginTop: 8 }}>新しいインターン求人情報を入力してください</p>
        </div>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
            <p style={{ color: '#B91C1C', fontSize: 13, margin: 0 }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

          {/* 基本情報 */}
          <div style={F.section}>
            <span style={F.sectionTitle}>基本情報</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={F.label}>職種名 <span style={{ color: '#F2620C' }}>*</span></label>
                <input style={F.input} value={formData.job_title} onChange={e => setFormData({...formData, job_title: e.target.value})} placeholder="例: Webエンジニア、マーケティングアシスタント" required
                  onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'}
                  onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={F.label}>給与 <span style={{ color: '#F2620C' }}>*</span></label>
                  <input style={F.input} value={formData.salary} onChange={e => setFormData({...formData, salary: e.target.value})} placeholder="例: 時給1,500〜2,000円" required
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'}
                    onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} />
                </div>
                <div>
                  <label style={F.label}>勤務地 <span style={{ color: '#F2620C' }}>*</span></label>
                  <input style={F.input} value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="例: 東京・渋谷、フルリモート" required
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'}
                    onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} />
                </div>
              </div>
              <div>
                <label style={F.label}>業務内容 <span style={{ color: '#F2620C' }}>*</span></label>
                <textarea style={{ ...F.input, resize: 'vertical' }} value={formData.job_description} onChange={e => setFormData({...formData, job_description: e.target.value})} placeholder="具体的な業務内容を詳しく記載してください" rows={6} required
                  onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = '#F2620C'}
                  onBlur={e => (e.target as HTMLTextAreaElement).style.borderColor = '#EFE8DF'} />
              </div>
              <div>
                <label style={F.label}>応募要件 <span style={{ color: '#F2620C' }}>*</span></label>
                <textarea style={{ ...F.input, resize: 'vertical' }} value={formData.requirements} onChange={e => setFormData({...formData, requirements: e.target.value})} placeholder="求めるスキルや条件を記載してください" rows={5} required
                  onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = '#F2620C'}
                  onBlur={e => (e.target as HTMLTextAreaElement).style.borderColor = '#EFE8DF'} />
              </div>
            </div>
          </div>

          {/* 職種カテゴリ */}
          <div style={F.section}>
            <span style={F.sectionTitle}>職種カテゴリ</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {JOB_CATEGORIES.map(cat => {
                const selected = formData.job_categories.includes(cat);
                return (
                  <button key={cat} type="button" onClick={() => toggle('job_categories', cat)}
                    style={{ border: selected ? '2px solid #F2620C' : '1px solid #EFE8DF', background: selected ? '#FFF1E8' : '#fff', color: selected ? '#F2620C' : '#57514A', borderRadius: 8, padding: '10px 14px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: selected ? 700 : 400, fontSize: 13, cursor: 'pointer', textAlign: 'left' }}>
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 勤務条件 */}
          <div style={F.section}>
            <span style={F.sectionTitle}>勤務日数・条件</span>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: '#938B81', marginBottom: 10 }}>勤務日数</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {WORK_DAYS.map(d => {
                  const sel = formData.work_days.includes(d);
                  return (
                    <button key={d} type="button" onClick={() => toggle('work_days', d)}
                      style={{ border: sel ? '2px solid #F2620C' : '1px solid #EFE8DF', background: sel ? '#FFF1E8' : '#fff', color: sel ? '#F2620C' : '#57514A', borderRadius: 8, padding: '10px 20px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: sel ? 700 : 400, fontSize: 13, cursor: 'pointer' }}>
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: '#938B81', marginBottom: 10 }}>勤務形態</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {WORK_CONDITIONS.map(c => {
                  const sel = formData.work_conditions.includes(c);
                  return (
                    <button key={c} type="button" onClick={() => toggle('work_conditions', c)}
                      style={{ border: sel ? '2px solid #F2620C' : '1px solid #EFE8DF', background: sel ? '#FFF1E8' : '#fff', color: sel ? '#F2620C' : '#57514A', borderRadius: 8, padding: '10px 20px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: sel ? 700 : 400, fontSize: 13, cursor: 'pointer' }}>
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#938B81', marginBottom: 10 }}>求人の特徴</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {JOB_FEATURES.map(f => {
                  const sel = formData.job_features.includes(f);
                  return (
                    <button key={f} type="button" onClick={() => toggle('job_features', f)}
                      style={{ border: sel ? '2px solid #F2620C' : '1px solid #EFE8DF', background: sel ? '#FFF1E8' : '#fff', color: sel ? '#F2620C' : '#57514A', borderRadius: 8, padding: '10px 20px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: sel ? 700 : 400, fontSize: 13, cursor: 'pointer' }}>
                      {f}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* BUTTONS */}
          <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
            <button type="submit" disabled={saving}
              style={{ flex: 1, background: saving ? '#D9B99B' : '#F2620C', color: '#fff', border: 'none', borderRadius: 12, padding: '16px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 900, fontSize: 15, cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? '投稿中...' : '求人を投稿する'}
            </button>
            <button type="button" onClick={() => router.push('/dashboard/company')}
              style={{ flex: 1, background: '#fff', color: '#57514A', border: '1px solid #EFE8DF', borderRadius: 12, padding: '16px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
