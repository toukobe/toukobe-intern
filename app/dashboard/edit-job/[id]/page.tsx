'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import ImagePositionPicker from '@/components/ImagePositionPicker';
import { COVER_ASPECT } from '@/utils/coverImage';
import { fetchFeatureTagOptions } from '@/utils/featureTags';
import { useIsMobile } from '@/utils/useIsMobile';
import JobFormFields, { EMPTY_JOB_FORM, validateJobForm, type JobFormValue } from '@/components/JobFormFields';
import { cleanCustomFields } from '@/components/CustomFieldsEditor';
import { splitJobPayload } from '@/utils/jobPayload';

const FF = "var(--font-sans)";
const F = {
  section: { background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, padding: '28px 32px', marginBottom: 20 } as React.CSSProperties,
  sectionTitle: { fontWeight: 900, fontSize: 16, color: '#1C1813', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid #EFE8DF', display: 'block' } as React.CSSProperties,
};

export default function EditJobPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const params = useParams();
  const jobId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const backHref = isAdmin ? '/dashboard/admin' : '/dashboard/company';
  useEffect(() => { document.title = '求人を編集する | トウコべインターン'; return () => { document.title = 'トウコべインターン'; }; }, []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [coverPosition, setCoverPosition] = useState('50% 50%');
  const [companyIdOfJob, setCompanyIdOfJob] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
  const [tagOptions, setTagOptions] = useState<string[]>([]);
  useEffect(() => { fetchFeatureTagOptions().then(setTagOptions); }, []);
  const [form, setForm] = useState<JobFormValue>(EMPTY_JOB_FORM);
  // DBに存在したカラムだけを更新対象にするため、読み込んだ求人の中身を覚えておく
  const [presentColumns, setPresentColumns] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth/company-login'); return; }

      const admin = session.user.email === 'ru_matsumoto@manabiph.com';
      setIsAdmin(admin);
      const { data: ut } = await supabase.from('user_types').select('company_id').eq('user_id', session.user.id).single();
      // 管理者は自分のcompany_idが無くても任意企業の求人を編集できる
      if (!admin && !ut?.company_id) { router.push('/auth/company-login'); return; }

      const { data: job, error: jobError } = await supabase
        .from('jobs').select('*').eq('id', jobId).single();

      if (jobError || !job) { setError('求人が見つかりません'); setLoading(false); return; }
      if (!admin && job.company_id !== ut?.company_id) { setError('この求人を編集する権限がありません'); setLoading(false); return; }

      const j = job as Record<string, unknown>;
      const str = (k: string) => (typeof j[k] === 'string' ? (j[k] as string) : '');
      const arr = (k: string) => (Array.isArray(j[k]) ? (j[k] as string[]) : []);

      setPresentColumns(new Set(Object.keys(j)));
      setCompanyIdOfJob(typeof j.company_id === 'string' ? j.company_id : null);
      setForm({
        job_title: str('job_title'),
        salary: str('salary'),
        location: str('location'),
        job_description: str('job_description'),
        job_categories: arr('job_categories'),
        work_days: arr('work_days'),
        work_conditions: arr('work_conditions'),
        job_features: arr('job_features'),
        // 旧「応募要件」しか入っていない求人は、必須条件として引き継いで表示する
        // （SQLの移行を実行していない環境でも編集画面で内容が消えないようにするため）
        required_conditions: str('required_conditions') || str('requirements'),
        welcome_conditions: str('welcome_conditions'),
        ideal_candidate: str('ideal_candidate'),
        shift_info: str('shift_info'),
        employment_type: str('employment_type'),
        address: str('address'),
        selection_process: str('selection_process'),
        training: str('training'),
        benefits: str('benefits'),
        alumni_placements: str('alumni_placements'),
        intern_count: str('intern_count'),
        feature_tags: arr('feature_tags'),
        custom_fields: Array.isArray(j.custom_fields) ? (j.custom_fields as JobFormValue['custom_fields']) : [],
      });
      if (typeof j.cover_image_url === 'string') { setCoverPreview(j.cover_image_url); setCoverUrl(j.cover_image_url); }
      if (typeof j.cover_image_position === 'string') setCoverPosition(j.cover_image_position);
      setLoading(false);
    }
    init();
  }, [jobId, router]);

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
      let cover_image_url = coverUrl;

      if (coverFile) {
        // 毎回ユニークなパスに新規アップロード(INSERT)する。
        // 固定パスへの upsert 上書きは、既存ファイルの所有者が異なるとRLSで失敗する
        // （＝「既存カバーの差し替えだけエラー」の原因）ため避ける。新URLになるので表示キャッシュ対策にもなる。
        const ext = (coverFile.name.split('.').pop() || 'png').toLowerCase();
        const folder = companyIdOfJob || 'jobs';
        const path = `${folder}/${jobId}_${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('job-covers').upload(path, coverFile, { contentType: coverFile.type || undefined });
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from('job-covers').getPublicUrl(path);
        cover_image_url = urlData.publicUrl;
        // 古いカバーはベストエフォートで削除（失敗しても差し替え自体は成功させる）
        const oldPath = coverUrl ? coverUrl.split('/job-covers/')[1]?.split('?')[0] : null;
        if (oldPath && oldPath !== path) {
          supabase.storage.from('job-covers').remove([oldPath]).catch(() => {});
        }
      }

      const { base, extras, custom } = splitJobPayload({ ...form, custom_fields: cleanCustomFields(form.custom_fields) });
      // DBに存在するカラムだけ更新する（マイグレーション未実行の環境でも壊れない）
      const presentExtras = Object.fromEntries(
        Object.entries(extras).filter(([k]) => presentColumns.size === 0 || presentColumns.has(k))
      );
      const baseUpdate = { ...base, cover_image_url, cover_image_position: coverPosition };

      let { error: updateError } = await supabase.from('jobs')
        .update({ ...baseUpdate, ...presentExtras, ...(presentColumns.has('custom_fields') ? custom : {}) })
        .eq('id', jobId);
      // 想定外のカラム差異があっても更新自体は通す
      if (updateError && /column/i.test(updateError.message)) {
        ({ error: updateError } = await supabase.from('jobs').update({ ...baseUpdate, ...presentExtras }).eq('id', jobId));
      }
      if (updateError && /column/i.test(updateError.message)) {
        ({ error: updateError } = await supabase.from('jobs').update(baseUpdate).eq('id', jobId));
      }
      if (updateError) throw updateError;

      showToast('求人を更新しました！');
      // リダイレクトまで saving を維持して二重送信を防ぐ
      setTimeout(() => router.push(backHref), 1200);
    } catch (err) {
      setError('求人更新に失敗しました: ' + (err as Error).message);
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
    <div style={{ minHeight: '100vh', background: '#FBF8F4', fontFamily: FF, color: '#1C1813' }}>

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
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: '#F2620C', letterSpacing: '.18em', marginBottom: 10 }}>EDIT JOB</div>
          <h1 style={{ fontWeight: 900, fontSize: 30, margin: 0 }}>求人を編集</h1>
          <p style={{ fontSize: 13, color: '#938B81', marginTop: 8 }}>求人情報を更新してください</p>
        </div>

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
                  onClick={() => { setCoverFile(null); setCoverPreview(null); setCoverUrl(null); setCoverPosition('50% 50%'); }}
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

          {/* ボタン */}
          <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
            <button type="submit" disabled={saving}
              style={{ flex: 1, background: saving ? '#D9B99B' : '#F2620C', color: '#fff', border: 'none', borderRadius: 12, padding: '16px', fontFamily: FF, fontWeight: 900, fontSize: 15, cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? '更新中...' : '求人を更新する'}
            </button>
            <button type="button" onClick={() => router.push(backHref)}
              style={{ flex: 1, background: '#fff', color: '#57514A', border: '1px solid #EFE8DF', borderRadius: 12, padding: '16px', fontFamily: FF, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
