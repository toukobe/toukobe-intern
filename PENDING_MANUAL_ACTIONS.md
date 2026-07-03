# 手動で対応が必要な項目

最終更新: 2026-07-01

---

## 🔴 環境変数の追加（未設定）

`.env.local` および本番環境に `SUPABASE_SERVICE_ROLE_KEY` を追加してください（Supabase ダッシュボード → Project Settings → API → service_role key）。

- 管理者ダッシュボードの「企業を追加」機能（`/api/admin/create-company`）が、`supabase.auth.admin.createUser` をクライアント側で anon キーのまま呼び出しており、常に失敗するバグを修正しました。
- 修正後はサーバー側の新規APIルート（service role キー使用）経由でユーザー作成するようにしたため、このキーが設定されるまで「企業を追加」機能は動作しません。

---

## 🔴 Supabase SQL（未実行のもの）

Supabase ダッシュボード → SQL Editor で実行してください。

### 1. student_profiles テーブルへのカラム追加
```sql
ALTER TABLE student_profiles
  ADD COLUMN IF NOT EXISTS last_name   text,
  ADD COLUMN IF NOT EXISTS first_name  text,
  ADD COLUMN IF NOT EXISTS birth_date  date,
  ADD COLUMN IF NOT EXISTS department  text;
```

### 2. jobs テーブルへのカラム追加
```sql
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS cover_image_url text;
```

### 3. applications テーブルへの重複防止制約
```sql
ALTER TABLE applications
  ADD CONSTRAINT applications_user_job_unique UNIQUE (user_id, job_id);
```

### 4. 匿名ユーザー向け RLS ポリシー（検索が「企業名不明」になる問題の修正）
```sql
-- companies テーブル（匿名でも読める）
CREATE POLICY "companies_public_read" ON companies
  FOR SELECT TO anon USING (true);

-- jobs テーブル（公開・停止中のみ匿名で読める）
CREATE POLICY "jobs_public_read" ON jobs
  FOR SELECT TO anon USING (status IN ('published', 'paused'));
```

### 5. job-covers ストレージバケットの作成
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('job-covers', 'job-covers', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- アップロードポリシー（企業ユーザーのみ）
CREATE POLICY "company_upload_covers" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'job-covers');

-- 公開読み取り
CREATE POLICY "public_read_covers" ON storage.objects
  FOR SELECT TO anon USING (bucket_id = 'job-covers');
```

---

## 🔴 Googleログインに必要なSupabase設定（コード修正済み・要ダッシュボード確認）

コード側のバグ（OAuthコールバックをサーバーRoute Handlerで処理していてセッションがブラウザに保存されない問題）は 2026-07-02 に修正済み。`/auth/callback` はクライアントページになりました。

以下のダッシュボード設定が揃っていないとGoogleログインは動きません:

1. **Supabase → Authentication → Providers → Google** を有効化し、Google Cloud Console で発行した Client ID / Client Secret を設定
2. **Google Cloud Console → OAuth クライアント** の「承認済みのリダイレクトURI」に `https://<プロジェクトref>.supabase.co/auth/v1/callback` を追加
3. **Supabase → Authentication → URL Configuration**:
   - Site URL: `https://toukobe-intern.com`
   - Redirect URLs に以下を追加:
     - `https://toukobe-intern.com/auth/callback`
     - `https://toukobe-intern.com/auth/callback?*`（redirect付きログイン用）
     - `http://localhost:3000/auth/callback`（開発用）
     - `http://localhost:3000/auth/callback?*`

---

## 🟡 Supabase Realtime の有効化

通知バッジ（未読メッセージ数のリアルタイム更新）に必要です。

Supabase ダッシュボード → Database → Replication で `chat_messages` テーブルを有効化するか、以下を実行：
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE jobs;
```

---

## 🟡 未完成の機能（コードだけでは完結しない）

### 資料請求フォーム
- `/for-companies` ページと LP の「資料請求する」ボタンが押せるが、送信先が未設定
- **対応方法の選択肢**:
  - A. Supabase の `contact_requests` テーブルにINSERTする簡易フォームを作る
  - B. Google Forms や Typeform の URL に飛ばす
  - C. `mailto:` リンクにする

### ~~企業新規登録フロー~~
- ✅ `/auth/signup` ページに企業登録フローあり（会社名・業種・連絡用メール入力）
- ✅ `/auth/company-login` から新規登録リンクを追加済み

### ~~よくある質問ページ~~
- ✅ `/faq` ページ作成済み

### チャット機能の既読管理
- `chat_messages.is_read` カラムが必要（存在しない場合）
- 未読バッジは `is_read = false` のメッセージ数をカウントしているが、既読にする処理（チャット画面を開いたときに UPDATE）が実装済みか要確認

---

## 🔴 セキュリティ要確認（RLS ポリシー）

コードのバグ調査中に発見。フロントエンドは anon キーで直接 Supabase を呼んでいるため、以下は **DB側の RLS ポリシーだけが最後の防御線** です。ポリシーが緩いと、ブラウザの devtools から他社のデータを書き換えられる可能性があります。Supabase ダッシュボード → Authentication → Policies で確認してください。

- `applications` テーブルの UPDATE（選考ステータス変更）: `job_id` が自社の求人であることを要求するポリシーが必要。`dashboard/company/applicants/page.tsx` 側にも自社の求人IDでの絞り込みチェックを追加済みだが、これは補助的なもの。
- `jobs` テーブルの UPDATE: `company_id = auth.uid() に対応する company_id` のみ許可（`dashboard/edit-job/[id]` はクライアント側で確認済みだが、同様にDB側が最終防御）。

### ~~`/api/send-email` が誰でも呼べる状態（オープンリレー懸念）~~ → 対応済み (2026-07-02)
- ✅ 認証必須化: `Authorization: Bearer <Supabaseアクセストークン>` を検証（未ログインは401）。3箇所の呼び出し元も更新済み。
- ✅ 全差し込みフィールドのHTMLエスケープ + 件名の改行除去（HTMLインジェクション/ヘッダインジェクション防止）
- ✅ ユーザー単位のレート制限（20通/時間、インメモリのベストエフォート）
- ✅ `/api/form-submit` も同様に強化（IPレート制限 5件/10分・メール形式検証・文字数制限・エスケープ）
- 🟡 残タスク: 独自ドメイン設定後、`to` をサーバー側でDBから再取得する方式（選択肢B）への移行を推奨。SUPABASE_SERVICE_ROLE_KEY 設定後に対応可能。

---

## ✅ 実装済み（確認のみ）

| 機能 | ファイル | 状態 |
|---|---|---|
| ログイン後リダイレクト | `auth/login`, `auth/callback` | ✅ |
| 企業ダッシュボード求人グリッド | `dashboard/company` | ✅ |
| 求人停止時の応募ブロック | `jobs/[id]` | ✅ |
| 求人カバー画像 | `dashboard/post-job`, `dashboard/edit-job/[id]` | ✅ |
| 重複応募防止 | `jobs/[id]` + DB制約（SQL要実行） | ✅コード/🔴SQL未実行 |
| 未確認ステータス | `dashboard/company/applicants` | ✅ |
| 通知バッジ | 学生・企業・管理者 | ✅コード/🟡Realtime要設定 |
| 言語設定 | `app/layout.tsx` | ✅ |
| 姓名分離・生年月日・学部学科 | `dashboard/student`, `auth/signup-profile` | ✅ |
| 学年選択肢更新 | 同上 | ✅ |
| 学部・学科 必須 | 同上 | ✅ |
| スマホ対応 | 主要ページ | ✅ |
