-- ================================================================
-- 2026-07-21: RLS 権限昇格ホールの修正（ローンチ前・要実行）
-- Supabase ダッシュボード → SQL Editor に貼って1回実行（何度実行しても安全）
-- ================================================================
--
-- 【重大】user_types の自己INSERTが緩すぎる問題の修正
--   旧: WITH CHECK (user_id = auth.uid())
--       → user_type と company_id を制限していないため、ログインした攻撃者が
--         自分の行を user_type='company', company_id=<任意の実在企業ID> で
--         INSERT でき、その企業の「応募者管理」権限を取得できてしまう。
--         結果、他社に応募した学生の個人情報（氏名・連絡先・大学・経歴等）を
--         閲覧し、選考ステータスを改ざん（内定/不採用メール送信）できる。
--         企業レコードのIDは公開ディレクトリ(companies)から取得可能で、
--         新規ユーザーは user_types 行が未作成の隙にこのINSERTを実行できる。
--   新: 学生・company_id無し のみ自己INSERTを許可する。
--       企業アカウントは管理者API(/api/admin/create-company)が service role で
--       作成しRLSを迂回するため、この制限による正規フローへの影響はない
--       （アプリ内の user_types INSERT は全て user_type='student', company_id=null）。

BEGIN;

DROP POLICY IF EXISTS "user_types_insert_own" ON user_types;
CREATE POLICY "user_types_insert_own" ON user_types
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND user_type = 'student'
    AND company_id IS NULL
  );

-- 【中】companies の「誰でもINSERT」ポリシーを削除
--   旧: companies_insert_authenticated = FOR INSERT TO authenticated WITH CHECK (true)
--       → ログインした誰でも公開企業ディレクトリに任意の企業レコードを作れる（汚染/なりすまし）。
--   企業レコードは管理者API(service role)でのみ作成しており、クライアントからの
--   companies INSERT は存在しないため削除して問題ない。
DROP POLICY IF EXISTS "companies_insert_authenticated" ON companies;

COMMIT;

-- ----------------------------------------------------------------
-- 【要確認】applications の INSERT ポリシー
--   応募作成(applications INSERT)のポリシーはこのリポジトリのSQLに含まれておらず
--   （以前Supabase上で直接作成）、定義を確認できていない。もし WITH CHECK (true)
--   等で緩い場合、認証ユーザーが user_id を詐称して他人名義の応募を作成できる恐れがある。
--   下記で現状を確認し、user_id=auth.uid() を強制していなければ張り替えること。
--
--   -- 現状ポリシー一覧
--   -- SELECT policyname, cmd, qual, with_check FROM pg_policies
--   --   WHERE schemaname='public' AND tablename='applications';
--
--   -- あるべき定義（緩いINSERTポリシーがあれば DROP して以下に統一）:
--   -- DROP POLICY IF EXISTS "<緩いポリシー名>" ON applications;
--   -- CREATE POLICY "applications_insert_own" ON applications
--   --   FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
-- ----------------------------------------------------------------

-- 確認用: 実行後にポリシーを一覧する
-- SELECT tablename, policyname, cmd, roles, with_check
--   FROM pg_policies WHERE schemaname='public'
--   AND tablename IN ('user_types','companies','applications','student_profiles','jobs')
--   ORDER BY tablename, cmd;
