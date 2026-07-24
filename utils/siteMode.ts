// サイト全体の公開モード。管理者ページ（サイト状態タブ）で切り替える。
// - public      : 通常公開（全画面表示・検索エンジン登録可）
// - prelaunch   : 公開前。一般訪問者には「準備中」ページのみ。登録・企業導線だけ許可。noindex
// - maintenance : メンテナンス中。一般訪問者には「メンテナンス」ページのみ。noindex
// 管理者（ADMIN_EMAIL でログイン中）は、どのモードでも全画面を閲覧できる（商談・保守用のバイパス）。

export type SiteMode = 'public' | 'prelaunch' | 'maintenance';

export const SITE_MODES: SiteMode[] = ['public', 'prelaunch', 'maintenance'];

export const ADMIN_EMAIL = 'ru_matsumoto@manabiph.com';

export const SITE_MODE_LABELS: Record<SiteMode, string> = {
  public: '公開（通常）',
  prelaunch: '公開前（準備中）',
  maintenance: 'メンテナンス',
};

// テーブル未作成・取得失敗時のフォールバック（サイトを止めないよう通常公開扱い）。
export const DEFAULT_SITE_MODE: SiteMode = 'public';

// prelaunch のとき、ゲートせずに素通りさせるパス（プレフィックス一致）。
// 学生登録・企業の登録導線・規約・認証・ダッシュボードは許可する。
export const PRELAUNCH_ALLOW_PREFIXES = [
  '/coming-soon', '/maintenance',
  '/auth', '/dashboard', '/api',
  '/for-companies', '/forms',
  '/terms', '/privacy-policy',
];

// maintenance のとき素通りさせるパス（管理者がログインして復旧できるよう最小限）。
export const MAINTENANCE_ALLOW_PREFIXES = [
  '/maintenance', '/coming-soon', '/auth', '/dashboard', '/api',
];

// どのモードでも常に素通りさせるパス（同期判定用。ここは即表示してモード取得を待たない）。
export const NEVER_GATE_PREFIXES = [
  '/coming-soon', '/maintenance', '/auth', '/dashboard', '/api',
];

export function pathMatchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + '/'));
}
