/**
 * fix_koakuma_duplicate_images.mjs
 *
 * 「被り写真バグ」修正 — 小悪魔スパトウキョウ
 *
 * 問題: 同一shop_id内で異なる名前のセラピストが同じ image_url を持つ状態。
 * 原因: fix_koakuma_photo_collision.mjs や fix_koakuma_new_therapists.mjs の
 *       suffix matching が誤って複数の DB 名を同一 UUID にマッチさせた可能性。
 *
 * 対応: 同shop_id内で重複する image_url をすべて null に戻す（noimage扱い）。
 *
 * 使い方:
 *   node scripts/maintenance/fix_koakuma_duplicate_images.mjs --dry-run
 *   node scripts/maintenance/fix_koakuma_duplicate_images.mjs
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SERVICE_KEY  = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  console.log(`=== 被り写真バグ修正 — 小悪魔スパ ${DRY_RUN ? '[DRY RUN]' : '[本実行]'} ===\n`);

  // koakuma 全店のセラピストを取得（image_url あり）
  const { data: therapists, error } = await supabase
    .from('therapists')
    .select('id, name, shop_id, image_url')
    .ilike('shop_id', '%koakuma%')
    .not('image_url', 'is', null);

  if (error) { console.error('取得エラー:', error); process.exit(1); }

  console.log(`image_url あり: ${therapists.length} 名\n`);

  // shop_id × image_url でグループ化
  const urlMap = {};
  for (const t of therapists) {
    const key = `${t.shop_id}::${t.image_url}`;
    if (!urlMap[key]) urlMap[key] = [];
    urlMap[key].push(t);
  }

  // 同shop_id内で同じimage_urlを2名以上が持つグループを抽出
  const duplicateGroups = Object.values(urlMap).filter(g => g.length > 1);

  if (duplicateGroups.length === 0) {
    console.log('✅ 被り写真は検出されませんでした。');
    return;
  }

  console.log(`被り写真グループ: ${duplicateGroups.length} 件`);

  const toNull = [];
  for (const group of duplicateGroups) {
    const names = group.map(t => t.name).join('  /  ');
    const shop  = group[0].shop_id.replace('tokyo_shinjuku_higashishinjuku_', '');
    console.log(`  [${shop}] ${names}`);
    console.log(`    URL: ${group[0].image_url.slice(-60)}`);
    for (const t of group) toNull.push(t.id);
  }

  console.log(`\nnull 化対象: ${toNull.length} 件`);

  if (DRY_RUN) {
    console.log('\n=== DRY RUN 完了: DB は変更しません ===');
    return;
  }

  // 50件ずつバッチで null 化
  let success = 0;
  for (let i = 0; i < toNull.length; i += 50) {
    const batch = toNull.slice(i, i + 50);
    const { error: e } = await supabase
      .from('therapists')
      .update({ image_url: null })
      .in('id', batch);
    if (e) { console.error('UPDATE エラー:', e); }
    else    { success += batch.length; }
  }

  console.log(`\n✅ null 化完了: ${success} 件`);
  console.log('⚠️  対象セラピストは noimage 表示になります（正しい挙動）。');
}

main();
