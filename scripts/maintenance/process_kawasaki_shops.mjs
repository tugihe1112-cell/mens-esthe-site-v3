/**
 * process_kawasaki_shops.mjs
 * 川崎エリア TOP9（Guarigione=7位は登録済みスキップ）shop・セラピスト登録
 *
 * 1位 doigt de fee  kanagawa_kawasaki_doigt_de_fee  - shop登録のみ（JS描画）
 * 2位 RiRe          kanagawa_kawasaki_rire           - 52名、manage.tete画像（TeTe系）
 * 3位 Fromage       kanagawa_kawasaki_fromage        - ~35名、名前のみ（S3 lazy）
 * 4位 gold          kanagawa_kawasaki_gold           - shop登録のみ（JS描画）
 * 5位 chouchou      kanagawa_kawasaki_chouchou       - shop登録のみ（JS描画）
 * 6位 DEEP ESSENTIAL kanagawa_kawasaki_deep_essential - shop登録のみ（独自CMS取得不可）
 * 7位 Guarigione    → kanagawa_yokohama_guarigione 登録済み（スキップ）
 * 8位 gentlemen-house kanagawa_kawasaki_gentlemen_house - shop登録のみ（JS描画）
 * 9位 Mint Club     kanagawa_kawasaki_mint_club      - ~20名、名前のみ（Panda CMS）
 *
 * 実行: node scripts/maintenance/process_kawasaki_shops.mjs [--dry-run]
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
  if (/募集|キャンペーン|割引|banner|logo|♡|求人/i.test(name)) return true;
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
  { id: 'kanagawa_kawasaki_doigt_de_fee',     name: 'doigt de fee (ドゥワドフェ)',   website_url: 'https://exe-fee.com/',                 schedule_url: 'https://exe-fee.com/schedule/' },
  { id: 'kanagawa_kawasaki_rire',             name: 'RiRe (リル)',                  website_url: 'https://rire-kawasaki.com/',            schedule_url: 'https://rire-kawasaki.com/#today' },
  { id: 'kanagawa_kawasaki_fromage',          name: 'Fromage (フロマージュ)',         website_url: 'https://fromage-kawasaki.com/',         schedule_url: 'https://fromage-kawasaki.com/schedule' },
  { id: 'kanagawa_kawasaki_gold',             name: 'GOLD (ゴールド)',               website_url: 'https://gold-m-e.com/',                 schedule_url: null },
  { id: 'kanagawa_kawasaki_chouchou',         name: 'chouchou (シュシュ)',           website_url: 'https://chouchou-official.com/',         schedule_url: null },
  { id: 'kanagawa_kawasaki_deep_essential',   name: 'DEEP ESSENTIAL (ディープ)',     website_url: 'https://deep-e.com/',                   schedule_url: 'https://deep-e.com/weeklys.html' },
  { id: 'kanagawa_kawasaki_gentlemen_house',  name: "Gentlemen's House",            website_url: 'https://gentlemen-house.com/',           schedule_url: null },
  { id: 'kanagawa_kawasaki_mint_club',        name: 'Mint Club (ミントクラブ)',       website_url: 'https://mint-club.net/',                 schedule_url: 'https://mint-club.net/schedule.php' },
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

// ─── RiRe (TeTe系 manage.tete CDN, 3ページ) ───────────────────────────────────
async function processRiRe() {
  console.log('\n=== Step 2: RiRe (3ページ) ===');
  const castMap = new Map();

  for (let page = 1; page <= 3; page++) {
    const url = page === 1 ? 'https://rire-kawasaki.com/casts' : `https://rire-kawasaki.com/casts?cp=${page}`;
    let html;
    try { html = await fetchHtml(url); }
    catch (e) { console.log(`  page ${page}: skip (${e.message})`); break; }
    const $ = cheerio.load(html);

    $('a[href*="/casts/detail/?cid="]').each((_, el) => {
      const cid = $(el).attr('href')?.match(/cid=(\d+)/)?.[1];
      if (!cid) return;
      if (!castMap.has(cid)) castMap.set(cid, {});
      const img = $(el).find('img[src*="manage.tete"]');
      if (img.length) {
        castMap.get(cid).imgUrl = img.attr('src');
      } else {
        const rawName = $(el).text().trim();
        const name = rawName.replace(/\s*\(\s*\d+\s*\).*$/, '').trim();
        if (name && !castMap.get(cid)?.name) castMap.get(cid).name = name;
      }
    });
    console.log(`  page ${page}: ${castMap.size}件累計`);
    await sleep(500);
  }

  const therapists = [...castMap.values()]
    .filter(c => c.name)
    .map(c => ({ name: c.name, image_url: c.imgUrl || null }));

  await upsertTherapists('kanagawa_kawasaki_rire', therapists);
}

// ─── Fromage (名前のみ、S3 lazy) ─────────────────────────────────────────────
async function processFromage() {
  console.log('\n=== Step 3: Fromage (名前のみ) ===');
  const html = await fetchHtml('https://fromage-kawasaki.com/therapist');
  const $ = cheerio.load(html);
  const seen = new Set();
  const therapists = [];

  $('a[href]').filter((_, el) => {
    const href = $(el).attr('href') || '';
    return /\/therapist\/\d+$/.test(href);
  }).each((_, el) => {
    const text = $(el).text().trim();
    // "えむ (25歳) --- T.153 Ｃ" → "えむ"
    const name = text.replace(/\s*\(\d+歳?\).*$/, '').replace(/\s*---.*$/, '').trim();
    if (!name || seen.has(name) || isNoise(name)) return;
    if (!/[ぁ-んァ-ヾ一-龯a-zA-Z]/.test(name)) return;
    seen.add(name);
    therapists.push({ name, image_url: null });
  });

  await upsertTherapists('kanagawa_kawasaki_fromage', therapists);
}

// ─── Mint Club (名前のみ、Panda CMS) ──────────────────────────────────────────
async function processMintClub() {
  console.log('\n=== Step 4: Mint Club (名前のみ) ===');
  const html = await fetchHtml('https://mint-club.net/therapist.php');
  const $ = cheerio.load(html);
  const seen = new Set();
  const therapists = [];

  $('a[href*="/profile.php?sid="]').each((_, el) => {
    const text = $(el).text().trim();
    // "みく みく (24) 新人 T158..." → first word before space is name
    // Name appears twice at start: "みく みく..."
    const firstWord = text.split(/\s+/)[0];
    const name = firstWord;
    if (!name || seen.has(name) || isNoise(name)) return;
    if (!/[ぁ-んァ-ヾ一-龯]/.test(name)) return;
    // 求人エントリをスキップ
    if (text.includes('未経験') || text.includes('求人')) return;
    seen.add(name);
    therapists.push({ name, image_url: null });
  });

  await upsertTherapists('kanagawa_kawasaki_mint_club', therapists);
}

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(DRY ? '\n=== DRY RUN ===' : '\n=== LIVE RUN ===');
  await upsertShops();
  await processRiRe();
  await processFromage();
  await processMintClub();
  console.log('\n=== 完了 ===');
  console.log('⚠️  doigt de fee: JS描画→セラピスト登録にChrome要（/lady/ページ）');
  console.log('⚠️  DEEP ESSENTIAL: 独自CMS→Chrome要（/web/therapist）');
  console.log('⚠️  gold/chouchou/gentlemen-house: JS描画→Chrome要');
  console.log('⚠️  Fromage: 画像はS3 lazy→Chrome要');
}

main().catch(console.error);
