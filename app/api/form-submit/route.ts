import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL || 'noreply@toukobe-intern.com';
const ADMIN_EMAIL = 'ru_matsumoto@manabiph.com';

const FORM_LABELS: Record<string, string> = {
  early: '早期申し込み契約フォーム',
  normal: '通常申し込み契約フォーム',
  material: '資料請求フォーム',
  contact: 'お問い合わせ',
};

function row(label: string, value: string | null | undefined) {
  if (!value) return '';
  return `<tr>
    <td style="padding:10px 12px;background:#FBF8F4;border:1px solid #EFE8DF;font-weight:600;width:180px;white-space:nowrap">${label}</td>
    <td style="padding:10px 12px;border:1px solid #EFE8DF">${value}</td>
  </tr>`;
}

function header(title: string) {
  return `
<div style="font-family:'Hiragino Kaku Gothic Pro',Meiryo,sans-serif;max-width:560px;margin:0 auto;color:#1C1813">
  <div style="background:#F2620C;padding:20px 32px;border-radius:12px 12px 0 0">
    <p style="color:#fff;font-size:13px;margin:0;letter-spacing:.08em">TOUKOBE INTERN</p>
  </div>
  <div style="background:#fff;border:1px solid #EFE8DF;border-top:none;padding:32px;border-radius:0 0 12px 12px">
    ${title}`;
}
const footer = `
    <p style="font-size:12px;color:#B6ADA2;margin:24px 0 0">このメールはトウコべインターンから自動送信されています。</p>
  </div>
</div>`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { form_type, company_name, contact_name, legal_email, billing_email, account_email, notes, source } = body;

    const isContact = form_type === 'contact';
    if (!form_type || (!isContact && !company_name) || (isContact && !contact_name)) {
      return NextResponse.json({ error: 'missing required fields' }, { status: 400 });
    }

    const { error: dbError } = await supabase
      .from('form_submissions')
      .insert([{ form_type, company_name, contact_name, legal_email, billing_email, account_email, notes, source }]);

    if (dbError) {
      console.error('DB error:', dbError);
      return NextResponse.json({ error: 'db error' }, { status: 500 });
    }

    const formLabel = FORM_LABELS[form_type] || 'フォーム申し込み';

    // 回答内容の表テンプレート（フォーム種別で列ラベルを切り替え）
    const answerTable = form_type === 'contact'
      ? `<table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px">
  ${row('お名前', contact_name)}
  ${row('メールアドレス', legal_email)}
  ${row('お問い合わせ種別', source)}
  ${row('お問い合わせ内容', notes)}
</table>`
      : `<table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px">
  ${row('企業名', company_name)}
  ${row('担当者名', contact_name)}
  ${row('法務メールアドレス', legal_email)}
  ${row('請求先メールアドレス', billing_email)}
  ${row('アカウント登録メール', account_email)}
  ${row('情報源', source)}
  ${row('その他ご要望', notes)}
</table>`;

    // ① 管理者宛メール
    const adminHtml = header(`<h2 style="font-size:20px;margin:0 0 6px">📋 新しい申し込みが届きました</h2>
    <p style="font-size:13px;color:#938B81;margin:0 0 24px">${formLabel}</p>
    ${answerTable}
    <p style="font-size:12px;color:#B6ADA2;margin:0">管理画面からすべての申し込みを確認・管理できます。</p>`) + footer;

    // ② 送信者宛確認メール（legal_email が送信先）
    const submitterEmail = legal_email;
    const submitterHtml = header(`
    <h2 style="font-size:20px;margin:0 0 8px">${isContact ? 'お問い合わせありがとうございます' : 'お申し込みありがとうございます'}</h2>
    <p style="font-size:14px;color:#57514A;line-height:1.8;margin:0 0 24px">
      ${contact_name ? `${contact_name} 様、` : ''}以下の内容で${isContact ? 'お問い合わせ' : 'お申し込み'}を受け付けました。<br>
      担当者より<strong>1営業日以内</strong>にご連絡いたします。
    </p>
    <div style="background:#FBF8F4;border-radius:10px;padding:16px 20px;margin-bottom:24px">
      <p style="font-size:13px;font-weight:700;color:#1C1813;margin:0 0 12px">【${isContact ? 'お問い合わせ内容' : 'お申し込み内容'}】${formLabel}</p>
      ${answerTable}
    </div>
    <p style="font-size:13px;color:#57514A;line-height:1.8;margin:0 0 8px">
      ご不明な点がございましたら、このメールへの返信またはお問い合わせフォームよりお気軽にご連絡ください。
    </p>`) + footer;

    const adminSubject = isContact
      ? `【お問い合わせ】${contact_name || '（名前なし）'} よりお問い合わせがありました`
      : `【${formLabel}】${company_name} より申し込みがありました`;

    // 送信（並列）
    const sends = [
      resend.emails.send({
        from: `トウコべインターン <${FROM}>`,
        to: ADMIN_EMAIL,
        subject: adminSubject,
        html: adminHtml,
      }),
    ];

    if (submitterEmail) {
      sends.push(
        resend.emails.send({
          from: `トウコべインターン <${FROM}>`,
          to: submitterEmail,
          subject: `【受付完了】${formLabel} のお申し込みを受け付けました`,
          html: submitterHtml,
        })
      );
    }

    await Promise.all(sends);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('form-submit error:', e);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}
