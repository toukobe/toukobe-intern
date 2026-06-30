'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

interface User { id: string; email?: string; }
interface StudentProfile {
  id: string; name: string; university: string; grade: string;
  skills: string[]; experience: string; contact_email: string;
}
interface Application {
  id: string; job_id: string; status: string; created_at: string;
  job_title?: string; salary?: string; location?: string; company_name?: string;
}
interface Favorite {
  id: string; job_id: string;
  job_title?: string; salary?: string; location?: string; company_name?: string;
}
interface Message { id: string; from_user_id: string; message_text: string; created_at: string; read_at: string | null; }

type Tab = 'profile' | 'applications' | 'favorites' | 'messages';

const F = {
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#57514A', marginBottom: 8 } as React.CSSProperties,
  input: { width: '100%', border: '1px solid #EFE8DF', borderRadius: 10, padding: '12px 16px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontSize: 14, color: '#1C1813', outline: 'none', boxSizing: 'border-box' as const },
};

const APP_STATUS: Record<string, { text: string; bg: string; color: string }> = {
  pending:   { text: '検討中', bg: '#FFFBEB', color: '#B45309' },
  interview: { text: '面接予定', bg: '#EFF6FF', color: '#1D4ED8' },
  offer:     { text: '内定', bg: '#F0FDF4', color: '#15803D' },
  rejected:  { text: '不採用', bg: '#FEF2F2', color: '#B91C1C' },
};

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('profile');
  const [applications, setApplications] = useState<Application[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<StudentProfile>>({});

  useEffect(() => {
    async function init() {
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

      const { data: msgs } = await supabase.from('messages').select('*').eq('to_user_id', session.user.id).order('created_at', { ascending: false }).limit(50);
      setMessages(msgs || []);

      setLoading(false);
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
    const { error } = await supabase.from('student_profiles').upsert(
      { user_id: user.id, name: editForm.name, university: editForm.university, grade: editForm.grade, skills, experience: editForm.experience, contact_email: editForm.contact_email },
      { onConflict: 'user_id' }
    );
    if (error) { alert('更新に失敗しました'); return; }
    setProfile(editForm as StudentProfile);
    setEditing(false);
    alert('プロフィールを保存しました');
  };

  const handleRemoveFavorite = async (id: string) => {
    const { error } = await supabase.from('favorites').delete().eq('id', id);
    if (!error) setFavorites(favorites.filter(f => f.id !== id));
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FBF8F4', fontFamily: "'Zen Kaku Gothic New',sans-serif" }}>
      <div style={{ color: '#57514A' }}>読み込み中...</div>
    </div>
  );

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: 'profile', label: 'プロフィール' },
    { key: 'applications', label: '応募履歴', count: applications.length },
    { key: 'favorites', label: 'お気に入り', count: favorites.length },
    { key: 'messages', label: 'メッセージ', count: messages.filter(m => !m.read_at).length },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#FBF8F4', fontFamily: "'Zen Kaku Gothic New',sans-serif", color: '#1C1813' }}>
      <link href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;700;900&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* NAV */}
      <div style={{ background: '#fff', borderBottom: '1px solid #EFE8DF', padding: '14px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <img src="/toukobe-intern-logo.png" alt="トウコべインターン" style={{ height: 34, width: 'auto', cursor: 'pointer' }} onClick={() => router.push('/')} />
          <div style={{ width: 1, height: 20, background: '#EFE8DF' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{profile?.name || 'マイページ'}</div>
            <div style={{ fontSize: 12, color: '#938B81' }}>{profile?.university} {profile?.grade}</div>
          </div>
        </div>
        <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} style={{ background: '#fff', color: '#57514A', border: '1px solid #EFE8DF', borderRadius: 8, padding: '10px 20px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>ログアウト</button>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 48px' }}>
        {/* TABS */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 32, background: '#fff', border: '1px solid #EFE8DF', borderRadius: 12, padding: 6 }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{ flex: 1, border: 'none', borderRadius: 8, padding: '11px 8px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: '.2s', background: tab === t.key ? '#F2620C' : 'transparent', color: tab === t.key ? '#fff' : '#57514A' }}
            >
              {t.label}{t.count !== undefined && t.count > 0 ? ` (${t.count})` : ''}
            </button>
          ))}
        </div>

        {/* PROFILE */}
        {tab === 'profile' && (
          <div style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
              <h2 style={{ fontWeight: 900, fontSize: 20, margin: 0 }}>プロフィール</h2>
              <button onClick={() => setEditing(!editing)} style={{ background: editing ? '#F3EEE7' : '#FFF1E8', color: '#F2620C', border: 'none', borderRadius: 8, padding: '10px 20px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                {editing ? 'キャンセル' : '編集'}
              </button>
            </div>
            {editing ? (
              <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div><label style={F.label}>名前 <span style={{ color: '#F2620C' }}>*</span></label><input style={F.input} value={editForm.name || ''} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div><label style={F.label}>大学 <span style={{ color: '#F2620C' }}>*</span></label><input style={F.input} value={editForm.university || ''} onChange={e => setEditForm({ ...editForm, university: e.target.value })} required onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} /></div>
                  <div><label style={F.label}>学年 <span style={{ color: '#F2620C' }}>*</span></label>
                    <select style={{ ...F.input, appearance: 'none' as const }} value={editForm.grade || ''} onChange={e => setEditForm({ ...editForm, grade: e.target.value })} required>
                      <option value="">選択</option>
                      {['1年生','2年生','3年生','4年生','大学院'].map(g => <option key={g}>{g}</option>)}
                    </select>
                  </div>
                </div>

                {/* Contact email */}
                <div>
                  <label style={F.label}>
                    連絡用メールアドレス <span style={{ color: '#F2620C' }}>*</span>
                  </label>
                  <input
                    type="email"
                    style={F.input}
                    value={editForm.contact_email || ''}
                    onChange={e => setEditForm({ ...editForm, contact_email: e.target.value })}
                    required
                    placeholder="example@university.ac.jp"
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'}
                    onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'}
                  />
                  <div style={{ marginTop: 8, padding: '10px 14px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>📧</span>
                    <p style={{ fontSize: 12, color: '#92400E', margin: 0, lineHeight: 1.7 }}>
                      このアドレスに企業からの選考連絡・面接案内・スカウトメールが届きます。普段よく確認できるメールアドレスを登録してください。
                    </p>
                  </div>
                </div>

                <div><label style={F.label}>スキル（カンマ区切り）</label><input style={F.input} value={Array.isArray(editForm.skills) ? editForm.skills.join(', ') : ''} onChange={e => setEditForm({ ...editForm, skills: e.target.value.split(',').map(s => s.trim()) })} placeholder="Python, Excel, 英語" onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#F2620C'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#EFE8DF'} /></div>
                <div><label style={F.label}>経歴・自己紹介</label><textarea style={{ ...F.input, resize: 'vertical' }} value={editForm.experience || ''} onChange={e => setEditForm({ ...editForm, experience: e.target.value })} rows={5} onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = '#F2620C'} onBlur={e => (e.target as HTMLTextAreaElement).style.borderColor = '#EFE8DF'} /></div>
                <button type="submit" style={{ alignSelf: 'flex-start', background: '#F2620C', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 32px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>更新する</button>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                <div><div style={{ fontSize: 12, color: '#938B81', marginBottom: 4 }}>名前</div><div style={{ fontWeight: 700, fontSize: 18 }}>{profile?.name || '未設定'}</div></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div><div style={{ fontSize: 12, color: '#938B81', marginBottom: 4 }}>大学</div><div style={{ fontWeight: 600, fontSize: 15 }}>{profile?.university || '未設定'}</div></div>
                  <div><div style={{ fontSize: 12, color: '#938B81', marginBottom: 4 }}>学年</div><div style={{ fontWeight: 600, fontSize: 15 }}>{profile?.grade || '未設定'}</div></div>
                </div>

                {/* Contact email display */}
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
        )}

        {/* APPLICATIONS */}
        {tab === 'applications' && (
          <div>
            <h2 style={{ fontWeight: 900, fontSize: 20, margin: '0 0 20px' }}>応募履歴</h2>
            {applications.length === 0 ? (
              <div style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, padding: '60px', textAlign: 'center' }}>
                <p style={{ color: '#938B81', marginBottom: 16 }}>応募がまだありません</p>
                <button onClick={() => router.push('/')} style={{ background: '#F2620C', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>求人を探す</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {applications.map(app => {
                  const st = APP_STATUS[app.status] || APP_STATUS.pending;
                  return (
                    <div key={app.id} style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 14, padding: '22px 24px' }}>
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
                        <button onClick={() => router.push(`/jobs/${app.job_id}`)} style={{ flex: 1, background: '#F3EEE7', color: '#57514A', border: 'none', borderRadius: 8, padding: '10px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>詳細を見る</button>
                        <button onClick={() => router.push(`/chat/${app.id}`)} style={{ flex: 1, background: '#FFF1E8', color: '#F2620C', border: 'none', borderRadius: 8, padding: '10px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>💬 メッセージ</button>
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
              <div style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, padding: '60px', textAlign: 'center' }}>
                <p style={{ color: '#938B81', marginBottom: 16 }}>お気に入りがまだありません</p>
                <button onClick={() => router.push('/')} style={{ background: '#F2620C', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>求人を探す</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {favorites.map(fav => (
                  <div key={fav.id} style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 14, padding: '22px 24px' }}>
                    <div style={{ fontSize: 12, color: '#938B81', marginBottom: 4 }}>{fav.company_name}</div>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{fav.job_title}</div>
                    <div style={{ fontSize: 13, color: '#57514A', marginBottom: 16 }}>📍 {fav.location} ｜ 💰 {fav.salary}</div>
                    <div style={{ display: 'flex', gap: 10, paddingTop: 16, borderTop: '1px solid #F0EAE2' }}>
                      <button onClick={() => router.push(`/jobs/${fav.job_id}`)} style={{ flex: 1, background: '#FFF1E8', color: '#F2620C', border: 'none', borderRadius: 8, padding: '10px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>詳細を見る</button>
                      <button onClick={() => handleRemoveFavorite(fav.id)} style={{ flex: 1, background: '#FEF2F2', color: '#B91C1C', border: 'none', borderRadius: 8, padding: '10px', fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>削除</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MESSAGES */}
        {tab === 'messages' && (
          <div>
            <h2 style={{ fontWeight: 900, fontSize: 20, margin: '0 0 20px' }}>メッセージ</h2>
            {messages.length === 0 ? (
              <div style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 16, padding: '60px', textAlign: 'center' }}>
                <p style={{ color: '#938B81' }}>メッセージはまだありません</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {messages.map(msg => (
                  <div key={msg.id} style={{ background: msg.read_at ? '#fff' : '#FFF8F5', border: `1px solid ${msg.read_at ? '#EFE8DF' : '#FBD5C0'}`, borderRadius: 14, padding: '20px 24px' }}>
                    {!msg.read_at && <span style={{ fontSize: 11, fontWeight: 700, color: '#F2620C', background: '#FFF1E8', borderRadius: 999, padding: '3px 10px', marginBottom: 10, display: 'inline-block' }}>未読</span>}
                    <p style={{ fontSize: 14, lineHeight: 1.8, color: '#1C1813', margin: '0 0 8px' }}>{msg.message_text}</p>
                    <div style={{ fontSize: 11, color: '#B6ADA2' }}>{new Date(msg.created_at).toLocaleString('ja-JP')}</div>
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
