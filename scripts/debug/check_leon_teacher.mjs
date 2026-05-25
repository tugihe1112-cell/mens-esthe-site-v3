/**
 * LEON SPA・女教師の秘め事・LIRICA の画像パターン詳細確認
 * 実行: node scripts/debug/check_leon_teacher.mjs
 */
import fs from 'fs';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function fetchHtml(url, referer) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Referer: referer || url }, signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function getNullNames(urlPart) {
  const { data: shops } = await supabase.from('shops').select('id').ilike('website_url', `%${urlPart}%`);
  const shopIds = shops?.map(s => s.id) || [];
  const { data: t } = await supabase.from('therapists').select('name').in('shop_id', shopIds).is('image_url', null);
  return new Set(t?.map(x => x.name) || []);
}

// ─── LEON SPA Gold ──────────────────────────────────────────────
console.log('\n' + '='.repeat(60));
console.log('【LEON SPA Gold】 https://leonspa-gold.com/');
console.log('='.repeat(60));

try {
  const html = await fetchHtml('https://leonspa-gold.com/', 'https://leonspa-gold.com/');
  const $ = cheerio.load(html);
  const nullNames = await getNullNames('leonspa-gold');

  // background-image 確認
  const bgItems = [];
  $('[style*="background"]').each((_, el) => {
    const style = $(el).attr('style') || '';
    const m = style.match(/url\(['"]?([^'")\s]+)['"]?\)/);
    if (m) bgItems.push({ url: m[1], text: $(el).text().trim().slice(0, 20), tag: el.name });
  });
  console.log(`background-image 要素: ${bgItems.length}件`);
  bgItems.slice(0, 5).forEach(b => console.log(`  tag=${b.tag} url="${b.url.slice(-60)}" text="${b.text}"`));

  // img 全件
  const imgs = [];
  $('img').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-original') || '';
    const alt = $(el).attr('alt') || '';
    if (src && !src.includes('logo') && !src.includes('banner') && !src.includes('png')) {
      imgs.push({ src: src.slice(-60), alt });
    }
  });
  console.log(`\nimgタグ(logo/banner/png除く): ${imgs.length}件`);
  imgs.slice(0, 8).forEach(i => console.log(`  alt="${i.alt}" src="...${i.src}"`));

  // null名がページ内に含まれる個所を確認
  console.log('\nDB null名の周辺HTML:');
  const htmlText = $.html();
  for (const name of [...nullNames].slice(0, 5)) {
    const idx = htmlText.indexOf(name);
    if (idx >= 0) {
      const ctx = htmlText.slice(Math.max(0, idx - 80), idx + name.length + 80).replace(/\n/g, ' ');
      console.log(`  "${name}": ...${ctx.slice(0, 150)}...`);
    }
  }
} catch (e) { console.log(`失敗: ${e.message}`); }

// ─── LEON SPA (leonspa.net) ──────────────────────────────────────
console.log('\n' + '='.repeat(60));
console.log('【LEON SPA】 https://leonspa.net/');
console.log('='.repeat(60));

try {
  const html = await fetchHtml('https://leonspa.net/', 'https://leonspa.net/');
  const $ = cheerio.load(html);
  const nullNames = await getNullNames('leonspa.net');

  const bgItems = [];
  $('[style*="background"]').each((_, el) => {
    const style = $(el).attr('style') || '';
    const m = style.match(/url\(['"]?([^'")\s]+)['"]?\)/);
    if (m) bgItems.push({ url: m[1], text: $(el).text().trim().slice(0, 20) });
  });
  console.log(`background-image: ${bgItems.length}件`);
  bgItems.slice(0, 5).forEach(b => console.log(`  url="${b.url.slice(-60)}" text="${b.text}"`));

  const htmlText = $.html();
  console.log('\nDB null名の周辺HTML:');
  for (const name of [...nullNames].slice(0, 5)) {
    const idx = htmlText.indexOf(name);
    if (idx >= 0) {
      const ctx = htmlText.slice(Math.max(0, idx - 80), idx + name.length + 80).replace(/\n/g, ' ');
      console.log(`  "${name}": ...${ctx.slice(0, 150)}...`);
    }
  }
} catch (e) { console.log(`失敗: ${e.message}`); }

