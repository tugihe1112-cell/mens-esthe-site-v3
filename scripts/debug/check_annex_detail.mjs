/**
 * 明大前ANNEX のimg[src*="staff"]詳細確認
 * 実行: node scripts/debug/check_annex_detail.mjs
 */
import fs from 'fs';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const html = await (await fetch('https://aroma-annex.com/therapist/', {
  headers: { 'User-Agent': UA, Referer: 'https://aroma-annex.com/' },
  signal: AbortSignal.timeout(15000),
})).text();

const $ = cheerio.load(html);

console.log('=== img[src*="staff"] 全件 ===');
$('img[src*="staff"]').each((i, el) => {
  const src = $(el).attr('src') || '';
  const alt = $(el).attr('alt') || '';
  const dataSrc = $(el).attr('data-src') || '';
  console.log(`[${i}] alt="${alt}" src="${src.slice(-70)}" data-src="${dataSrc.slice(-70)}"`);
});

console.log('\n=== DB null名 と altの照合 ===');
const { data: shops } = await supabase.from('shops').select('id').ilike('website_url', '%aroma-annex%');
const shopIds = shops.map(s => s.id);
const { data: therapists } = await supabase.from('therapists').select('id, name, image_url').in('shop_id', shopIds).is('image_url', null);
console.log('DB null名:', therapists.map(t => t.name).join('、'));

// altに名前が含まれる img を表示
for (const t of therapists) {
  $('img').each((_, el) => {
    const alt = $(el).attr('alt') || '';
    if (alt.includes(t.name)) {
      const src = $(el).attr('src') || $(el).attr('data-src') || '';
      console.log(`  ${t.name} → alt="${alt}" src="${src.slice(-70)}"`);
    }
  });
}
