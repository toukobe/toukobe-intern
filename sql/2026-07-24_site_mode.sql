-- 2026-07-24: サイト公開モード（公開／公開前／メンテナンス）の切り替え設定
-- 管理者ページ「サイト状態」タブから切り替える。1行のみのテーブル（id=1固定）。
-- Supabase ダッシュボード → SQL Editor で実行してください（何度実行しても安全）。

CREATE TABLE IF NOT EXISTS site_settings (
  id         int PRIMARY KEY DEFAULT 1,
  site_mode  text NOT NULL DEFAULT 'public',   -- 'public' | 'prelaunch' | 'maintenance'
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT site_settings_single_row CHECK (id = 1),
  CONSTRAINT site_settings_mode_valid CHECK (site_mode IN ('public','prelaunch','maintenance'))
);

-- 初期値は「公開前」（未ローンチのため）。既に行があれば変更しない。
INSERT INTO site_settings (id, site_mode) VALUES (1, 'prelaunch')
  ON CONFLICT (id) DO NOTHING;

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- 誰でも現在のモードを読める（ゲート・robotsが匿名で参照するため）
DROP POLICY IF EXISTS "site_settings_public_read" ON site_settings;
CREATE POLICY "site_settings_public_read" ON site_settings
  FOR SELECT USING (true);

-- 変更は管理者のみ
DROP POLICY IF EXISTS "site_settings_admin_insert" ON site_settings;
CREATE POLICY "site_settings_admin_insert" ON site_settings
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt()->>'email') = 'ru_matsumoto@manabiph.com');

DROP POLICY IF EXISTS "site_settings_admin_update" ON site_settings;
CREATE POLICY "site_settings_admin_update" ON site_settings
  FOR UPDATE TO authenticated
  USING ((auth.jwt()->>'email') = 'ru_matsumoto@manabiph.com')
  WITH CHECK ((auth.jwt()->>'email') = 'ru_matsumoto@manabiph.com');
