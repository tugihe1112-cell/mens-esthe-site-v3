/**
 * process_shinyokohama_shops.mjs
 * 新横浜エリア TOP10 shop・セラピスト登録
 *
 * 1位 YURU SPA        → 関内で kanagawa_kannai_yuru_spa 登録済み（スキップ）
 * 2位 Natura          kanagawa_shinyokohama_natura       - shop登録のみ（S3 lazy）
 * 3位 Perfume         kanagawa_shinyokohama_perfume      - 17名、Wix CDN画像
 * 4位 aikagi          kanagawa_shinyokohama_aikagi       - shop登録のみ（JS描画）
 * 5位 Marine(綱島)     kanagawa_shinyokohama_marine       - ~80名、名前のみ（dummy.png）
 * 6位 aroma-rafeel    kanagawa_shinyokohama_aroma_rafeel - shop登録のみ（JS描画）
 * 7位 KingSpa         kanagawa_shinyokohama_kingspa      - 43名、caskan CDN画像
 * 8位 mtime           kanagawa_shinyokohama_mtime        - shop登録のみ（JS描画）
 * 9位 NOI             kanagawa_shinyokohama_noi          - 35名、名前のみ
 * 10位 mrs-colle      → 関内で kanagawa_kannai_mrs_collection 登録済み（スキップ）
 *
 * 実行: node scripts/maintenance/process_shinyokohama_shops.mjs [--dry-run]
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
const fetchHtml = async url => {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.text();
};

const isNoise = name => {
  if (!name || name.length < 1) return true;
  if (name.length > 15) return true;
  if (/割|募集|特別|特典|NEW|new|banner|logo/i.test(name)) return true;
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
  { id: 'kanagawa_shinyokohama_natura',       name: 'Natura (ナチュラ) 新横浜店',   website_url: 'https://natura-yokohama.com/',           schedule_url: 'https://natura-yokohama.com/schedule' },
  { id: 'kanagawa_shinyokohama_perfume',      name: 'Perfume (パフューム) 新横浜',  website_url: 'https://www.perfume-syh.com/',           schedule_url: null },
  { id: 'kanagawa_shinyokohama_aikagi',       name: 'aikagi (アイカギ) 新横浜店',   website_url: 'https://aikagishinyoko.esthe-hp.com/',   schedule_url: null },
  { id: 'kanagawa_shinyokohama_marine',       name: 'Marine (マリン) 綱島',         website_url: 'https://tsunamarine.com/',               schedule_url: 'https://tsunamarine.com/schedule.php' },
  { id: 'kanagawa_shinyokohama_aroma_rafeel', name: 'Aroma Rafeel (アロマラフィール)', website_url: 'https://www.aroma-rafeel.com/',         schedule_url: null },
  { id: 'kanagawa_shinyokohama_kingspa',      name: 'KingSpa (キングスパ)',          website_url: 'https://kingspa.jp/',                    schedule_url: 'https://kingspa.jp/schedule' },
  { id: 'kanagawa_shinyokohama_mtime',        name: 'mtime (エムタイム) 横浜',       website_url: 'https://mtime-yokohama.net/',            schedule_url: null },
  { id: 'kanagawa_shinyokohama_noi',          name: 'NOI (ノイ) 新横浜',             website_url: 'https://noi-esthe.com/',                 schedule_url: 'https://noi-esthe.com/schedule.html' },
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

// ─── KingSpa (caskan CDN, img alt=name) ───────────────────────────────────────
async function processKingSpa() {
  console.log('\n=== Step 2: KingSpa ===');
  const html = await fetchHtml('https://kingspa.jp/therapist');
  const $ = cheerio.load(html);
  const castMap = new Map();

  // 画像リンク: img[src*="cast_tmb"][alt=名前]
  $('img[src*="cast_tmb"]').each((_, el) => {
    const imgSrc = $(el).attr('src');
    const name = ($(el).attr('alt') || '').trim();
    const id = $(el).closest('a[href*="/therapist/"]').attr('href')?.match(/\/therapist\/(\d+)/)?.[1];
    if (id && name && /[ぁ-んァ-ヾ一-龯]/.test(name) && !isNoise(name)) {
      castMap.set(id, { name, imgUrl: imgSrc });
    }
  });

  const therapists = [...castMap.values()].map(c => ({ name: c.name, image_url: c.imgUrl || null }));
  await upsertTherapists('kanagawa_shinyokohama_kingspa', therapists);
}

// ─── Perfume (Wix CDN, ハードコード) ──────────────────────────────────────────
// 17名 (2026-06-07 静的HTMLから取得)
const WIX = 'https://static.wixstatic.com/media/';
const PERFUME = [
  { name: '美咲',  img: `${WIX}63c6ec_9f561d4885fc40a3aaf158a5df9596d0~mv2.jpeg` },
  { name: '名波',  img: `${WIX}63c6ec_f0c3adb7473b43d9b28fbdb97dd514f8~mv2.jpeg` },
  { name: '観月',  img: `${WIX}63c6ec_417eeefc811e4b00aceef61f66e3a6da~mv2.jpg` },
  { name: '真木',  img: `${WIX}63c6ec_31b4827c84af4b3fa385b0d8b6e221b8~mv2.jpg` },
  { name: '菜花',  img: `${WIX}63c6ec_8f7a5d14617346f89bb40476a80f00a4~mv2.jpeg` },
  { name: '舞香',  img: `${WIX}63c6ec_fe6edbbcbb004bdeb23278a88a088942~mv2.jpeg` },
  { name: '斉藤',  img: `${WIX}63c6ec_edf0c9d8352547f986e0d2f6572f9ce5~mv2.jpg` },
  { name: '松雪',  img: `${WIX}63c6ec_ed14dc5c9b1f4255aa818ef99478d9ea~mv2.jpg` },
  { name: '夏樹',  img: `${WIX}63c6ec_6c9e9de37adf451c8c60cd0f25ece02a~mv2.jpg` },
  { name: '上原',  img: `${WIX}63c6ec_654d43b948b14c41a5b2292ecdc608aa~mv2.jpeg` },
  { name: '白石',  img: `${WIX}63c6ec_881755a6f983407cb3c1424d946f466f~mv2.jpg` },
  { name: '日向',  img: `${WIX}63c6ec_e1316ed276274fb8af946afb31db273a~mv2.jpeg` },
  { name: '松尾',  img: `${WIX}63c6ec_255b50aebd614d1f879bce4ffa6933c7~mv2.jpeg` },
  { name: '大田',  img: `${WIX}63c6ec_1b2bd5c02f7b420b9c3340390bbf9298~mv2.jpeg` },
  { name: '青野',  img: `${WIX}63c6ec_28e15f8274914c3ca93ad2889fe544c3~mv2.jpeg` },
  { name: '井川',  img: `${WIX}63c6ec_3dbb683a86f8464f881a8f87eab96e41~mv2.jpeg` },
  { name: '佐野',  img: `${WIX}63c6ec_daaceb1976254854aa17425e2d1b52a1~mv2.jpeg` },
];

async function processPerfume() {
  console.log('\n=== Step 3: Perfume ===');
  await upsertTherapists('kanagawa_shinyokohama_perfume',
    PERFUME.map(t => ({ name: t.name, image_url: t.img }))
  );
}

// ─── Marine/tsunamarine (名前のみ、dummy.png) ──────────────────────────────────
async function processMarine() {
  console.log('\n=== Step 4: Marine (名前のみ) ===');
  const html = await fetchHtml('https://tsunamarine.com/staff.php');
  const $ = cheerio.load(html);
  const seen = new Set();
  const therapists = [];

  // img[src*="dummy.png"][alt] → alt が名前
  $('img[src*="dummy.png"][alt]').each((_, el) => {
    const name = ($(el).attr('alt') || '').trim();
    if (!name || name === 'NEW' || seen.has(name) || isNoise(name)) return;
    if (!/[ぁ-んァ-ヾ一-龯]/.test(name)) return;
    seen.add(name);
    therapists.push({ name, image_url: null });
  });

  await upsertTherapists('kanagawa_shinyokohama_marine', therapists);
}

// ─── NOI (名前のみ、/profile.html?id) ─────────────────────────────────────────
async function processNoi() {
  console.log('\n=== Step 5: NOI (名前のみ) ===');
  const html = await fetchHtml('https://noi-esthe.com/staff.html');
  const $ = cheerio.load(html);
  const seen = new Set();
  const therapists = [];

  $('a[href*="/profile.html?"]').each((_, el) => {
    const rawText = $(el).text().trim();
    // "月島しの(新人) (24)" → "月島しの"
    const name = rawText.replace(/\(新人\)/g, '').replace(/\s*\(\d+\).*$/, '').trim();
    if (!name || seen.has(name) || isNoise(name)) return;
    if (!/[ぁ-んァ-ヾ一-龯]/.test(name)) return;
    seen.add(name);
    therapists.push({ name, image_url: null });
  });

  await upsertTherapists('kanagawa_shinyokohama_noi', therapists);
}

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(DRY ? '\n=== DRY RUN ===' : '\n=== LIVE RUN ===');
  await upsertShops();
  await processKingSpa();
  await processPerfume();
  await processMarine();
  await processNoi();
  console.log('\n=== 完了 ===');
  console.log('⚠️  Natura: S3 lazy → Chrome で別途セラピスト登録要');
  console.log('⚠️  aikagi / aroma-rafeel / mtime: JS描画 → Chrome要');
  console.log('⚠️  Marine: 画像はdummy.png → fix_marine_images.mjs で後日対応要');
}

main().catch(console.error);
