import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { escapeHtml, sanitizeSubject, isValidEmail, rateLimit } from '@/utils/apiSecurity';

const resend = new Resend(process.env.RESEND_API_KEY);
// 環境変数が空・空白・不正な形式でも必ず有効な送信元に落とす（422 Invalid from 対策）
const RAW_FROM = (process.env.RESEND_FROM_EMAIL || '').trim();
const FROM = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(RAW_FROM) ? RAW_FROM : 'noreply@intern.toukobe.com';
const SITE = 'https://intern.toukobe.com';

const anonClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type EmailType =
  | 'application_received'   // 企業宛: 学生が応募した
  | 'application_viewed'     // 学生宛: 企業が応募を確認した
  | 'status_interview'       // 学生宛: 面接予定になった
  | 'status_offer'           // 学生宛: 内定が出た
  | 'status_rejected'        // 学生宛: 不採用になった
  | 'student_welcome';       // 学生宛: 登録完了ウェルカム

const EMAIL_TYPES: EmailType[] = ['application_received', 'application_viewed', 'status_interview', 'status_offer', 'status_rejected', 'student_welcome'];

// 既定の件名・本文。管理者ページ「メール文面」タブ（email_templatesテーブル）で上書きできる。
// 本文では {{jobTitle}} {{companyName}} {{studentName}} が差し込み変数として使える。
const DEFAULT_TEMPLATES: Record<EmailType, { subject: string; body: string }> = {
  application_received: {
    subject: '【新着応募】{{jobTitle}} への応募がありました',
    body: '{{companyName}} 様\n新しい応募がありました。ダッシュボードから確認・選考を進めてください。',
  },
  application_viewed: {
    subject: '【応募確認】{{companyName}}があなたの応募を確認しました',
    body: '{{companyName}} が「{{jobTitle}}」へのあなたの応募を確認しました。\n今後、企業から選考のご連絡が届くことがあります。登録した連絡用メールアドレスへのメールを見逃さないようご注意ください（迷惑メールフォルダも合わせてご確認ください）。',
  },
  status_interview: {
    subject: '【面接予定】{{companyName}}「{{jobTitle}}」の選考結果',
    body: 'おめでとうございます！面接に進むことになりました。企業からの連絡をお待ちください。',
  },
  status_offer: {
    subject: '【内定】{{companyName}}「{{jobTitle}}」の選考結果',
    body: 'おめでとうございます！内定のご連絡です。詳細は企業からの連絡をご確認ください。',
  },
  status_rejected: {
    subject: '【選考結果】{{companyName}}「{{jobTitle}}」の選考結果',
    body: '今回は残念ながら選考を終了させていただきます。またぜひ他の求人にもご応募ください。',
  },
  student_welcome: {
    subject: 'トウコべインターンへようこそ！登録が完了しました',
    body: '{{studentName}} さん、トウコべインターンへようこそ！\nプロフィールの登録が完了しました。さっそく求人を探して、理想のインターンシップに応募してみましょう。',
  },
};

// email_templates から上書き文面を読む（テーブル未作成・空なら既定文面のまま）
async function loadTemplate(type: EmailType): Promise<{ subject: string; body: string }> {
  try {
    const { data } = await anonClient.from('email_templates').select('subject, body').eq('slug', type).maybeSingle();
    return {
      subject: data?.subject?.trim() || DEFAULT_TEMPLATES[type].subject,
      body: data?.body?.trim() || DEFAULT_TEMPLATES[type].body,
    };
  } catch {
    return DEFAULT_TEMPLATES[type];
  }
}

// {{変数}} を実際の値に置き換える（値は呼び出し側でエスケープ済みにすること）
function fill(text: string, vars: Record<string, string | undefined>) {
  return text.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] || '');
}

interface EmailPayload {
  type: EmailType;
  to?: string; // 後方互換で受け取るが使用しない。宛先はサーバー側でDBから確定する
  // 共通
  jobTitle?: string;
  companyName?: string;
  // 応募通知 (企業宛)
  studentName?: string;
  studentUniversity?: string;
  studentGrade?: string;
  studentEmail?: string;
  applicationId?: string;
  // ステータス変更 (学生宛)
  jobId?: string;
}

// メールに差し込むフィールドをすべてエスケープ済みにする
function sanitizePayload(p: EmailPayload): EmailPayload {
  return {
    ...p,
    jobTitle: escapeHtml(p.jobTitle).slice(0, 200),
    companyName: escapeHtml(p.companyName).slice(0, 200),
    studentName: escapeHtml(p.studentName).slice(0, 100),
    studentUniversity: escapeHtml(p.studentUniversity).slice(0, 100),
    studentGrade: escapeHtml(p.studentGrade).slice(0, 50),
    studentEmail: typeof p.studentEmail === 'string' && isValidEmail(p.studentEmail) ? escapeHtml(p.studentEmail) : undefined,
    jobId: typeof p.jobId === 'string' && /^[0-9a-f-]{1,64}$/i.test(p.jobId) ? p.jobId : undefined,
  };
}

