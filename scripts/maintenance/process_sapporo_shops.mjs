/**
 * 北海道 札幌 - 10店舗登録
 * 実行: node scripts/maintenance/process_sapporo_shops.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const DRY_RUN = process.argv.includes('--dry-run');

const SHOPS = [
  {
    id: 'hokkaido_sapporo_sapporo_latte',
    name: 'LATTE (ラテ)',
    website_url: 'https://latte-sapporo.com/',
    image_url: 'https://img.estama.jp/shop_data/00000039701/hp/logo/600x600/d99aj_20240508185203.png',
    schedule_url: 'https://latte-sapporo.com/schedule/',
    raw_data: { prefecture: '北海道', area: '札幌' }
  },
  {
    id: 'hokkaido_sapporo_sapporo_chocolat',
    name: 'Chocolat (ショコラ)',
    website_url: 'https://chocolat-esthe.com/',
    image_url: 'https://cdn2-caskan.com/caskan/img/shop_top_banner/1611_banner_1739176569.jpg',
    schedule_url: 'https://chocolat-esthe.com/schedule',
    raw_data: { prefecture: '北海道', area: '札幌' }
  },
  {
    id: 'hokkaido_sapporo_sapporo_labo',
    name: '札幌エステ研究所',
    website_url: 'https://esthetic-labo.net/',
    image_url: 'https://esthetic-labo.net/common/img/concept_logo.png',
    schedule_url: 'https://esthetic-labo.net/schedule/',
    raw_data: { prefecture: '北海道', area: '札幌' }
  },
  {
    id: 'hokkaido_sapporo_sapporo_aromaria',
    name: 'Aromaria (アロマリア)',
    website_url: 'https://www.aroma-ria.com/',
    image_url: null,
    schedule_url: 'https://www.aroma-ria.com/schedule/',
    raw_data: { prefecture: '北海道', area: '札幌' }
  },
  {
    id: 'hokkaido_sapporo_sapporo_coscos',
    name: 'コス×コス',
    website_url: 'https://coscosmenes.com/',
    image_url: null,
    schedule_url: null,
    raw_data: { prefecture: '北海道', area: '札幌' }
  },
  {
    id: 'hokkaido_sapporo_sapporo_flan',
    name: 'aroma Flan (アロマフラン)',
    website_url: 'https://flan-sapporo.com/',
    image_url: null,
    schedule_url: null,
    raw_data: { prefecture: '北海道', area: '札幌' }
  },
  {
    id: 'hokkaido_sapporo_sapporo_goddess',
    name: 'GODDESS BLESS (ゴッデスブレス)',
    website_url: 'https://goddess-bless.com/',
    image_url: 'https://pwchp.com/images_page/313/Kdt0x0OCVq16RcM.jpg',
    schedule_url: 'https://goddess-bless.com/schedule.php',
    raw_data: { prefecture: '北海道', area: '札幌' }
  },
  {
    id: 'hokkaido_sapporo_sapporo_lollipop',
    name: 'ロリポップ',
    website_url: 'http://idoldream.officialblog.jp/',
    image_url: null,
    schedule_url: null,
    raw_data: { prefecture: '北海道', area: '札幌' }
  },
  {
    id: 'hokkaido_sapporo_sapporo_madam',
    name: 'マダムの手',
    website_url: 'https://madamnote.ap1hp.com/',
    image_url: 'https://aroma-tsushin.com/__admin/img_hp/head_2_4613_1551178715667332.jpg',
    schedule_url: null,
    raw_data: { prefecture: '北海道', area: '札幌' }
  },
];

async function main() {
  console.log(`🏪 北海道 札幌 ${SHOPS.length}店舗登録${DRY_RUN ? ' [DRY RUN]' : ''}`);

  for (const shop of SHOPS) {
    // 既存チェック
    const { data: existing } = await supabase
      .from('shops')
      .select('id, name')
      .eq('id', shop.id)
      .single();

    if (existing) {
      console.log(`⏭️  SKIP: ${shop.id} (既登録)`);
      continue;
    }

    console.log(`+ ${shop.id} — ${shop.name}`);
    if (!DRY_RUN) {
      const { error } = await supabase.from('shops').insert({
        id: shop.id,
        name: shop.name,
        website_url: shop.website_url,
        image_url: shop.image_url,
        schedule_url: shop.schedule_url,
        raw_data: shop.raw_data
      });
      if (error) console.error(`  ❌ ERROR:`, error.message);
      else console.log(`  ✅ 登録完了`);
    }
  }

  console.log('\n完了。次: node scripts/maintenance/process_sapporo_therapists.mjs [--dry-run]');
}

main().catch(console.error);
