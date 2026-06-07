/**
 * process_yamato_atsugi_shops.mjs
 * 大和エリア TOP10 + 厚木エリア TOP10 shop・セラピスト登録
 *
 * 【大和】
 * 1位 calme              kanagawa_yamato_calme          - shop登録のみ（JS描画）
 * 2位 Offside            kanagawa_yamato_offside         - 52名、caskan画像
 * 3位 anokono            kanagawa_yamato_anokono         - shop登録のみ（JS描画）
 * 4位 oashisu            kanagawa_yamato_oashisu         - shop登録のみ（goope.jp）
 * 5位 A-lice             kanagawa_yamato_alice           - shop登録のみ（多店舗、個別ページ）
 * 6位 Queen Terrace      kanagawa_yamato_queen_terrace   - 21名、estemax.net画像
 * 7位 more               kanagawa_yamato_more            - shop登録のみ（JS描画）
 * 8位 mahalo             kanagawa_yamato_mahalo          - 9名、/photo/画像
 * 9位 real-members       kanagawa_yamato_real_members    - shop登録のみ
 * 10位 aromacandle       kanagawa_yamato_aromacandle     - shop登録のみ
 *
 * 【厚木】
 * 1位 Lunedia            kanagawa_atsugi_lunedia         - shop登録のみ（S3 lazy）
 * 2位 CODE:4030          kanagawa_atsugi_code4030        - 52名、wp-content画像
 * 3位 THE BLANC          → 登録済みスキップ
 * 4位 Salon Delight      kanagawa_atsugi_salon_delight   - 19名、caskan画像
 * 5位 chill              kanagawa_atsugi_chill           - shop登録のみ（JS描画）
 * 6位 doigt de fee       → 登録済みスキップ
 * 7位 SixthSense         kanagawa_atsugi_sixthsense      - 40名、名前のみ（Panda CMS）
 * 9位 atsugi-aroma-guild kanagawa_atsugi_aroma_guild     - shop登録のみ
 * 10位 andspa            kanagawa_atsugi_andspa          - shop登録のみ
 *
 * 実行: node scripts/maintenance/process_yamato_atsugi_shops.mjs [--dry-run]
 */

import fs from 'fs';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = k => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(
  getEnv('VITE_SUPABASE_URL'),
  getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('VITE_SUPABASE_ANON_KEY')
);
const DRY = process.argv.includes('--dry-run');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fetchHtml = async url => {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.text();
};

const isNoise = name => {
  if (!name || name.length < 1) return true;
  if (name.length > 15) return true;
  if (/募集|キャンペーン|求人|定休日|アカウント|LINE|変更/i.test(name)) return true;
  return false;
};

const upsertTherapists = async (shopId, therapists) => {
  const valid = therapists.filter(t => t.name && !isNoise(t.name));
  const withPhoto = valid.filter(t => t.image_url).length;
  console.log(`  → ${valid.length}名 (写真: ${withPhoto})`);
  if (DRY) { valid.slice(0, 3).forEach(t => console.log(`    DRY: ${t.name} ${t.image_url ? '📷' : ''}`)); return; }
  for (let i = 0; i < valid.length; i += 50) {
    const batch = valid.slice(i, i + 50).map(t => ({
      id: `${shopId}_${t.name}`,
      shop_id: shopId,
      name: t.name,
      image_url: t.image_url || null,
    }));
    const { error } = await supabase.from('therapists').upsert(batch, { onConflict: 'id', ignoreDuplicates: true });
    if (error) console.error(`  ERROR: ${error.message}`);
    else process.stdout.write(`  batch ${Math.floor(i / 50) + 1} OK\n`);
  }
};

