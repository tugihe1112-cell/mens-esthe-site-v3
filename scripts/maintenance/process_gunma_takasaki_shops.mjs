/**
 * 群馬県 高崎エリア shop登録スクリプト
 *
 * 対象: 高崎TOP10 + 注目店舗（計8店舗）
 * 実行: node scripts/maintenance/process_gunma_takasaki_shops.mjs [--dry-run]
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const SUPA_URL = getEnv('VITE_SUPABASE_URL');
const SERVICE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(SUPA_URL, SERVICE_KEY);

const DRY_RUN = process.argv.includes('--dry-run');

const SHOPS = [
  {
    id: 'gunma_takasaki_takasaki_kami_no_tsue',
    name: '神の杖 高崎ルーム',
    website_url: 'https://esthe-god-cane.com/',
    schedule_url: 'https://esthe-god-cane.com/',
    image_url: 'https://esthe-god-cane.com/wp-content/uploads/2024/04/logoooo-1.png',
    raw_data: { prefecture: '群馬県', area: '高崎' },
  },
  {
    id: 'gunma_takasaki_takasaki_luana_spa',
    name: 'LUANA SPA (ルアナスパ)',
    website_url: 'https://luanaspa.jp/',
    schedule_url: 'https://luanaspa.jp/',
    image_url: 'https://luanaspa.jp/images/mv-logo.png',
    raw_data: { prefecture: '群馬県', area: '高崎' },
  },
  {
    id: 'gunma_takasaki_takasaki_yurikago',
    name: 'ゆりかご 高崎ルーム',
    website_url: 'https://www.yurikago-t.com/',
    schedule_url: 'https://www.yurikago-t.com/',
    image_url: 'https://www.yurikago-t.com/img/top_header_rogo.png',
    raw_data: { prefecture: '群馬県', area: '高崎' },
  },
  {
    id: 'gunma_takasaki_takasaki_my_precious',
    name: 'My Precious (マイプレシャス)',
    website_url: 'https://my-precious.net/',
    schedule_url: 'https://my-precious.net/',
    image_url: 'https://my-precious.net/lib/img/h-logo.png',
    raw_data: { prefecture: '群馬県', area: '高崎' },
  },
  {
    id: 'gunma_takasaki_takasaki_irokoi_club',
    name: '色恋倶楽部',
    website_url: 'https://irokoi-club.com/',
    schedule_url: 'https://irokoi-club.com/',
    image_url: 'https://irokoi-club.com/wp-content/uploads/2023/08/main-logo.png',
    raw_data: { prefecture: '群馬県', area: '高崎' },
  },
  {
    id: 'gunma_takasaki_takasaki_muchimuchi_spa',
    name: 'ムチムチSPA 高崎店',
    website_url: 'https://muchimuchi-spatakasaki.com/',
    schedule_url: 'https://muchimuchi-spatakasaki.com/',
    image_url: 'https://muchimuchi-spatakasaki.com/upFu8/1000109/official/officialConf/logo/img/headerLogo.png',
    raw_data: { prefecture: '群馬県', area: '高崎' },
  },
  {
    id: 'gunma_takasaki_takasaki_zero',
    name: 'Zero (ゼロ)',
    website_url: 'https://zerotakasaki.esthe-hp.com/',
    schedule_url: 'https://zerotakasaki.esthe-hp.com/',
    image_url: 'https://zerotakasaki.esthe-hp.com/upFu8/1005328/official/officialConf/logoresponsive/img/logo1.webp',
    raw_data: { prefecture: '群馬県', area: '高崎' },
  },
  {
    id: 'gunma_takasaki_takasaki_pompom',
    name: 'PomPom 高崎ルーム',
    website_url: 'https://ntokyo-esthe-pompom.com/',
    schedule_url: 'https://ntokyo-esthe-pompom.com/',
    image_url: 'https://ntokyo-esthe-pompom.com/favicon/apple-touch-icon.png',
    raw_data: { prefecture: '群馬県', area: '高崎' },
  },
];

async function main() {
  console.log(`=== 群馬県 高崎エリア shop登録 ${DRY_RUN ? '[DRY-RUN]' : ''} ===`);
  console.log(`登録対象: ${SHOPS.length}店舗\n`);

  // 既存チェック
  const { data: existing } = await supabase
    .from('shops')
    .select('id')
    .in('id', SHOPS.map(s => s.id));
  const existingIds = new Set((existing || []).map(s => s.id));

  let inserted = 0, skipped = 0;

  for (const shop of SHOPS) {
    if (existingIds.has(shop.id)) {
      console.log(`  ✓ SKIP: ${shop.name} (${shop.id})`);
      skipped++;
      continue;
    }

    const payload = {
      id: shop.id,
      name: shop.name,
      website_url: shop.website_url,
      schedule_url: shop.schedule_url,
      image_url: shop.image_url,
      raw_data: shop.raw_data,
    };

    console.log(`  + ${shop.name}`);
    console.log(`    id: ${shop.id}`);
    console.log(`    image: ${shop.image_url}`);

    if (!DRY_RUN) {
      const { error } = await supabase.from('shops').insert(payload);
      if (error) {
        console.error(`    ERROR: ${error.message}`);
      } else {
        console.log(`    → 登録OK`);
        inserted++;
      }
    } else {
      inserted++;
    }
  }

  console.log(`\n=== 完了 ===`);
  console.log(`登録: ${inserted}件, スキップ: ${skipped}件`);
}

main().catch(console.error);
