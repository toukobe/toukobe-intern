'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import ImagePositionPicker from '@/components/ImagePositionPicker';
import { useIsMobile } from '@/utils/useIsMobile';

interface User { id: string; email?: string; }
interface Job { id: string; job_title: string; salary: string; location: string; status: string; cover_image_url?: string | null; cover_image_position?: string | null; }
interface Company { id: string; company_name: string; industry: string; contact_email: string; description?: string; website?: string; employee_count?: string; location?: string; founded_year?: string; logo_url?: string; cover_url?: string; cover_position?: string; }

const F = {
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#57514A', marginBottom: 8 } as React.CSSProperties,
  input: { width: '100%', border: '1px solid #EFE8DF', borderRadius: 10, padding: '12px 16px', fontFamily: "var(--font-sans)", fontSize: 14, color: '#1C1813', outline: 'none', boxSizing: 'border-box' as const },
};

const STATUS_LABEL: Record<string, { text: string; bg: string; color: string; border: string }> = {
  published: { text: '公開中',   bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' },
  pending:   { text: '承認待ち', bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' },
  paused:    { text: '募集停止', bg: '#F3F4F6', color: '#374151', border: '#D1D5DB' },
  draft:     { text: '非公開',   bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB' },
};

export default function CompanyDashboard() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { document.title = 'ダッシュボード | トウコべインターン'; return () => { document.title = 'トウコべインターン'; }; }, []);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ company_name: '', industry: '', contact_email: '', description: '', website: '', employee_count: '', location: '', founded_year: '' });
  const [logoUploading, setLogoUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverPosition, setCoverPosition] = useState('50% 50%');
  const [coverPositionSaved, setCoverPositionSaved] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  // パスワード変更（仮パスワードで発行されたアカウントが自分で変更するためのツール）
  const [showPwModal, setShowPwModal] = useState(false);
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    if (newPw.length < 8) { setPwError('パスワードは8文字以上で設定してください'); return; }
    if (newPw !== confirmPw) { setPwError('パスワードが一致しません'); return; }
    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setPwSaving(false);
    if (error) {
      setPwError(error.message.includes('should be different') ? '現在と同じパスワードは設定できません' : '変更に失敗しました。時間をおいて再度お試しください');
      return;
    }
    setShowPwModal(false);
    setNewPw('');
    setConfirmPw('');
    showToast('パスワードを変更しました');
  };

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth/company-login'); return; }
      setUser(session.user as User);

      const { data: ut } = await supabase.from('user_types').select('company_id').eq('user_id', session.user.id).single();
      if (!ut?.company_id) { router.push('/auth/company-login'); return; }

      const { data: c } = await supabase.from('companies').select('*').eq('id', ut.company_id).single();
      if (c) {
        setCompany(c);
        setEditForm({ company_name: c.company_name || '', industry: c.industry || '', contact_email: c.contact_email || '', description: c.description || '', website: c.website || '', employee_count: c.employee_count || '', location: c.location || '', founded_year: c.founded_year || '' });
        if (c.cover_position) setCoverPosition(c.cover_position);
      }

      const { data: j } = await supabase.from('jobs').select('id,job_title,salary,location,status,cover_image_url,cover_image_position').eq('company_id', ut.company_id).order('created_at', { ascending: false });
      setJobs(j || []);
      setLoading(false);
    }
    init();
  }, [router]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !company) return;
    if (file.size > 2 * 1024 * 1024) { showToast('2MB以下の画像を選択してください', 'error'); return; }
    setLogoUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${company.id}/logo_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('company-logos').upload(path, file);
      if (upErr) { showToast('アップロードに失敗しました', 'error'); return; }
      const { data: urlData } = supabase.storage.from('company-logos').getPublicUrl(path);
      const { error: dbErr } = await supabase.from('companies').update({ logo_url: urlData.publicUrl }).eq('id', company.id);
      if (dbErr) { showToast('ロゴの保存に失敗しました', 'error'); return; }
      showToast('ロゴを更新しました');
      setCompany({ ...company, logo_url: urlData.publicUrl });
    } finally {
      setLogoUploading(false);
    }
  };

  const handleLogoDelete = async () => {
    if (!company || !confirm('ロゴを削除しますか？')) return;
    const { error } = await supabase.from('companies').update({ logo_url: null }).eq('id', company.id);
    if (error) { showToast('削除に失敗しました', 'error'); return; }
    setCompany({ ...company, logo_url: undefined });
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !company) return;
    if (file.size > 5 * 1024 * 1024) { showToast('5MB以下の画像を選択してください', 'error'); return; }
    setCoverUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${company.id}/cover_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('company-logos').upload(path, file);
      if (upErr) { showToast('アップロードに失敗しました', 'error'); return; }
      const { data: urlData } = supabase.storage.from('company-logos').getPublicUrl(path);
      const { error: dbErr } = await supabase.from('companies').update({ cover_url: urlData.publicUrl }).eq('id', company.id);
      if (dbErr) { showToast('背景画像の保存に失敗しました', 'error'); return; }
      showToast('背景画像を更新しました');
      setCompany({ ...company, cover_url: urlData.publicUrl });
    } finally {
      setCoverUploading(false);
    }
  };

  const handleCoverPositionSave = async () => {
    if (!company) return;
    const { error } = await supabase.from('companies').update({ cover_position: coverPosition } as any).eq('id', company.id);
    if (error) { showToast('位置の保存に失敗しました', 'error'); return; }
    setCompany({ ...company, cover_position: coverPosition });
    setCoverPositionSaved(true);
  };

  const handleCoverDelete = async () => {
    if (!company || !confirm('背景画像を削除しますか？')) return;
    const { error } = await supabase.from('companies').update({ cover_url: null }).eq('id', company.id);
    if (error) { showToast('削除に失敗しました', 'error'); return; }
    setCompany({ ...company, cover_url: undefined });
  };

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    const { error } = await supabase.from('companies').update(editForm).eq('id', company.id);
    if (error) { showToast('更新に失敗しました', 'error'); return; }
    setCompany({ ...company, ...editForm });
    setShowEdit(false);
    showToast('企業情報を更新しました');
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('この求人を削除しますか？')) return;
    const { error } = await supabase.from('jobs').delete().eq('id', jobId);
    if (error) { showToast('削除に失敗しました', 'error'); return; }
    setJobs(jobs.filter(j => j.id !== jobId));
    showToast('求人を削除しました');
  };

  const handleStatusChange = async (jobId: string, newStatus: string) => {
    const { error } = await supabase.from('jobs').update({ status: newStatus }).eq('id', jobId);
    if (error) { showToast('更新に失敗しました', 'error'); return; }
    setJobs(jobs.map(j => j.id === jobId ? { ...j, status: newStatus } : j));
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FBF8F4', fontFamily: "var(--font-sans)" }}>
      <div style={{ width: 36, height: 36, border: '2.5px solid #F2620C', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const published = jobs.filter(j => j.status === 'published');
  const pending = jobs.filter(j => j.status === 'pending');
  const paused = jobs.filter(j => j.status === 'paused');
  const draft = jobs.filter(j => j.status === 'draft');

  return (
    <div style={{ minHeight: '100vh', background: '#FBF8F4', fontFamily: "var(--font-sans)", color: '#1C1813' }}>

      {/* TOAST */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: toast.type === 'error' ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${toast.type === 'error' ? '#FECACA' : '#BBF7D0'}`, color: toast.type === 'error' ? '#B91C1C' : '#15803D', borderRadius: 12, padding: '14px 24px', fontWeight: 700, fontSize: 14, boxShadow: '0 8px 32px rgba(0,0,0,.12)', whiteSpace: 'nowrap' }}>
          {toast.type === 'success' ? '✓ ' : '✕ '}{toast.msg}
        </div>
      )}

      {/* NAV */}
      <div style={{ background: '#fff', borderBottom: '1px solid #EFE8DF', padding: isMobile ? '14px 16px' : '14px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <img src="/toukobe-intern-logo.png" alt="トウコべインターン" style={{ height: 34, width: 'auto', cursor: 'pointer' }} onClick={() => router.push('/')} />
          <div style={{ width: 1, height: 20, background: '#EFE8DF' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{company?.company_name}</div>
            <div style={{ fontSize: 12, color: '#938B81' }}>{company?.industry}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => router.push('/dashboard/company/applicants')} style={{ background: '#FFF1E8', color: '#F2620C', border: 'none', borderRadius: 8, padding: '10px 20px', fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            応募者管理
          </button>
          <button onClick={() => { setShowPwModal(true); setPwError(null); }} style={{ background: '#fff', color: '#57514A', border: '1px solid #EFE8DF', borderRadius: 8, padding: isMobile ? '10px 12px' : '10px 20px', fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>{isMobile ? 'PW変更' : 'パスワード変更'}</button>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} style={{ background: '#fff', color: '#57514A', border: '1px solid #EFE8DF', borderRadius: 8, padding: '10px 20px', fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>ログアウト</button>
        </div>
      </div>

      {/* パスワード変更モーダル */}
      {showPwModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '32px', width: '100%', maxWidth: 440, boxShadow: '0 24px 60px rgba(0,0,0,.2)' }}>
            <h3 style={{ fontWeight: 900, fontSize: 18, margin: '0 0 8px' }}>パスワード変更</h3>
            <p style={{ fontSize: 13, color: '#938B81', margin: '0 0 20px' }}>ログイン中のアカウント（{user?.email}）のパスワードを変更します。仮パスワードでログインしている場合は、必ず変更してください。</p>
            {pwError && <div style={{ background: '#FFF1EE', border: '1px solid #FBCFBE', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#C2390A', marginBottom: 16 }}>{pwError}</div>}
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={F.label}>新しいパスワード（8文字以上） *</label>
                <input style={F.input} type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required minLength={8} placeholder="••••••••" onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} />
              </div>
              <div>
                <label style={F.label}>新しいパスワード（確認） *</label>
                <input style={F.input} type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required minLength={8} placeholder="••••••••" onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="submit" disabled={pwSaving} style={{ flex: 1, background: '#F2620C', color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: pwSaving ? 0.7 : 1 }}>{pwSaving ? '変更中...' : '変更する'}</button>
                <button type="button" onClick={() => { setShowPwModal(false); setNewPw(''); setConfirmPw(''); }} style={{ flex: 1, background: '#F3EEE7', color: '#57514A', border: 'none', borderRadius: 10, padding: '13px', fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>キャンセル</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '24px 12px 60px' : '40px 48px' }}>
        {/* STATS */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { label: '公開中の求人', value: published.length, color: '#15803D' },
            { label: '承認待ち', value: pending.length, color: '#B45309' },
            { label: '募集停止', value: paused.length, color: '#374151' },
            { label: '非公開', value: draft.length, color: '#6B7280' },
          ].map((s) => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 14, padding: '24px 28px' }}>
              <div style={{ fontSize: 13, color: '#938B81', marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontWeight: 900, fontSize: isMobile ? 24 : 36, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* POST JOB */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <h2 style={{ fontWeight: 900, fontSize: 22, margin: 0 }}>求人管理</h2>
          <button onClick={() => router.push('/dashboard/post-job')} style={{ background: '#F2620C', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 14px rgba(242,98,12,.28)' }}>
            + 新しい求人を投稿
          </button>
        </div>

        {/* JOB LIST */}
        {jobs.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, padding: isMobile ? '40px 20px' : '60px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
            <p style={{ fontSize: 16, color: '#938B81', margin: '0 0 20px' }}>まだ求人がありません</p>
            <button onClick={() => router.push('/dashboard/post-job')} style={{ background: '#F2620C', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>求人を投稿する</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {jobs.map((job) => {
              const st = STATUS_LABEL[job.status] || STATUS_LABEL.draft;
              return (
                <div key={job.id} style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  {/* カバー画像 */}
                  <div style={{ height: 120, position: 'relative', overflow: 'hidden', cursor: 'pointer', flexShrink: 0 }} onClick={() => router.push(`/jobs/${job.id}`)}>
                    {job.cover_image_url
                      ? <img src={job.cover_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: job.cover_image_position || '50% 50%', display: 'block' }} />
                      : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#F2620C,#FB8A3C)' }} />
                    }
                    {/* ステータスバッジ */}
                    <span style={{ position: 'absolute', top: 10, left: 12, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>{st.text}</span>
                  </div>
                  <div style={{ padding: '16px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Title */}
                    <div
                      style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.5, marginBottom: 10, cursor: 'pointer', color: '#1C1813' }}
                      onClick={() => router.push(`/jobs/${job.id}`)}
                    >
                      {job.job_title}
                    </div>
                    {/* Meta */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 13, color: '#57514A', marginBottom: 18 }}>
                      <span>📍 {job.location || '未設定'}</span>
                      <span>💰 {job.salary || '未設定'}</span>
                    </div>
                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 'auto', paddingTop: 14, borderTop: '1px solid #F3EDE5' }}>
                      {job.status === 'published' && (
                        <button onClick={() => handleStatusChange(job.id, 'paused')} style={{ background: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB', borderRadius: 8, padding: '7px 13px', fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>募集停止</button>
                      )}
                      {job.status === 'paused' && (
                        <button onClick={() => handleStatusChange(job.id, 'pending')} style={{ background: '#FFF1E8', color: '#F2620C', border: 'none', borderRadius: 8, padding: '7px 13px', fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>再申請</button>
                      )}
                      {(job.status === 'published' || job.status === 'paused') && (
                        <button onClick={() => handleStatusChange(job.id, 'draft')} style={{ background: '#F3F4F6', color: '#6B7280', border: '1px solid #E5E7EB', borderRadius: 8, padding: '7px 13px', fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>非公開</button>
                      )}
                      {job.status === 'draft' && (
                        <button onClick={() => handleStatusChange(job.id, 'pending')} style={{ background: '#FFF1E8', color: '#F2620C', border: 'none', borderRadius: 8, padding: '7px 13px', fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>承認申請</button>
                      )}
                      <button onClick={() => router.push(`/dashboard/edit-job/${job.id}`)} style={{ background: '#F3EEE7', color: '#57514A', border: 'none', borderRadius: 8, padding: '7px 14px', fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>編集</button>
                      <button onClick={() => handleDeleteJob(job.id)} style={{ background: '#FFF1EE', color: '#C2390A', border: 'none', borderRadius: 8, padding: '7px 14px', fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>削除</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* COMPANY INFO */}
        <div style={{ marginTop: 40, background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, padding: '28px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: '#F2620C', letterSpacing: '.14em', marginBottom: 6 }}>COMPANY INFO</div>
              <h3 style={{ fontWeight: 700, fontSize: 18, margin: 0 }}>企業情報・公開プロフィール</h3>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {company && (
                <button onClick={() => router.push(`/companies/${company.id}`)} style={{ background: '#F3EEE7', color: '#57514A', border: '1px solid #EFE8DF', borderRadius: 8, padding: '10px 16px', fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                  公開ページを見る →
                </button>
              )}
              <button onClick={() => setShowEdit(!showEdit)} style={{ background: showEdit ? '#F3EEE7' : '#FFF1E8', color: '#F2620C', border: 'none', borderRadius: 8, padding: '10px 20px', fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                {showEdit ? 'キャンセル' : '編集'}
              </button>
            </div>
          </div>
          {/* LOGO + COVER UPLOAD */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid #EFE8DF' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {company?.logo_url ? (
                <img src={company.logo_url} alt="企業ロゴ" style={{ width: 80, height: 80, borderRadius: 14, objectFit: 'contain', border: '1px solid #EFE8DF', background: '#fff', padding: 4 }} />
              ) : (
                <div style={{ width: 80, height: 80, borderRadius: 14, background: '#FFF1E8', border: '2px dashed #FBD5C0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🏢</div>
              )}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>企業ロゴ</div>
              <div style={{ fontSize: 12, color: '#938B81', marginBottom: 10 }}>PNG / JPG / WebP・2MB以内・推奨サイズ 200×200px以上</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <label style={{ background: '#FFF1E8', color: '#F2620C', border: 'none', borderRadius: 8, padding: '9px 18px', fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13, cursor: logoUploading ? 'not-allowed' : 'pointer', opacity: logoUploading ? 0.6 : 1 }}>
                  {logoUploading ? 'アップロード中...' : 'ロゴを変更'}
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleLogoUpload} style={{ display: 'none' }} disabled={logoUploading} />
                </label>
                {company?.logo_url && (
                  <button onClick={handleLogoDelete} style={{ background: '#FEF2F2', color: '#B91C1C', border: 'none', borderRadius: 8, padding: '9px 14px', fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>削除</button>
                )}
              </div>
            </div>
          </div>

          {/* COVER IMAGE UPLOAD */}
          <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid #EFE8DF' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>背景画像（カバー）</div>
            <div style={{ fontSize: 12, color: '#938B81', marginBottom: 12 }}>PNG / JPG / WebP・5MB以内・推奨サイズ 1200×400px以上</div>
            {company?.cover_url ? (
              <div style={{ marginBottom: 10 }}>
                <ImagePositionPicker
                  src={company.cover_url}
                  position={coverPosition}
                  onChange={pos => { setCoverPosition(pos); setCoverPositionSaved(false); }}
                  height={160}
                />
              </div>
            ) : (
              <div style={{ width: '100%', height: 120, borderRadius: 12, background: 'linear-gradient(135deg,#FFF1E8,#FFE4CC)', border: '2px dashed #FBD5C0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 28 }}>🖼️</span>
                <span style={{ fontSize: 12, color: '#938B81' }}>背景画像が未設定です</span>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label style={{ background: '#FFF1E8', color: '#F2620C', border: 'none', borderRadius: 8, padding: '9px 18px', fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13, cursor: coverUploading ? 'not-allowed' : 'pointer', opacity: coverUploading ? 0.6 : 1 }}>
                {coverUploading ? 'アップロード中...' : '背景画像を変更'}
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleCoverUpload} style={{ display: 'none' }} disabled={coverUploading} />
              </label>
              {company?.cover_url && !coverPositionSaved && (
                <button onClick={handleCoverPositionSave} style={{ background: '#F2620C', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 14px', fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>位置を保存</button>
              )}
              {company?.cover_url && (
                <button onClick={handleCoverDelete} style={{ background: '#FEF2F2', color: '#B91C1C', border: 'none', borderRadius: 8, padding: '9px 14px', fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>削除</button>
              )}
            </div>
          </div>

          {!showEdit ? (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(3,1fr)', gap: 20, marginBottom: 20 }}>
                {[{ label: '企業名', val: company?.company_name }, { label: '業種', val: company?.industry }, { label: 'メール', val: company?.contact_email }, { label: '所在地', val: company?.location || '未設定' }, { label: '従業員数', val: company?.employee_count ? `${company.employee_count}名` : '未設定' }, { label: '設立年', val: company?.founded_year || '未設定' }, { label: 'Webサイト', val: company?.website || '未設定' }].map(f => (
                  <div key={f.label}>
                    <div style={{ fontSize: 12, color: '#938B81', marginBottom: 4 }}>{f.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{f.val}</div>
                  </div>
                ))}
              </div>
              {company?.description && (
                <div style={{ background: '#FBF8F4', borderRadius: 10, padding: '16px 20px' }}>
                  <div style={{ fontSize: 12, color: '#938B81', marginBottom: 6 }}>会社概要</div>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.8, color: '#3A352F' }}>{company.description}</p>
                </div>
              )}
              {!company?.description && (
                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '14px 18px', fontSize: 13, color: '#B45309' }}>
                  💡 会社概要を入力すると、学生に企業の魅力が伝わりやすくなります。「編集」から追加しましょう。
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleUpdateCompany} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
                <div><label style={F.label}>企業名 *</label><input style={F.input} value={editForm.company_name} onChange={e => setEditForm({ ...editForm, company_name: e.target.value })} required onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} /></div>
                <div><label style={F.label}>業種 *</label><input style={F.input} value={editForm.industry} onChange={e => setEditForm({ ...editForm, industry: e.target.value })} required onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} /></div>
                <div><label style={F.label}>メールアドレス *</label><input style={F.input} type="email" value={editForm.contact_email} onChange={e => setEditForm({ ...editForm, contact_email: e.target.value })} required onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} /></div>
                <div><label style={F.label}>所在地</label><input style={F.input} value={editForm.location} placeholder="例：東京都渋谷区" onChange={e => setEditForm({ ...editForm, location: e.target.value })} onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} /></div>
                <div><label style={F.label}>従業員数</label><input style={F.input} value={editForm.employee_count} placeholder="例：50" onChange={e => setEditForm({ ...editForm, employee_count: e.target.value })} onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} /></div>
                <div><label style={F.label}>設立年</label><input style={F.input} value={editForm.founded_year} placeholder="例：2015" onChange={e => setEditForm({ ...editForm, founded_year: e.target.value })} onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} /></div>
              </div>
              <div><label style={F.label}>Webサイト</label><input style={F.input} value={editForm.website} placeholder="例：https://example.com" onChange={e => setEditForm({ ...editForm, website: e.target.value })} onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} /></div>
              <div>
                <label style={F.label}>会社概要</label>
                <textarea style={{ ...F.input, minHeight: 120, resize: 'vertical' } as React.CSSProperties} value={editForm.description} placeholder="会社の事業内容・文化・インターン生に期待することなどを記載してください" onChange={e => setEditForm({ ...editForm, description: e.target.value })} onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = '#F2620C'} onBlur={e => (e.target as HTMLTextAreaElement).style.borderColor = '#EFE8DF'} />
              </div>
              <button type="submit" style={{ alignSelf: 'flex-start', background: '#F2620C', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 32px', fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>更新する</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
