import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const redirect = searchParams.get('redirect');

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    try {
      const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error || !session) {
        return NextResponse.redirect(new URL('/auth/login?error=callback_failed', origin));
      }

      // Look up user_type to redirect to the right dashboard
      const { data: ut } = await supabase
        .from('user_types')
        .select('user_type')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (!ut) {
        // New OAuth user — needs to pick student/company
        return NextResponse.redirect(new URL('/auth/setup', origin));
      }

      if (ut.user_type === 'company') {
        return NextResponse.redirect(new URL('/dashboard/company', origin));
      }
      if (ut.user_type === 'student') {
        return NextResponse.redirect(new URL(redirect || '/dashboard/student', origin));
      }
      if (session.user.email === 'ru_matsumoto@manabiph.com') {
        return NextResponse.redirect(new URL('/dashboard/admin', origin));
      }
      return NextResponse.redirect(new URL('/', origin));
    } catch (error) {
      console.error('Auth callback error:', error);
      return NextResponse.redirect(new URL('/auth/login', origin));
    }
  }

  return NextResponse.redirect(new URL('/auth/login', origin));
}
