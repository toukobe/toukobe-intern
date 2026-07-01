'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/utils/useIsMobile';

const FF = "'Zen Kaku Gothic New', sans-serif";

const S = {
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 } as React.CSSProperties,
  input: { width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '12px 14px', fontFamily: FF, fontSize: 14, color: '#1C1813', outline: 'none', boxSizing: 'border-box' as const, transition: 'border-color .2s' },
  hint: { fontSize: 12, color: '#6B7280', marginTop: 6, lineHeight: 1.7 } as React.CSSProperties,
  req: { color: '#F2620C', marginLeft: 3 },
};

const TYPES = [
  '学生として（登録・応募について）',
  '企業として（掲載・採用について）',
  'サービスに関するご意見・ご要望',
  'その他',
];

function focus(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.target.style.borderColor = '#F2620C';
}
function blur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.target.style.borderColor = '#E5E7EB';
}

export default function ContactFormPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [form, setForm] = useState({ contact_name: '', legal_email: '', source: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'お問い合わせ | トウコべインターン';
    return () => { document.title = 'トウコべインターン'; };
  }, []);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/form-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form_type: 'contact', ...form }),
      });
      if (!res.ok) throw new Error();
      setDone(true);
    } catch {
      setError('送信に失敗しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FFF6EE', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '24px 16px' : '48px 24px', fontFamily: FF }}>
      <link href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;700;900&display=swap" rel="stylesheet" />

      <div style={{ width: '100%', maxWidth: 520, background: '#fff', borderRadius: 20, boxShadow: '0 8px 40px rgba(0,0,0,.10)', padding: isMobile ? '32px 20px' : '48px 44px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <img src="/toukobe-intern-logo.png" alt="トウコべインターン" style={{ height: 40, display: 'block', margin: '0 auto 16px', cursor: 'pointer' }} onClick={() => router.push('/')} />
          <h1 style={{ fontWeight: 900, fontSize: isMobile ? 20 : 24, margin: '0 0 8px', color: '#1C1813' }}>お問い合わせ</h1>
          <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>担当者より1営業日以内にご連絡いたします</p>
        </div>

        {done ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontWeight: 900, fontSize: 20, margin: '0 0 12px', color: '#1C1813' }}>ありがとうございます</h2>
            <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.8, margin: '0 0 28px' }}>お問い合わせを受け付けました。<br />担当者より1営業日以内にご連絡いたします。</p>
            <button onClick={() => router.push('/')} style={{ background: '#F2620C', color: '#fff', border: 'none', borderRadius: 10, padding: '13px 32px', fontFamily: FF, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>トップへ戻る</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {error && <div style={{ background: '#FFF1EE', border: '1px solid #FBCFBE', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#C2390A' }}>{error}</div>}

            <div>
              <label style={S.label}>お名前<span style={S.req}>*</span></label>
              <input style={S.input} value={form.contact_name} onChange={e => set('contact_name', e.target.value)} onFocus={focus} onBlur={blur} placeholder="山田太郎" required />
            </div>

            <div>
              <label style={S.label}>メールアドレス<span style={S.req}>*</span></label>
              <input type="email" style={S.input} value={form.legal_email} onChange={e => set('legal_email', e.target.value)} onFocus={focus} onBlur={blur} placeholder="example@email.com" required />
              <p style={S.hint}>ご返信をお送りします。</p>
            </div>

            <div>
              <label style={S.label}>お問い合わせ種別<span style={S.req}>*</span></label>
              <select
                style={{ ...S.input, appearance: 'none' as const, background: `#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236B7280' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 14px center` }}
                value={form.source}
                onChange={e => set('source', e.target.value)}
                onFocus={focus}
                onBlur={blur}
                required
              >
                <option value="">選択してください</option>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label style={S.label}>お問い合わせ内容<span style={S.req}>*</span></label>
              <textarea
                style={{ ...S.input, resize: 'vertical', minHeight: 120 }}
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                onFocus={focus}
                onBlur={blur}
                placeholder="ご質問・ご要望などをご記入ください。"
                required
              />
            </div>

            <button type="submit" disabled={loading} style={{ background: '#F2620C', color: '#fff', border: 'none', borderRadius: 10, padding: '15px', fontFamily: FF, fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: '0 4px 14px rgba(242,98,12,.3)', marginTop: 4 }}>
              {loading ? '送信中...' : '送信する'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
