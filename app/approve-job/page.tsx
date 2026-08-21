'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

const FF = 'var(--font-sans)';

interface JobInfo { id: string; title: string; status: string; location?: string | null; salary?: string | null; }

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#FBF8F4', fontFamily: FF, color: '#1C1813', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', border: '1px solid #EFE8DF', borderRadius: 18, padding: '36px 32px', maxWidth: 460, width: '100%', boxShadow: '0 12px 40px rgba(28,24,19,.08)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#F2620C', letterSpacing: '.18em', marginBottom: 18 }}>TOUKOBE INTERN</div>
        {children}
      </div>
    </div>
  );
}

function ApproveContent() {
  const params = useSearchParams();
  const token = params.get('token') || '';
  const [loading, setLoading] = useState(Boolean(token));
  const [job, setJob] = useState<JobInfo | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<'approved' | 'already' | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`/api/approve-job?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!res.ok) setError(data.error || '確認できませんでした。');
        else { setJob(data.job); setCompanyName(data.companyName || ''); }
      } catch {
        setError('通信エラーが発生しました。');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const approve = async () => {
    setSubmitting(true); setError(null);
    try {
      const res = await fetch('/api/approve-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || '承認に失敗しました。');
      else setDone(data.alreadyPublished ? 'already' : 'approved');
    } catch {
      setError('通信エラーが発生しました。');
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) return (
    <Card>
      <h1 style={{ fontSize: 19, fontWeight: 900, margin: '0 0 12px', color: '#B91C1C' }}>リンクが正しくありません</h1>
      <p style={{ fontSize: 14, lineHeight: 1.9, color: '#57514A', margin: '0 0 20px' }}>メールの「ログイン不要で承認する」ボタンからもう一度お試しください。</p>
      <a href="/dashboard/admin" style={{ color: '#F2620C', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>管理画面を開く →</a>
    </Card>
  );

  if (loading) return <Card><p style={{ color: '#938B81', fontSize: 14, margin: 0 }}>確認しています…</p></Card>;

  if (done) return (
    <Card>
      <h1 style={{ fontSize: 20, fontWeight: 900, margin: '0 0 12px', color: '#15803D' }}>✓ {done === 'already' ? 'すでに公開済みです' : '求人を公開しました'}</h1>
      <p style={{ fontSize: 14, lineHeight: 1.9, color: '#57514A', margin: '0 0 20px' }}>
        {companyName && <b>{companyName}</b>}「{job?.title}」{done === 'already' ? 'はすでに公開されています。' : 'を承認し、サイトに公開しました。'}
      </p>
      <a href="/dashboard/admin" style={{ color: '#F2620C', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>管理画面を開く →</a>
    </Card>
  );

  if (error) return (
    <Card>
      <h1 style={{ fontSize: 19, fontWeight: 900, margin: '0 0 12px', color: '#B91C1C' }}>承認できませんでした</h1>
      <p style={{ fontSize: 14, lineHeight: 1.9, color: '#57514A', margin: '0 0 20px' }}>{error}</p>
      <a href="/dashboard/admin" style={{ color: '#F2620C', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>管理画面を開く →</a>
    </Card>
  );

  return (
    <Card>
      <h1 style={{ fontSize: 20, fontWeight: 900, margin: '0 0 6px' }}>この求人を承認しますか？</h1>
      <p style={{ fontSize: 13, color: '#938B81', margin: '0 0 18px' }}>承認するとサイトに公開されます。</p>
      <div style={{ background: '#FBF8F4', border: '1px solid #EFE8DF', borderRadius: 12, padding: '16px 18px', marginBottom: 22 }}>
        {companyName && <div style={{ fontSize: 12, color: '#938B81', marginBottom: 4 }}>{companyName}</div>}
        <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.5, marginBottom: 8 }}>{job?.title}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12.5, color: '#57514A' }}>
          {job?.location && <span>📍 {job.location}</span>}
          {job?.salary && <span>💰 {job.salary}</span>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={approve} disabled={submitting}
          style={{ flex: 1, background: submitting ? '#D9B99B' : '#F2620C', color: '#fff', border: 'none', borderRadius: 10, padding: '14px', fontFamily: FF, fontWeight: 900, fontSize: 15, cursor: submitting ? 'not-allowed' : 'pointer' }}>
          {submitting ? '処理中…' : '承認して公開する'}
        </button>
        <a href={job ? `/jobs/${job.id}` : '/dashboard/admin'}
          style={{ flex: 1, textAlign: 'center', background: '#fff', color: '#57514A', border: '1px solid #EFE8DF', borderRadius: 10, padding: '14px', fontFamily: FF, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
          内容を確認
        </a>
      </div>
    </Card>
  );
}

export default function ApproveJobPage() {
  return (
    <Suspense fallback={null}>
      <ApproveContent />
    </Suspense>
  );
}
