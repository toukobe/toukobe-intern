'use client';

import { useEffect, useState } from 'react';
import { supabase } from './supabase';

// 学生・企業共通: 未読メッセージ数
export function useUnreadMessages(userId: string | null) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    async function fetchCount() {
      const { data: ut } = await supabase
        .from('user_types')
        .select('user_type, company_id')
        .eq('user_id', userId)
        .single();
      if (!ut) { setCount(0); return; }

      let applicationIds: string[] = [];
      if (ut.user_type === 'student') {
        const { data: apps } = await supabase.from('applications').select('id').eq('user_id', userId);
        applicationIds = (apps || []).map((a: { id: string }) => a.id);
      } else if (ut.user_type === 'company' && ut.company_id) {
        const { data: jobs } = await supabase.from('jobs').select('id').eq('company_id', ut.company_id);
        const jobIds = (jobs || []).map((j: { id: string }) => j.id);
        if (jobIds.length > 0) {
          const { data: apps } = await supabase.from('applications').select('id').in('job_id', jobIds);
          applicationIds = (apps || []).map((a: { id: string }) => a.id);
        }
      }

      if (applicationIds.length === 0) { setCount(0); return; }

      const { count: c } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .in('application_id', applicationIds)
        .neq('sender_id', userId)
        .eq('is_read', false);
      setCount(c || 0);
    }

    fetchCount();

    const channel = supabase
      .channel(`unread-msgs-${userId}-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, () => {
        fetchCount();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  return count;
}

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
