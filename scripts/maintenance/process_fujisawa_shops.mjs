/**
 * process_fujisawa_shops.mjs
 * 藤沢エリア TOP10 shop・セラピスト登録
 *
 * 1位 ROUGE        kanagawa_fujisawa_rouge        - shop登録のみ（spacer画像）
 * 2位 bijukujo     kanagawa_fujisawa_bijukujo     - shop登録のみ（JS描画）
 * 3位 zerofirst    kanagawa_fujisawa_zerofirst     - shop登録のみ（JS描画）
 * 4位 Navel        kanagawa_fujisawa_navel         - 117名、名前のみ（静的HTML）
 * 5位 bless-rich   kanagawa_fujisawa_bless_rich   - shop登録のみ（JS描画）
 * 6位 Irene        kanagawa_fujisawa_irene         - shop登録のみ（spacer画像）
 * 7位 ALICE        kanagawa_fujisawa_alice         - 40名、名前のみ（ap2hp CMS）
 * 8位 Plumeria     kanagawa_fujisawa_plumeria      - 13名、名前のみ
 * 9位 jasmine      kanagawa_fujisawa_jasmine       - shop登録のみ（JS描画）
 * 10位 辻堂        kanagawa_fujisawa_tsujido       - ~20名、名前のみ（WordPress 2P）
 *
 * 実行: node scripts/maintenance/process_fujisawa_shops.mjs [--dry-run]
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
  if (/募集|キャンペーン|求人|定休日|NEW|banner|logo/i.test(name)) return true;
  return false;
};

const upsertTherapists = async (shopId, therapists) => {
  const valid = therapists.filter(t => t.name && !isNoise(t.name));
  console.log(`  → ${valid.length}名`);
  if (DRY) { valid.slice(0, 3).forEach(t => console.log(`    DRY: ${t.name}`)); return; }
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
  { id: 'kanagawa_fujisawa_rouge',      name: 'ROUGE (ルージュ)',             website_url: 'http://www.esthe-rouge.com/',           schedule_url: 'http://www.esthe-rouge.com/schedule/' },
  { id: 'kanagawa_fujisawa_bijukujo',   name: '美熟女セレブスパ',              website_url: 'https://bijukujo-celeb-spa.com/',       schedule_url: null },
  { id: 'kanagawa_fujisawa_zerofirst',  name: 'ZEROFIRST',                   website_url: 'https://zerofirst-menes.com/',           schedule_url: null },
  { id: 'kanagawa_fujisawa_navel',      name: 'Navel (ネーブル)',              website_url: 'https://www.navel-spa.com/',            schedule_url: 'https://www.navel-spa.com/cast/sindex.cgi' },
  { id: 'kanagawa_fujisawa_bless_rich', name: 'Bless Rich (ブレスリッチ)',     website_url: 'https://bless-rich.com/',               schedule_url: null },
  { id: 'kanagawa_fujisawa_irene',      name: 'Irene (アイリーン)',            website_url: 'http://www.irene-fujisawa.com/',        schedule_url: 'http://www.irene-fujisawa.com/schedule/' },
  { id: 'kanagawa_fujisawa_alice',      name: 'ALICE (アリス) 湘南',          website_url: 'https://esthe-alice-shonan.com/',       schedule_url: null },
  { id: 'kanagawa_fujisawa_plumeria',   name: "Men's Spa Plumeria (プルメリア)", website_url: 'https://salondeplumeria.com/',        schedule_url: 'https://salondeplumeria.com/schedule.html' },
  { id: 'kanagawa_fujisawa_jasmine',    name: 'Jasmine Spa (ジャスミンスパ)', website_url: 'https://jasmine-spa-esthe.com/',         schedule_url: null },
  { id: 'kanagawa_fujisawa_tsujido',    name: 'メンズエステ辻堂',              website_url: 'https://mens-esthe-tsujido.com/',       schedule_url: 'https://mens-esthe-tsujido.com/schedule' },
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

// ─── Navel (cast/detail.cgi?status=, 117名) ─────────────────────────────────
async function processNavel() {
  console.log('\n=== Step 2: Navel (117名) ===');
  const html = await fetchHtml('https://www.navel-spa.com/cast/');
  const $ = cheerio.load(html);
  const seen = new Set();
  const therapists = [];

  $('a[href]').filter((_, el) => /cast\/detail\.cgi\?status=/.test($(el).attr('href') || '')).each((_, el) => {
    const text = $(el).text().trim();
    // "セラピスト まなか *まなか (32)*" → "まなか"
    const name = text.replace(/^セラピスト\s+/, '').split(/[\s*（]/)[0].trim();
    if (!name || seen.has(name) || isNoise(name)) return;
    if (!/[ぁ-んァ-ヾ一-龯]/.test(name)) return;
    seen.add(name);
    therapists.push({ name });
  });

  await upsertTherapists('kanagawa_fujisawa_navel', therapists);
}

// ─── ALICE (esthe-alice-shonan.com, ap2hp CMS, 40名) ─────────────────────────
async function processAlice() {
  console.log('\n=== Step 3: ALICE (40名) ===');
  const html = await fetchHtml('https://esthe-alice-shonan.com/');
  const $ = cheerio.load(html);
  const seen = new Set();
  const therapists = [];

  $('a[href]').filter((_, el) => /\/profile\/\d+/.test($(el).attr('href') || '')).each((_, el) => {
    const text = $(el).text().trim();
    // "来夢(らむ) 来夢(らむ) / (23) 18:00〜翌2:00" or "来夢(らむ) 来夢(らむ) / (23)"
    const name = text.split(' / ')[0].split(/\s+/)[0].trim();
    if (!name || seen.has(name) || isNoise(name)) return;
    if (!/[ぁ-んァ-ヾ一-龯]/.test(name)) return;
    seen.add(name);
    therapists.push({ name });
  });

  await upsertTherapists('kanagawa_fujisawa_alice', therapists);
}

// ─── Plumeria (salondeplumeria.com, 13名) ─────────────────────────────────────
async function processPlumeria() {
  console.log('\n=== Step 4: Plumeria (13名) ===');
  const html = await fetchHtml('https://salondeplumeria.com/staff.html');
  const $ = cheerio.load(html);
  const seen = new Set();
  const therapists = [];

  $('a[href]').filter((_, el) => /\/profile\.html\?\d+/.test($(el).attr('href') || '')).each((_, el) => {
    const text = $(el).text().trim();
    // "AA級美女セラピスト‼️‼️ 朝倉 ゆい (30) T.160 (D) * 出張対応..."
    // or "白鷺 ふうか 誰もがハマるSSS級美女..."
    // 日本語名は "姓 名" or "名" パターン
    const jaNames = text.match(/([一-龯ぁ-んァ-ヾ]{1,4}[\s　]?[一-龯ぁ-んァ-ヾ]{1,5})/);
    const name = jaNames?.[0]?.replace(/[\s　]+/g, ' ').trim();
    if (!name || seen.has(name) || isNoise(name)) return;
    seen.add(name);
    therapists.push({ name });
  });

  await upsertTherapists('kanagawa_fujisawa_plumeria', therapists);
}

// ─── 辻堂 (WordPress, 2ページ) ────────────────────────────────────────────────
async function processTsujido() {
  console.log('\n=== Step 5: 辻堂 (2ページ) ===');
  const seen = new Set();
  const therapists = [];

  for (let page = 1; page <= 2; page++) {
    const url = page === 1 ? 'https://mens-esthe-tsujido.com/cast' : 'https://mens-esthe-tsujido.com/cast/page/2/';
    let html;
    try { html = await fetchHtml(url); } catch(e) { break; }
    const $ = cheerio.load(html);

    $('a[href]').filter((_, el) => /\/cast\//.test($(el).attr('href') || '') && !/schedule|recruit|reserve|blog|event|menu|access/.test($(el).attr('href') || '')).each((_, el) => {
      const text = $(el).text().trim();
      // "吉沢 りょうか🆕✨✨" or "山手 のぞみ" → clean name
      const name = text.replace(/NEW✨?|🆕|✨|☆|新人|出勤|PLATINUM|GOLD|REGULAR|SILVER/g, '').trim().split(/\s+/).slice(0, 2).join(' ').trim();
      if (!name || seen.has(name) || isNoise(name)) return;
      if (!/[ぁ-んァ-ヾ一-龯]/.test(name)) return;
      if (name.length < 2) return;
      seen.add(name);
      therapists.push({ name });
    });

    await sleep(500);
  }

  await upsertTherapists('kanagawa_fujisawa_tsujido', therapists);
}

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(DRY ? '\n=== DRY RUN ===' : '\n=== LIVE RUN ===');
  await upsertShops();
  await processNavel();
  await processAlice();
  await processPlumeria();
  await processTsujido();
  console.log('\n=== 完了 ===');
  console.log('⚠️  ROUGE / Irene: spacer画像→セラピスト登録にChrome要');
  console.log('⚠️  bijukujo / zerofirst / bless-rich / jasmine: JS描画→Chrome要');
  console.log('⚠️  Navel / ALICE / Plumeria / 辻堂: 画像はChrome要');
}

main().catch(console.error);