// ─── Shops ────────────────────────────────────────────────────────────────────
const SHOPS = [
  // 大和
  { id: 'kanagawa_yamato_calme',        name: 'CALME (カルム)',             website_url: 'https://calme-esthe.com/',              schedule_url: null },
  { id: 'kanagawa_yamato_offside',      name: 'Offside (オフサイド)',         website_url: 'https://offside-spa.com/',              schedule_url: 'https://offside-spa.com/schedule' },
  { id: 'kanagawa_yamato_anokono',      name: 'あのコの癒し',                 website_url: 'https://anokono-iyashi.com/',           schedule_url: null },
  { id: 'kanagawa_yamato_oashisu',      name: '大和お癒し空間',               website_url: 'https://r.goope.jp/yamatooashisu2/',    schedule_url: null },
  { id: 'kanagawa_yamato_alice',        name: 'A-lice (アリス)',              website_url: 'https://a-lice.tokyo/',                 schedule_url: 'https://a-lice.tokyo/schedule.html' },
  { id: 'kanagawa_yamato_queen_terrace',name: 'Queen Terrace (クイーンテラス)', website_url: 'https://queen-terrace.com/',           schedule_url: 'https://queen-terrace.com/schedule' },
  { id: 'kanagawa_yamato_more',         name: 'MORE (モア)',                  website_url: 'https://more.men-es.jp/',               schedule_url: null },
  { id: 'kanagawa_yamato_mahalo',       name: 'mahalo (マハロ)',              website_url: 'https://mahalo-esthe.com/',             schedule_url: 'https://mahalo-esthe.com/schedule.php' },
  { id: 'kanagawa_yamato_real_members', name: 'Real Members',                website_url: 'http://www.real-members.info/',          schedule_url: null },
  { id: 'kanagawa_yamato_aromacandle',  name: 'Aromacandle (アロマキャンドル)', website_url: 'https://aromacandle.net/',              schedule_url: null },
  // 厚木
  { id: 'kanagawa_atsugi_lunedia',      name: 'Lunedia (ルナディア)',          website_url: 'https://esthe-lunedia.com/',            schedule_url: 'https://esthe-lunedia.com/schedule' },
  { id: 'kanagawa_atsugi_code4030',     name: 'CODE:4030 (オトナコード)',      website_url: 'https://code4030.com/',                 schedule_url: 'https://code4030.com/schedule' },
  { id: 'kanagawa_atsugi_salon_delight',name: 'Salon Delight (サロン ディライト)', website_url: 'https://salon-delight.com/',        schedule_url: 'https://salon-delight.com/schedule' },
  { id: 'kanagawa_atsugi_chill',        name: 'Chill Aroma (チルアロマ)',      website_url: 'https://chill-aroma.com/',              schedule_url: null },
  { id: 'kanagawa_atsugi_sixthsense',   name: 'SixthSense+ (シックスセンス)',   website_url: 'https://esthe-sixthsense.com/',         schedule_url: 'https://esthe-sixthsense.com/cast/sindex.cgi' },
  { id: 'kanagawa_atsugi_aroma_guild',  name: '厚木アロマギルド',              website_url: 'https://www.atsugi-aroma-guild.com/',   schedule_url: null },
  { id: 'kanagawa_atsugi_andspa',       name: 'And Spa (アンドスパ)',           website_url: 'https://andspa-esthe.com/',             schedule_url: null },
];

async function upsertShops() {
  console.log('\n=== Step 1: Shops 登録 ===');
  for (const s of SHOPS) {
    const record = { id: s.id, name: s.name, website_url: s.website_url, schedule_url: s.schedule_url || null, raw_data: { prefecture: '神奈川県' } };
    if (DRY) { console.log(`  DRY: ${s.id}`); continue; }
    const { error } = await supabase.from('shops').upsert(record, { onConflict: 'id' });
    if (error) console.error(`  ERROR ${s.id}: ${error.message}`);
    else console.log(`  OK: ${s.name}`);
  }
}

// ─── Offside / Salon Delight (caskan, img[alt=name]) ────────────────────────
async function processCaskan(shopId, url) {
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);
  const castMap = new Map();

  $('img[src*="cast_tmb"]').each((_, el) => {
    const imgSrc = $(el).attr('src');
    const name = ($(el).attr('alt') || '').trim();
    const id = $(el).closest('a[href*="/therapist/"]').attr('href')?.match(/\/therapist\/(\d+)/)?.[1];
    if (id && name && /[ぁ-んァ-ヾ一-龯]/.test(name) && !isNoise(name)) {
      castMap.set(id, { name, imgSrc });
    }
  });

  const therapists = [...castMap.values()].map(c => ({ name: c.name, image_url: c.imgSrc || null }));
  await upsertTherapists(shopId, therapists);
}

// ─── Queen Terrace (WordPress, estemax.net + wp-content) ──────────────────────
async function processQueenTerrace() {
  console.log('\n=== Step 4: Queen Terrace ===');
  const html = await fetchHtml('https://queen-terrace.com/cast');
  const $ = cheerio.load(html);
  const castMap = new Map();

  // img リンクから画像取得
  $('a[href*="/cast/"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const slug = href.match(/\/cast\/([^/]+)\/?$/)?.[1];
    if (!slug || slug === '' || /^%e5%85%ac%e5/.test(slug)) return; // LINEノイズ除外

    if (!castMap.has(slug)) castMap.set(slug, {});

    const img = $(el).find('img[src]').first();
    if (img.length && !castMap.get(slug).imgSrc) {
      castMap.get(slug).imgSrc = img.attr('src');
    }

    // h3 から名前取得
    const h3 = $(el).closest('div, li, article').find('h3 a[href*="/cast/"]').first();
    if (!h3.length) {
      const parentH3 = $(el).is('a') && $(el).parent().is('h3') ? $(el) : null;
      if (parentH3) {
        const rawName = parentH3.text().trim().replace(/\s*\d+\/\d+.*$/, '').trim();
        if (rawName && !castMap.get(slug).name) castMap.get(slug).name = rawName;
      }
    } else {
      const rawName = h3.text().trim().replace(/\s*\d+\/\d+.*$/, '').trim();
      if (rawName && !castMap.get(slug).name) castMap.get(slug).name = rawName;
    }
  });

  // h3リンクから名前補完
  $('h3 a[href*="/cast/"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const slug = href.match(/\/cast\/([^/]+)\/?$/)?.[1];
    if (!slug) return;
    if (!castMap.has(slug)) castMap.set(slug, {});
    if (!castMap.get(slug).name) {
      const rawName = $(el).text().trim().replace(/\s*\d+\/\d+.*$/, '').trim();
      if (rawName) castMap.get(slug).name = rawName;
    }
  });

  const therapists = [...castMap.values()]
    .filter(c => c.name && !isNoise(c.name) && /[ぁ-んァ-ヾ一-龯]/.test(c.name))
    .map(c => ({ name: c.name, image_url: c.imgSrc || null }));

  await upsertTherapists('kanagawa_yamato_queen_terrace', therapists);
}

