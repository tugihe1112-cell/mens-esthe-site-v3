/**
 * 奈良県 店舗登録スクリプト
 * mens-mg.com 奈良ランキング TOP10 をDBに登録
 * 実行: node scripts/maintenance/process_nara_shops.mjs [--dry-run]
 */
import fs from 'fs';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const DRY_RUN = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const SHOPS = [
  { id: 'nara_nara_naroma',              name: 'NAROMA (ナロマ)',                     website_url: 'https://naroma.jp/',                      area: '奈良' },
  { id: 'nara_nara_aromaclinic',         name: 'AROMA CLINIC NARA (アロマクリニック奈良)', website_url: 'https://aromaclinic-nara.com/',            area: '奈良' },
  { id: 'nara_ikoma_therapist_club',     name: 'THE THERAPIST CLUB',                 website_url: 'https://therapist-club.com/ikoma/',       area: '生駒' },
  { id: 'nara_nara_sepia_collection',    name: 'sepia collection (セピアコレクション)', website_url: 'https://sepia-collection-aroma.com/',     area: '奈良' },
  { id: 'nara_nara_olive',               name: 'OLive (オリーブ)',                    website_url: 'https://www.olive-narao.com/',             area: '奈良' },
  { id: 'nara_nara_moonlight',           name: 'Moonlight (ムーンライト)',             website_url: 'https://moonlight-nara.com/',             area: '奈良' },
  { id: 'nara_nara_karlovy',             name: 'Karlovy colonnade (カルロビコロナーダ)', website_url: 'https://www.m-karlovy.com/',              area: '奈良' },
  { id: 'nara_nara_aroma_coco',          name: 'AROMA COCO (アロマココ)',              website_url: 'https://nara-aromacoco.com/',             area: '奈良' },
  { id: 'nara_tawaramoto_heavenly',      name: 'HEAVENLY',                           website_url: 'https://private-page.my.canva.site/heavenly-hp', area: '田原本' },
];

async function getOgImage(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(8000),
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    return $('meta[property="og:image"]').attr('content')
      || $('meta[name="twitter:image"]').attr('content')
      || $('link[rel="apple-touch-icon"]').attr('href')
      || null;
  } catch { return null; }
}

// 既存shop確認
const { data: existing } = await supabase.from('shops').select('id').in('id', SHOPS.map(s => s.id));
const existingIds = new Set((existing || []).map(s => s.id));

console.log(`奈良県 shop登録 (dry-run: ${DRY_RUN})\n`);

let inserted = 0, skipped = 0;
for (const shop of SHOPS) {
  if (existingIds.has(shop.id)) {
    console.log(`  skip (already exists): ${shop.name}`);
    skipped++;
    continue;
  }

  const image_url = await getOgImage(shop.website_url);
  console.log(`  + ${shop.name} → image: ${image_url ? '✓' : 'null'}`);

  if (!DRY_RUN) {
    const { error } = await supabase.from('shops').insert({
      id: shop.id,
      name: shop.name,
      website_url: shop.website_url,
      image_url,
      raw_data: { prefecture: '奈良県', area: shop.area },
    });
    if (error) console.error(`    ERROR: ${error.message}`);
    else inserted++;
  } else {
    inserted++;
  }
}

console.log(`\n完了: 登録 ${inserted}件 / スキップ ${skipped}件 (dry-run: ${DRY_RUN})`);
