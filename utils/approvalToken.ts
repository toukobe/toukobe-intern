import { createHmac, timingSafeEqual } from 'crypto';

// 求人承認リンク用の署名トークン。ログインなしでもメールのボタンから承認できるようにするため、
// 「この求人を承認してよい」という許可を、サーバーの秘密鍵で署名して持たせる。
// ※このファイルはサーバー(APIルート)からのみ import すること。秘密鍵をクライアントに出さない。

// 署名鍵はサーバー専用の SERVICE_ROLE_KEY を流用する（新しい環境変数を増やさない）。
// クライアントには絶対に露出しない値。
const secret = () => process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7日間有効

/** jobId に対する承認トークンを発行する（有効期限つき） */
export function signApprovalToken(jobId: string, ttlMs: number = DEFAULT_TTL_MS): string {
  const exp = Date.now() + ttlMs;
  const payload = `${jobId}.${exp}`;
  const sig = createHmac('sha256', secret()).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

/** トークンを検証し、正しく有効期限内なら jobId を返す。不正・期限切れは null */
export function verifyApprovalToken(token: string): { jobId: string } | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [jobId, expStr, sig] = parts;
  if (!/^[0-9a-f-]{10,64}$/i.test(jobId)) return null;

  const expected = createHmac('sha256', secret()).update(`${jobId}.${expStr}`).digest('hex');
  // 署名の比較はタイミング攻撃を避けて長さを合わせてから
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) return null;
  return { jobId };
}