function applicationReceivedHtml(p: EmailPayload, bodyHtml: string) {
  return `
<div style="font-family:'Hiragino Kaku Gothic Pro',Meiryo,sans-serif;max-width:560px;margin:0 auto;color:#1C1813">
  <div style="background:#F2620C;padding:20px 32px;border-radius:12px 12px 0 0">
    <p style="color:#fff;font-size:13px;margin:0;letter-spacing:.08em">TOUKOBE INTERN</p>
  </div>
  <div style="background:#fff;border:1px solid #EFE8DF;border-top:none;padding:32px;border-radius:0 0 12px 12px">
    <h2 style="font-size:20px;margin:0 0 16px">【新着応募】${p.jobTitle}</h2>
    <p style="font-size:14px;line-height:1.8;margin:0 0 24px;color:#57514A">${bodyHtml}</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px">
      <tr><td style="padding:10px 12px;background:#FBF8F4;border:1px solid #EFE8DF;font-weight:600;width:120px">氏名</td><td style="padding:10px 12px;border:1px solid #EFE8DF">${p.studentName || '—'}</td></tr>
      <tr><td style="padding:10px 12px;background:#FBF8F4;border:1px solid #EFE8DF;font-weight:600">大学</td><td style="padding:10px 12px;border:1px solid #EFE8DF">${p.studentUniversity || '—'}</td></tr>
      <tr><td style="padding:10px 12px;background:#FBF8F4;border:1px solid #EFE8DF;font-weight:600">学年</td><td style="padding:10px 12px;border:1px solid #EFE8DF">${p.studentGrade || '—'}</td></tr>
      <tr><td style="padding:10px 12px;background:#FBF8F4;border:1px solid #EFE8DF;font-weight:600">連絡先メール</td><td style="padding:10px 12px;border:1px solid #EFE8DF">${p.studentEmail ? `<a href="mailto:${p.studentEmail}" style="color:#F2620C">${p.studentEmail}</a>` : '—'}</td></tr>
      <tr><td style="padding:10px 12px;background:#FBF8F4;border:1px solid #EFE8DF;font-weight:600">応募職種</td><td style="padding:10px 12px;border:1px solid #EFE8DF">${p.jobTitle}</td></tr>
    </table>
    <p style="font-size:13px;line-height:1.8;margin:0 0 24px;color:#57514A">選考のご連絡は、上記の連絡先メールアドレス宛に直接お送りください。学生には「貴社の登録メールアドレスから連絡が届く」と案内しています。</p>
    <a href="${SITE}/dashboard/company/applicants" style="display:inline-block;background:#F2620C;color:#fff;text-decoration:none;border-radius:8px;padding:13px 28px;font-weight:700;font-size:14px">応募者を確認する →</a>
    <p style="font-size:12px;color:#B6ADA2;margin:24px 0 0">このメールはトウコべインターンから自動送信されています。</p>
  </div>
</div>`;
}

function applicationViewedHtml(p: EmailPayload, bodyHtml: string) {
  return `
<div style="font-family:'Hiragino Kaku Gothic Pro',Meiryo,sans-serif;max-width:560px;margin:0 auto;color:#1C1813">
  <div style="background:#F2620C;padding:20px 32px;border-radius:12px 12px 0 0">
    <p style="color:#fff;font-size:13px;margin:0;letter-spacing:.08em">TOUKOBE INTERN</p>
  </div>
  <div style="background:#fff;border:1px solid #EFE8DF;border-top:none;padding:32px;border-radius:0 0 12px 12px">
    <div style="display:inline-block;background:#F2620C15;color:#F2620C;border:1px solid #F2620C40;border-radius:999px;padding:6px 16px;font-size:13px;font-weight:700;margin-bottom:16px">応募確認</div>
    <h2 style="font-size:20px;margin:0 0 16px">企業があなたの応募を確認しました</h2>
    <p style="font-size:14px;line-height:1.8;margin:0 0 20px;color:#57514A">${bodyHtml}</p>
    <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;padding:14px 18px;margin-bottom:24px">
      <p style="font-size:13px;color:#92400E;margin:0;line-height:1.8">📧 選考のご連絡は企業から直接メールで届きます。見慣れないアドレスからのメールも見落とさないようご注意ください。</p>
    </div>
    <a href="${p.jobId ? `${SITE}/jobs/${p.jobId}` : `${SITE}/dashboard/student`}" style="display:inline-block;background:#F2620C;color:#fff;text-decoration:none;border-radius:8px;padding:13px 28px;font-weight:700;font-size:14px">${p.jobId ? '求人を確認する' : 'マイページを開く'} →</a>
    <p style="font-size:12px;color:#B6ADA2;margin:24px 0 0">このメールはトウコべインターンから自動送信されています。</p>
  </div>
</div>`;
}

