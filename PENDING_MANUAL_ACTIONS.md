# 手動で対応が必要な項目

最終更新: 2026-07-07（お問い合わせフォームの500エラー修正・退会機能追加・共通フッター追加）

---

## ✅ 2026-07-07 の自動修正（コード側・対応不要、記録のみ）

- 🔴 **お問い合わせフォームが全件500エラーだったのを修正**: `form_submissions.company_name` の NOT NULL 制約により、企業名を送らない `/forms/contact` の送信が全て失敗していた。API側で空文字を補って解消（API実測で200確認済み）。DB変更は不要
- **退会機能を追加**: 学生はマイページから退会可能（`/api/delete-account`、E2E検証済み）。企業アカウントは403でお問い合わせ誘導
- **共通フッター**: 全公開ページに利用規約/プライバシーポリシー等へのリンクを追加
- **サインアップ堅牢化**: メール確認ONに設定変更しても壊れないよう、セッション無し時は確認画面→初回ログイン時に `/auth/setup` で登録完了する流れに（現在この Supabase プロジェクトはメール確認OFFと実測確認済み）
- その他: 応募者管理のN+1解消、選考通知メールの成否トースト、企業ダッシュボードのサイレント失敗解消、求人投稿の二重送信防止、フォームのレート制限メッセージ

---

## 🔴 チャット廃止に伴うDBクリーンアップ（2026-07-06）

アプリ内チャットを廃止し、連絡は双方の登録メールアドレス（`student_profiles.contact_email` / `companies.contact_email`）に一本化した。コード側の削除は完了済み。残る手動タスク:

- `sql/2026-07-06_drop_chat_messages.sql` を Supabase SQL Editor で実行して `chat_messages` テーブルを削除する（チャット履歴は完全に消えるので、必要ならバックアップを先に取る）

---

## 🔴 ローンチ前必須: デモ企業アカウントのパスワード変更

`seed/fake_companies.sql` で作成した架空企業4社（demo-milestone / demo-cloudcare / demo-workhero / demo-soel @toukobe.test）のパスワードは `Demo1234!` で、**GitHubリポジトリに公開されています**。本番DBでこのseedを実行済みの場合、誰でもこれらの企業アカウントにログインできます。

ローンチ前に以下のいずれかを実施してください（Supabase ダッシュボード → Authentication → Users）:
- 4アカウントのパスワードを強力なものに変更する、または
- 4アカウントを削除する（求人・企業データを残す場合はアカウントのみBan/無効化）

また、架空企業の求人が本番の検索結果に出続けるのが適切かどうかも判断してください（実企業の求人が揃ったら非公開化を推奨）。

---

## 🟡 環境変数（ローカル設定済み・本番未設定）

- ✅ `.env.local` に `SUPABASE_SERVICE_ROLE_KEY`（新体系の Secret key `sb_secret_...`）を設定済み（2026-07-03、キーの有効性確認済み）
- 🔴 **本番環境（Vercel等）には未設定**。デプロイ先の環境変数に同じ4つを設定すること:
  `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` / `RESEND_API_KEY` / `RESEND_FROM_EMAIL`
- 🟡 あわせて `NEXT_PUBLIC_SITE_URL`（本番の公開URL、例 `https://toukobe-intern.com`）も設定推奨。管理者ページのフォーム共有リンクのベースURLに使われる（未設定時は開いているサイトのURLになるので、デプロイ先の管理画面から開けば実用上は問題ない）。なお `app/sitemap.ts`・`app/layout.tsx`・`app/api/send-email/route.ts` は `https://toukobe-intern.com` をハードコードしているため、**本番ドメインが変わる場合はこれらの修正も必要**
- Secret key は旧 service_role キーの後継で supabase-js にそのまま渡せる（コード変更不要）。管理者ページの「企業を追加」がこのキーを使用。

### 🔴 本番環境のメール設定
現在 `.env.local` は `RESEND_FROM_EMAIL=onboarding@resend.dev`（テストモード）のため、**全メールが管理者宛に転送され、件名に [テスト] が付きます**。本番では:

1. Resend ダッシュボードで `toukobe-intern.com` のドメイン認証（DNSレコード追加）
2. 本番環境変数に `RESEND_FROM_EMAIL=noreply@toukobe-intern.com` と `RESEND_API_KEY` を設定

---

## ✅ Supabase SQL（全項目 実行確認済み 2026-07-03）

DBを直接プローブして以下すべての反映を確認した:

