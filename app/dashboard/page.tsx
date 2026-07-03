'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

export default function DashboardRouter() {
  const router = useRouter();

  useEffect(() => {
    async function route() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth/login'); return; }

      const { data: userType } = await supabase
        .from('user_types')
        .select('user_type')
        .eq('user_id', session.user.id)
        .single();

      if (!userType) { router.push('/auth/login'); return; }

      if (userType.user_type === 'admin') router.push('/dashboard/admin');
      else if (userType.user_type === 'company') router.push('/dashboard/company');
      else if (userType.user_type === 'student') router.push('/dashboard/student');
      else router.push('/');
    }
    route();
  }, [router]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FBF8F4', fontFamily: "var(--font-sans)" }}>
      <div style={{ width: 36, height: 36, border: '2.5px solid #F2620C', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
