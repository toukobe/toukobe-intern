import { supabase } from '@/utils/supabase';

/**
 * 求人が承認待ち(pending)になったことを管理者へメール通知する。
 * 宛先・求人名・企業名はサーバー側(API)でDBから確定するので、ここでは jobId だけ渡せばよい。
 * 通知の成否は求人の投稿・申請自体の成功に影響させない（失敗しても握りつぶす）。
 */
export async function notifyPendingReview(jobId: string): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ type: 'job_pending_review', jobId }),
    });
  } catch {
    // 通知はベストエフォート。承認フロー自体は管理画面でも確認できる
  }
}
