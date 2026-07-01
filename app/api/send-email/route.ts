import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL || 'noreply@toukobe-intern.com';
const SITE = 'https://toukobe-intern.com';

type EmailType =
  | 'application_received'   // 企業宛: 学生が応募した
  | 'status_interview'       // 学生宛: 面接予定になった
  | 'status_offer'           // 学生宛: 内定が出た
  | 'status_rejected'        // 学生宛: 不採用になった
  | 'student_welcome';       // 学生宛: 登録完了ウェルカム

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
  applicationId?: string;
  // ステータス変更 (学生宛)
  jobId?: string;
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
      <tr><td style="padding:10px 12px;background:#FBF8F4;border:1px solid #EFE8DF;font-weight:600">応募職種</td><td style="padding:10px 12px;border:1px solid #EFE8DF">${p.jobTitle}</td></tr>
    </table>
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
        <li>企業からのメッセージは登録メールアドレスに届きます</li>
      </ul>
    </div>
    <p style="font-size:12px;color:#B6ADA2;margin:24px 0 0">このメールはトウコべインターンから自動送信されています。</p>
  </div>
</div>`;
}

export async function POST(req: NextRequest) {
  try {
    const payload: EmailPayload = await req.json();
    const { type, to } = payload;

    if (!to || !type) {
      return NextResponse.json({ error: 'missing fields' }, { status: 400 });
    }

    const subjectMap: Record<EmailType, string> = {
      application_received: `【新着応募】${payload.jobTitle} への応募がありました`,
      status_interview: `【面接予定】${payload.companyName}「${payload.jobTitle}」の選考結果`,
      status_offer: `【内定】${payload.companyName}「${payload.jobTitle}」の選考結果`,
      status_rejected: `【選考結果】${payload.companyName}「${payload.jobTitle}」の選考結果`,
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
      subject: `[テスト: 本来の宛先: ${to}] ${subjectMap[type]}`,
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('send-email error:', e);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}
