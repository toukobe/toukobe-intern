-- ================================================================
-- RLS有効化マイグレーション (2026-07-03)
-- Supabase SQL Editor に丸ごとコピペして1回実行する
--
-- 背景: applications / companies / jobs / student_profiles / user_types
-- のRLSが無効で、anonキーで全データの読み書きが可能な状態だった。
-- 既存ポリシーには全開放(qual=true)の危険なものと、不足(applicationsの
-- UPDATE等)があるため、整理してから有効化する。
-- ================================================================

BEGIN;

-- ----------------------------------------------------------------
-- 1. 危険な全開放ポリシー・重複ポリシーの削除
-- ----------------------------------------------------------------
-- 誰でも全応募データを読めるポリシー（個人情報漏洩）
DROP POLICY IF EXISTS "allow_all_read_applications" ON applications;
-- 重複（allow_users_read_own_applications と同内容）
DROP POLICY IF EXISTS "Users can view applications" ON applications;

-- 下書き含む全求人を誰でも読めるポリシー
DROP POLICY IF EXISTS "Allow public read" ON jobs;
-- 重複（jobs_public_read と同内容）
DROP POLICY IF EXISTS "Public can view published jobs" ON jobs;

-- 学生プロフィールを誰でも読み書きできるポリシー（個人情報漏洩）
DROP POLICY IF EXISTS "allow_read_student_profiles" ON student_profiles;
DROP POLICY IF EXISTS "allow_update_student_profiles" ON student_profiles;
DROP POLICY IF EXISTS "allow_insert_student_profiles" ON student_profiles;

-- ログイン済みなら誰でもフォーム送信内容を読めるポリシー（管理者専用に置換）
DROP POLICY IF EXISTS "authenticated select" ON form_submissions;
DROP POLICY IF EXISTS "authenticated update" ON form_submissions;

-- user_types を匿名で全件読めるポリシー（user_id と企業の対応が公開されてしまう。
-- ログイン済みユーザーの自行読み取りは "Users can view their own type" が担当）
DROP POLICY IF EXISTS "Enable read access for all users" ON user_types;

-- companies の重複SELECTポリシー掃除（companies_read_all に統一）
DROP POLICY IF EXISTS "Public can view companies" ON companies;
DROP POLICY IF EXISTS "Allow read access for everyone" ON companies;
DROP POLICY IF EXISTS "Enable read access for all users" ON companies;
DROP POLICY IF EXISTS "Anyone can read companies" ON companies;
DROP POLICY IF EXISTS "companies_public_read" ON companies;
DROP POLICY IF EXISTS "companies_select_authenticated" ON companies;

-- ----------------------------------------------------------------
-- 2. 不足ポリシーの追加
--    管理者判定は auth.jwt()->>'email'（メール変更には本人確認が必要なため安全）
-- ----------------------------------------------------------------

-- companies: 公開ディレクトリなので誰でも読める
CREATE POLICY "companies_read_all" ON companies
  FOR SELECT TO anon, authenticated USING (true);
-- companies: 企業の新規登録フロー（signup/setup）はログイン済みユーザーがINSERTする
CREATE POLICY "companies_insert_authenticated" ON companies
  FOR INSERT TO authenticated WITH CHECK (true);
-- companies: 管理者は編集・削除できる（管理者ページの企業管理タブ）
CREATE POLICY "companies_admin_update" ON companies
  FOR UPDATE TO authenticated
  USING ((auth.jwt()->>'email') = 'ru_matsumoto@manabiph.com');
CREATE POLICY "companies_admin_delete" ON companies
  FOR DELETE TO authenticated
  USING ((auth.jwt()->>'email') = 'ru_matsumoto@manabiph.com');

-- jobs: ログイン済みユーザーは 公開中/停止中 + 自社の全求人 + 管理者は全件 読める
--       (anon向けは既存の jobs_public_read が担当)
CREATE POLICY "jobs_read_authenticated" ON jobs
  FOR SELECT TO authenticated
  USING (
    status IN ('published', 'paused')
    OR EXISTS (SELECT 1 FROM user_types ut
               WHERE ut.user_id = auth.uid() AND ut.company_id = jobs.company_id)
    OR (auth.jwt()->>'email') = 'ru_matsumoto@manabiph.com'
  );
-- jobs: 管理者は公開/停止を切り替えられる（管理者ページの求人管理タブ）
CREATE POLICY "jobs_admin_update" ON jobs
  FOR UPDATE TO authenticated
  USING ((auth.jwt()->>'email') = 'ru_matsumoto@manabiph.com');

-- applications: 企業は自社求人への応募を閲覧・選考ステータス更新できる
CREATE POLICY "applications_company_read" ON applications
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM jobs j
                 JOIN user_types ut ON ut.company_id = j.company_id
                 WHERE j.id = applications.job_id AND ut.user_id = auth.uid()));
CREATE POLICY "applications_company_update" ON applications
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM jobs j
                 JOIN user_types ut ON ut.company_id = j.company_id
                 WHERE j.id = applications.job_id AND ut.user_id = auth.uid()));
-- applications: 管理者は全件読める（管理者ページの応募数カウント）
CREATE POLICY "applications_admin_read" ON applications
  FOR SELECT TO authenticated
  USING ((auth.jwt()->>'email') = 'ru_matsumoto@manabiph.com');

-- student_profiles: 本人は自分のプロフィールを読み書きできる
CREATE POLICY "student_profiles_own" ON student_profiles
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
-- student_profiles: 企業は自社求人に応募してきた学生のプロフィールを読める
--（応募者管理・チャット画面で使用）
CREATE POLICY "student_profiles_company_read" ON student_profiles
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM applications a
                 JOIN jobs j ON j.id = a.job_id
                 JOIN user_types ut ON ut.company_id = j.company_id
                 WHERE a.user_id = student_profiles.user_id AND ut.user_id = auth.uid()));
-- student_profiles: 管理者は全件読める
CREATE POLICY "student_profiles_admin_read" ON student_profiles
  FOR SELECT TO authenticated
  USING ((auth.jwt()->>'email') = 'ru_matsumoto@manabiph.com');

-- user_types: 登録フローで自分の行をINSERTできる
CREATE POLICY "user_types_insert_own" ON user_types
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
-- user_types: 管理者は全件読める（学生数・企業数カウント）
CREATE POLICY "user_types_admin_read" ON user_types
  FOR SELECT TO authenticated
  USING ((auth.jwt()->>'email') = 'ru_matsumoto@manabiph.com');

-- form_submissions: 閲覧・更新は管理者のみ（INSERTは既存の "public insert" を維持）
CREATE POLICY "form_submissions_admin_select" ON form_submissions
  FOR SELECT TO authenticated
  USING ((auth.jwt()->>'email') = 'ru_matsumoto@manabiph.com');
CREATE POLICY "form_submissions_admin_update" ON form_submissions
  FOR UPDATE TO authenticated
  USING ((auth.jwt()->>'email') = 'ru_matsumoto@manabiph.com');

-- ----------------------------------------------------------------
-- 3. RLS有効化（ここで初めてポリシーが効き始める）
-- ----------------------------------------------------------------
ALTER TABLE applications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies        ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_types       ENABLE ROW LEVEL SECURITY;

COMMIT;

-- ----------------------------------------------------------------
-- 確認用（実行後に流すと現状が見える）
-- ----------------------------------------------------------------
-- SELECT c.relname, c.relrowsecurity FROM pg_class c
-- JOIN pg_namespace n ON n.oid = c.relnamespace
-- WHERE n.nspname = 'public' AND c.relkind = 'r' ORDER BY 1;
