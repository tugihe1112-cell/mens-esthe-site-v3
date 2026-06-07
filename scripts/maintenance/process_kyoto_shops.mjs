/**
 * 京都府 追加店舗登録スクリプト
 * mens-mg.com 京都ランキング TOP10+ をDBに登録（既存分はスキップ）
 * 実行: node scripts/maintenance/process_kyoto_shops.mjs [--dry-run]
 */
import fs from 'fs';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const DRY_RUN = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const SHOPS = [
  { id: 'kyoto_kyoto_arrow',        name: 'ARROW京都',                         website_url: 'https://www.arrowkyoto.com/',        area: '京都' },
  { id: 'kyoto_kyoto_winkle',       name: 'WINKLE (ウインクル)',                website_url: 'https://kyoto-winkle.com/',          area: '京都' },
  { id: 'kyoto_kyoto_yurikago',     name: 'ゆりかご京都',                      website_url: 'https://yurikago-kyoto.com/',        area: '京都' },
  { id: 'kyoto_kyoto_purewhite',    name: 'Pure White (ピュアホワイト)',        website_url: 'https://purewhite-aroma.com/',       area: '京都' },
  { id: 'kyoto_kyoto_flower_spa',   name: 'Mrs.Flower Spa (ミセスフラワースパ)', website_url: 'https://flowerspa-kyoto.com/',      area: '京都' },
  { id: 'kyoto_kyoto_only',         name: 'ONLY (オンリー)',                    website_url: 'https://only-kyoto.net/',            area: '京都' },
  { id: 'kyoto_kyoto_kiyo',         name: 'Kiyoの部屋',                        website_url: 'https://mens-kiyo.com/',             area: '京都' },
  { id: 'kyoto_kyoto_zephyr',       name: 'ZEPHYR (ゼファー)',                 website_url: 'https://www.zephyr-kyoto.com/',      area: '京都' },
  { id: 'kyoto_kyoto_tiana',        name: 'Ti.ana (ティアナ)',                  website_url: 'https://tiana-esthe.com/',           area: '京都' },
  { id: 'kyoto_kyoto_spade',        name: 'SPADE (スペード)',                   website_url: 'https://esthe-spade.com/',           area: '京都' },
  { id: 'kyoto_kyoto_ppara',        name: 'P-パラ',                            website_url: 'https://www.p-para-kyoto.com/',      area: '京都' },
  { id: 'kyoto_kyoto_fairy_bay',    name: 'FAIRY BAY (フェアリーベイ)',         website_url: 'https://mensesthe-kyoto.com/',       area: '京都' },
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

// 既存の京都店舗を確認
const { data: existingKyoto } = await supabase
  .from('shops')
  .select('id, name, website_url')
  .ilike('id', 'kyoto_%');

console.log('=== 既存の京都店舗 ===');
(existingKyoto || []).forEach(s => console.log(`  ${s.id}: ${s.name} (${s.website_url})`));
console.log();

const existingIds = new Set((existingKyoto || []).map(s => s.id));
const existingUrls = new Set((existingKyoto || []).map(s => s.website_url).filter(Boolean));

// 既存店舗の名前でも重複チェック（URLが異なる場合）
const existingNames = new Set((existingKyoto || []).map(s => s.name));

console.log(`京都府 追加shop登録 (dry-run: ${DRY_RUN})\n`);

let inserted = 0, skipped = 0;
for (const shop of SHOPS) {
  if (existingIds.has(shop.id) || existingUrls.has(shop.website_url) || existingNames.has(shop.name)) {
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
      raw_data: { prefecture: '京都府', area: shop.area },
    });
    if (error) console.error(`    ERROR: ${error.message}`);
    else inserted++;
  } else {
    inserted++;
  }
}

console.log(`\n完了: 登録 ${inserted}件 / スキップ ${skipped}件 (dry-run: ${DRY_RUN})`);
