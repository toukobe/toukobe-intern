'use client';

import { useEffect, useState } from 'react';
import { supabase } from './supabase';

// 管理者用: 承認待ち求人数
export function usePendingJobs() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    async function fetchCount() {
      const { count: c } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      setCount(c || 0);
    }

    fetchCount();

    const channel = supabase
      .channel(`pending-jobs-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => {
        fetchCount();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return count;
}
