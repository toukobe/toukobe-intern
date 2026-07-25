-- 2026-07-24: 画像アップロード用ストレージRLSポリシー
-- company-logos（企業ロゴ・企業背景）と job-covers（求人カバー）は公開読み取りだが、
-- 書き込み(INSERT)ポリシーが無い／不適切だと、企業のロゴ・背景画像・求人カバーの
-- アップロードが「row-level security policy に違反」でRLS拒否され、失敗する。
-- 認証ユーザー（企業アカウント・管理者）が両バケットにアップロード・差し替え・削除
-- できるようにする。読み取りは引き続き公開。
-- Supabase ダッシュボード → SQL Editor で実行（何度実行しても安全）。

-- 公開読み取り（バケットが public なら実質有効だが明示しておく）
DROP POLICY IF EXISTS "images_public_read" ON storage.objects;
CREATE POLICY "images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id IN ('company-logos', 'job-covers'));

-- 認証ユーザーはアップロード(INSERT)できる
DROP POLICY IF EXISTS "images_authenticated_insert" ON storage.objects;
CREATE POLICY "images_authenticated_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('company-logos', 'job-covers'));

-- 認証ユーザーは差し替え(UPDATE)できる（upsert対応）
DROP POLICY IF EXISTS "images_authenticated_update" ON storage.objects;
CREATE POLICY "images_authenticated_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id IN ('company-logos', 'job-covers'))
  WITH CHECK (bucket_id IN ('company-logos', 'job-covers'));

-- 認証ユーザーは削除(DELETE)できる（古いカバーの削除に使用）
DROP POLICY IF EXISTS "images_authenticated_delete" ON storage.objects;
CREATE POLICY "images_authenticated_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id IN ('company-logos', 'job-covers'));

-- 確認用（実行後）:
-- SELECT policyname, cmd, roles FROM pg_policies
--   WHERE schemaname='storage' AND tablename='objects' ORDER BY policyname;
