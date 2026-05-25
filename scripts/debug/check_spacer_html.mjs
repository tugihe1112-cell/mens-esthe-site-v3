/**
 * spacer画像店舗のHTMLパターンを実際に確認するスクリプト
 * 実行: node scripts/debug/check_spacer_html.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

// spacerのある店舗を件数多い順に取得
const { data: therapists } = await supabase
  .from('therapists')
  .select('shop_id')
  .ilike('image_url', '%spacer%');

const countByShop = {};
for (const t of therapists) countByShop[t.shop_id] = (countByShop[t.shop_id] || 0) + 1;

const shopIds = Object.keys(countByShop);
const { data: shops } = await supabase
  .from('shops')
  .select('id, name, website_url')
  .in('id', shopIds);

shops.sort((a, b) => (countByShop[b.id] || 0) - (countByShop[a.id] || 0));

console.log(`スペーサー画像を持つ店舗: ${shops.length}件\n`);

const STAFF_PATHS = ['/staff/', '/cast/', '/therapist/', '/girls/', '/member/', '/lineup/'];

for (const shop of shops) {
  const baseUrl = shop.website_url?.replace(/\/$/, '');
  if (!baseUrl) {
    console.log(`[${shop.id}] (${countByShop[shop.id]}名) URLなし - ${shop.name}`);
    continue;
  }

  let found = false;
  let result = '';

  for (const path of STAFF_PATHS) {
    try {
      const r = await fetch(baseUrl + path, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(8000),
      });
      if (!r.ok) continue;
      const html = await r.text();
      const $ = cheerio.load(html);

      const spacerCount = $('img[src*="spacer"]').length;
      const sannoCount = $('img[alt*="さんの写真"]').length;
      const bgCount = $('[style*="background-image"]').length;

      // サンプルalt取得
      const alts = [];
      $('img[alt]').each((_, el) => {
        const a = $(el).attr('alt')?.trim();
        if (a) alts.push(a);
      });
      const sample = [...new Set(alts)].slice(0, 5).join(' / ');

      result = `${path} | spacer:${spacerCount} sanno:${sannoCount} bg:${bgCount} | alts: ${sample}`;
      found = true;
      break;
    } catch {}
  }

  const status = found ? result : 'ページ取得失敗';
  console.log(`[${shop.id}] (${countByShop[shop.id]}名)`);
  console.log(`  ${shop.name} | ${baseUrl}`);
  console.log(`  → ${status}\n`);
}
