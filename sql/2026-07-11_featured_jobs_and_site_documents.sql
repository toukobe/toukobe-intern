-- 2026-07-11: 注目求人フラグ + 管理者が編集できる規約・ポリシー文書
-- Supabase ダッシュボード → SQL Editor で実行してください

-- ① 注目求人フラグ（管理者がトップページの「注目の長期インターン」に出す求人を選ぶ）
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;

-- 更新は既存の jobs_admin_update ポリシー（管理者のみ）でカバーされる

-- ② 規約・ポリシー文書（管理者ページから編集し、公開ページに表示する）
CREATE TABLE IF NOT EXISTS site_documents (
  slug text PRIMARY KEY,            -- 'terms-student' | 'terms-company' | 'privacy-policy'
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE site_documents ENABLE ROW LEVEL SECURITY;

-- 誰でも閲覧可（公開ページで表示するため）
DROP POLICY IF EXISTS "site_documents_public_read" ON site_documents;
CREATE POLICY "site_documents_public_read" ON site_documents
  FOR SELECT
  USING (true);

-- 書き込みは管理者のみ
DROP POLICY IF EXISTS "site_documents_admin_insert" ON site_documents;
CREATE POLICY "site_documents_admin_insert" ON site_documents
  FOR INSERT
  WITH CHECK ((auth.jwt()->>'email') = 'ru_matsumoto@manabiph.com');

DROP POLICY IF EXISTS "site_documents_admin_update" ON site_documents;
CREATE POLICY "site_documents_admin_update" ON site_documents
  FOR UPDATE
  USING ((auth.jwt()->>'email') = 'ru_matsumoto@manabiph.com');

DROP POLICY IF EXISTS "site_documents_admin_delete" ON site_documents;
CREATE POLICY "site_documents_admin_delete" ON site_documents
  FOR DELETE
  USING ((auth.jwt()->>'email') = 'ru_matsumoto@manabiph.com');

-- ③ 企業セルフ登録の廃止に伴う締め付け（2026-07-11）
-- 企業アカウントは管理者ページ（service role権限のAPI）でのみ発行する。
-- 画面から登録導線は削除済みだが、API直叩きでも作れないようDB側も塞ぐ。

-- 誰でも（ログイン済みなら）企業を作成できたポリシーを削除
DROP POLICY IF EXISTS "companies_insert_authenticated" ON companies;

-- user_types のセルフ登録は「学生として」のみに制限
DROP POLICY IF EXISTS "user_types_insert_own" ON user_types;
CREATE POLICY "user_types_insert_own" ON user_types
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND user_type = 'student');
