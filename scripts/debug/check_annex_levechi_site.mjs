/**
 * 明大前ANNEX・超レベチなエステ24 サイト構造確認
 * 実行: node scripts/debug/check_annex_levechi_site.mjs
 */
import fs from 'fs';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function fetchHtml(url, referer) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Referer: referer || url },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return await res.text();
}

async function getNullTherapists(urlPart) {
  const { data: shops } = await supabase.from('shops').select('id, name, website_url').ilike('website_url', `%${urlPart}%`);
  if (!shops?.length) return { shops: [], therapists: [] };
  const shopIds = shops.map(s => s.id);
  const { data: therapists } = await supabase.from('therapists')
    .select('id, name, shop_id, image_url')
    .in('shop_id', shopIds);
  return { shops, therapists: therapists || [] };
}

// ─── 明大前ANNEX ────────────────────────────────────────────────
console.log('\n' + '='.repeat(60));
console.log('【明大前ANNEX (アネックス)】 https://aroma-annex.com');
console.log('='.repeat(60));

const annex = await getNullTherapists('aroma-annex.com');
console.log(`対象店舗: ${annex.shops.map(s => s.id + ' ' + s.name).join(', ')}`);
const annexNull = annex.therapists.filter(t => !t.image_url);
console.log(`DB 写真なし: ${annexNull.length}/${annex.therapists.length}名`);
console.log('名前:', annexNull.map(t => t.name).join('、'));

const ANNEX_URLS = [
  'https://aroma-annex.com/therapist/',
  'https://aroma-annex.com/cast/',
  'https://aroma-annex.com/',
  'https://aroma-annex.com/staff/',
];

for (const url of ANNEX_URLS) {
  try {
    const html = await fetchHtml(url, 'https://aroma-annex.com/');
    const $ = cheerio.load(html);

    const imgCount = $('img').length;
    const wpImgs = $('img[src*="/wp-content/"]').length;
    const bgCount = $('[style*="background-image"]').length;
    const photosImgs = $('img[src*="/photos/"]').length;
    const staffImgs = $('img[src*="/staff/"], img[src*="staff"]').length;

    console.log(`\n[${url}]`);
    console.log(`  img合計: ${imgCount}, wp-content: ${wpImgs}, background-image: ${bgCount}, photos: ${photosImgs}, staff: ${staffImgs}`);

    if (wpImgs > 0) {
      console.log('  wp-content imgs:');
      $('img[src*="/wp-content/"]').slice(0, 5).each((_, el) => {
        console.log(`    alt="${$(el).attr('alt')}" src="${$(el).attr('src')?.slice(-60)}"`);
      });
    }

    if (bgCount > 0) {
      console.log('  background-image items:');
      $('[style*="background-image"]').slice(0, 5).each((_, el) => {
        const style = $(el).attr('style') || '';
        const m = style.match(/url\(['"]?([^'")\s]+)['"]?\)/);
        const text = $(el).text().trim().slice(0, 20);
        console.log(`    url="${m?.[1]?.slice(-50)}" text="${text}"`);
      });
    }

    // 名前が含まれるか
    const names = annexNull.map(t => t.name);
    const found = names.filter(n => html.includes(n));
    console.log(`  DB null名がページ内: ${found.length}/${names.length}名`);
    if (found.length > 0) {
      console.log('  →', found.slice(0, 8).join('、'));
      break; // ヒットしたURLで停止
    }
  } catch (e) {
    console.log(`  ${url}: ${e.message}`);
  }
}

// ─── 超レベチなエステ24 ─────────────────────────────────────────
console.log('\n' + '='.repeat(60));
console.log('【超レベチなエステ24】 https://tokyo242424.com/');
console.log('='.repeat(60));

const levechi = await getNullTherapists('tokyo242424');
console.log(`対象店舗: ${levechi.shops.map(s => s.id + ' ' + s.name).join(', ')}`);
const levechiNull = levechi.therapists.filter(t => !t.image_url);
console.log(`DB 写真なし: ${levechiNull.length}/${levechi.therapists.length}名`);
console.log('名前(最初の20名):', levechiNull.slice(0, 20).map(t => t.name).join('、'));

const LEVECHI_URLS = [
  'https://tokyo242424.com/cast/',
  'https://tokyo242424.com/',
  'https://tokyo242424.com/therapist/',
  'https://tokyo242424.com/staff/',
];

for (const url of LEVECHI_URLS) {
  try {
    const html = await fetchHtml(url, 'https://tokyo242424.com/');
    const $ = cheerio.load(html);

    const imgCount = $('img').length;
    const estamaImgs = $('img[src*="estama"]').length;
    const wpImgs = $('img[src*="/wp-content/"]').length;
    const photosImgs = $('img[src*="/photos/"]').length;
    const bgCount = $('[style*="background-image"]').length;

    console.log(`\n[${url}]`);
    console.log(`  img合計: ${imgCount}, estama: ${estamaImgs}, wp-content: ${wpImgs}, photos: ${photosImgs}, bg: ${bgCount}`);

    if (estamaImgs > 0) {
      console.log('  estama imgs:');
      $('img[src*="estama"]').slice(0, 5).each((_, el) => {
        console.log(`    alt="${$(el).attr('alt')}" src="${$(el).attr('src')?.slice(-70)}"`);
      });
    }

    if (wpImgs > 0) {
      console.log('  wp-content imgs:');
      $('img[src*="/wp-content/"]').slice(0, 5).each((_, el) => {
        console.log(`    alt="${$(el).attr('alt')}" src="${$(el).attr('src')?.slice(-60)}"`);
      });
    }

    // 名前が含まれるか
    const names = levechiNull.map(t => t.name);
    const found = names.filter(n => html.includes(n));
    console.log(`  DB null名がページ内: ${found.length}/${names.length}名`);
    if (found.length > 0) {
      console.log('  →', found.slice(0, 10).join('、'));
      break;
    }
  } catch (e) {
    console.log(`  ${url}: ${e.message}`);
  }
}

console.log('\n完了');
