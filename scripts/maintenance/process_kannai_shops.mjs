/**
 * process_kannai_shops.mjs
 * 関内エリア TOP9（3位掲載終了除く）のshop・セラピスト登録
 *
 * 対象:
 *   1位 YURU SPA        kanagawa_kannai_yuru_spa         - ~50名、therapist_img/{id}_1.webp
 *   2位 Lynx 横浜関内店  kanagawa_kannai_lynx             - 60名以上、名前のみ（画像はChrome要）
 *   4位 姫のエステ       kanagawa_kannai_hime_esthe       - shop登録のみ（spacer画像）
 *   5位 Selesa          kanagawa_kannai_selesa           - shop登録のみ（JS描画）
 *   6位 Aroma Pult      kanagawa_kannai_aroma_pult       - shop登録のみ（JS描画）
 *   7位 AZALEA          kanagawa_kannai_azalea           - 18名、menesjapon.com/showimg/therapist/{id}
 *   8位 ミセスコレクション kanagawa_kannai_mrs_collection  - shop登録のみ（要確認）
 *   9位 Guarigione       → kanagawa_yokohama_guarigione で登録済み（スキップ）
 *  10位 CREST           kanagawa_kannai_crest            - shop登録のみ（JS描画）
 *
 * 実行: node scripts/maintenance/process_kannai_shops.mjs [--dry-run]
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
const fetchHtml = async (url) => {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.text();
};

const isNoise = name => {
  if (!name || name.length < 1) return true;
  if (name.length > 15) return true;
  if (/イベント|キャンペーン|求人|banner|logo/i.test(name)) return true;
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
  {
    id: 'kanagawa_kannai_yuru_spa',
    name: 'YURU SPA (ゆるスパ) 横浜店',
    website_url: 'https://yuru-spa.com/yokohama/',
    schedule_url: 'https://yuru-spa.com/yokohama/schedule/',
  },
  {
    id: 'kanagawa_kannai_lynx',
    name: 'Lynx (リンクス) 横浜関内店',
    website_url: 'https://www.esthe-lynx-yokohama.com/',
    schedule_url: 'https://www.esthe-lynx-yokohama.com/schedule/',
  },
  {
    id: 'kanagawa_kannai_hime_esthe',
    name: '姫のエステ',
    website_url: 'https://www.hime-esthe.com/',
    schedule_url: 'https://www.hime-esthe.com/schedule/',
  },
  {
    id: 'kanagawa_kannai_selesa',
    name: 'Selesa (セレーサ)',
    website_url: 'https://www.esthe-selesa.com/',
    schedule_url: null,
  },
  {
    id: 'kanagawa_kannai_aroma_pult',
    name: 'Aroma Pult (アロマプルト)',
    website_url: 'https://aromapult.com/',
    schedule_url: null,
  },
  {
    id: 'kanagawa_kannai_azalea',
    name: 'AZALEA (アゼリア)',
    website_url: 'https://aroma-azalea.com/',
    schedule_url: 'https://aroma-azalea.com/attendance/',
  },
  {
    id: 'kanagawa_kannai_mrs_collection',
    name: 'ミセスコレクション',
    website_url: 'https://www.mrs-colle.tokyo/',
    schedule_url: null,
  },
  {
    id: 'kanagawa_kannai_crest',
    name: 'CREST',
    website_url: 'https://crest.chiraes.com/',
    schedule_url: null,
  },
];

async function upsertShops() {
  console.log('\n=== Step 1: Shops 登録 ===');
  for (const s of SHOPS) {
    const record = {
      id: s.id,
      name: s.name,
      website_url: s.website_url,
      schedule_url: s.schedule_url || null,
      raw_data: { prefecture: '神奈川県' },
    };
    if (DRY) { console.log(`  DRY: ${s.id}`); continue; }
    const { error } = await supabase.from('shops').upsert(record, { onConflict: 'id' });
    if (error) console.error(`  ERROR ${s.id}: ${error.message}`);
    else console.log(`  OK: ${s.name}`);
  }
}

// ─── YURU SPA (/therapist_img/{id}_1.webp) ───────────────────────────────────
async function processYuruSpa() {
  console.log('\n=== Step 2: YURU SPA ===');
  const html = await fetchHtml('https://yuru-spa.com/yokohama/therapist/');
  const $ = cheerio.load(html);
  const seen = new Set();
  const therapists = [];

  // 各セラピストカードのimg + boldテキスト
  $('img[src*="therapist_img/"]').each((_, el) => {
    const src = $(el).attr('src') || '';
    // クエリストリング除去
    const imgUrl = src.replace(/\?.*$/, '');
    if (!imgUrl.includes('therapist_img/') || imgUrl.includes('x.svg') || imgUrl.includes('instagram.svg')) return;

    // alt からショップ名を除いた名前を取得
    // alt = "谷りり ｜横浜メンズエステ 出張型メンズエステ ゆるスパ"
    const alt = $(el).attr('alt') || '';
    const name = alt.split('｜')[0].trim().replace(/\s+NEW\s*$/, '').trim();

    if (!name || seen.has(name) || isNoise(name)) return;
    if (!/[ぁ-んァ-ヾ一-龯]/.test(name)) return;

    seen.add(name);
    therapists.push({ name, image_url: `https://yuru-spa.com/yokohama/${imgUrl.replace(/^\//, '')}` });
  });

  await upsertTherapists('kanagawa_kannai_yuru_spa', therapists);
}

// ─── AZALEA (menesjapon.com/showimg/therapist/{id}) ──────────────────────────
async function processAzalea() {
  console.log('\n=== Step 3: AZALEA ===');
  const html = await fetchHtml('https://aroma-azalea.com/therapist/list/');
  const $ = cheerio.load(html);
  const seen = new Set();
  const therapists = [];

  $('img[src*="menesjapon.com/showimg/therapist/"]').each((_, el) => {
    const imgUrl = $(el).attr('src') || '';
    // alt = "伊勢佐木長者町メンズエステ｜AZALEA～アゼリア｜聖（ひじり）" 形式
    const alt = $(el).attr('alt') || '';
    // 最後の ｜ 以降が名前
    const namePart = alt.split('｜').pop()?.trim() || '';
    // "聖（ひじり）" → "聖（ひじり）" のまま保持
    const name = namePart;

    if (!name || seen.has(name) || isNoise(name)) return;
    if (!/[ぁ-んァ-ヾ一-龯]/.test(name)) return;

    seen.add(name);
    therapists.push({ name, image_url: imgUrl });
  });

  await upsertTherapists('kanagawa_kannai_azalea', therapists);
}

// ─── Lynx 横浜関内店 (名前のみ) ───────────────────────────────────────────────
async function processLynxYokohama() {
  console.log('\n=== Step 4: Lynx 横浜関内店 (名前のみ) ===');
  const html = await fetchHtml('https://www.esthe-lynx-yokohama.com/therapist-list/');
  const $ = cheerio.load(html);
  const seen = new Set();
  const therapists = [];

  // 各セラピストリンク: /therapist/?id=XXX
  // CSS属性セレクター内の?はfilterで対応
  $('a[href]').filter((_, el) => {
    const href = $(el).attr('href') || '';
    return /\/therapist\/\?id=\d+/.test(href);
  }).each((_, el) => {
    const rawText = $(el).text().trim();
    // "七瀬りお NEW 新人おすすめ💝Name.七瀬りおAge.23歳..." から抽出
    const nameMatch = rawText.match(/Name\.(.+?)Age\./);
    const name = nameMatch?.[1]?.trim();

    if (!name || seen.has(name) || isNoise(name)) return;
    seen.add(name);
    therapists.push({ name, image_url: null });
  });

  await upsertTherapists('kanagawa_kannai_lynx', therapists);
}

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(DRY ? '\n=== DRY RUN ===' : '\n=== LIVE RUN ===');

  await upsertShops();
  await processYuruSpa();
  await processAzalea();
  await processLynxYokohama();

  console.log('\n=== 完了 ===');
  console.log('⚠️  姫のエステ: spacer画像 → セラピスト登録にChrome要');
  console.log('⚠️  Selesa / Aroma Pult / CREST: JS描画 → Chrome要');
  console.log('⚠️  Lynx: 画像はlazy → fix_lynx_yokohama_images.mjsで後日対応要');
  console.log('⚠️  ミセスコレクション: shop登録のみ（tokyo_shinagawa_yokohama等で既存の可能性あり）');
}

main().catch(console.error);