function statusChangedHtml(p: EmailPayload, bodyHtml: string) {
  const statusMap: Record<string, { label: string; color: string }> = {
    status_interview: { label: '面接予定', color: '#1D4ED8' },
    status_offer:     { label: '内定',     color: '#15803D' },
    status_rejected:  { label: '不採用',   color: '#B91C1C' },
  };
  const s = statusMap[p.type] || statusMap.status_rejected;
  return `
<div style="font-family:'Hiragino Kaku Gothic Pro',Meiryo,sans-serif;max-width:560px;margin:0 auto;color:#1C1813">
  <div style="background:#F2620C;padding:20px 32px;border-radius:12px 12px 0 0">
    <p style="color:#fff;font-size:13px;margin:0;letter-spacing:.08em">TOUKOBE INTERN</p>
  </div>
  <div style="background:#fff;border:1px solid #EFE8DF;border-top:none;padding:32px;border-radius:0 0 12px 12px">
    <div style="display:inline-block;background:${s.color}15;color:${s.color};border:1px solid ${s.color}40;border-radius:999px;padding:6px 16px;font-size:13px;font-weight:700;margin-bottom:16px">${s.label}</div>
    <h2 style="font-size:20px;margin:0 0 16px">選考結果のお知らせ</h2>
    <p style="font-size:14px;line-height:1.8;margin:0 0 20px;color:#57514A">
      <strong>${p.companyName}</strong>「${p.jobTitle}」の選考結果をお知らせします。<br>${bodyHtml}
    </p>
    <a href="${p.jobId ? `${SITE}/jobs/${p.jobId}` : `${SITE}/dashboard/student`}" style="display:inline-block;background:#F2620C;color:#fff;text-decoration:none;border-radius:8px;padding:13px 28px;font-weight:700;font-size:14px">${p.jobId ? '求人を確認する' : 'マイページを開く'} →</a>
    <p style="font-size:13px;line-height:1.7;margin:20px 0 0"><a href="${SITE}" style="color:#F2620C;text-decoration:none">トウコべインターンを開く →</a></p>
    <p style="font-size:12px;color:#B6ADA2;margin:24px 0 0">このメールはトウコべインターンから自動送信されています。</p>
  </div>
</div>`;
}

function studentWelcomeHtml(p: EmailPayload, bodyHtml: string) {
  return `
<div style="font-family:'Hiragino Kaku Gothic Pro',Meiryo,sans-serif;max-width:560px;margin:0 auto;color:#1C1813">
  <div style="background:#F2620C;padding:20px 32px;border-radius:12px 12px 0 0">
    <p style="color:#fff;font-size:13px;margin:0;letter-spacing:.08em">TOUKOBE INTERN</p>
  </div>
  <div style="background:#fff;border:1px solid #EFE8DF;border-top:none;padding:32px;border-radius:0 0 12px 12px">
    <h2 style="font-size:20px;margin:0 0 16px">🎉 登録ありがとうございます！</h2>
    <p style="font-size:14px;line-height:1.8;margin:0 0 24px;color:#57514A">${bodyHtml}</p>
    <a href="${SITE}/search" style="display:inline-block;background:#F2620C;color:#fff;text-decoration:none;border-radius:8px;padding:13px 28px;font-weight:700;font-size:14px">求人を探す →</a>
    <div style="margin-top:28px;padding:20px;background:#FBF8F4;border-radius:10px">
      <p style="font-size:13px;font-weight:700;margin:0 0 10px;color:#1C1813">📋 次にやること</p>
      <ul style="font-size:13px;color:#57514A;margin:0;padding-left:18px;line-height:2">
        <li>プロフィールを100%完成させると応募できるようになります</li>
        <li>気になる求人はお気に入りに追加しておきましょう</li>
        <li>企業からの選考連絡は登録した連絡用メールアドレスに届きます</li>
      </ul>
    </div>
    <p style="font-size:12px;color:#B6ADA2;margin:24px 0 0">このメールはトウコべインターンから自動送信されています。</p>
  </div>
</div>`;
}

