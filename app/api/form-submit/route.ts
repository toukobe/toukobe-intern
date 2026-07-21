import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { escapeHtml, sanitizeSubject, isValidEmail, isValidEmailList, rateLimit } from '@/utils/apiSecurity';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
const resend = new Resend(process.env.RESEND_API_KEY);
// Slack 即時通知用の Incoming Webhook URL（未設定なら Webhook 通知はスキップ）
const SLACK_WEBHOOK_URL = (process.env.SLACK_WEBHOOK_URL || '').trim();
// Slack チャンネルのメール投稿アドレス（「メールを送信」で発行）。設定すると管理者宛通知が同チャンネルにも届く
const SLACK_CHANNEL_EMAIL = (process.env.SLACK_CHANNEL_EMAIL || '').trim();
// 環境変数が空・空白・不正な形式でも必ず有効な送信元に落とす（422 Invalid from 対策）
const RAW_FROM = (process.env.RESEND_FROM_EMAIL || '').trim();
const FROM = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(RAW_FROM) ? RAW_FROM : 'noreply@intern.toukobe.com';
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
    // IP単位のレート制限（10分間に5件まで）
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (!rateLimit(`form-submit:${ip}`, 5, 10 * 60 * 1000)) {
      return NextResponse.json({ error: 'rate limit exceeded' }, { status: 429 });
    }

    const body = await req.json();
    const clip = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : v == null ? v : String(v).slice(0, max));
    const form_type = clip(body.form_type, 20);
    const company_name = clip(body.company_name, 200);
    const contact_name = clip(body.contact_name, 100);
    const phone = clip(body.phone, 40);
    const legal_email = clip(body.legal_email, 254);
    // 請求先・アカウント登録メールはカンマ区切りで複数入力できるため、1件分より長い上限にする
    const billing_email = clip(body.billing_email, 1000);
    const account_email = clip(body.account_email, 1000);
    const notes = clip(body.notes, 5000);
    const source = clip(body.source, 200);

    const isContact = form_type === 'contact';
    if (!form_type || !(form_type in FORM_LABELS) || !phone || (!isContact && !company_name) || (isContact && !contact_name)) {
      return NextResponse.json({ error: 'missing required fields', message: '未入力の必須項目があります。すべてご入力のうえ再度お試しください。' }, { status: 400 });
    }
    if (legal_email && !isValidEmail(legal_email)) {
      return NextResponse.json({ error: 'invalid email format', message: 'メールアドレスの形式が正しくありません。' }, { status: 400 });
    }
    // これらは「複数ある場合はカンマ区切り」とフォームで案内しているので、リストとして検証する
    for (const email of [billing_email, account_email]) {
      if (email && !isValidEmailList(email)) {
        return NextResponse.json({ error: 'invalid email format', message: 'メールアドレスの形式が正しくありません。複数入力する場合は「,」（カンマ）で区切ってください。' }, { status: 400 });
      }
    }

    // company_name は NOT NULL 制約があるため、お問い合わせ（企業名なし）は空文字で保存する
    const baseRow = { form_type, company_name: company_name || '', contact_name, legal_email, billing_email, account_email, notes, source };
    let { error: dbError } = await supabase
      .from('form_submissions')
      .insert([{ ...baseRow, phone }]);

    // phone 列が未作成の環境向けフォールバック（電話番号はメール／Slack には載る）
    if (dbError && /phone|column/i.test(dbError.message || '')) {
      ({ error: dbError } = await supabase.from('form_submissions').insert([baseRow]));
    }

    if (dbError) {
      console.error('DB error:', dbError);
      return NextResponse.json({ error: 'db error' }, { status: 500 });
    }

    const formLabel = FORM_LABELS[form_type as string] || 'フォーム申し込み';

    // メールに差し込む値はすべてエスケープする（HTMLインジェクション防止）
    const e = {
      company_name: escapeHtml(company_name),
      contact_name: escapeHtml(contact_name),
      phone: escapeHtml(phone),
      legal_email: escapeHtml(legal_email),
      billing_email: escapeHtml(billing_email),
      account_email: escapeHtml(account_email),
      notes: escapeHtml(notes),
      source: escapeHtml(source),
    };

    // 回答内容の表テンプレート（フォーム種別で列ラベルを切り替え）
    const answerTable = form_type === 'contact'
      ? `<table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px">
  ${row('お名前', e.contact_name)}
  ${row('電話番号', e.phone)}
  ${row('メールアドレス', e.legal_email)}
  ${row('お問い合わせ種別', e.source)}
  ${row('お問い合わせ内容', e.notes)}
</table>`
      : `<table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px">
  ${row('企業名', e.company_name)}
  ${row('担当者名', e.contact_name)}
  ${row('電話番号', e.phone)}
  ${row('法務メールアドレス', e.legal_email)}
  ${row('請求先メールアドレス', e.billing_email)}
  ${row('アカウント登録メール', e.account_email)}
  ${row('情報源', e.source)}
  ${row('その他ご要望', e.notes)}
</table>`;

    // ① 管理者宛メール
    const adminHtml = header(`<h2 style="font-size:20px;margin:0 0 6px">📋 ${isContact ? '新しいお問い合わせが届きました' : '新しい申し込みが届きました'}</h2>
    <p style="font-size:13px;color:#938B81;margin:0 0 24px">${formLabel}</p>
    ${answerTable}
    <p style="font-size:12px;color:#B6ADA2;margin:0">管理画面からすべての申し込みを確認・管理できます。</p>`) + footer;

    // ② 送信者宛確認メール（legal_email が送信先）
    const submitterEmail = legal_email;
    const submitterHtml = header(`
    <h2 style="font-size:20px;margin:0 0 8px">${isContact ? 'お問い合わせありがとうございます' : 'お申し込みありがとうございます'}</h2>
    <p style="font-size:14px;color:#57514A;line-height:1.8;margin:0 0 24px">
      ${e.contact_name ? `${e.contact_name} 様、` : ''}以下の内容で${isContact ? 'お問い合わせ' : 'お申し込み'}を受け付けました。<br>
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
      ? `【お問い合わせ】${sanitizeSubject(contact_name) || '（名前なし）'} よりお問い合わせがありました`
      : `【${formLabel}】${sanitizeSubject(company_name)} より申し込みがありました`;

    // Slack 即時通知の本文（プレーンテキスト。DB保存済みの内容をそのまま流す）
    const slackLines = isContact
      ? [
          `*お名前:* ${contact_name}`,
          `*電話番号:* ${phone}`,
          `*メール:* ${legal_email}`,
          source ? `*お問い合わせ種別:* ${source}` : '',
          notes ? `*お問い合わせ内容:* ${notes}` : '',
        ]
      : [
          `*企業名:* ${company_name}`,
          `*担当者:* ${contact_name}`,
          `*電話番号:* ${phone}`,
          `*法務メール:* ${legal_email}`,
          billing_email ? `*請求先メール:* ${billing_email}` : '',
          account_email ? `*アカウントメール:* ${account_email}` : '',
          source ? `*情報源:* ${source}` : '',
          notes ? `*ご要望:* ${notes}` : '',
        ];
    const slackText = `:bell: *${isContact ? '新しいお問い合わせが届きました' : '新しい申し込みが届きました'}*（${formLabel}）\n${slackLines.filter(Boolean).join('\n')}`;

    // 管理者宛メールの宛先。Slack チャンネルのメール投稿アドレスが設定されていれば
    // 同じ通知をそのチャンネルにも届ける（Slackアプリ不要でチャンネルに投稿される）
    const adminRecipients =
      SLACK_CHANNEL_EMAIL && isValidEmail(SLACK_CHANNEL_EMAIL)
        ? [ADMIN_EMAIL, SLACK_CHANNEL_EMAIL]
        : ADMIN_EMAIL;

    // 送信（並列）。ラベル付きで管理し、失敗は種別ごとにログへ残す
    const jobs: { label: string; p: Promise<{ error?: unknown }> }[] = [
      {
        label: 'admin-email',
        p: resend.emails.send({
          from: `トウコべインターン <${FROM}>`,
          to: adminRecipients,
          subject: adminSubject,
          html: adminHtml,
        }),
      },
    ];

    if (submitterEmail) {
      jobs.push({
        label: 'submitter-email',
        p: resend.emails.send({
          from: `トウコべインターン <${FROM}>`,
          to: submitterEmail,
          subject: isContact
            ? '【受付完了】お問い合わせを受け付けました'
            : `【受付完了】${formLabel} のお申し込みを受け付けました`,
          html: submitterHtml,
        }),
      });
    }

    if (SLACK_WEBHOOK_URL) {
      jobs.push({
        label: 'slack',
        p: fetch(SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: slackText }),
        }).then(async (r) => (r.ok ? { error: undefined } : { error: `slack ${r.status}: ${await r.text().catch(() => '')}` })),
      });
    }

    // 送信は失敗しても throw せず記録するだけ（DB保存は完了しているので受付は成立）
    const results = await Promise.all(jobs.map((j) => j.p.catch((err) => ({ error: err }))));
    results.forEach((r, i) => {
      if (r?.error) console.error(`form-submit ${jobs[i].label} failed:`, r.error);
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('form-submit error:', e);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}
