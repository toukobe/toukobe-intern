'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { useIsMobile } from '@/utils/useIsMobile';

interface User { id: string; email?: string; }
interface StudentProfile {
  id: string; name: string; last_name: string; first_name: string;
  university: string; department: string; grade: string;
  skills: string[]; experience: string; contact_email: string;
  birth_date: string;
}

const GRADES = ['学部1年生','学部2年生','学部3年生','学部4年生','修士1年生','修士2年生','博士1年生','博士2年生','博士3年生','卒業済み','その他'];
interface Application {
  id: string; job_id: string; status: string; created_at: string;
  job_title?: string; salary?: string; location?: string; company_name?: string;
}
interface Favorite {
  id: string; job_id: string;
  job_title?: string; salary?: string; location?: string; company_name?: string;
}
type Tab = 'profile' | 'applications' | 'favorites';

const F = {
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#57514A', marginBottom: 8 } as React.CSSProperties,
  input: { width: '100%', border: '1px solid #EFE8DF', borderRadius: 10, padding: '12px 16px', fontFamily: "var(--font-sans)", fontSize: 14, color: '#1C1813', outline: 'none', boxSizing: 'border-box' as const },
};

const APP_STATUS: Record<string, { text: string; bg: string; color: string }> = {
  unread:    { text: '未確認', bg: '#F5F3FF', color: '#6D28D9' },
  pending:   { text: '検討中', bg: '#FFFBEB', color: '#B45309' },
  interview: { text: '面接予定', bg: '#EFF6FF', color: '#1D4ED8' },
  offer:     { text: '内定', bg: '#F0FDF4', color: '#15803D' },
  rejected:  { text: '不採用', bg: '#FEF2F2', color: '#B91C1C' },
};

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const isMobile = useIsMobile();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('profile');
  useEffect(() => { document.title = 'マイページ | トウコべインターン'; return () => { document.title = 'トウコべインターン'; }; }, []);
  const [applications, setApplications] = useState<Application[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<StudentProfile>>({});
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.push('/auth/login'); return; }
        setUser(session.user as User);

        const { data: p } = await supabase.from('student_profiles').select('*').eq('user_id', session.user.id).maybeSingle();
        if (p) {
          setProfile(p);
          // Pre-fill contact_email with auth email if not set
          setEditForm({ ...p, contact_email: p.contact_email || session.user.email || '' });
        } else {
          setEditForm({ contact_email: session.user.email || '' });
        }

        // Fetch applications without nested join
        await fetchApplications(session.user.id);
        await fetchFavorites(session.user.id);
        setLoading(false);
      } catch (e) {
        console.error('student dashboard init error:', e);
        setLoading(false);
      }
    }
    init();
  }, [router]);

  const fetchApplications = async (userId: string) => {
    const { data: apps } = await supabase
      .from('applications')
      .select('id, job_id, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (!apps || apps.length === 0) { setApplications([]); return; }

    const jobIds = apps.map((a: any) => a.job_id);
    const { data: jobs } = await supabase
      .from('jobs')
      .select('id, job_title, salary, location, company_id')
      .in('id', jobIds);

    const companyIds = [...new Set((jobs || []).map((j: any) => j.company_id).filter(Boolean))];
    const { data: companies } = companyIds.length > 0
      ? await supabase.from('companies').select('id, company_name').in('id', companyIds)
      : { data: [] };

    const jobMap: Record<string, any> = {};
    (jobs || []).forEach((j: any) => { jobMap[j.id] = j; });
    const compMap: Record<string, any> = {};
    (companies || []).forEach((c: any) => { compMap[c.id] = c; });

    setApplications(apps.map((a: any) => {
      const j = jobMap[a.job_id] || {};
      const c = compMap[j.company_id] || {};
      return { id: a.id, job_id: a.job_id, status: a.status, created_at: a.created_at, job_title: j.job_title, salary: j.salary, location: j.location, company_name: c.company_name };
    }));
  };

  const fetchFavorites = async (userId: string) => {
    const { data: favs } = await supabase
      .from('favorites')
      .select('id, job_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (!favs || favs.length === 0) { setFavorites([]); return; }

    const jobIds = favs.map((f: any) => f.job_id);
    const { data: jobs } = await supabase
      .from('jobs')
      .select('id, job_title, salary, location, company_id')
      .in('id', jobIds);

    const companyIds = [...new Set((jobs || []).map((j: any) => j.company_id).filter(Boolean))];
    const { data: companies } = companyIds.length > 0
      ? await supabase.from('companies').select('id, company_name').in('id', companyIds)
      : { data: [] };

    const jobMap: Record<string, any> = {};
    (jobs || []).forEach((j: any) => { jobMap[j.id] = j; });
    const compMap: Record<string, any> = {};
    (companies || []).forEach((c: any) => { compMap[c.id] = c; });

    setFavorites(favs.map((f: any) => {
      const j = jobMap[f.job_id] || {};
      const c = compMap[j.company_id] || {};
      return { id: f.id, job_id: f.job_id, job_title: j.job_title, salary: j.salary, location: j.location, company_name: c.company_name };
    }));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const skills = (editForm.skills || []).filter(s => typeof s === 'string');
    const last_name = (editForm.last_name || '').trim();
    const first_name = (editForm.first_name || '').trim();
    const fullName = `${last_name} ${first_name}`.trim();
    const { error } = await supabase.from('student_profiles').upsert(
      { user_id: user.id, last_name, first_name, name: fullName, university: editForm.university, department: editForm.department || null, grade: editForm.grade, skills, experience: editForm.experience, contact_email: editForm.contact_email, birth_date: editForm.birth_date || null },
      { onConflict: 'user_id' }
    );
    if (error) { showToast('更新に失敗しました', 'error'); return; }
    setProfile(editForm as StudentProfile);
    setEditing(false);
    showToast('プロフィールを保存しました');
  };

  const handleRemoveFavorite = async (id: string) => {
    const { error } = await supabase.from('favorites').delete().eq('id', id);
    if (!error) setFavorites(favorites.filter(f => f.id !== id));
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FBF8F4', fontFamily: "var(--font-sans)" }}>
      <div style={{ width: 36, height: 36, border: '2.5px solid #F2620C', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: 'profile', label: 'プロフィール' },
    { key: 'applications', label: '応募履歴', count: applications.length },
    { key: 'favorites', label: 'お気に入り', count: favorites.length },
  ];

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
            <div style={{ fontWeight: 700, fontSize: 15 }}>{profile?.name || 'マイページ'}</div>
            {!isMobile && <div style={{ fontSize: 12, color: '#938B81' }}>{profile?.university} {profile?.grade}</div>}
          </div>
        </div>
        <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} style={{ background: '#fff', color: '#57514A', border: '1px solid #EFE8DF', borderRadius: 8, padding: isMobile ? '8px 14px' : '10px 20px', fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>ログアウト</button>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: isMobile ? '20px 16px' : '40px 48px' }}>
        {/* TABS */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 32, background: '#fff', border: '1px solid #EFE8DF', borderRadius: 12, padding: 6 }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{ flex: 1, border: 'none', borderRadius: 8, padding: isMobile ? '10px 4px' : '11px 8px', fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: isMobile ? 11 : 13, cursor: 'pointer', transition: '.2s', background: tab === t.key ? '#F2620C' : 'transparent', color: tab === t.key ? '#fff' : '#57514A', position: 'relative' }}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span style={{ position: 'absolute', top: 4, right: 8, minWidth: 16, height: 16, background: '#E11D48', color: '#fff', borderRadius: 999, fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', lineHeight: 1 }}>
                  {t.count > 9 ? '9+' : t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* PROFILE */}
        {tab === 'profile' && (() => {
          const fields = [profile?.last_name, profile?.first_name, profile?.birth_date, profile?.university, profile?.department, profile?.grade, profile?.contact_email, profile?.skills?.length, profile?.experience];
          const filled = fields.filter(Boolean).length;
          const pct = Math.round((filled / fields.length) * 100);
          return (
          <>
          {!editing && pct < 100 && (
            <div style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, padding: isMobile ? '16px' : '20px 24px', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>プロフィール完成度</span>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14, color: pct >= 80 ? '#15803D' : '#F2620C' }}>{pct}%</span>
              </div>
              <div style={{ background: '#F3EEE7', borderRadius: 999, height: 8, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: pct >= 80 ? '#22C55E' : '#F2620C', borderRadius: 999, transition: 'width .4s ease' }} />
              </div>
              {pct < 70 && (
                <p style={{ fontSize: 12, color: '#938B81', margin: '8px 0 0' }}>プロフィールを70%以上入力すると求人に応募できます。「編集」から入力を完成させましょう。</p>
              )}
            </div>
          )}
          <div style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, padding: isMobile ? '20px 16px' : '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
              <h2 style={{ fontWeight: 900, fontSize: 20, margin: 0 }}>プロフィール</h2>
              <button onClick={() => setEditing(!editing)} style={{ background: editing ? '#F3EEE7' : '#FFF1E8', color: '#F2620C', border: 'none', borderRadius: 8, padding: '10px 20px', fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                {editing ? 'キャンセル' : '編集'}
              </button>
            </div>
            {editing ? (
              <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* 姓名 */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
                  <div><label style={F.label}>姓 <span style={{ color: '#F2620C' }}>*</span></label><input style={F.input} value={editForm.last_name || ''} onChange={e => setEditForm({ ...editForm, last_name: e.target.value })} placeholder="山田" required onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} /></div>
                  <div><label style={F.label}>名 <span style={{ color: '#F2620C' }}>*</span></label><input style={F.input} value={editForm.first_name || ''} onChange={e => setEditForm({ ...editForm, first_name: e.target.value })} placeholder="太郎" required onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} /></div>
                </div>
                {/* 生年月日 */}
                <div><label style={F.label}>生年月日 <span style={{ color: '#F2620C' }}>*</span></label><input type="date" style={F.input} value={editForm.birth_date || ''} onChange={e => setEditForm({ ...editForm, birth_date: e.target.value })} required onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
                  <div><label style={F.label}>大学 <span style={{ color: '#F2620C' }}>*</span></label><input style={F.input} value={editForm.university || ''} onChange={e => setEditForm({ ...editForm, university: e.target.value })} placeholder="○○大学" required onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} /></div>
                  <div><label style={F.label}>学部・学科 <span style={{ color: '#F2620C' }}>*</span></label><input style={F.input} value={editForm.department || ''} onChange={e => setEditForm({ ...editForm, department: e.target.value })} placeholder="経済学部 経済学科" required onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} /></div>
                </div>
                <div><label style={F.label}>学年 <span style={{ color: '#F2620C' }}>*</span></label>
                  <select style={{ ...F.input, appearance: 'none' as const }} value={editForm.grade || ''} onChange={e => setEditForm({ ...editForm, grade: e.target.value })} required>
                    <option value="">選択</option>
                    {GRADES.map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                {/* Contact email */}
                <div>
                  <label style={F.label}>連絡用メールアドレス <span style={{ color: '#F2620C' }}>*</span></label>
                  <input type="email" style={F.input} value={editForm.contact_email || ''} onChange={e => setEditForm({ ...editForm, contact_email: e.target.value })} required placeholder="example@university.ac.jp" onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} />
                  <div style={{ marginTop: 8, padding: '10px 14px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>📧</span>
                    <p style={{ fontSize: 12, color: '#92400E', margin: 0, lineHeight: 1.7 }}>このアドレスに企業からの選考連絡・面接案内・スカウトメールが届きます。普段よく確認できるメールアドレスを登録してください。</p>
                  </div>
                </div>
                <div><label style={F.label}>スキル（カンマ区切り）</label><input style={F.input} value={Array.isArray(editForm.skills) ? editForm.skills.join(', ') : ''} onChange={e => setEditForm({ ...editForm, skills: e.target.value.split(',').map(s => s.trim()) })} placeholder="Python, Excel, 英語" onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} /></div>
                <div><label style={F.label}>経歴・自己紹介</label><textarea style={{ ...F.input, resize: 'vertical' }} value={editForm.experience || ''} onChange={e => setEditForm({ ...editForm, experience: e.target.value })} rows={5} onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = '#F2620C'} onBlur={e => (e.target as HTMLTextAreaElement).style.borderColor = '#EFE8DF'} /></div>
                <button type="submit" style={{ alignSelf: isMobile ? 'stretch' : 'flex-start', background: '#F2620C', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 32px', fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>更新する</button>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr', gap: 20 }}>
                  <div><div style={{ fontSize: 12, color: '#938B81', marginBottom: 4 }}>姓</div><div style={{ fontWeight: 700, fontSize: 17 }}>{profile?.last_name || '未設定'}</div></div>
                  <div><div style={{ fontSize: 12, color: '#938B81', marginBottom: 4 }}>名</div><div style={{ fontWeight: 700, fontSize: 17 }}>{profile?.first_name || '未設定'}</div></div>
                  <div><div style={{ fontSize: 12, color: '#938B81', marginBottom: 4 }}>生年月日</div><div style={{ fontWeight: 600, fontSize: 15 }}>{profile?.birth_date || '未設定'}</div></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr', gap: 20 }}>
                  <div><div style={{ fontSize: 12, color: '#938B81', marginBottom: 4 }}>大学</div><div style={{ fontWeight: 600, fontSize: 15 }}>{profile?.university || '未設定'}</div></div>
                  <div><div style={{ fontSize: 12, color: '#938B81', marginBottom: 4 }}>学部・学科</div><div style={{ fontWeight: 600, fontSize: 15 }}>{profile?.department || '未設定'}</div></div>
                  <div><div style={{ fontSize: 12, color: '#938B81', marginBottom: 4 }}>学年</div><div style={{ fontWeight: 600, fontSize: 15 }}>{profile?.grade || '未設定'}</div></div>
                </div>
                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '16px 20px' }}>
                  <div style={{ fontSize: 12, color: '#92400E', marginBottom: 6, fontWeight: 600 }}>📧 連絡用メールアドレス</div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#1C1813' }}>{profile?.contact_email || '未設定'}</div>
                  <div style={{ fontSize: 12, color: '#92400E', marginTop: 6 }}>企業からの選考連絡・面接案内・スカウトメールがこのアドレスに届きます</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#938B81', marginBottom: 8 }}>スキル</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {profile?.skills?.length ? profile.skills.map((s, i) => (
                      <span key={i} style={{ fontSize: 12, background: '#FFF1E8', color: '#F2620C', border: '1px solid #FBD5C0', borderRadius: 999, padding: '4px 12px' }}>{s}</span>
                    )) : <span style={{ fontSize: 13, color: '#B6ADA2' }}>未登録</span>}
                  </div>
                </div>
                <div><div style={{ fontSize: 12, color: '#938B81', marginBottom: 6 }}>経歴・自己紹介</div><p style={{ fontSize: 14, lineHeight: 1.85, color: '#57514A', margin: 0, whiteSpace: 'pre-wrap' }}>{profile?.experience || '未記入'}</p></div>
              </div>
            )}
          </div>
          </>
          );
        })()}

        {/* APPLICATIONS */}
        {tab === 'applications' && (
          <div>
            <h2 style={{ fontWeight: 900, fontSize: 20, margin: '0 0 20px' }}>応募履歴</h2>
            {applications.length > 0 && (
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>📧</span>
                <p style={{ fontSize: 12, color: '#92400E', margin: 0, lineHeight: 1.7 }}>
                  企業からの選考連絡は、連絡用メールアドレス（<strong>{profile?.contact_email || '未設定'}</strong>）宛にメールで届きます。迷惑メールフォルダもあわせてご確認ください。
                </p>
              </div>
            )}
            {applications.length === 0 ? (
              <div style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, padding: isMobile ? '40px 20px' : '60px', textAlign: 'center' }}>
                <p style={{ color: '#938B81', marginBottom: 16 }}>応募がまだありません</p>
                <button onClick={() => router.push('/')} style={{ background: '#F2620C', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>求人を探す</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {applications.map(app => {
                  const st = APP_STATUS[app.status] || APP_STATUS.pending;
                  return (
                    <div key={app.id} style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 14, padding: isMobile ? '16px' : '22px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, color: '#938B81', marginBottom: 4 }}>{app.company_name}</div>
                          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{app.job_title}</div>
                          <div style={{ fontSize: 13, color: '#57514A', display: 'flex', gap: 16 }}>
                            <span>📍 {app.location}</span>
                            <span>💰 {app.salary}</span>
                          </div>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 999, background: st.bg, color: st.color, whiteSpace: 'nowrap' }}>{st.text}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 10, marginTop: 16, paddingTop: 16, borderTop: '1px solid #F0EAE2' }}>
                        <button onClick={() => router.push(`/jobs/${app.job_id}`)} style={{ flex: 1, background: '#F3EEE7', color: '#57514A', border: 'none', borderRadius: 8, padding: '10px', fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>詳細を見る</button>
                      </div>
                      <div style={{ fontSize: 11, color: '#B6ADA2', marginTop: 10 }}>応募日：{new Date(app.created_at).toLocaleDateString('ja-JP')}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* FAVORITES */}
        {tab === 'favorites' && (
          <div>
            <h2 style={{ fontWeight: 900, fontSize: 20, margin: '0 0 20px' }}>お気に入り</h2>
            {favorites.length === 0 ? (
              <div style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, padding: isMobile ? '40px 20px' : '60px', textAlign: 'center' }}>
                <p style={{ color: '#938B81', marginBottom: 16 }}>お気に入りがまだありません</p>
                <button onClick={() => router.push('/')} style={{ background: '#F2620C', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>求人を探す</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {favorites.map(fav => (
                  <div key={fav.id} style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 14, padding: isMobile ? '16px' : '22px 24px' }}>
                    <div style={{ fontSize: 12, color: '#938B81', marginBottom: 4 }}>{fav.company_name}</div>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{fav.job_title}</div>
                    <div style={{ fontSize: 13, color: '#57514A', marginBottom: 16 }}>📍 {fav.location} ｜ 💰 {fav.salary}</div>
                    <div style={{ display: 'flex', gap: 10, paddingTop: 16, borderTop: '1px solid #F0EAE2' }}>
                      <button onClick={() => router.push(`/jobs/${fav.job_id}`)} style={{ flex: 1, background: '#FFF1E8', color: '#F2620C', border: 'none', borderRadius: 8, padding: '10px', fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>詳細を見る</button>
                      <button onClick={() => handleRemoveFavorite(fav.id)} style={{ flex: 1, background: '#FEF2F2', color: '#B91C1C', border: 'none', borderRadius: 8, padding: '10px', fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>削除</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
