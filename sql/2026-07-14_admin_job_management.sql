-- 2026-07-14: 管理者が任意企業の求人を作成・編集・削除できるようにする
-- Supabase ダッシュボード → SQL Editor で実行してください（何度実行しても安全）
-- ※ PERMISSIVE ポリシーはORで評価されるため、既存の企業向け権限には影響しません。

-- 管理者は求人をINSERTできる（任意の company_id で作成可能）
DROP POLICY IF EXISTS "jobs_admin_insert" ON jobs;
CREATE POLICY "jobs_admin_insert" ON jobs
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt()->>'email') = 'ru_matsumoto@manabiph.com');

-- 管理者は求人を削除できる
DROP POLICY IF EXISTS "jobs_admin_delete" ON jobs;
CREATE POLICY "jobs_admin_delete" ON jobs
  FOR DELETE TO authenticated
  USING ((auth.jwt()->>'email') = 'ru_matsumoto@manabiph.com');

-- （UPDATE は既存の jobs_admin_update が担当。SELECT は jobs_read_authenticated で管理者も全件可）
