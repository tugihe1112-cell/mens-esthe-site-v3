/**
 * 竜宮城・旧百万石 全店舗確認（ID・名前両方でサーチ）
 * 実行: node scripts/debug/check_ryugujo_shops.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

// IDで検索
const { data: byId } = await supabase
  .from('shops').select('id, name, raw_data').ilike('id', '%ryugujo%');

// 名前で検索（竜宮城 or 百万石）
const { data: byName1 } = await supabase
  .from('shops').select('id, name, raw_data').ilike('name', '%竜宮城%');
const { data: byName2 } = await supabase
  .from('shops').select('id, name, raw_data').ilike('name', '%百万石%');

// 重複排除してマージ
const all = new Map();
for (const s of [...(byId||[]), ...(byName1||[]), ...(byName2||[])]) all.set(s.id, s);

console.log(`竜宮城関連 店舗数: ${all.size}\n`);
for (const s of all.values()) {
  const pref = s.raw_data?.prefecture || '（未設定）';
  const area = s.raw_data?.area || '（未設定）';
  console.log(`[${s.id}]`);
  console.log(`  name:       ${s.name}`);
  console.log(`  prefecture: ${pref}`);
  console.log(`  area:       ${area}`);
  console.log();
}