// ─── 女教師の秘め事 ──────────────────────────────────────────────
console.log('\n' + '='.repeat(60));
console.log('【女教師の秘め事】 https://teachersecret2025.com');
console.log('='.repeat(60));

try {
  const html = await fetchHtml('https://teachersecret2025.com/', 'https://teachersecret2025.com/');
  const $ = cheerio.load(html);
  const nullNames = await getNullNames('teachersecret');

  // 全imgタグ
  console.log('imgタグ全件:');
  $('img').each((i, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-original') || '';
    const alt = $(el).attr('alt') || '';
    console.log(`  [${i}] alt="${alt.slice(0,20)}" src="...${src.slice(-60)}"`);
  });

  // background-image
  const bgItems = [];
  $('[style*="background"]').each((_, el) => {
    const style = $(el).attr('style') || '';
    const m = style.match(/url\(['"]?([^'")\s]+)['"]?\)/);
    if (m) bgItems.push({ url: m[1], text: $(el).text().trim().slice(0, 20) });
  });
  console.log(`\nbackground-image: ${bgItems.length}件`);
  bgItems.slice(0, 5).forEach(b => console.log(`  url="${b.url.slice(-70)}" text="${b.text}"`));

  // null名の周辺HTML
  console.log('\nDB null名の周辺HTML:');
  const htmlText = $.html();
  for (const name of [...nullNames].slice(0, 5)) {
    const idx = htmlText.indexOf(name);
    if (idx >= 0) {
      const ctx = htmlText.slice(Math.max(0, idx - 100), idx + name.length + 100).replace(/\n/g, ' ');
      console.log(`  "${name}": ...${ctx.slice(0, 200)}...`);
    }
  }
} catch (e) { console.log(`失敗: ${e.message}`); }

// ─── LIRICA /cast/ の def/con パターン確認 ──────────────────────
console.log('\n' + '='.repeat(60));
console.log('【LIRICA /cast/ def/con パターン確認】');
console.log('='.repeat(60));

try {
  const html = await fetchHtml('https://lirica-osaka.com/cast/', 'https://lirica-osaka.com/');
  const $ = cheerio.load(html);
  const nullNames = await getNullNames('lirica-osaka');

  // def/con URLs と周辺テキスト（名前）
  const castItems = [];
  $('[style*="def/con"], a[href*="def/con"]').each((_, el) => {
    const style = $(el).attr('style') || '';
    const href = $(el).attr('href') || '';
    const urlMatch = (style + href).match(/def\/con\?p=([^"'\s&]+)/);
    if (!urlMatch) return;
    const castPath = urlMatch[1]; // upload/cast/thumb_123.jpg など
    const castId = castPath.match(/(\d+)/)?.[1];
    // 同じ親要素のテキストから名前を探す
    const $parent = $(el).closest('li, div.item, div.cast, article, .staff-item, .cast-item');
    const text = $parent.text().trim().replace(/\s+/g, ' ').slice(0, 40);
    castItems.push({ castId, castPath, text });
  });

  console.log(`def/con 要素: ${castItems.length}件`);
  castItems.slice(0, 5).forEach(c => console.log(`  castId=${c.castId} path=${c.castPath.slice(0,50)} text="${c.text}"`));

  // altやテキストで名前を探す
  console.log('\nDB null名がページ内に含まれる:');
  const htmlText = $.html();
  for (const name of [...nullNames].slice(0, 8)) {
    const idx = htmlText.indexOf(name);
    if (idx >= 0) {
      const ctx = htmlText.slice(Math.max(0, idx - 100), idx + name.length + 100).replace(/\n/g, ' ');
      console.log(`  "${name}": ...${ctx.slice(0, 180)}...`);
    } else {
      console.log(`  "${name}": HTMLに見つからず`);
    }
  }
} catch (e) { console.log(`失敗: ${e.message}`); }

console.log('\n完了');
