/**
 * fix_warned_shop_images.mjs
 *
 * fix_missing_shop_images.mjs で ⚠️ となった17件のうち
 * Chrome で手動取得した画像URLを適用する
 *
 * node scripts/maintenance/fix_warned_shop_images.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const isDryRun = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

// website_url の部分一致 → 設定する image_url
// ⚠️ salon-cms デフォルト stock photo (pexels) は除外
// ⚠️ logo のみ / nav icon / tile bg は除外
const UPDATES = [
  {
    urlPattern: 'revere-spa.com',
    imageUrl: 'https://revere-spa.com/theme/mblme2whbk/images/ogp.jpg',
    note: 'Revere Spa (ogp.jpg)',
  },
  {
    urlPattern: 'idol-official.com',
    imageUrl: 'https://idol-official.com/theme/mblme2whpk/images/ogp.jpg',
    note: 'iDOL (ogp.jpg)',
  },
  {
    urlPattern: 'yokohama-mens-salon.com',
    imageUrl: 'https://yokohama-mens-salon.com/data/topic/tpc_6a24201b9b4af.jpg',
    note: 'Chloe (bg topic photo)',
  },
  {
    urlPattern: 'exe-fee.com',
    imageUrl: 'https://imgsrv.jp/shop/97/parts/og-image.png',
    note: 'doigt de fee (og-image)',
  },
  {
    urlPattern: 'esthe-rouge.com',
    imageUrl: 'http://www.esthe-rouge.com/images/up_100_4_0_1664324382.jpg',
    note: 'ROUGE (main visual)',
  },
  {
    urlPattern: 'andspa-esthe.com',
    imageUrl: 'https://andspa-esthe.com/img/content-title.jpg',
    note: 'And Spa (content-title)',
  },
  {
    urlPattern: 'beststar-osaka.com',
    imageUrl: 'https://oil-and-me.com/manage/image/up/20260527151611_2583250860_shop_slide_banner_img_url_0_w1920xh960.jpg',
    note: 'BESTSTAR / Oil&Me (banner)',
  },
  {
    urlPattern: 'aroma-president.com',
    imageUrl: 'https://aroma-president.com/wp-content/themes/aromapresident/images/pc02.jpg',
    note: 'AROMA PRESIDENT (main visual pc02)',
  },
];

console.log(`${isDryRun ? '[DRY RUN] ' : ''}⚠️ 店舗画像 手動更新 (${UPDATES.length}件)\n`);

let updated = 0;
let skipped = 0;

for (const entry of UPDATES) {
  // website_url が該当するショップを検索
  const { data: shops, error } = await supabase
    .from('shops')
    .select('id, name, website_url, image_url')
    .ilike('website_url', `%${entry.urlPattern}%`);

  if (error) {
    console.error(`  ❌ クエリエラー [${entry.urlPattern}]:`, error.message);
    continue;
  }

  if (!shops || shops.length === 0) {
    console.log(`  ⚠️  ヒットなし: ${entry.urlPattern}`);
    skipped++;
    continue;
  }

  for (const shop of shops) {
    if (shop.image_url) {
      console.log(`  ✅ スキップ（設定済み）: ${shop.name}`);
      skipped++;
      continue;
    }

    console.log(`  📸 ${shop.name} (${shop.id})`);
    console.log(`     ${entry.note}`);
    console.log(`     → ${entry.imageUrl}`);

    if (!isDryRun) {
      const { error: e } = await supabase
        .from('shops')
        .update({ image_url: entry.imageUrl })
        .eq('id', shop.id);
      if (e) {
        console.log(`     ❌ 更新エラー: ${e.message}`);
      } else {
        console.log(`     ✅ 更新完了`);
        updated++;
      }
    } else {
      updated++;
    }
    console.log();
  }
}

console.log(`\n完了: ${updated}件更新, ${skipped}件スキップ`);
