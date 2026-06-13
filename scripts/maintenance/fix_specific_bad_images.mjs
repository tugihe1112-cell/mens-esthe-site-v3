/**
 * fix_specific_bad_images.mjs
 *
 * 自動取得で誤った画像が設定された店舗を手動で上書き修正する
 * fix_bad_shop_images.mjs の上書きバージョン（設定済みでも強制更新）
 *
 * node scripts/maintenance/fix_specific_bad_images.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const isDryRun = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

// website_url の部分一致 → 強制上書きする image_url（現在の値に関係なく）
const FORCE_UPDATES = [
  {
    urlPattern: 'mens-shinjuku.com',
    imageUrl: 'https://mens-shinjuku.com/img/mainvisual.jpg',
    note: 'MITSUBACHI → メインビジュアル (esthe-zukan.com バナーを修正)',
  },
  {
    urlPattern: 'rs-spa.com',
    imageUrl: 'https://rs-spa.com/wp-content/uploads/2025/05/r.2spamain-pc.jpg',
    note: 'R,s SPA → メインビジュアル (クレカ画像を修正)',
  },
  {
    urlPattern: 'aroma-chocolate.com',
    imageUrl: 'https://www.aroma-chocolate.com/images/up_100_1_0_1673874501.jpg',
    note: 'Chocolate → 背景画像 (spacer → 正規画像)',
  },
  {
    urlPattern: 'grandchariottakadababa.com',
    imageUrl: 'https://www.grandchariottakadababa.com/asset/img/bg_top.jpg',
    note: 'GRAND CHARIOT → トップ背景画像 (spacer → 正規画像)',
  },
  {
    urlPattern: 'aroma-tiamo.com',
    imageUrl: 'https://www.aroma-tiamo.com/images/up_100_2_0_1738306591.png',
    note: 'AROMA TIAMO → 背景画像 (spacer → 正規画像)',
  },
];

// spacer 系の画像が設定されている全店舗を null に戻す
// （null → fix_bad_shop_images.mjs で再取得 or 手動対応）
const SPACER_PATTERNS = [
  'spacer',
  'placeholder',
  'noimage',
  'no-image',
  'no_image',
];

console.log(`${isDryRun ? '[DRY RUN] ' : ''}手動修正 + spacer クリア\n`);

let updated = 0, skipped = 0;

// --- 1. 手動修正（FORCE_UPDATES） ---
console.log('=== 手動修正 ===');
for (const entry of FORCE_UPDATES) {
  const { data: shops, error } = await supabase
    .from('shops')
    .select('id, name, website_url, image_url')
    .ilike('website_url', `%${entry.urlPattern}%`);

  if (error) { console.error(`❌ ${entry.urlPattern}:`, error.message); continue; }
  if (!shops?.length) { console.log(`⚠️  ヒットなし: ${entry.urlPattern}`); continue; }

  for (const shop of shops) {
    console.log(`📸 ${shop.name}`);
    console.log(`   現在: ${shop.image_url || '(null)'}`);
    console.log(`   新規: ${entry.imageUrl}`);
    console.log(`   備考: ${entry.note}`);

    if (!isDryRun) {
      const { error: e } = await supabase.from('shops').update({ image_url: entry.imageUrl }).eq('id', shop.id);
      if (e) { console.log(`   ❌ ${e.message}`); }
      else   { console.log(`   ✅ 更新完了`); updated++; }
    } else {
      updated++;
    }
    console.log();
  }
}

// --- 2. spacer 系 → null に戻す ---
console.log('=== spacer 系クリア ===');

// 全店舗の image_url を取得してフィルタ
const { data: allShops, error: allErr } = await supabase
  .from('shops')
  .select('id, name, image_url')
  .not('image_url', 'is', null);

if (allErr) { console.error('❌ 全取得エラー:', allErr.message); process.exit(1); }

const spacerShops = allShops.filter(s => {
  const filename = (s.image_url || '').split('/').pop().split('?')[0].toLowerCase();
  return SPACER_PATTERNS.some(p => filename.includes(p));
});

console.log(`spacer 系: ${spacerShops.length}件\n`);

for (const shop of spacerShops) {
  console.log(`🗑  ${shop.name}`);
  console.log(`   ${shop.image_url}`);

  if (!isDryRun) {
    const { error: e } = await supabase.from('shops').update({ image_url: null }).eq('id', shop.id);
    if (e) { console.log(`   ❌ ${e.message}`); }
    else   { console.log(`   ✅ null に戻しました`); updated++; }
  } else {
    updated++;
  }
  console.log();
}

console.log(`\n完了: ${updated}件更新, ${skipped}件スキップ`);
