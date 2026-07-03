'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/utils/useIsMobile';

const FF = "var(--font-sans)";

const S = {
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 } as React.CSSProperties,
  input: { width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '12px 14px', fontFamily: FF, fontSize: 14, color: '#1C1813', outline: 'none', boxSizing: 'border-box' as const, transition: 'border-color .2s' },
  hint: { fontSize: 12, color: '#6B7280', marginTop: 6, lineHeight: 1.7 } as React.CSSProperties,
  req: { color: '#F2620C', marginLeft: 3 },
};

function focus(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.target.style.borderColor = '#F2620C';
}
function blur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.target.style.borderColor = '#E5E7EB';
}

export default function NormalFormPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [form, setForm] = useState({ company_name: '', contact_name: '', legal_email: '', billing_email: '', account_email: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = '申し込みフォーム | トウコべインターン';
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
        body: JSON.stringify({ form_type: 'normal', ...form }),
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

      <div style={{ width: '100%', maxWidth: 560, background: '#fff', borderRadius: 20, boxShadow: '0 8px 40px rgba(0,0,0,.10)', padding: isMobile ? '32px 20px' : '48px 44px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <img src="/toukobe-intern-logo.png" alt="トウコべインターン" style={{ height: 40, display: 'block', margin: '0 auto 16px', cursor: 'pointer' }} onClick={() => router.push('/')} />
          <h1 style={{ fontWeight: 900, fontSize: isMobile ? 20 : 24, margin: '0 0 8px', color: '#1C1813' }}>契約申し込みフォーム</h1>
          <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>ご入力内容をもとに担当者よりご連絡いたします</p>
        </div>

        {done ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontWeight: 900, fontSize: 20, margin: '0 0 12px', color: '#1C1813' }}>申し込みを受け付けました</h2>
            <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.8, margin: '0 0 28px' }}>担当者より1営業日以内にご連絡いたします。</p>
            <button onClick={() => router.push('/')} style={{ background: '#F2620C', color: '#fff', border: 'none', borderRadius: 10, padding: '13px 32px', fontFamily: FF, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>トップへ戻る</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {error && <div style={{ background: '#FFF1EE', border: '1px solid #FBCFBE', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#C2390A' }}>{error}</div>}

            <div>
              <label style={S.label}>企業名<span style={S.req}>*</span></label>
              <input style={S.input} value={form.company_name} onChange={e => set('company_name', e.target.value)} onFocus={focus} onBlur={blur} placeholder="株式会社トウコべ" required />
              <p style={S.hint}>ご入力内容がトウコべインターン上に登録されます。</p>
            </div>

            <div>
              <label style={S.label}>法務担当者様のお名前<span style={S.req}>*</span></label>
              <input style={S.input} value={form.contact_name} onChange={e => set('contact_name', e.target.value)} onFocus={focus} onBlur={blur} placeholder="山田太郎" required />
              <p style={S.hint}>ご回答いただいたメールアドレス宛に、弊社より契約書を送付させていただきます。</p>
            </div>

            <div>
              <label style={S.label}>法務担当者様のメールアドレス<span style={S.req}>*</span></label>
              <input type="email" style={S.input} value={form.legal_email} onChange={e => set('legal_email', e.target.value)} onFocus={focus} onBlur={blur} placeholder="legal@example.com" required />
              <p style={S.hint}>ご回答いただいたメールアドレス宛に、弊社より契約書を送付させていただきます。※Gmail等のフリーメールアドレスはご遠慮ください。</p>
            </div>

            <div>
              <label style={S.label}>請求先のメールアドレス<span style={S.req}>*</span></label>
              <input style={S.input} value={form.billing_email} onChange={e => set('billing_email', e.target.value)} onFocus={focus} onBlur={blur} placeholder="billing1@example.com, billing2@example.com" required />
              <p style={S.hint}>料金を請求させていただくメールアドレスをご回答ください。複数ある場合はカンマ区切りで入力してください。</p>
            </div>

            <div>
              <label style={S.label}>法人アカウント登録メールアドレス<span style={S.req}>*</span></label>
              <input style={S.input} value={form.account_email} onChange={e => set('account_email', e.target.value)} onFocus={focus} onBlur={blur} placeholder="recruit1@example.com, recruit2@example.com" required />
              <p style={S.hint}>こちらのアドレスに法人アカウントを発行いたします。応募通知メールはこのメールアドレスに送信されます。広報連絡メールはこのメールアドレスに送信されます。個人のメールアドレスだけでなく、法人名をメールアドレスとするのも可能です。</p>
            </div>

            <div>
              <label style={S.label}>その他ご要望など</label>
              <textarea
                style={{ ...S.input, resize: 'vertical', minHeight: 100 }}
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                onFocus={focus}
                onBlur={blur}
                placeholder="ご不明な点やご質問などがあればお知らせください。"
              />
            </div>

            <button type="submit" disabled={loading} style={{ background: '#F2620C', color: '#fff', border: 'none', borderRadius: 10, padding: '15px', fontFamily: FF, fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: '0 4px 14px rgba(242,98,12,.3)', marginTop: 4 }}>
              {loading ? '送信中...' : '申請する'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
