-- 2026-07-14: メール文面テンプレート + 求人詳細項目の拡張
-- Supabase ダッシュボード → SQL Editor で実行してください

-- ① メール文面テンプレート（管理者ページ「メール文面」タブで編集する）
-- 行が無い/空のテンプレートはコード内の既定文面が使われる
CREATE TABLE IF NOT EXISTS email_templates (
  slug text PRIMARY KEY,          -- 'application_received' | 'status_interview' | 'status_offer' | 'status_rejected' | 'student_welcome'
  subject text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- 文面はユーザーが受け取るものなので読み取りは公開でよい（送信APIがanonキーで読む）
DROP POLICY IF EXISTS "email_templates_public_read" ON email_templates;
CREATE POLICY "email_templates_public_read" ON email_templates
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "email_templates_admin_insert" ON email_templates;
CREATE POLICY "email_templates_admin_insert" ON email_templates
  FOR INSERT WITH CHECK ((auth.jwt()->>'email') = 'ru_matsumoto@manabiph.com');

DROP POLICY IF EXISTS "email_templates_admin_update" ON email_templates;
CREATE POLICY "email_templates_admin_update" ON email_templates
  FOR UPDATE USING ((auth.jwt()->>'email') = 'ru_matsumoto@manabiph.com');

DROP POLICY IF EXISTS "email_templates_admin_delete" ON email_templates;
CREATE POLICY "email_templates_admin_delete" ON email_templates
  FOR DELETE USING ((auth.jwt()->>'email') = 'ru_matsumoto@manabiph.com');

-- ② 求人詳細の拡張項目（すべて任意入力。既存の求人はそのまま表示され続ける）
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS shift_info text;          -- シフト
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS address text;             -- 勤務地（住所詳細）
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS intern_count text;        -- インターン生（在籍数の表記）
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS benefits text;            -- 福利厚生
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS employment_type text;     -- 雇用形態
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS required_conditions text; -- 必須条件
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS welcome_conditions text;  -- 歓迎条件
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS ideal_candidate text;     -- 求める人物像
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS selection_process text;   -- 選考プロセス
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS training text;            -- 研修・教育制度
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS alumni_placements text;   -- 内定実績（過去のインターン生の内定先）

-- ③ 会社情報の拡張
ALTER TABLE companies ADD COLUMN IF NOT EXISTS representative text; -- 代表者
ALTER TABLE companies ADD COLUMN IF NOT EXISTS related_links text;  -- 関連URL（1行1リンク。「タイトル URL」形式）
