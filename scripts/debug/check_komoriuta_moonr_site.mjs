/**
 * ミセスの子守唄・ミセスムーンR サイト構造確認 + DB nullセラピスト一覧
 * 実行: node scripts/debug/check_komoriuta_moonr_site.mjs
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
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.text();
}

async function getNullTherapists(urlPart) {
  const { data: shops } = await supabase.from('shops').select('id, name').ilike('website_url', `%${urlPart}%`);
  if (!shops?.length) return { shops: [], therapists: [] };
  const shopIds = shops.map(s => s.id);
  const { data: therapists } = await supabase.from('therapists')
    .select('id, name, shop_id, image_url')
    .in('shop_id', shopIds)
    .is('image_url', null);
  return { shops, therapists: therapists || [] };
}

// ─── ミセスの子守唄 ─────────────────────────────────────────────
console.log('\n' + '='.repeat(60));
console.log('【ミセスの子守唄】 https://mrs-komoriuta.com/');
console.log('='.repeat(60));

const komoriuta = await getNullTherapists('komoriuta');
console.log(`DB内 写真なしセラピスト: ${komoriuta.therapists.length}名`);
if (komoriuta.therapists.length > 0) {
  console.log('名前一覧:', komoriuta.therapists.map(t => t.name).join('、'));
}

try {
  const html = await fetchHtml('https://mrs-komoriuta.com/cast/', 'https://mrs-komoriuta.com/');
  const $ = cheerio.load(html);

  // wcms パターン確認
  const wcmsImgs = $('img[src*="/wcms/"]').length;
  const bgImgs = $('[style*="background-image"]').filter((_, el) => $(el).attr('style')?.includes('/wcms/')).length;
  console.log(`\n[/cast/ ページ] wcms img: ${wcmsImgs}件, wcms background: ${bgImgs}件`);

  // 全imgタグのsrc確認（最初の10件）
  const imgs = [];
  $('img').each((_, el) => {
    const src = $(el).attr('src') || '';
    const alt = $(el).attr('alt') || '';
    if (src && !src.includes('logo') && !src.includes('banner')) {
      imgs.push({ src: src.slice(0, 80), alt });
    }
  });
  console.log(`img タグ合計: ${imgs.length}件`);
  imgs.slice(0, 5).forEach(i => console.log(`  alt="${i.alt}" src="${i.src}"`));

  // background-image パターン
  const bgItems = [];
  $('[style*="background"]').each((_, el) => {
    const style = $(el).attr('style') || '';
    const m = style.match(/url\(['"]?([^'")\s]+)['"]?\)/);
    if (m && m[1].includes('/wcms/')) bgItems.push({ style: m[1].slice(0, 80), text: $(el).text().slice(0, 20) });
  });
  console.log(`\nbackground-image (wcms): ${bgItems.length}件`);
  bgItems.slice(0, 5).forEach(b => console.log(`  url="${b.style}" text="${b.text}"`));

  // /gals/ パターン
  const galsImgs = [];
  $('img[src*="/gals/"]').each((_, el) => {
    galsImgs.push({ src: $(el).attr('src')?.slice(0, 80), alt: $(el).attr('alt') || '' });
  });
  console.log(`\n/gals/ パターン img: ${galsImgs.length}件`);
  galsImgs.slice(0, 5).forEach(i => console.log(`  alt="${i.alt}" src="${i.src}"`));

  // ページ全体のテキスト断片（名前手がかり）
  const names = komoriuta.therapists.map(t => t.name);
  const found = names.filter(n => html.includes(n));
  console.log(`\nDB null名がページ内に含まれる: ${found.length}/${names.length}名`);
  if (found.length > 0) console.log(' →', found.slice(0, 10).join('、'));

} catch (e) {
  console.log(`/cast/ 取得失敗: ${e.message}`);
  // トップページを試す
  try {
    const html2 = await fetchHtml('https://mrs-komoriuta.com/', 'https://mrs-komoriuta.com/');
    const $ = cheerio.load(html2);
    const wcmsImgs2 = $('img[src*="/wcms/"]').length;
    console.log(`トップページ wcms img: ${wcmsImgs2}件`);
    $('img[src*="/wcms/"]').slice(0, 3).each((_, el) => {
      console.log(`  src="${$(el).attr('src')?.slice(0, 80)}" alt="${$(el).attr('alt')}"`);
    });
  } catch (e2) {
    console.log(`トップページも失敗: ${e2.message}`);
  }
}

// ─── ミセスムーンR 大阪 ────────────────────────────────────────
console.log('\n' + '='.repeat(60));
console.log('【ミセスムーンR 大阪】 https://www.moonr.jp/');
console.log('='.repeat(60));

const moonr = await getNullTherapists('moonr.jp');
console.log(`DB内 写真なしセラピスト: ${moonr.therapists.length}名`);
if (moonr.therapists.length > 0) {
  console.log('名前一覧:', moonr.therapists.map(t => t.name).join('、'));
}

const MOONR_PAGES = [
  'https://www.moonr.jp/cast/',
  'https://www.moonr.jp/',
  'https://www.moonr.jp/cast/index.html',
];

for (const url of MOONR_PAGES) {
  try {
    const html = await fetchHtml(url, 'https://www.moonr.jp/');
    const $ = cheerio.load(html);
    const wcmsImgs = $('img[src*="/wcms/"]').length;
    const galsImgs = $('img[src*="/gals/"]').length;
    console.log(`\n[${url}] wcms: ${wcmsImgs}, gals: ${galsImgs}`);
    if (wcmsImgs > 0 || galsImgs > 0) {
      $('img[src*="/wcms/"], img[src*="/gals/"]').slice(0, 3).each((_, el) => {
        console.log(`  alt="${$(el).attr('alt')}" src="${$(el).attr('src')?.slice(0, 80)}"`);
      });
      const names = moonr.therapists.map(t => t.name);
      const found = names.filter(n => html.includes(n));
      console.log(`DB null名がページ内に含まれる: ${found.length}/${names.length}名`);
      if (found.length > 0) console.log(' →', found.slice(0, 10).join('、'));
      break;
    }
    // JS描画の可能性
    const scriptTags = $('script[src]').length;
    console.log(`  → scriptタグ: ${scriptTags}件（JS描画の可能性）`);
  } catch (e) {
    console.log(`  ${url} 失敗: ${e.message}`);
  }
}

// ─── 兵庫 ミセスムーンR ────────────────────────────────────────
console.log('\n' + '='.repeat(60));
console.log('【ミセスムーンR 兵庫】 https://moor-kobe.jp/');
console.log('='.repeat(60));

const moonrHyogo = await getNullTherapists('moor-kobe');
console.log(`DB内 写真なしセラピスト: ${moonrHyogo.therapists.length}名`);
if (moonrHyogo.therapists.length > 0) {
  console.log('名前一覧:', moonrHyogo.therapists.map(t => t.name).join('、'));
}

try {
  const html = await fetchHtml('https://moor-kobe.jp/cast/', 'https://moor-kobe.jp/');
  const $ = cheerio.load(html);
  const wcmsImgs = $('img[src*="/wcms/"]').length;
  const galsImgs = $('img[src*="/gals/"]').length;
  const photosImgs = $('img[src*="/photos/"]').length;
  console.log(`wcms: ${wcmsImgs}, gals: ${galsImgs}, photos: ${photosImgs}`);
  $('img[src*="/wcms/"], img[src*="/gals/"], img[src*="/photos/"]').slice(0, 3).each((_, el) => {
    console.log(`  alt="${$(el).attr('alt')}" src="${$(el).attr('src')?.slice(0, 80)}"`);
  });
  const names = moonrHyogo.therapists.map(t => t.name);
  const found = names.filter(n => html.includes(n));
  console.log(`DB null名がページ内: ${found.length}/${names.length}名`);
} catch (e) {
  console.log(`失敗: ${e.message}`);
}

console.log('\n完了');
