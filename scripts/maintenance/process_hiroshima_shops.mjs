/**
 * 広島県 8店舗 shop登録 + og:image設定
 * 実行: node scripts/maintenance/process_hiroshima_shops.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const DRY_RUN = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = k => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';

const SHOPS = [
  {
    id: 'hiroshima_hiroshima_salon_do_ni_na',
    name: 'salon.do.ni-na (サロン・ド・ニーナ)',
    website_url: 'https://salon-do-ni-na.com/',
    schedule_url: 'https://salon-do-ni-na.com/lady.php',
    phone: '070-2368-2727',
    area: '広島',
    prefecture: '広島県',
  },
  {
    id: 'hiroshima_hiroshima_hitozuma_san',
    name: '広島人妻さん',
    website_url: 'https://hiroshima-hitozumasan.com/',
    phone: '070-8461-5262',
    area: '広島',
    prefecture: '広島県',
  },
  {
    id: 'hiroshima_hiroshima_queen',
    name: 'Queen (クイーン)',
    website_url: 'https://hiroshima-queen.com/',
    phone: '090-3517-1314',
    area: '広島',
    prefecture: '広島県',
  },
  {
    id: 'hiroshima_hiroshima_resort',
    name: 'RESORT (リゾート)',
    website_url: 'https://resort-h.net/',
    phone: '080-2926-1146',
    area: '広島',
    prefecture: '広島県',
  },
  {
    id: 'hiroshima_hiroshima_enel',
    name: 'ENEL (エネル)',
    website_url: 'https://enel-official.com/',
    phone: '080-8244-9297',
    area: '広島',
    prefecture: '広島県',
  },
  {
    id: 'hiroshima_hiroshima_crea',
    name: 'CREA (クレア)',
    website_url: 'https://creahiroshima.com/',
    phone: '070-2353-9000',
    area: '広島',
    prefecture: '広島県',
  },
  {
    id: 'hiroshima_hiroshima_aroma_mia',
    name: 'Aroma Mia (アロマミア)',
    website_url: 'https://aromamia0619.com/',
    phone: '070-8537-6369',
    area: '広島',
    prefecture: '広島県',
  },
  {
    id: 'hiroshima_fukuyama_mensesthe_kenkyujo',
    name: '福山メンズエステ研究所',
    website_url: 'https://iyashilab.xyz/',
    phone: '090-9672-8962',
    area: '福山',
    prefecture: '広島県',
  },
];

async function getOgImage(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);
    return (
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      $('link[rel="apple-touch-icon"]').attr('href') ||
      null
    );
  } catch {
    return null;
  }
}

// Check existing shops
const { data: existing } = await supabase
  .from('shops')
  .select('id')
  .in('id', SHOPS.map(s => s.id));
const existingIds = new Set((existing || []).map(s => s.id));

let added = 0, skipped = 0;
for (const shop of SHOPS) {
  if (existingIds.has(shop.id)) {
    console.log(`  skip (exists): ${shop.id}`);
    skipped++;
    continue;
  }

  const imageUrl = await getOgImage(shop.website_url);
  console.log(`  ${shop.id}`);
  console.log(`    image_url: ${imageUrl || 'null'}`);

  if (DRY_RUN) { added++; continue; }

  const { error } = await supabase.from('shops').insert({
    id: shop.id,
    name: shop.name,
    website_url: shop.website_url,
    schedule_url: shop.schedule_url || null,
    image_url: imageUrl,
    raw_data: {
      area: shop.area,
      prefecture: shop.prefecture,
      phone: shop.phone,
    },
  });

  if (error) {
    console.log(`    ✗ insert失敗: ${error.message}`);
  } else {
    console.log(`    ✓ 登録完了`);
    added++;
  }
  await new Promise(r => setTimeout(r, 500));
}

console.log(`\n${DRY_RUN ? '[dry-run] ' : ''}登録: ${added}件 / スキップ: ${skipped}件`);
