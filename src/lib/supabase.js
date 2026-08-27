import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabaseの接続情報が .env に設定されていません。');
}

// ⚠️ 2026-08-26: トークンの自動更新を**明示的に**有効化する。
//    既定でも有効だが、既定に頼っていた結果「ログイン中のJWTが1時間で切れ、
//    以降すべてのRESTが 401 JWT expired → 画面には『情報はありません』」という
//    原因の分かりにくい壊れ方をした（authHeaders 側でも期限チェックと
//    anonフォールバックを入れてある）。設定は明示して意図を残す。
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