export async function POST(req: NextRequest) {
  try {
    // 認証必須: ログイン済みユーザーの Supabase アクセストークンを検証する
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) {
      return NextResponse.json({ error: 'authentication required' }, { status: 401 });
    }
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'invalid token' }, { status: 401 });
    }

    // ユーザー単位のレート制限（1時間に20通まで）
    if (!rateLimit(`send-email:${user.id}`, 20, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'rate limit exceeded' }, { status: 429 });
    }

    const rawPayload: EmailPayload = await req.json();
    const { type } = rawPayload;

    if (!type || !EMAIL_TYPES.includes(type)) {
      return NextResponse.json({ error: 'missing fields' }, { status: 400 });
    }

    // 宛先はクライアント指定(rawPayload.to)を一切信用せず、認証情報とDBからサーバー側で確定する。
    // （従来は to をそのまま使っていたため、ログイン済みなら公式ドメイン差出で任意の宛先に
    //   定型メールを送れてしまう問題があった。ここで送信元の権限も併せて検証する）
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'server misconfigured' }, { status: 500 });
    }
    const svc = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const appId = typeof rawPayload.applicationId === 'string' && /^[0-9a-f-]{10,64}$/i.test(rawPayload.applicationId)
      ? rawPayload.applicationId : null;

    let recipient: string | null = null;
    if (type === 'student_welcome') {
      // 登録した本人宛（トークンで確認済みのメールアドレス）
      recipient = user.email ?? null;
    } else if (type === 'application_received') {
      // 応募した本人(student)が呼び出し、その求人を出している企業へ通知する
      if (!appId) return NextResponse.json({ error: 'applicationId required' }, { status: 400 });
      const { data: app } = await svc.from('applications').select('user_id, job_id').eq('id', appId).maybeSingle();
      if (!app || app.user_id !== user.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
      const { data: job } = await svc.from('jobs').select('company_id').eq('id', app.job_id).maybeSingle();
      const { data: company } = job
        ? await svc.from('companies').select('contact_email').eq('id', job.company_id).maybeSingle()
        : { data: null };
      recipient = company?.contact_email ?? null;
    } else {
      // application_viewed / status_* : 企業が呼び出し、応募してきた学生へ通知する
      if (!appId) return NextResponse.json({ error: 'applicationId required' }, { status: 400 });
      const { data: app } = await svc.from('applications').select('user_id, job_id').eq('id', appId).maybeSingle();
      if (!app) return NextResponse.json({ error: 'not found' }, { status: 404 });
      const { data: job } = await svc.from('jobs').select('company_id').eq('id', app.job_id).maybeSingle();
      const { data: ut } = await svc.from('user_types').select('company_id').eq('user_id', user.id).maybeSingle();
      // 呼び出し元(企業ユーザー)がこの応募の求人を保有していること
      if (!job || !ut || !ut.company_id || ut.company_id !== job.company_id) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 });
      }
      const { data: prof } = await svc.from('student_profiles').select('contact_email').eq('user_id', app.user_id).maybeSingle();
      recipient = prof?.contact_email ?? null;
    }

    if (!recipient || !isValidEmail(recipient)) {
      return NextResponse.json({ error: 'recipient not resolved' }, { status: 400 });
    }

    const payload = sanitizePayload(rawPayload);

    // 件名・本文: 管理者が編集したテンプレート（無ければ既定文面）に変数を差し込む
    const tpl = await loadTemplate(type);
    const subject = fill(tpl.subject, {
      jobTitle: sanitizeSubject(rawPayload.jobTitle),
      companyName: sanitizeSubject(rawPayload.companyName),
      studentName: sanitizeSubject(rawPayload.studentName),
    });
    const bodyHtml = fill(escapeHtml(tpl.body), {
      jobTitle: payload.jobTitle,
      companyName: payload.companyName,
      studentName: payload.studentName,
    }).replace(/\n/g, '<br>');

    const html = type === 'application_received'
      ? applicationReceivedHtml(payload, bodyHtml)
      : type === 'application_viewed'
      ? applicationViewedHtml(payload, bodyHtml)
      : type === 'student_welcome'
      ? studentWelcomeHtml(payload, bodyHtml)
      : statusChangedHtml(payload, bodyHtml);

    // onboarding@resend.dev はアカウント登録メール宛にしか送れないため
    // 独自ドメイン設定前は強制的に登録メールへ送る
    const actualTo = FROM === 'onboarding@resend.dev'
      ? 'ru_matsumoto@manabiph.com'
      : recipient;

    const { error } = await resend.emails.send({
      from: `トウコべインターン <${FROM}>`,
      to: actualTo,
      subject: FROM === 'onboarding@resend.dev'
        ? `[テスト: 本来の宛先: ${sanitizeSubject(recipient, 254)}] ${subject}`
        : subject,
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: 'send failed' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('send-email error:', e);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}
