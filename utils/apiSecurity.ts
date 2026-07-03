// APIルート共通のセキュリティユーティリティ（サーバー側専用）

// メール本文・件名に差し込むユーザー入力のHTMLエスケープ
export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 件名用: 改行を除去してヘッダインジェクションを防ぐ
export function sanitizeSubject(value: unknown, maxLength = 150): string {
  return String(value ?? '').replace(/[\r\n]+/g, ' ').slice(0, maxLength);
}

export function isValidEmail(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// シンプルなインメモリレート制限（サーバーレス環境ではインスタンス単位のベストエフォート）
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}
