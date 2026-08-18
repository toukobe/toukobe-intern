import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const ADMIN_EMAIL = 'ru_matsumoto@manabiph.com';

const anonClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/** company-logos / job-covers は `${companyId}/...` に置いているので、フォルダごと消す（失敗しても続行） */
async function removeStorageFolder(admin: SupabaseClient, bucket: string, companyId: string) {
  try {
    const { data, error } = await admin.storage.from(bucket).list(companyId, { limit: 1000 });
    if (error || !data || data.length === 0) return;
    await admin.storage.from(bucket).remove(data.map(f => `${companyId}/${f.name}`));
  } catch (e) {
    console.error(`delete-company: storage cleanup failed (${bucket}):`, e);
  }
}

/**
 * 企業アカウントの完全削除（管理者のみ）。
 * ブラウザから companies を直接 DELETE すると、求人・応募・ログインユーザーが残るため
 * 外部キー制約で失敗する（＝管理者ページで「削除できない」状態になっていた）。
 * ここで service role を使い、依存データ → 認証ユーザー → 企業 の順に消す。
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'サーバー設定エラー: SUPABASE_SERVICE_ROLE_KEY が未設定です' }, { status: 500 });
    }

    const { company_id, company_name } = await req.json();
    if (!company_id) {
      return NextResponse.json({ error: '企業IDが指定されていません' }, { status: 400 });
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 対象企業の存在確認。名前も送られていれば一致するか検証する（取り違え防止）
    const { data: company, error: companyErr } = await admin
      .from('companies')
      .select('id, company_name')
      .eq('id', company_id)
      .maybeSingle();
    if (companyErr) {
      return NextResponse.json({ error: companyErr.message }, { status: 500 });
    }
    if (!company) {
      return NextResponse.json({ error: '対象の企業が見つかりません' }, { status: 404 });
    }
    if (company_name && company.company_name !== company_name) {
      return NextResponse.json({ error: '企業名が一致しません。画面を再読み込みしてやり直してください' }, { status: 409 });
    }

    // 1. この企業の求人を洗い出し、求人にぶら下がるデータから消す
    const { data: jobRows, error: jobsErr } = await admin
      .from('jobs')
      .select('id')
      .eq('company_id', company_id);
    if (jobsErr) {
      return NextResponse.json({ error: `求人の取得に失敗しました: ${jobsErr.message}` }, { status: 500 });
    }
    const jobIds = (jobRows || []).map(j => j.id as string);

    let deletedApplications = 0;
    if (jobIds.length > 0) {
      const { error: favErr } = await admin.from('favorites').delete().in('job_id', jobIds);
      if (favErr) {
        return NextResponse.json({ error: `お気に入りの削除に失敗しました: ${favErr.message}` }, { status: 500 });
      }
      const { data: appRows, error: appErr } = await admin
        .from('applications')
        .delete()
        .in('job_id', jobIds)
        .select('id');
      if (appErr) {
        return NextResponse.json({ error: `応募データの削除に失敗しました: ${appErr.message}` }, { status: 500 });
      }
      deletedApplications = appRows?.length ?? 0;

      const { error: delJobsErr } = await admin.from('jobs').delete().eq('company_id', company_id);
      if (delJobsErr) {
        return NextResponse.json({ error: `求人の削除に失敗しました: ${delJobsErr.message}` }, { status: 500 });
      }
    }

    // 2. この企業のログインアカウント（認証ユーザー）を消す
    const { data: userTypeRows, error: utErr } = await admin
      .from('user_types')
      .select('user_id')
      .eq('company_id', company_id);
    if (utErr) {
      return NextResponse.json({ error: `ユーザー情報の取得に失敗しました: ${utErr.message}` }, { status: 500 });
    }
    const userIds = (userTypeRows || []).map(u => u.user_id as string);

    const { error: delUtErr } = await admin.from('user_types').delete().eq('company_id', company_id);
    if (delUtErr) {
      return NextResponse.json({ error: `ユーザー種別の削除に失敗しました: ${delUtErr.message}` }, { status: 500 });
    }
    for (const uid of userIds) {
      const { error: delUserErr } = await admin.auth.admin.deleteUser(uid);
      // 認証ユーザーが既にいない場合もあるのでログのみ（企業レコードの削除は続行する）
      if (delUserErr) console.error('delete-company: failed to delete auth user', uid, delUserErr);
    }

    // 3. 企業レコード本体
    const { error: delCompanyErr } = await admin.from('companies').delete().eq('id', company_id);
    if (delCompanyErr) {
      return NextResponse.json({ error: `企業の削除に失敗しました: ${delCompanyErr.message}` }, { status: 500 });
    }

    // 4. 画像はベストエフォートで後始末（失敗しても削除自体は成功扱い）
    await removeStorageFolder(admin, 'company-logos', company_id);
    await removeStorageFolder(admin, 'job-covers', company_id);

    return NextResponse.json({
      ok: true,
      deleted: {
        company_name: company.company_name,
        jobs: jobIds.length,
        applications: deletedApplications,
        accounts: userIds.length,
      },
    });
  } catch (e) {
    console.error('delete-company error:', e);
    return NextResponse.json({ error: '内部エラーが発生しました' }, { status: 500 });
  }
}
