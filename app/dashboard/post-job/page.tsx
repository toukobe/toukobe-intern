'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { TOKYO_AREAS, PREFECTURES } from '@/utils/constants';
import ImagePositionPicker from '@/components/ImagePositionPicker';
import StepsEditor from '@/components/StepsEditor';
import SkillsPicker from '@/components/SkillsPicker';
import { fetchFeatureTagOptions } from '@/utils/featureTags';
import { useIsMobile } from '@/utils/useIsMobile';

const JOB_CATEGORIES = ['コンサルティング','経営・企画','金融・ファイナンス','マーケティング','エンジニア','デザイナー','営業','ライター・メディア','経理','人事・広報','事務・アシスタント','その他'];
const WORK_DAYS = ['週2から','週3から','週4から'];
const WORK_CONDITIONS = ['フルリモート','一部リモート','フレックス勤務','土日勤務可'];
const JOB_FEATURES = ['未経験OK','交通費支給','服装髪型自由'];

const F = {
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#57514A', marginBottom: 8 } as React.CSSProperties,
  input: { width: '100%', border: '1px solid #EFE8DF', borderRadius: 10, padding: '12px 16px', fontFamily: "var(--font-sans)", fontSize: 14, color: '#1C1813', outline: 'none', boxSizing: 'border-box' as const, background: '#fff' },
  section: { background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, padding: '28px 32px', marginBottom: 20 } as React.CSSProperties,
  sectionTitle: { fontWeight: 900, fontSize: 16, color: '#1C1813', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid #EFE8DF', display: 'block' } as React.CSSProperties,
};

export default function PostJobPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCompanyName, setAdminCompanyName] = useState<string | null>(null);
  const backHref = isAdmin ? '/dashboard/admin' : '/dashboard/company';
  const [loading, setLoading] = useState(true);
  useEffect(() => { document.title = '求人を掲載する | トウコべインターン'; return () => { document.title = 'トウコべインターン'; }; }, []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverPosition, setCoverPosition] = useState('50% 50%');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
  const [formData, setFormData] = useState({
    job_title: '', salary: '', location: '', job_description: '', requirements: '',
    job_categories: [] as string[], work_days: [] as string[], work_conditions: [] as string[], job_features: [] as string[],
  });
  // 募集要項の詳細（任意項目・2026-07-14追加）
  const [extra, setExtra] = useState({
    employment_type: '', address: '', intern_count: '', shift_info: '', benefits: '',
    required_conditions: '', welcome_conditions: '', ideal_candidate: '', selection_process: '', training: '', alumni_placements: '',
  });
  // 特徴タグ（ハッシュタグ）
  const [featureTags, setFeatureTags] = useState<string[]>([]);
  const [tagOptions, setTagOptions] = useState<string[]>([]);
  useEffect(() => { fetchFeatureTagOptions().then(setTagOptions); }, []);

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth/company-login'); return; }
      // 管理者が ?company=<id> を指定した場合は、その企業の求人として作成する
      const adminCompany = new URLSearchParams(window.location.search).get('company');
      if (session.user.email === 'ru_matsumoto@manabiph.com' && adminCompany) {
        setIsAdmin(true);
        setCompanyId(adminCompany);
        const { data: c } = await supabase.from('companies').select('company_name').eq('id', adminCompany).maybeSingle();
        setAdminCompanyName(c?.company_name || null);
        setLoading(false);
        return;
      }
      const { data: userType } = await supabase.from('user_types').select('company_id').eq('user_id', session.user.id).single();
      if (!userType?.company_id) { router.push('/auth/company-login'); return; }
      setCompanyId(userType.company_id);
      setLoading(false);
    }
    checkAuth();
  }, [router]);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('5MB以下の画像を選択してください', 'error'); return; }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      if (!companyId) return;
      let cover_image_url: string | null = null;
      if (coverFile) {
        const ext = coverFile.name.split('.').pop();
        const path = `${companyId}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('job-covers').upload(path, coverFile, { upsert: true });
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from('job-covers').getPublicUrl(path);
        cover_image_url = urlData.publicUrl;
      }
      // 空欄の任意項目は送らない
      const extras = Object.fromEntries(Object.entries(extra).filter(([, v]) => v.trim()));
      let { error: jobError } = await supabase.from('jobs').insert([{
        company_id: companyId, ...formData, ...extras, feature_tags: featureTags, status: 'pending', cover_image_url, cover_image_position: coverPosition,
      }]);
      // 詳細カラム未追加の環境（マイグレーション未実行）では基本項目のみで投稿する
      if (jobError && /column/i.test(jobError.message)) {
        ({ error: jobError } = await supabase.from('jobs').insert([{
          company_id: companyId, ...formData, status: 'pending', cover_image_url, cover_image_position: coverPosition,
        }]));
      }
      if (jobError) throw jobError;
      showToast('求人を投稿しました！');
      // リダイレクトまで saving を維持して二重送信を防ぐ
      setTimeout(() => router.push(backHref), 1200);
    } catch (err) {
      setError('求人投稿に失敗しました: ' + (err as any).message);
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FBF8F4', fontFamily: "var(--font-sans)" }}>
      <div style={{ width: 36, height: 36, border: '2.5px solid #F2620C', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#FBF8F4', fontFamily: "var(--font-sans)", color: '#1C1813' }}>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: toast.type === 'error' ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${toast.type === 'error' ? '#FECACA' : '#BBF7D0'}`, color: toast.type === 'error' ? '#B91C1C' : '#15803D', borderRadius: 12, padding: '14px 24px', fontWeight: 700, fontSize: 14, boxShadow: '0 8px 32px rgba(0,0,0,.12)', whiteSpace: 'nowrap' }}>
          {toast.type === 'success' ? '✓ ' : '✕ '}{toast.msg}
        </div>
      )}

      {/* NAV */}
      <div style={{ background: '#fff', borderBottom: '1px solid #EFE8DF', padding: isMobile ? '14px 16px' : '14px 48px', display: 'flex', alignItems: 'center', gap: 16, position: 'sticky', top: 0, zIndex: 50 }}>
        <img src="/toukobe-intern-logo.png" alt="トウコべインターン" style={{ height: 34, width: 'auto', cursor: 'pointer' }} onClick={() => router.push('/')} />
        <div style={{ width: 1, height: 20, background: '#EFE8DF' }} />
        <span style={{ fontSize: 13, color: '#F2620C', fontWeight: 700, cursor: 'pointer' }} onClick={() => router.push(backHref)}>← ダッシュボードに戻る</span>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: isMobile ? '24px 16px 60px' : '48px 48px 80px' }}>
        {/* HEADER */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: '#F2620C', letterSpacing: '.18em', marginBottom: 10 }}>POST JOB</div>
          <h1 style={{ fontWeight: 900, fontSize: 30, margin: 0 }}>求人を投稿</h1>
          <p style={{ fontSize: 13, color: '#938B81', marginTop: 8 }}>新しいインターン求人情報を入力してください</p>
        </div>

        {isAdmin && (
          <div style={{ background: '#1C1813', color: '#fff', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: '.2em', background: 'rgba(251,169,76,.2)', color: '#FBA94C', padding: '3px 8px', borderRadius: 999 }}>ADMIN</span>
            <span style={{ fontSize: 13 }}>管理者として <b>{adminCompanyName || 'この企業'}</b> の求人を作成しています</span>
          </div>
        )}

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
            <p style={{ color: '#B91C1C', fontSize: 13, margin: 0 }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

          {/* カバー画像 */}
          <div style={F.section}>
            <span style={F.sectionTitle}>カバー画像</span>
            {coverPreview ? (
              <div style={{ position: 'relative' }}>
                <ImagePositionPicker src={coverPreview} position={coverPosition} onChange={setCoverPosition} height={200} />
                <button
                  type="button"
                  onClick={() => { setCoverFile(null); setCoverPreview(null); setCoverPosition('50% 50%'); }}
                  style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,.5)', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', zIndex: 10 }}
                >
                  削除
                </button>
              </div>
            ) : (
              <div
                style={{ width: '100%', height: 200, borderRadius: 12, background: '#F3EDE5', border: '2px dashed #EFE8DF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                onClick={() => document.getElementById('cover-input')?.click()}
              >
                <div style={{ textAlign: 'center', color: '#938B81' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🖼️</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>クリックして画像を選択</div>
                  <div style={{ fontSize: 11, marginTop: 4 }}>JPG / PNG / WebP・5MB以内・推奨 1200×630px</div>
                </div>
              </div>
            )}
            {!coverPreview && (
              <input id="cover-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleCoverChange} style={{ display: 'none' }} />
            )}
            {coverPreview && (
              <div style={{ marginTop: 8, display: 'flex', gap: 10, alignItems: 'center' }}>
                <button type="button" onClick={() => document.getElementById('cover-input')?.click()} style={{ background: '#F3EDE5', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, color: '#57514A', cursor: 'pointer', fontFamily: 'inherit' }}>画像を変更</button>
                <input id="cover-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleCoverChange} style={{ display: 'none' }} />
              </div>
            )}
          </div>

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
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={F.label}>給与 <span style={{ color: '#F2620C' }}>*</span></label>
                  <input style={F.input} value={formData.salary} onChange={e => setFormData({...formData, salary: e.target.value})} placeholder="例: 時給1,500〜2,000円" required
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'}
                    onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} />
                </div>
                <div style={{ position: 'relative' }}>
                  <label style={F.label}>勤務地 <span style={{ color: '#F2620C' }}>*</span></label>
                  <input
                    style={F.input}
                    value={formData.location}
                    onChange={e => {
                      const v = e.target.value;
                      setFormData({...formData, location: v});
                      setLocationSuggestions(v ? PREFECTURES.filter(p => p.includes(v)) : []);
                    }}
                    onFocus={e => { (e.target as HTMLInputElement).style.borderColor = '#F2620C'; setLocationSuggestions(formData.location ? PREFECTURES.filter(p => p.includes(formData.location)) : []); }}
                    onBlur={e => { (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'; setTimeout(() => setLocationSuggestions([]), 150); }}
                    placeholder="例: 東京都、大阪府" required
                  />
                  {locationSuggestions.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #EFE8DF', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,.1)', zIndex: 50, maxHeight: 220, overflowY: 'auto', marginTop: 4 }}>
                      {locationSuggestions.map(p => (
                        <div
                          key={p}
                          onMouseDown={() => { setFormData({...formData, location: p}); setLocationSuggestions([]); }}
                          style={{ padding: '10px 16px', fontSize: 14, cursor: 'pointer', borderBottom: '1px solid #F5F0EB' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#FFF6EE')}
                          onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                        >{p}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {/* 東京エリア選択 */}
              {formData.location.includes('東京') && (
                <div style={{ background: '#FFF6EE', border: '1px solid #FBD5C0', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontSize: 12, color: '#F2620C', fontWeight: 700, marginBottom: 10 }}>🗼 東京 詳細エリア（クリックで入力欄に追加）</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {TOKYO_AREAS.map(a => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => {
                          const base = formData.location.replace(/（.*?）/, '').replace(/[\s　]*[^\s　東京都]*[区市].*$/, '').trim();
                          setFormData({ ...formData, location: `東京都${a}` });
                        }}
                        style={{ fontSize: 11, padding: '4px 10px', borderRadius: 999, border: '1px solid #FBD5C0', background: formData.location.includes(a) ? '#F2620C' : '#fff', color: formData.location.includes(a) ? '#fff' : '#57514A', fontFamily: "var(--font-sans)", cursor: 'pointer', transition: '.15s' }}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
              )}
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

          {/* 募集要項の詳細（任意） */}
          <div style={F.section}>
            <span style={F.sectionTitle}>募集要項の詳細（任意）</span>
            <p style={{ fontSize: 12.5, color: '#938B81', margin: '0 0 16px', lineHeight: 1.8 }}>入力した項目だけが求人ページに表示されます。充実させるほど応募につながりやすくなります。</p>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={F.label}>雇用形態</label>
                <input style={F.input} value={extra.employment_type} onChange={e => setExtra({ ...extra, employment_type: e.target.value })} placeholder="例: インターン契約" onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} />
              </div>
              <div>
                <label style={F.label}>インターン生の在籍数</label>
                <input style={F.input} value={extra.intern_count} onChange={e => setExtra({ ...extra, intern_count: e.target.value })} placeholder="例: 30人在籍（※2026年1月時点）" onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={F.label}>勤務地の詳細住所</label>
              <input style={F.input} value={extra.address} onChange={e => setExtra({ ...extra, address: e.target.value })} placeholder="例: 東京都 千代田区 内幸町2-1-6" onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {([
                ['shift_info', 'シフト', '例: 週15時間以上稼働できる方を募集しています。\n学業の状況に合わせて柔軟にシフト変動できます。', 3],
                ['benefits', '福利厚生', '例:\n・交通費支給\n・昇給制度あり', 3],
                ['required_conditions', '必須条件', '例:\n・基礎的なPCスキルやコミュニケーションスキル\n・週15時間以上稼働できる方', 3],
                ['welcome_conditions', '歓迎条件', '例:\n・半年以上の勤務ができる方\n・団体のリーダー経験がある方', 3],
                ['ideal_candidate', '求める人物像', '例:\n・主体的に業務に取り組み、裁量を持って働きたい方\n・結果に妥協しない環境で成長したい方', 4],
              ] as const).map(([key, label, ph, rows]) => (
                <div key={key}>
                  <label style={F.label}>{label}</label>
                  <textarea style={{ ...F.input, resize: 'vertical' }} value={extra[key]} onChange={e => setExtra({ ...extra, [key]: e.target.value })} placeholder={ph} rows={rows}
                    onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = '#F2620C'}
                    onBlur={e => (e.target as HTMLTextAreaElement).style.borderColor = '#EFE8DF'} />
                </div>
              ))}
              {/* 選考プロセス（工程数可変・プリセット＋自由入力） */}
              <div>
                <label style={F.label}>選考プロセス</label>
                <StepsEditor value={extra.selection_process} onChange={v => setExtra({ ...extra, selection_process: v })} />
              </div>
              {([
                ['training', '研修・教育制度', '例: 入社後は先輩メンバーから手厚いサポートが受けられます。', 3],
                ['alumni_placements', 'インターン卒業生の内定実績', '例: 過去に弊社でインターンをしていた学生は、以下のような企業に内定しています。\n・外資系コンサルティングファーム\n・大手商社', 3],
              ] as const).map(([key, label, ph, rows]) => (
                <div key={key}>
                  <label style={F.label}>{label}</label>
                  <textarea style={{ ...F.input, resize: 'vertical' }} value={extra[key]} onChange={e => setExtra({ ...extra, [key]: e.target.value })} placeholder={ph} rows={rows}
                    onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = '#F2620C'}
                    onBlur={e => (e.target as HTMLTextAreaElement).style.borderColor = '#EFE8DF'} />
                </div>
              ))}
            </div>
          </div>

          {/* 職種カテゴリ */}
          <div style={F.section}>
            <span style={F.sectionTitle}>職種カテゴリ</span>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 10 }}>
              {JOB_CATEGORIES.map(cat => {
                const selected = formData.job_categories.includes(cat);
                return (
                  <button key={cat} type="button" onClick={() => toggle('job_categories', cat)}
                    style={{ border: selected ? '2px solid #F2620C' : '1px solid #EFE8DF', background: selected ? '#FFF1E8' : '#fff', color: selected ? '#F2620C' : '#57514A', borderRadius: 8, padding: '10px 14px', fontFamily: "var(--font-sans)", fontWeight: selected ? 700 : 400, fontSize: 13, cursor: 'pointer', textAlign: 'left' }}>
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
                      style={{ border: sel ? '2px solid #F2620C' : '1px solid #EFE8DF', background: sel ? '#FFF1E8' : '#fff', color: sel ? '#F2620C' : '#57514A', borderRadius: 8, padding: '10px 20px', fontFamily: "var(--font-sans)", fontWeight: sel ? 700 : 400, fontSize: 13, cursor: 'pointer' }}>
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
                      style={{ border: sel ? '2px solid #F2620C' : '1px solid #EFE8DF', background: sel ? '#FFF1E8' : '#fff', color: sel ? '#F2620C' : '#57514A', borderRadius: 8, padding: '10px 20px', fontFamily: "var(--font-sans)", fontWeight: sel ? 700 : 400, fontSize: 13, cursor: 'pointer' }}>
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
                      style={{ border: sel ? '2px solid #F2620C' : '1px solid #EFE8DF', background: sel ? '#FFF1E8' : '#fff', color: sel ? '#F2620C' : '#57514A', borderRadius: 8, padding: '10px 20px', fontFamily: "var(--font-sans)", fontWeight: sel ? 700 : 400, fontSize: 13, cursor: 'pointer' }}>
                      {f}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 特徴タグ（ハッシュタグ・検索に使われる） */}
          <div style={F.section}>
            <span style={F.sectionTitle}>特徴タグ</span>
            <p style={{ fontSize: 12.5, color: '#938B81', margin: '0 0 16px', lineHeight: 1.8 }}>当てはまるタグを選んでください（自由に追加も可能）。学生はこのタグで求人を検索できます。</p>
            <SkillsPicker value={featureTags} onChange={setFeatureTags} groups={[{ label: '求人の特徴タグ', skills: tagOptions }]} addPlaceholder="タグを追加（例: 事業立案）" />
          </div>

          {/* BUTTONS */}
          <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
            <button type="submit" disabled={saving}
              style={{ flex: 1, background: saving ? '#D9B99B' : '#F2620C', color: '#fff', border: 'none', borderRadius: 12, padding: '16px', fontFamily: "var(--font-sans)", fontWeight: 900, fontSize: 15, cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? '投稿中...' : '求人を投稿する'}
            </button>
            <button type="button" onClick={() => router.push(backHref)}
              style={{ flex: 1, background: '#fff', color: '#57514A', border: '1px solid #EFE8DF', borderRadius: 12, padding: '16px', fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
