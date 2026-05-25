/**
 * Supabase Storage バケット一覧確認
 * 実行: node scripts/debug/check_storage_buckets.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const { data: buckets, error } = await supabase.storage.listBuckets();
if (error) {
  console.error('バケット一覧取得エラー:', error.message);
} else {
  console.log('Storage バケット一覧:');
  buckets.forEach(b => console.log(`  - ${b.name} (public: ${b.public})`));
  if (buckets.length === 0) console.log('  （バケットなし）');
}
