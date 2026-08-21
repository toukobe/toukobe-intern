import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyApprovalToken } from '@/utils/approvalToken';

// メールの承認ボタンから、ログインなしで求人を承認（公開）するためのAPI。
// 認可は「署名トークンが正しいこと」で行う（管理者のメールに届いたトークンだけが有効）。
// GET  … トークンを確認して求人情報を返す（確認ページ表示用・状態は変えない）
// POST … トークンを確認して求人を published にする（実際の承認）

function svc() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

async function loadJob(token: string) {
  const v = verifyApprovalToken(token);
  if (!v) return { error: 'このリンクは無効か、有効期限が切れています。管理画面から承認してください。', status: 400 as const };
  const { data: job } = await svc().from('jobs').select('id, job_title, status, company_id, location, salary').eq('id', v.jobId).maybeSingle();
  if (!job) return { error: '対象の求人が見つかりません（削除された可能性があります）。', status: 404 as const };
  const { data: company } = await svc().from('companies').select('company_name').eq('id', job.company_id).maybeSingle();
  return { job, companyName: company?.company_name ?? '' };
}

export async function GET(req: NextRequest) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ error: 'server misconfigured' }, { status: 500 });
  const token = req.nextUrl.searchParams.get('token') || '';
  const r = await loadJob(token);
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status });
  return NextResponse.json({
    ok: true,
    job: { id: r.job.id, title: r.job.job_title, status: r.job.status, location: r.job.location, salary: r.job.salary },
    companyName: r.companyName,
  });
}

export async function POST(req: NextRequest) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ error: 'server misconfigured' }, { status: 500 });
  const { token } = await req.json().catch(() => ({ token: '' }));
  const r = await loadJob(token);
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status });

  // すでに公開済みなら二重処理せず成功扱い（メールのボタンを何度押しても安全）
  if (r.job.status === 'published') {
    return NextResponse.json({ ok: true, alreadyPublished: true, job: { title: r.job.job_title } });
  }
  // 承認待ち以外（下書き・停止中など）は、意図しない公開を避けて弾く
  if (r.job.status !== 'pending') {
    return NextResponse.json({ error: `この求人は現在「${r.job.status}」の状態のため、メールからは承認できません。管理画面をご確認ください。` }, { status: 409 });
  }

  const { error } = await svc().from('jobs').update({ status: 'published' }).eq('id', r.job.id);
  if (error) return NextResponse.json({ error: '承認処理に失敗しました: ' + error.message }, { status: 500 });
  return NextResponse.json({ ok: true, job: { title: r.job.job_title } });
}
