'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

interface User { id: string; email?: string; }
interface Job { id: string; job_title: string; salary: string; location: string; status: string; }
interface Company { id: string; company_name: string; industry: string; contact_email: string; description?: string; website?: string; employee_count?: string; location?: string; founded_year?: string; logo_url?: string; }

const F = {
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#57514A', marginBottom: 8 } as React.CSSProperties,
  input: { width: '100%', border: '1px solid #EFE8DF', borderRadius: 10, padding: '12px 16px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontSize: 14, color: '#1C1813', outline: 'none', boxSizing: 'border-box' as const },
};

const STATUS_LABEL: Record<string, { text: string; bg: string; color: string; border: string }> = {
  published: { text: '公開中',   bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' },
  pending:   { text: '承認待ち', bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' },
  paused:    { text: '募集停止', bg: '#F3F4F6', color: '#374151', border: '#D1D5DB' },
  draft:     { text: '非公開',   bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB' },
};

export default function CompanyDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ company_name: '', industry: '', contact_email: '', description: '', website: '', employee_count: '', location: '', founded_year: '' });
  const [logoUploading, setLogoUploading] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth/company-login'); return; }
      setUser(session.user as User);

      const { data: ut } = await supabase.from('user_types').select('company_id').eq('user_id', session.user.id).single();
      if (!ut?.company_id) { router.push('/auth/company-login'); return; }

      const { data: c } = await supabase.from('companies').select('*').eq('id', ut.company_id).single();
      if (c) { setCompany(c); setEditForm({ company_name: c.company_name, industry: c.industry, contact_email: c.contact_email, description: c.description || '', website: c.website || '', employee_count: c.employee_count || '', location: c.location || '', founded_year: c.founded_year || '' }); }

      const { data: j } = await supabase.from('jobs').select('id,job_title,salary,location,status').eq('company_id', ut.company_id).order('created_at', { ascending: false });
      setJobs(j || []);
      setLoading(false);
    }
    init();
  }, [router]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !company) return;
    if (file.size > 2 * 1024 * 1024) { alert('2MB以下の画像を選択してください'); return; }
    setLogoUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${company.id}/logo.${ext}`;
      const { error: upErr } = await supabase.storage.from('company-logos').upload(path, file, { upsert: true });
      if (upErr) { alert('アップロードに失敗しました: ' + upErr.message); return; }
      const { data: urlData } = supabase.storage.from('company-logos').getPublicUrl(path);
      // append timestamp to bust cache
      const logoUrl = urlData.publicUrl + '?t=' + Date.now();
      await supabase.from('companies').update({ logo_url: urlData.publicUrl }).eq('id', company.id);
      setCompany({ ...company, logo_url: logoUrl });
    } finally {
      setLogoUploading(false);
    }
  };

  const handleLogoDelete = async () => {
    if (!company || !confirm('ロゴを削除しますか？')) return;
    await supabase.from('companies').update({ logo_url: null }).eq('id', company.id);
    setCompany({ ...company, logo_url: undefined });
  };

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    const { error } = await supabase.from('companies').update(editForm).eq('id', company.id);
    if (error) { alert('更新に失敗しました'); return; }
    setCompany({ ...company, ...editForm });
    setShowEdit(false);
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('この求人を削除しますか？')) return;
    const { error } = await supabase.from('jobs').delete().eq('id', jobId);
    if (error) { alert('削除に失敗しました'); return; }
    setJobs(jobs.filter(j => j.id !== jobId));
  };

  const handleStatusChange = async (jobId: string, newStatus: string) => {
    const { error } = await supabase.from('jobs').update({ status: newStatus }).eq('id', jobId);
    if (error) { alert('更新に失敗しました'); return; }
    setJobs(jobs.map(j => j.id === jobId ? { ...j, status: newStatus } : j));
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FBF8F4', fontFamily: "'Zen Kaku Gothic New',sans-serif" }}>
      <div style={{ textAlign: 'center', color: '#57514A' }}>読み込み中...</div>
    </div>
  );

  const published = jobs.filter(j => j.status === 'published');
  const pending = jobs.filter(j => j.status === 'pending');
  const paused = jobs.filter(j => j.status === 'paused');
  const draft = jobs.filter(j => j.status === 'draft');

  return (
    <div style={{ minHeight: '100vh', background: '#FBF8F4', fontFamily: "'Zen Kaku Gothic New',sans-serif", color: '#1C1813' }}>
      <link href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;700;900&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* NAV */}
      <div style={{ background: '#fff', borderBottom: '1px solid #EFE8DF', padding: '14px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <img src="/toukobe-intern-logo.png" alt="トウコべインターン" style={{ height: 34, width: 'auto', cursor: 'pointer' }} onClick={() => router.push('/')} />
          <div style={{ width: 1, height: 20, background: '#EFE8DF' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{company?.company_name}</div>
            <div style={{ fontSize: 12, color: '#938B81' }}>{company?.industry}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => router.push('/dashboard/company/applicants')} style={{ background: '#FFF1E8', color: '#F2620C', border: 'none', borderRadius: 8, padding: '10px 20px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>応募者管理</button>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} style={{ background: '#fff', color: '#57514A', border: '1px solid #EFE8DF', borderRadius: 8, padding: '10px 20px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>ログアウト</button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 48px' }}>
        {/* STATS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { label: '公開中の求人', value: published.length, color: '#15803D' },
            { label: '承認待ち', value: pending.length, color: '#B45309' },
            { label: '募集停止', value: paused.length, color: '#374151' },
            { label: '非公開', value: draft.length, color: '#6B7280' },
          ].map((s) => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 14, padding: '24px 28px' }}>
              <div style={{ fontSize: 13, color: '#938B81', marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontWeight: 900, fontSize: 36, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* POST JOB */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <h2 style={{ fontWeight: 900, fontSize: 22, margin: 0 }}>求人管理</h2>
          <button onClick={() => router.push('/dashboard/post-job')} style={{ background: '#F2620C', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 14px rgba(242,98,12,.28)' }}>
            + 新しい求人を投稿
          </button>
        </div>

        {/* JOB LIST */}
        {jobs.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
            <p style={{ fontSize: 16, color: '#938B81', margin: '0 0 20px' }}>まだ求人がありません</p>
            <button onClick={() => router.push('/dashboard/post-job')} style={{ background: '#F2620C', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>求人を投稿する</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {jobs.map((job) => {
              const st = STATUS_LABEL[job.status] || STATUS_LABEL.draft;
              return (
                <div key={job.id} style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  {/* Status bar */}
                  <div style={{ height: 4, background: job.status === 'published' ? '#22C55E' : job.status === 'pending' ? '#F59E0B' : '#D1D5DB' }} />
                  <div style={{ padding: '20px 22px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Header: status badge */}
                    <div style={{ marginBottom: 12 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>{st.text}</span>
                    </div>
                    {/* Title */}
                    <div
                      style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.5, marginBottom: 10, cursor: 'pointer', color: '#1C1813' }}
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
                        <button onClick={() => handleStatusChange(job.id, 'paused')} style={{ background: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB', borderRadius: 8, padding: '7px 13px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>募集停止</button>
                      )}
                      {job.status === 'paused' && (
                        <button onClick={() => handleStatusChange(job.id, 'pending')} style={{ background: '#FFF1E8', color: '#F2620C', border: 'none', borderRadius: 8, padding: '7px 13px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>再申請</button>
                      )}
                      {(job.status === 'published' || job.status === 'paused') && (
                        <button onClick={() => handleStatusChange(job.id, 'draft')} style={{ background: '#F3F4F6', color: '#6B7280', border: '1px solid #E5E7EB', borderRadius: 8, padding: '7px 13px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>非公開</button>
                      )}
                      {job.status === 'draft' && (
                        <button onClick={() => handleStatusChange(job.id, 'pending')} style={{ background: '#FFF1E8', color: '#F2620C', border: 'none', borderRadius: 8, padding: '7px 13px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>承認申請</button>
                      )}
                      <button onClick={() => router.push(`/dashboard/edit-job/${job.id}`)} style={{ background: '#F3EEE7', color: '#57514A', border: 'none', borderRadius: 8, padding: '7px 14px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>編集</button>
                      <button onClick={() => handleDeleteJob(job.id)} style={{ background: '#FFF1EE', color: '#C2390A', border: 'none', borderRadius: 8, padding: '7px 14px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>削除</button>
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
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: '#F2620C', letterSpacing: '.14em', marginBottom: 6 }}>COMPANY INFO</div>
              <h3 style={{ fontWeight: 700, fontSize: 18, margin: 0 }}>企業情報・公開プロフィール</h3>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {company && (
                <button onClick={() => router.push(`/companies/${company.id}`)} style={{ background: '#F3EEE7', color: '#57514A', border: '1px solid #EFE8DF', borderRadius: 8, padding: '10px 16px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                  公開ページを見る →
                </button>
              )}
              <button onClick={() => setShowEdit(!showEdit)} style={{ background: showEdit ? '#F3EEE7' : '#FFF1E8', color: '#F2620C', border: 'none', borderRadius: 8, padding: '10px 20px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                {showEdit ? 'キャンセル' : '編集'}
              </button>
            </div>
          </div>
          {/* LOGO UPLOAD */}
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
                <label style={{ background: '#FFF1E8', color: '#F2620C', border: 'none', borderRadius: 8, padding: '9px 18px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 700, fontSize: 13, cursor: logoUploading ? 'not-allowed' : 'pointer', opacity: logoUploading ? 0.6 : 1 }}>
                  {logoUploading ? 'アップロード中...' : 'ロゴを変更'}
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleLogoUpload} style={{ display: 'none' }} disabled={logoUploading} />
                </label>
                {company?.logo_url && (
                  <button onClick={handleLogoDelete} style={{ background: '#FEF2F2', color: '#B91C1C', border: 'none', borderRadius: 8, padding: '9px 14px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>削除</button>
                )}
              </div>
            </div>
          </div>

          {!showEdit ? (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, marginBottom: 20 }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
              <button type="submit" style={{ alignSelf: 'flex-start', background: '#F2620C', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 32px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>更新する</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
