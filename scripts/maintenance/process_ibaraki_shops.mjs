/**
 * 茨城県 shop登録スクリプト
 * 水戸・つくば・守谷エリア 17店舗
 * Run: node scripts/maintenance/process_ibaraki_shops.mjs [--dry-run]
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const isDryRun = process.argv.includes('--dry-run');

// og:image取得
async function getOgImage(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(8000)
    });
    const html = await res.text();
    const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (ogMatch) return ogMatch[1];
    const twitterMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
    if (twitterMatch) return twitterMatch[1];
    return null;
  } catch { return null; }
}

const SHOPS = [
  // ── 水戸エリア ──
  {
    id: 'ibaraki_mito_mito_madame_spa',
    name: 'マダムスパ 水戸',
    website_url: 'https://madame-esthe.com/',
    schedule_url: 'https://madame-esthe.com/schedule/',
    raw_data: { prefecture: '茨城県', area: '水戸', city: '水戸市' }
  },
  {
    id: 'ibaraki_mito_mito_melt_rich',
    name: 'Melt Rich (メルトリッチ)',
    website_url: 'https://melt-rich.com/',
    schedule_url: 'https://melt-rich.com/schedule/',
    raw_data: { prefecture: '茨城県', area: '水戸', city: '水戸市' }
  },
  {
    id: 'ibaraki_mito_mito_bijo_spa',
    name: '美女SPA (水戸店)',
    website_url: 'https://bijospa-mito.com/',
    schedule_url: 'https://bijospa-mito.com/schedule.php',
    raw_data: { prefecture: '茨城県', area: '水戸', city: '水戸市' }
  },
  {
    id: 'ibaraki_mito_mito_aroma_queen',
    name: 'AROMA QUEEN (アロマクイーン)',
    website_url: 'https://aroma-queen.net/',
    schedule_url: 'https://aroma-queen.net/schedule/',
    raw_data: { prefecture: '茨城県', area: '水戸', city: '水戸市' }
  },
  {
    id: 'ibaraki_mito_mito_queendom',
    name: 'QUEENDOM (クイーンダム)',
    website_url: 'https://queendom-esthe.com/',
    schedule_url: 'https://queendom-esthe.com/schedule/',
    raw_data: { prefecture: '茨城県', area: '水戸', city: '水戸市' }
  },
  {
    id: 'ibaraki_mito_mito_esthe_tora',
    name: 'エステの虎 水戸店',
    website_url: 'https://esthe-tora.com/',
    schedule_url: 'https://esthe-tora.com/schedule/',
    raw_data: { prefecture: '茨城県', area: '水戸', city: '水戸市' }
  },
  {
    id: 'ibaraki_mito_mito_manamochi',
    name: 'まなもち',
    website_url: 'https://manamochi.net/',
    schedule_url: 'https://manamochi.net/schedule/',
    raw_data: { prefecture: '茨城県', area: '水戸', city: '水戸市' }
  },
  {
    id: 'ibaraki_mito_mito_empress',
    name: 'eMpress (エンプレス)',
    website_url: 'https://empress-mito.com/',
    schedule_url: 'https://empress-mito.com/schedule/',
    raw_data: { prefecture: '茨城県', area: '水戸', city: '水戸市' }
  },
  {
    id: 'ibaraki_mito_mito_never_land',
    name: 'NEVER LAND (ネバーランド)',
    website_url: 'https://neverland-mito.com/',
    schedule_url: null,
    raw_data: { prefecture: '茨城県', area: '水戸', city: '水戸市' }
  },
  // ── つくばエリア ──
  {
    id: 'ibaraki_tsukuba_tsukuba_tiara',
    name: 'TIARA (ティアラ)',
    website_url: 'https://www.tiaramens.com/',
    schedule_url: 'https://www.tiaramens.com/schedule/',
    raw_data: { prefecture: '茨城県', area: 'つくば', city: 'つくば市' }
  },
  {
    id: 'ibaraki_tsukuba_tsukuba_marvelous',
    name: 'Marvelous (マーベラス)',
    website_url: 'https://marvelous-mensesthetic.com/',
    schedule_url: 'https://marvelous-mensesthetic.com/schedule.php',
    raw_data: { prefecture: '茨城県', area: 'つくば', city: 'つくば市' }
  },
  {
    id: 'ibaraki_tsukuba_tsukuba_bijo_spa',
    name: '美女SPA (つくば店)',
    website_url: 'https://bijospa-tsukuba.com/',
    schedule_url: 'https://bijospa-tsukuba.com/schedule.php',
    raw_data: { prefecture: '茨城県', area: 'つくば', city: 'つくば市' }
  },
  {
    id: 'ibaraki_tsukuba_tsukuba_lspa',
    name: 'L&spa (エルスパ)',
    website_url: 'https://eru-supa.com/',
    schedule_url: 'https://eru-supa.com/schedule/',
    raw_data: { prefecture: '茨城県', area: 'つくば', city: 'つくば市' }
  },
  {
    id: 'ibaraki_tsukuba_tsukuba_showtime',
    name: 'SHOWTIME (ショータイム)',
    website_url: 'https://st-esthetic.com/',
    schedule_url: 'https://st-esthetic.com/schedule.php',
    raw_data: { prefecture: '茨城県', area: 'つくば', city: 'つくば市' }
  },
  {
    id: 'ibaraki_tsukuba_tsukuba_colors',
    name: 'COLORS (カラーズ)',
    website_url: 'https://www.029colors.com/',
    schedule_url: 'https://www.029colors.com/schedule',
    raw_data: { prefecture: '茨城県', area: 'つくば', city: 'つくば市' }
  },
  {
    id: 'ibaraki_tsukuba_tsukuba_kaminote',
    name: '神の手 (かみのて)',
    website_url: 'https://me-kaminote.com/',
    schedule_url: 'https://me-kaminote.com/schedule.php',
    raw_data: { prefecture: '茨城県', area: 'つくば', city: 'つくば市' }
  },
  // ── 守谷エリア ──
  {
    id: 'ibaraki_moriya_moriya_bijo_spa',
    name: '美女SPA (守谷店)',
    website_url: 'https://bijospa-moriya.com/',
    schedule_url: 'https://bijospa-moriya.com/schedule.php',
    raw_data: { prefecture: '茨城県', area: '守谷', city: '守谷市' }
  },
];

async function run() {
  console.log(`茨城県 shop登録 (${isDryRun ? 'DRY RUN' : '本実行'}) — ${SHOPS.length}店舗`);

  for (const shop of SHOPS) {
    // og:image取得
    const imageUrl = await getOgImage(shop.website_url);

    const record = {
      id: shop.id,
      name: shop.name,
      website_url: shop.website_url,
      schedule_url: shop.schedule_url || null,
      image_url: imageUrl,
      raw_data: shop.raw_data,
    };

    console.log(`\n${shop.id}`);
    console.log(`  image_url: ${imageUrl || '(null)'}`);

    if (isDryRun) continue;

    const { error } = await supabase.from('shops').upsert(record, { onConflict: 'id' });
    if (error) {
      console.error(`  ERROR:`, error.message);
    } else {
      console.log(`  ✅ 登録完了`);
    }
  }

  console.log('\n完了');
}

run().catch(console.error);