1. ✅ student_profiles のカラム追加（last_name / first_name / birth_date / department）
2. ✅ jobs.cover_image_url
3. ✅ applications の重複防止UNIQUE制約（2重に存在するが無害）
4. ✅ 匿名read用ポリシー（companies / jobs published・paused）
5. ✅ job-covers バケット（public、6/30作成）

---

## 🟡 Googleログイン（設定済み・公開ステータスのみ残り）

2026-07-03 に設定完了・動作確認済み（authorize エンドポイントが Google へ正常にリダイレクトすることを確認）:

- ✅ Google Cloud Console で OAuth クライアント作成（リダイレクトURI設定済み）
- ✅ Supabase → Providers → Google 有効化（Client ID / Secret 設定済み）
- ✅ Supabase → URL Configuration（Site URL + Redirect URLs 4件）
- ✅ コード側の OAuth コールバックバグは 2026-07-02 修正済み（`/auth/callback` はクライアントページ）

**🔴 残り1つ: OAuth同意画面の公開**

現在「テスト」ステータスのため、**プロジェクトオーナーのGoogleアカウント以外はログインできません**。ローンチ前に必ず公開してください:

- https://console.cloud.google.com/auth/audience?project=toukobe-intern → 「アプリを公開（Publish app）」
- 基本スコープ（email / profile）のみなのでGoogleの審査は不要

---

## ✅ Supabase Realtime（設定済み確認 2026-07-03 / チャット廃止 2026-07-06）

`jobs` は `supabase_realtime` パブリケーションに登録済み（管理者の承認待ちバッジで使用）。`chat_messages` はチャット廃止に伴い不要になった（テーブルDROPでパブリケーションからも自動的に外れる）。

---

## 🟡 未完成の機能（コードだけでは完結しない）

### ~~資料請求フォーム~~
- ✅ 実装済み: `/forms/material`（資料請求）・`/forms/contact`（お問い合わせ）・`/forms/early`・`/forms/normal` の4フォームを作成済み
- ✅ 送信内容は `form_submissions` テーブルに保存され、管理者ページ（`/dashboard/admin` → フォーム申し込みタブ）で確認・ステータス管理・メモ・CSV出力が可能
- ✅ 送信時に管理者宛通知メール + 送信者宛確認メールを自動送信（`/api/form-submit`）

### ~~企業新規登録フロー~~
- ✅ `/auth/signup` ページに企業登録フローあり（会社名・業種・連絡用メール入力）
- ✅ `/auth/company-login` から新規登録リンクを追加済み

### ~~よくある質問ページ~~
- ✅ `/faq` ページ作成済み

### ~~チャット機能の既読管理~~
- ❌ 廃止（2026-07-06）: チャット機能自体を削除し、連絡はメールに一本化した

---

## ✅ セキュリティ: RLS 有効化・全ポリシー整備（2026-07-03 完了・検証済み）

調査の結果、**主要5テーブル（applications / companies / jobs / student_profiles / user_types）のRLS自体が無効**で、anonキーで全データの読み書きが可能な状態だった。`sql/2026-07-03_enable_rls.sql` を実行して修正済み:

- 全開放ポリシー（誰でも全応募・全学生プロフィールを読める等）を削除
- 不足ポリシーを追加（企業の応募閲覧/選考ステータス更新、登録フローのINSERT、管理者のみのフォーム閲覧・全件アクセス等）
- 5テーブルのRLSを有効化

外部から検証済み: 匿名は公開求人・企業のみ閲覧可、学生PII・応募・フォーム送信・下書き求人は遮断。企業アカウントは自社求人・自社への応募・応募者のプロフィールのみ閲覧可。

🟡 ブラウザでの最終確認推奨: 管理者ページ（統計カウント・求人/企業/フォームタブ）と学生の応募フローを一度ずつ触って正常動作を確認する。

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
| 重複応募防止 | `jobs/[id]` + DB制約 | ✅ |
| 未確認ステータス | `dashboard/company/applicants` | ✅ |
| 通知バッジ | 管理者（承認待ち求人）※未読メッセージバッジはチャット廃止で削除 | ✅ |
| 言語設定 | `app/layout.tsx` | ✅ |
| 姓名分離・生年月日・学部学科 | `dashboard/student`, `auth/signup-profile` | ✅ |
| 学年選択肢更新 | 同上 | ✅ |
| 学部・学科 必須 | 同上 | ✅ |
| スマホ対応 | 主要ページ | ✅ |
