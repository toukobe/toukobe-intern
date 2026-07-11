import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { escapeHtml, sanitizeSubject, isValidEmail, rateLimit } from '@/utils/apiSecurity';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL || 'noreply@intern.toukobe.com';
const SITE = 'https://intern.toukobe.com';

const anonClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type EmailType =
  | 'application_received'   // 企業宛: 学生が応募した
  | 'status_interview'       // 学生宛: 面接予定になった
  | 'status_offer'           // 学生宛: 内定が出た
  | 'status_rejected'        // 学生宛: 不採用になった
  | 'student_welcome';       // 学生宛: 登録完了ウェルカム

const EMAIL_TYPES: EmailType[] = ['application_received', 'status_interview', 'status_offer', 'status_rejected', 'student_welcome'];

interface EmailPayload {
  type: EmailType;
  to: string;
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

function applicationReceivedHtml(p: EmailPayload) {
  return `
<div style="font-family:'Hiragino Kaku Gothic Pro',Meiryo,sans-serif;max-width:560px;margin:0 auto;color:#1C1813">
  <div style="background:#F2620C;padding:20px 32px;border-radius:12px 12px 0 0">
    <p style="color:#fff;font-size:13px;margin:0;letter-spacing:.08em">TOUKOBE INTERN</p>
  </div>
  <div style="background:#fff;border:1px solid #EFE8DF;border-top:none;padding:32px;border-radius:0 0 12px 12px">
    <h2 style="font-size:20px;margin:0 0 16px">【新着応募】${p.jobTitle}</h2>
    <p style="font-size:14px;line-height:1.8;margin:0 0 24px;color:#57514A">
      ${p.companyName} 様<br>
      新しい応募がありました。ダッシュボードから確認・選考を進めてください。
    </p>
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

function statusChangedHtml(p: EmailPayload) {
  const statusMap: Record<string, { label: string; color: string; message: string }> = {
    status_interview: {
      label: '面接予定',
      color: '#1D4ED8',
      message: 'おめでとうございます！面接に進むことになりました。企業からの連絡をお待ちください。',
    },
    status_offer: {
      label: '内定',
      color: '#15803D',
      message: 'おめでとうございます！内定のご連絡です。詳細は企業からの連絡をご確認ください。',
    },
    status_rejected: {
      label: '不採用',
      color: '#B91C1C',
      message: '今回は残念ながら選考を終了させていただきます。またぜひ他の求人にもご応募ください。',
    },
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
      <strong>${p.companyName}</strong>「${p.jobTitle}」の選考結果をお知らせします。<br>${s.message}
    </p>
    ${p.jobId ? `<a href="${SITE}/jobs/${p.jobId}" style="display:inline-block;background:#F2620C;color:#fff;text-decoration:none;border-radius:8px;padding:13px 28px;font-weight:700;font-size:14px">求人を確認する →</a>` : ''}
    <p style="font-size:12px;color:#B6ADA2;margin:24px 0 0">このメールはトウコべインターンから自動送信されています。</p>
  </div>
</div>`;
}

function studentWelcomeHtml(p: EmailPayload) {
  return `
<div style="font-family:'Hiragino Kaku Gothic Pro',Meiryo,sans-serif;max-width:560px;margin:0 auto;color:#1C1813">
  <div style="background:#F2620C;padding:20px 32px;border-radius:12px 12px 0 0">
    <p style="color:#fff;font-size:13px;margin:0;letter-spacing:.08em">TOUKOBE INTERN</p>
  </div>
  <div style="background:#fff;border:1px solid #EFE8DF;border-top:none;padding:32px;border-radius:0 0 12px 12px">
    <h2 style="font-size:20px;margin:0 0 16px">🎉 登録ありがとうございます！</h2>
    <p style="font-size:14px;line-height:1.8;margin:0 0 8px;color:#57514A">
      ${p.studentName ? `${p.studentName} さん、` : ''}トウコべインターンへようこそ！
    </p>
    <p style="font-size:14px;line-height:1.8;margin:0 0 24px;color:#57514A">
      プロフィールの登録が完了しました。さっそく求人を探して、理想のインターンシップに応募してみましょう。
    </p>
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
    const { type, to } = rawPayload;

    if (!to || !type || !EMAIL_TYPES.includes(type)) {
      return NextResponse.json({ error: 'missing fields' }, { status: 400 });
    }
    if (!isValidEmail(to)) {
      return NextResponse.json({ error: 'invalid recipient' }, { status: 400 });
    }

    const payload = sanitizePayload(rawPayload);

    const subjectMap: Record<EmailType, string> = {
      application_received: `【新着応募】${sanitizeSubject(rawPayload.jobTitle)} への応募がありました`,
      status_interview: `【面接予定】${sanitizeSubject(rawPayload.companyName)}「${sanitizeSubject(rawPayload.jobTitle)}」の選考結果`,
      status_offer: `【内定】${sanitizeSubject(rawPayload.companyName)}「${sanitizeSubject(rawPayload.jobTitle)}」の選考結果`,
      status_rejected: `【選考結果】${sanitizeSubject(rawPayload.companyName)}「${sanitizeSubject(rawPayload.jobTitle)}」の選考結果`,
      student_welcome: 'トウコべインターンへようこそ！登録が完了しました',
    };

    const html = type === 'application_received'
      ? applicationReceivedHtml(payload)
      : type === 'student_welcome'
      ? studentWelcomeHtml(payload)
      : statusChangedHtml(payload);

    // onboarding@resend.dev はアカウント登録メール宛にしか送れないため
    // 独自ドメイン設定前は強制的に登録メールへ送る
    const actualTo = FROM === 'onboarding@resend.dev'
      ? 'ru_matsumoto@manabiph.com'
      : to;

    const { error } = await resend.emails.send({
      from: `トウコべインターン <${FROM}>`,
      to: actualTo,
      subject: FROM === 'onboarding@resend.dev'
        ? `[テスト: 本来の宛先: ${sanitizeSubject(to, 254)}] ${subjectMap[type]}`
        : subjectMap[type],
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
