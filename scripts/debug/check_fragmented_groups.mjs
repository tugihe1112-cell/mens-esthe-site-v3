/**
 * 同一ブランド名なのに group_id がバラバラな店舗を検出
 * 実行: node scripts/debug/check_fragmented_groups.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const { data: shops } = await supabase.from('shops').select('id, name, group_id, raw_data');

// 店舗名からブランド名を抽出（末尾の「〇〇店」「〇〇ルーム」を除去）
const getBrandName = (name) => {
  if (!name) return '';
  return name
    .replace(/[\s　]*[（(][^）)]*(?:店|ルーム)[）)]/gu, '')
    .replace(/[\s　]+\S+(?:店|ルーム)$/u, '')
    .trim()
    .toLowerCase()
    .replace(/[\s　]+/g, '');
};

// ブランド名でグループ化
const brandMap = new Map();
for (const shop of shops) {
  const brand = getBrandName(shop.name);
  if (!brand) continue;
  if (!brandMap.has(brand)) brandMap.set(brand, []);
  brandMap.get(brand).push(shop);
}

// 複数店舗あり、かつ group_id が複数種類あるブランドを抽出
const fragmented = [];
for (const [brand, stores] of brandMap) {
  if (stores.length < 2) continue;
  const groupIds = new Set(stores.map(s => s.group_id).filter(Boolean));
  const hasFragmented = groupIds.size > 1;
  if (hasFragmented) {
    fragmented.push({ brand, stores, groupIds: [...groupIds] });
  }
}

// group_id がバラバラなものを優先表示
fragmented.sort((a, b) => b.stores.length - a.stores.length);

console.log(`=== 同一ブランド・group_id 分散 ${fragmented.length}件 ===\n`);
for (const { brand, stores, groupIds } of fragmented) {
  // g_solo_ だけのものは特に注意
  const hasBrandGroup = groupIds.some(g => !g.startsWith('g_solo_'));
  const marker = hasBrandGroup ? '⚠️' : '🔴';
  console.log(`${marker} ${stores[0].name.match(/^[^\s]+(?:\s[^\s]+)?/)?.[0] || brand} (${stores.length}店舗)`);
  console.log(`   group_ids: ${groupIds.join(', ')}`);
  stores.forEach(s => {
    const pref = s.raw_data?.prefecture || '?';
    const area = s.raw_data?.area || s.raw_data?.city || '?';
    console.log(`   - ${s.name} [${s.group_id}] ${pref} ${area}`);
  });
  console.log('');
}

console.log('凡例: 🔴=全てg_solo_（要統合） ⚠️=一部ブランドグループあり（確認要）');
