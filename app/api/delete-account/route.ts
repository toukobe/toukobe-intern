import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '@/utils/apiSecurity';

const anonClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // 認証必須: 本人の Supabase アクセストークンを検証する
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) {
      return NextResponse.json({ error: 'authentication required' }, { status: 401 });
    }
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'invalid token' }, { status: 401 });
    }

    if (!rateLimit(`delete-account:${user.id}`, 3, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'rate limit exceeded' }, { status: 429 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'サーバー設定エラー' }, { status: 500 });
    }
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 企業アカウントは求人・応募データが契約に紐づくため、自動削除は学生のみ
    const { data: ut } = await adminClient
      .from('user_types')
      .select('user_type, company_id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (ut && ut.user_type !== 'student') {
      return NextResponse.json(
        { error: '企業アカウントの退会はお問い合わせフォームよりご連絡ください' },
        { status: 403 }
      );
    }

    // 学生の関連データを削除してから認証アカウントを削除する
    const userId = user.id;
    const tables = ['favorites', 'applications', 'student_profiles', 'user_types'] as const;
    for (const table of tables) {
      const { error } = await adminClient.from(table).delete().eq('user_id', userId);
      if (error) {
        console.error(`delete-account: failed to delete from ${table}:`, error);
        return NextResponse.json({ error: '退会処理に失敗しました。お問い合わせフォームよりご連絡ください' }, { status: 500 });
      }
    }

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error('delete-account: failed to delete auth user:', deleteError);
      return NextResponse.json({ error: '退会処理に失敗しました。お問い合わせフォームよりご連絡ください' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('delete-account error:', e);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}
