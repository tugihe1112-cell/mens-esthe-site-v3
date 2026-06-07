/**
 * 和歌山県 店舗登録スクリプト
 * mens-mg.com 和歌山ランキング TOP10 をDBに登録
 * 実行: node scripts/maintenance/process_wakayama_shops.mjs [--dry-run]
 */
import fs from 'fs';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const DRY_RUN = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const SHOPS = [
  { id: 'wakayama_wakayama_ideal',         name: 'ideal (イデアル)',                website_url: 'https://www.esthe-ideal.net/',              area: '和歌山' },
  { id: 'wakayama_wakayama_yolu_spa',      name: 'YOLU SPA (ヨルスパ)',             website_url: 'https://www.yoluspa.com/top/',             area: '和歌山' },
  { id: 'wakayama_wakayama_mrs_kyoshitsu', name: 'ミセスの教室',                   website_url: 'https://classroom-of-mrs.com/',             area: '和歌山' },
  { id: 'wakayama_wakayama_eden',          name: 'Eden (エデン)',                   website_url: 'https://2lpz8.crayonsite.com/',             area: '和歌山' },
  { id: 'wakayama_wakayama_clearflan',     name: 'Clearflan (クリアフラン)',        website_url: 'https://clearflan.com/',                   area: '和歌山' },
  { id: 'wakayama_wakayama_royal_crystal', name: 'royal.Crystal (ロイヤルクリスタル)', website_url: 'https://royal-crystal-wakayama.com/',   area: '和歌山' },
  { id: 'wakayama_wakayama_kyupito',       name: 'キューピット',                   website_url: 'https://kyupito-wakayama.net/top',          area: '和歌山' },
  { id: 'wakayama_wakayama_eco_kyoshitsu', name: 'エコde教室',                     website_url: 'https://www.ecodekyousitsu.com/top/',       area: '和歌山' },
  { id: 'wakayama_wakayama_melty_aroma',   name: 'Melty Aroma (メルティアロマ)',    website_url: 'https://melty-aroma.crayonsite.net/',      area: '和歌山' },
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

const { data: existing } = await supabase.from('shops').select('id').in('id', SHOPS.map(s => s.id));
const existingIds = new Set((existing || []).map(s => s.id));

console.log(`和歌山県 shop登録 (dry-run: ${DRY_RUN})\n`);

let inserted = 0, skipped = 0;
for (const shop of SHOPS) {
  if (existingIds.has(shop.id)) {
    console.log(`  skip: ${shop.name}`);
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
      raw_data: { prefecture: '和歌山県', area: shop.area },
    });
    if (error) console.error(`    ERROR: ${error.message}`);
    else inserted++;
  } else {
    inserted++;
  }
}

console.log(`\n完了: 登録 ${inserted}件 / スキップ ${skipped}件 (dry-run: ${DRY_RUN})`);
