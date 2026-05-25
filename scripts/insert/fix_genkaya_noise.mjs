/**
 * 原価屋 ノイズエントリ削除
 * 「☆原価屋」などキャンペーン画像由来の不正レコードを削除
 * 実行: node scripts/insert/fix_genkaya_noise.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const SHOP_ID = 'osaka_dispatch_genkaya';

// 削除対象: 日本語名でない、または明らかにノイズ
const NOISE_PATTERNS = [
  /^[☆★◆●■▲]/,          // 記号始まり
  /激選|キャンペーン|イベント|募集|求人|お知らせ|デリバリー|施術|公式|SNS|ランキング/,
  /^原価屋$/,             // 店名そのまま
];

const { data: all, error } = await supabase
  .from('therapists').select('id, name').eq('shop_id', SHOP_ID);

if (error) { console.log('取得エラー:', error.message); process.exit(1); }
console.log(`原価屋セラピスト総数: ${all.length}名`);

const toDelete = all.filter(t => NOISE_PATTERNS.some(p => p.test(t.name)));
console.log(`削除対象: ${toDelete.length}名`);
toDelete.forEach(t => console.log(`  "${t.name}" (${t.id})`));

if (toDelete.length > 0) {
  for (const t of toDelete) {
    const { error: delErr } = await supabase.from('therapists').delete().eq('id', t.id);
    if (delErr) console.log(`  削除エラー [${t.name}]: ${delErr.message}`);
    else console.log(`  ✅ 削除: ${t.name}`);
  }
}
console.log('完了');