// ─── mahalo (/photo/ 画像, img[alt=name]) ─────────────────────────────────────
async function processMahalo() {
  console.log('\n=== Step 5: mahalo ===');
  const html = await fetchHtml('https://mahalo-esthe.com/therapist.php');
  const $ = cheerio.load(html);
  const seen = new Set();
  const therapists = [];

  $('img[src*="/photo/"][alt]').each((_, el) => {
    const imgSrc = $(el).attr('src');
    const name = ($(el).attr('alt') || '').trim();
    if (!name || seen.has(name) || isNoise(name)) return;
    if (!/[ぁ-んァ-ヾ一-龯]/.test(name)) return;
    // ヘッダー画像などのノイズ除外（URLがphoto/で画像ファイル名が長いもの）
    if (!imgSrc?.match(/photo\/\d{15,}/)) return;
    seen.add(name);
    therapists.push({ name, image_url: imgSrc });
  });

  await upsertTherapists('kanagawa_yamato_mahalo', therapists);
}

// ─── CODE:4030 (WordPress, wp-content画像) ────────────────────────────────────
async function processCode4030() {
  console.log('\n=== Step 6: CODE:4030 ===');
  const html = await fetchHtml('https://code4030.com/cast');
  const $ = cheerio.load(html);
  const castMap = new Map();

  // img リンク
  $('a[href*="/cast/cast-"]').each((_, el) => {
    const slug = $(el).attr('href')?.match(/\/cast\/cast-(\d+)\//)?.[1];
    if (!slug) return;
    if (!castMap.has(slug)) castMap.set(slug, {});
    const img = $(el).find('img[src]').first();
    if (img.length && !castMap.get(slug).imgSrc) {
      castMap.get(slug).imgSrc = img.attr('src');
    }
  });

  // h3 名前
  $('h3 a[href*="/cast/cast-"]').each((_, el) => {
    const slug = $(el).attr('href')?.match(/\/cast\/cast-(\d+)\//)?.[1];
    if (!slug) return;
    if (!castMap.has(slug)) castMap.set(slug, {});
    const name = $(el).text().trim().replace(/\(.*?\)/g, '').trim();
    if (name && !castMap.get(slug).name) castMap.get(slug).name = name;
  });

  const therapists = [...castMap.values()]
    .filter(c => c.name && !isNoise(c.name) && /[ぁ-んァ-ヾ一-龯]/.test(c.name))
    .map(c => ({ name: c.name, image_url: c.imgSrc || null }));

  await upsertTherapists('kanagawa_atsugi_code4030', therapists);
}

// ─── SixthSense (Panda CMS, 名前のみ) ─────────────────────────────────────────
async function processSixthSense() {
  console.log('\n=== Step 7: SixthSense (名前のみ) ===');
  const html = await fetchHtml('https://esthe-sixthsense.com/cast/');
  const $ = cheerio.load(html);
  const seen = new Set();
  const therapists = [];

  $('a[href]').filter((_, el) => /cast\/detail\.cgi\?status=/.test($(el).attr('href') || '')).each((_, el) => {
    const text = $(el).text().trim();
    const name = text.replace(/^セラピスト\s+/, '').split(/[\s*（(]/)[0].trim();
    if (!name || name.length < 1 || seen.has(name) || isNoise(name)) return;
    if (!/[ぁ-んァ-ヾ一-龯a-zA-Z・]/.test(name)) return;
    seen.add(name);
    therapists.push({ name, image_url: null });
  });

  await upsertTherapists('kanagawa_atsugi_sixthsense', therapists);
}

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(DRY ? '\n=== DRY RUN ===' : '\n=== LIVE RUN ===');
  await upsertShops();

  console.log('\n=== Step 2: Offside (caskan) ===');
  await processCaskan('kanagawa_yamato_offside', 'https://offside-spa.com/therapist');

  console.log('\n=== Step 3: Salon Delight (caskan) ===');
  await processCaskan('kanagawa_atsugi_salon_delight', 'https://salon-delight.com/therapist');

  await processQueenTerrace();
  await processMahalo();
  await processCode4030();
  await processSixthSense();

  console.log('\n=== 完了 ===');
  console.log('⚠️  calme/anokono/more/chill: JS描画→Chrome要');
  console.log('⚠️  Lunedia: S3 lazy→Chrome要');
  console.log('⚠️  Queen Terrace/CODE:4030/mahalo: 画像確認要');
}

main().catch(console.error);
