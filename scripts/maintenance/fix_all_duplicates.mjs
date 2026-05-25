/**
 * 全店舗の重複セラピストを一括削除するスクリプト
 * ロジック: 同じ shop_id × name の組み合わせが複数ある場合、
 *   1. 写真あり（image_url != null）を優先して残す
 *   2. 複数が写真ありの場合: 最もシンプルなID（短い＆shop名が二重になっていない）を優先
 *   3. それでも同列: created_at が新しいものを残す
 *
 * 実行: node scripts/maintenance/fix_all_duplicates.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('VITE_SUPABASE_ANON_KEY'));

const DRY_RUN = process.argv.includes('--dry-run');
if (DRY_RUN) console.log('🔍 DRY-RUN モード（DB変更なし）\n');

// --- 全セラピスト取得 ---
console.log('全セラピストを取得中...');
let all = [];
let from = 0;
const BATCH = 1000;
while (true) {
  const { data, error } = await supabase
    .from('therapists')
    .select('id, shop_id, name, image_url, created_at')
    .range(from, from + BATCH - 1);
  if (error) { console.error(error); break; }
  if (!data || data.length === 0) break;
  all = all.concat(data);
  if (data.length < BATCH) break;
  from += BATCH;
}
console.log(`総セラピスト数: ${all.length}件\n`);

// --- shop_id × name でグループ化 ---
const map = {};
for (const t of all) {
  const key = `${t.shop_id}|||${(t.name || '').trim()}`;
  if (!map[key]) map[key] = [];
  map[key].push(t);
}

// --- IDの「クリーンさ」スコア（低いほど良い）---
// 二重shop名（例: _salon_blanca_salon_blanca_...）はペナルティ
function idScore(t) {
  const id = t.id;
  let score = 0;
  // UUIDっぽい（ランダムハイフン区切り）は少しペナルティ
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-/.test(id)) score += 10;
  // shop_idが2回登場（二重登録バグ）はペナルティ
  const shopId = t.shop_id;
  if (shopId && id.includes(shopId + '_' + shopId)) score += 20;
  if (shopId && id.replace(shopId + '_', '').includes(shopId)) score += 15;
  // ♦︎付きはペナルティ（サイト表示用記号が混入している）
  if (id.includes('♦')) score += 5;
  // 数字サフィックス（_0, _1, ... _25）はペナルティ
  if (/_\d+$/.test(id)) score += 3;
  // URLエンコード（%XX）が含まれる場合はペナルティ
  if (/%[0-9A-F]{2}/i.test(id)) score += 8;
  // IDが短いほど良い（シンプル）
  score += id.length * 0.01;
  return score;
}

// --- 重複処理 ---
let totalDeleted = 0;
let totalKept = 0;
const deleteIds = [];

for (const [key, list] of Object.entries(map)) {
  if (list.length <= 1) continue;

  // ソート: 写真あり優先 → IDスコア低い優先 → created_at新しい優先
  list.sort((a, b) => {
    const aHasImg = a.image_url ? 0 : 1;
    const bHasImg = b.image_url ? 0 : 1;
    if (aHasImg !== bHasImg) return aHasImg - bHasImg;
    const scoreDiff = idScore(a) - idScore(b);
    if (Math.abs(scoreDiff) > 0.5) return scoreDiff;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const keep = list[0];
  const toDelete = list.slice(1);

  totalKept++;
  totalDeleted += toDelete.length;

  if (DRY_RUN) {
    const [sid, name] = key.split('|||');
    console.log(`✅ 残す: ${keep.id} (${keep.image_url ? '写真✓' : '写真✗'})`);
    toDelete.forEach(t => console.log(`  🗑️  削除: ${t.id}`));
  }

  toDelete.forEach(t => deleteIds.push(t.id));
}

console.log(`\n重複グループ数: ${totalKept + deleteIds.length > 0 ? totalKept : 0}`);
console.log(`削除予定件数: ${deleteIds.length}件`);

if (DRY_RUN) {
  console.log('\n✅ DRY-RUN 完了。本実行は --dry-run なしで。');
  process.exit(0);
}

// --- 一括削除（50件ずつバッチ処理）---
console.log('\n削除開始...');
let done = 0;
const CHUNK = 50;
for (let i = 0; i < deleteIds.length; i += CHUNK) {
  const chunk = deleteIds.slice(i, i + CHUNK);
  const { error } = await supabase
    .from('therapists')
    .delete()
    .in('id', chunk);
  if (error) {
    console.error(`❌ バッチ削除エラー (${i}~${i + chunk.length}):`, error.message);
  } else {
    done += chunk.length;
    process.stdout.write(`\r進捗: ${done}/${deleteIds.length}件`);
  }
}

console.log(`\n\n✅ 完了: ${done}件削除`);
