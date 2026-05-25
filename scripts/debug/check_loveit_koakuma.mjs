/**
 * Love it（ラヴィット）・小悪魔スパトウキョウ のサイト構造確認
 * Love it: 10名null（前回2名不一致→新規8名追加？）
 * 小悪魔スパ: 4店舗×4名ずつ = 16名（新規店舗）
 * 実行: node scripts/debug/check_loveit_koakuma.mjs
 */
import fs from 'fs';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchHtml(url, referer) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Referer: referer || url },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return { ok: false, status: res.status, text: '', finalUrl: url };
    return { ok: true, status: 200, text: await res.text(), finalUrl: res.url };
  } catch (e) {
    return { ok: false, status: 0, text: '', error: e.message, finalUrl: url };
  }
}

async function getNullNames(urlPart) {
  const { data: shops } = await supabase.from('shops').select('id, name').ilike('website_url', `%${urlPart}%`);
  const shopIds = shops?.map(s => s.id) || [];
  const { data: t } = await supabase.from('therapists').select('name').in('shop_id', shopIds).is('image_url', null);
  return { shops: shops || [], names: t?.map(x => x.name) || [] };
}

// ─── Love it ──────────────────────────────────────────────────
console.log('='.repeat(60));
console.log('【Love it (ラヴィット)】 https://loveit.love/');
console.log('='.repeat(60));

const loveitInfo = await getNullNames('loveit.love');
console.log(`DB null ${loveitInfo.names.length}名: ${loveitInfo.names.join('・')}`);

const loveitPages = ['/', '/therapist/', '/cast/', '/staff/', '/girls/'];
for (const path of loveitPages) {
  const r = await fetchHtml('https://loveit.love' + path, 'https://loveit.love/');
  if (!r.ok) { console.log(`  ${path} → ${r.status}`); continue; }

  const $ = cheerio.load(r.text);
  // data/staff パターン
  const staffImgs = [];
  $('[style*="data/staff"], img[src*="data/staff"], img[data-src*="data/staff"]').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || '';
    const style = $(el).attr('style') || '';
    const urlMatch = (src + style).match(/\/data\/staff\/(\d+)\/stf_([a-f0-9]+)\.(webp|jpg|jpeg)/);
    if (!urlMatch) return;
    const $box = $(el).closest('li, div.staff, div.box, article, .cast-item, .item');
    const name = $box.find('.name, h3, h2, .staff-name, dt, dd').first().text()
      .replace(/\(\d+\)/g, '').trim().slice(0, 15);
    staffImgs.push({ staffId: urlMatch[1], name, src: src || style.match(/url\(['"]?([^'")\s]+)['"]?\)/)?.[1] || '' });
  });
  // background-image の data/staff も確認
  $('[style*="/data/staff/"]').each((_, el) => {
    const style = $(el).attr('style') || '';
    const m = style.match(/\/data\/staff\/(\d+)\/stf_([a-f0-9]+)\.(webp|jpg|jpeg)/);
    if (!m) return;
    const $box = $(el).closest('li, div, article');
    const name = $box.find('.name, h3, h2, .box-name').first().text()
      .replace(/\(\d+\)/g, '').trim().slice(0, 15);
    if (!staffImgs.find(x => x.staffId === m[1])) {
      staffImgs.push({ staffId: m[1], name, url: `https://loveit.love/data/staff/${m[1]}/stf_${m[2]}.${m[3]}` });
    }
  });

  const nameHits = loveitInfo.names.filter(n => r.text.includes(n));
  console.log(`\n✅ ${path} (${r.text.length}byte) staffImgs:${staffImgs.length} nameHits:${nameHits.length}`);
  if (staffImgs.length > 0) {
    staffImgs.slice(0, 15).forEach(i => console.log(`  staffId=${i.staffId} name="${i.name}"`));
  }
  if (nameHits.length > 0) console.log(`  名前ヒット: ${nameHits.join('・')}`);

  await sleep(400);
  if (staffImgs.length > 0) break;
}

// ─── 小悪魔スパトウキョウ ─────────────────────────────────────
console.log('\n' + '='.repeat(60));
console.log('【小悪魔スパトウキョウ】 https://mens-esthe-aroma.site/');
console.log('='.repeat(60));

const koakumaInfo = await getNullNames('mens-esthe-aroma.site');
console.log(`DB null ${koakumaInfo.names.length}名: ${[...new Set(koakumaInfo.names)].join('・')}`);
console.log(`店舗: ${koakumaInfo.shops.map(s => s.name).join(', ')}`);

const koakumaPages = ['/', '/index.html', '/cast/', '/therapist/', '/staff/'];
for (const path of koakumaPages) {
  const r = await fetchHtml('https://mens-esthe-aroma.site' + path, 'https://mens-esthe-aroma.site/');
  if (!r.ok) { console.log(`  ${path} → ${r.status}`); continue; }

  const $ = cheerio.load(r.text);
  const imgs = [];
  $('img').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-original') || '';
    const alt = ($(el).attr('alt') || '').trim();
    if (src && !src.includes('logo') && !src.includes('banner') && alt) {
      imgs.push({ src: src.slice(-60), alt: alt.slice(0, 20) });
    }
  });

  const bgImgs = [];
  $('[style*="background"]').each((_, el) => {
    const style = $(el).attr('style') || '';
    const m = style.match(/url\(['"]?([^'")\s]+\.(?:jpg|jpeg|png|webp))['"]?\)/i);
    if (m && !m[1].includes('logo') && !m[1].includes('banner')) {
      const text = $(el).closest('li, div, article').text().trim().slice(0, 30);
      bgImgs.push({ url: m[1].slice(-60), text });
    }
  });

  const nameHits = [...new Set(koakumaInfo.names)].filter(n => r.text.includes(n));
  console.log(`\n${path} (${r.text.length}byte) img:${imgs.length} bg:${bgImgs.length} nameHits:${nameHits.length}`);
  if (imgs.length > 0 && imgs.length <= 15) {
    imgs.forEach(i => console.log(`  alt="${i.alt}" src="...${i.src}"`));
  }
  if (bgImgs.length > 0 && bgImgs.length <= 10) {
    bgImgs.forEach(b => console.log(`  bg: "${b.text}" → ...${b.url}`));
  }
  if (nameHits.length > 0) {
    nameHits.forEach(n => {
      const idx = r.text.indexOf(n);
      const ctx = r.text.slice(Math.max(0, idx - 100), idx + n.length + 100).replace(/\n/g, ' ');
      console.log(`  ✅ "${n}": ...${ctx.slice(0, 150)}...`);
    });
  }
  await sleep(400);
}

console.log('\n完了');
