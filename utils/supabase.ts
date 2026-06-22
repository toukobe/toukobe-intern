import { createClient } from '@supabase/supabase-js'

// .env.local に隠した鍵を読み込む
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 連絡係（supabaseクライアント）を作成して、他のファイルで使えるようにする
export const supabase = createClient(supabaseUrl, supabaseKey)
