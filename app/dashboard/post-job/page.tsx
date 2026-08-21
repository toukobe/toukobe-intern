'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import ImagePositionPicker from '@/components/ImagePositionPicker';
import { COVER_ASPECT } from '@/utils/coverImage';
import { fetchFeatureTagOptions } from '@/utils/featureTags';
import { useIsMobile } from '@/utils/useIsMobile';
import JobFormFields, { EMPTY_JOB_FORM, validateJobForm, buildCustomFieldsFromJob, type JobFormValue } from '@/components/JobFormFields';
import { cleanCustomFields } from '@/components/CustomFieldsEditor';
import { splitJobPayload } from '@/utils/jobPayload';

const F = {
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
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverPosition, setCoverPosition] = useState('50% 50%');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
  const [form, setForm] = useState<JobFormValue>(EMPTY_JOB_FORM);
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

  // 「この求人をコピー」から来た場合は、元求人の内容を読み込んで初期値にする
  useEffect(() => {
    const copyId = new URLSearchParams(window.location.search).get('copy');
    if (!copyId) return;
    (async () => {
      const { data: job } = await supabase.from('jobs').select('*').eq('id', copyId).single();
      if (!job) return;
      const j = job as Record<string, unknown>;
      const str = (k: string) => (typeof j[k] === 'string' ? (j[k] as string) : '');
      const arr = (k: string) => (Array.isArray(j[k]) ? (j[k] as string[]) : []);
      setForm({
        ...EMPTY_JOB_FORM,
        job_title: `${str('job_title')}のコピー`,
        salary: str('salary'),
        location: str('location'),
        job_description: str('job_description'),
        job_categories: arr('job_categories'),
        work_days: arr('work_days'),
        work_conditions: arr('work_conditions'),
        job_features: arr('job_features'),
        // 応募要件しか無い（マイグレーション前の）求人は、必須条件として引き継ぐ
        required_conditions: str('required_conditions') || str('requirements'),
        welcome_conditions: str('welcome_conditions'),
        shift_info: str('shift_info'),
        employment_type: str('employment_type'),
        address: str('address'),
        selection_process: str('selection_process'),
        training: str('training'),
        benefits: str('benefits'),
        feature_tags: arr('feature_tags'),
        // 求める人物像・内定実績・在籍数は「この求人だけの項目」へ移して引き継ぐ
        custom_fields: buildCustomFieldsFromJob(j),
      });
      // カバー画像は元求人のものをそのまま引き継ぐ（別ファイルとして持ち直す必要はない）
      if (typeof j.cover_image_url === 'string') setCoverPreview(j.cover_image_url);
      if (typeof j.cover_image_position === 'string') setCoverPosition(j.cover_image_position);
      showToast('元の求人の内容を読み込みました');
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('5MB以下の画像を選択してください', 'error'); return; }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const invalid = validateJobForm(form);
    if (invalid) {
      setError(invalid);
      showToast(invalid, 'error');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSaving(true); setError(null);
    try {
      if (!companyId) return;
      // 新しく選び直した画像があればアップロード。コピー元の画像はURLをそのまま使う
      let cover_image_url: string | null = coverFile ? null : (coverPreview || null);
      if (coverFile) {
        const ext = coverFile.name.split('.').pop();
        const path = `${companyId}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('job-covers').upload(path, coverFile, { upsert: true });
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from('job-covers').getPublicUrl(path);
        cover_image_url = urlData.publicUrl;
      }

      const { base, extras, custom } = splitJobPayload({ ...form, custom_fields: cleanCustomFields(form.custom_fields) });
      const common = { company_id: companyId, status: 'pending', cover_image_url, cover_image_position: coverPosition };

      // カラム未追加の環境でも投稿できるよう、段階的に落として再試行する
      let { error: jobError } = await supabase.from('jobs').insert([{ ...common, ...base, ...extras, ...custom }]);
      if (jobError && /column/i.test(jobError.message)) {
        ({ error: jobError } = await supabase.from('jobs').insert([{ ...common, ...base, ...extras }]));
      }
      if (jobError && /column/i.test(jobError.message)) {
        ({ error: jobError } = await supabase.from('jobs').insert([{ ...common, ...base }]));
      }
      if (jobError) throw jobError;

      showToast('求人を投稿しました！');
      // リダイレクトまで saving を維持して二重送信を防ぐ
      setTimeout(() => router.push(backHref), 1200);
    } catch (err) {
      setError('求人投稿に失敗しました: ' + (err as Error).message);
      setSaving(false);
    }
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
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: toast.type === 'error' ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${toast.type === 'error' ? '#FECACA' : '#BBF7D0'}`, color: toast.type === 'error' ? '#B91C1C' : '#15803D', borderRadius: 12, padding: '14px 24px', fontWeight: 700, fontSize: 14, boxShadow: '0 8px 32px rgba(0,0,0,.12)', maxWidth: '90vw' }}>
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
          <p style={{ fontSize: 13, color: '#938B81', marginTop: 8 }}>「必須」の項目だけ埋めれば投稿できます。任意の項目は後から追加できます。</p>
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
                <ImagePositionPicker src={coverPreview} position={coverPosition} onChange={setCoverPosition} aspectRatio={COVER_ASPECT} />
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
                style={{ width: '100%', aspectRatio: COVER_ASPECT, borderRadius: 12, background: '#F3EDE5', border: '2px dashed #EFE8DF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                onClick={() => document.getElementById('cover-input')?.click()}
              >
                <div style={{ textAlign: 'center', color: '#938B81' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🖼️</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>クリックして画像を選択</div>
                  <div style={{ fontSize: 11, marginTop: 4 }}>JPG / PNG / WebP・5MB以内・推奨 1600×600px（横長）</div>
                  <div style={{ fontSize: 11, marginTop: 2 }}>この枠の比率で一覧に表示されます</div>
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

          <JobFormFields value={form} onChange={setForm} tagOptions={tagOptions} isMobile={isMobile} />

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
