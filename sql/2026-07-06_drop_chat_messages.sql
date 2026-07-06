-- チャット機能の廃止に伴い chat_messages テーブルを削除する
-- 実行方法: Supabase SQL Editor に丸ごとコピペして1回実行する
--
-- 背景: 学生と企業の連絡は、双方が登録した連絡先メールアドレス
-- (student_profiles.contact_email / companies.contact_email) による
-- 直接のメールに一本化した。アプリ内チャットは廃止済み。
--
-- 注意: 実行するとチャット履歴は完全に消える。
-- 必要であれば実行前にバックアップを取ること:
--   create table chat_messages_backup as select * from chat_messages;

-- DROP TABLE で supabase_realtime パブリケーションからも自動的に外れる
drop table if exists chat_messages;
