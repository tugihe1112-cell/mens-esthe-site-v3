/**
 * print_one_r2_key.mjs — R2画像を持つセラピストを1件取り、Workerテスト用URLを出力
 * 実行: node scripts/debug/print_one_r2_key.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const E = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(E('VITE_SUPABASE_URL'), E('SUPABASE_SERVICE_ROLE_KEY') || E('VITE_SUPABASE_ANON_KEY'));

const WORKER = 'https://mens-esthe-images.tugihe1112.workers.dev';

async function main() {
  const { data } = await supabase
    .from('therapists')
    .select('name, image_url')
    .ilike('image_url', '%r2.dev%')
    .limit(1);
  if (!data?.length) { console.log('R2画像を持つ行が見つからない'); return; }
  const { name, image_url } = data[0];
  // r2.dev URL からキー部分(therapist-images/xxx)を取り出す
  const key = image_url.split('.r2.dev/')[1];
  console.log('\nセラピスト :', name);
  console.log('現r2.dev URL:', image_url);
  console.log('\n▼このURLをブラウザで開いて画像が出ればOK:');
  console.log(`${WORKER}/${key}\n`);
}
main().catch((e) => console.error(e.message));
