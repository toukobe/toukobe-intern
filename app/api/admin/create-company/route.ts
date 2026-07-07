import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAIL = 'ru_matsumoto@manabiph.com';

const anonClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

    const { company_name, industry, contact_email, login_email } = await req.json();
    if (!company_name || !industry || !contact_email || !login_email) {
      return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 });
    }

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: company, error: companyError } = await adminClient
      .from('companies')
      .insert([{ company_name, industry, contact_email }])
      .select()
      .single();
    if (companyError) {
      return NextResponse.json({ error: companyError.message }, { status: 500 });
    }

    const { data: authData, error: createUserError } = await adminClient.auth.admin.createUser({
      email: login_email,
      password: randomBytes(24).toString('base64url'),
      email_confirm: true,
    });
    if (createUserError || !authData.user) {
      await adminClient.from('companies').delete().eq('id', company.id);
      return NextResponse.json({ error: createUserError?.message || 'ユーザー作成に失敗しました' }, { status: 500 });
    }

    const { error: userTypeError } = await adminClient
      .from('user_types')
      .insert([{ user_id: authData.user.id, user_type: 'company', company_id: company.id }]);
    if (userTypeError) {
      // 途中で失敗した場合は作成済みのユーザー・企業を巻き戻す（孤児レコード防止）
      await adminClient.auth.admin.deleteUser(authData.user.id).catch(() => {});
      await adminClient.from('companies').delete().eq('id', company.id);
      return NextResponse.json({ error: userTypeError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, company, login_email });
  } catch (e) {
    console.error('create-company error:', e);
    return NextResponse.json({ error: '内部エラーが発生しました' }, { status: 500 });
  }
}
