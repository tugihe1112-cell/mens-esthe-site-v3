/**
 * カテゴリD: 同一場所への重複登録を検出
 * 同一ブランド名 × 同一 city/area でIDが複数存在する店舗を探す
 * 実行: node scripts/debug/check_duplicate_shops.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const { data: shops } = await supabase
  .from('shops')
  .select('id, name, group_id, raw_data');

// セラピスト数も取得
const { data: therapistCounts } = await supabase
  .from('therapists')
  .select('shop_id');

const countMap = {};
for (const t of (therapistCounts || [])) {
  countMap[t.shop_id] = (countMap[t.shop_id] || 0) + 1;
}

// ブランド名を正規化（末尾の店舗サフィックスを除去）
const normalize = (name) => {
  if (!name) return '';
  return name
    .replace(/[\s　]*[（(][^）)]*(?:店|ルーム)[）)]/gu, '')
    .replace(/[\s　]+\S+(?:店|ルーム)$/u, '')
    .trim()
    .toLowerCase()
    .replace(/[\s　]+/g, '');
};

// city + area の組み合わせでキーを作成
const getLocationKey = (shop) => {
  const pref = shop.raw_data?.prefecture || '';
  const city = shop.raw_data?.city || '';
  const area = shop.raw_data?.area || '';
  return `${pref}|${city}|${area}`;
};

// ブランド名 × 場所 でグループ化
const map = new Map();
for (const shop of shops) {
  const brand = normalize(shop.name);
  const loc = getLocationKey(shop);
  const key = `${brand}|||${loc}`;
  if (!map.has(key)) map.set(key, []);
  map.get(key).push(shop);
}

// 同一キーに複数の店舗IDがあるものを抽出
const duplicates = [];
for (const [key, stores] of map) {
  if (stores.length < 2) continue;
  duplicates.push({ key, stores });
}

duplicates.sort((a, b) => b.stores.length - a.stores.length);

console.log(`=== カテゴリD: 同一場所への重複登録 ${duplicates.length}件 ===\n`);

for (const { stores } of duplicates) {
  const s0 = stores[0];
  const pref = s0.raw_data?.prefecture || '?';
  const city = s0.raw_data?.city || '?';
  const area = s0.raw_data?.area || '';
  console.log(`📍 ${s0.name} [${pref} ${city} ${area}]`);
  for (const s of stores) {
    const cnt = countMap[s.id] || 0;
    const gid = s.group_id || 'null';
    console.log(`   ${s.id} | group=${gid} | セラピスト:${cnt}名`);
  }
  console.log('');
}
