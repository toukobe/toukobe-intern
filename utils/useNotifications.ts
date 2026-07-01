'use client';

import { useEffect, useState } from 'react';
import { supabase } from './supabase';

// 学生・企業共通: 未読メッセージ数
export function useUnreadMessages(userId: string | null) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    async function fetchCount() {
      const { count: c } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
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
