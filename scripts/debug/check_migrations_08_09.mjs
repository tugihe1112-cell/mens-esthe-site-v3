/**
 * check_migrations_08_09.mjs — 08/09マイグレーションがSupabaseで実行済みか判定
 *
 * 08_review_views.sql  → reviews.view_count 列
 * 09_therapist_status.sql → therapists.is_active 列
 * の存在をservice roleでselectして確認する（列が無ければ "column ... does not exist" が返る）。
 *
 * 実行: node scripts/debug/check_migrations_08_09.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

async function hasColumn(table, column) {
  const { error } = await supabase.from(table).select(column).limit(1);
  if (!error) return true;
  if (/does not exist|column .* does not exist/i.test(error.message)) return false;
  // 予期せぬエラーはそのまま投げて気づけるように
  throw new Error(`${table}.${column} 判定失敗: ${error.message}`);
}

async function main() {
  const rv = await hasColumn('reviews', 'view_count');
  const ta = await hasColumn('therapists', 'is_active');
  console.log('\n── マイグレーション実行状況 ──');
  console.log(`  08_review_views.sql   (reviews.view_count):   ${rv ? '✅ 実行済み' : '❌ 未実行'}`);
  console.log(`  09_therapist_status.sql (therapists.is_active): ${ta ? '✅ 実行済み' : '❌ 未実行'}`);
  console.log('');
  if (!rv || !ta) {
    console.log('👉 未実行のSQLは Supabase → SQL Editor で実行してください:');
    if (!rv) console.log('   - supabase_migrations/08_review_views.sql');
    if (!ta) console.log('   - supabase_migrations/09_therapist_status.sql');
  } else {
    console.log('👉 両方実行済み。retention-email を手動テスト可:');
    console.log('   curl -s "https://www.mens-esthe-map.jp/api/cron/retention-email?force=1"');
  }
  console.log('');
}
main().catch((e) => { console.error('❌', e.message); process.exit(1); });
