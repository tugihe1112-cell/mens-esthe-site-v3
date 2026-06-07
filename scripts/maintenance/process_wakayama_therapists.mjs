/**
 * 和歌山県 全店舗セラピスト登録スクリプト
 * 実行: node scripts/maintenance/process_wakayama_therapists.mjs [--dry-run]
 */
import fs from 'fs';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const DRY_RUN = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = k => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';

async function fetchHtml(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(10000) });
  return res.text();
}

// ──────────── ideal (/photos/ パターン) ────────────
async function getIdeal() {
  const html = await fetchHtml('https://esthe-ideal.net/girl');
  const $ = cheerio.load(html);
  const result = [];
  $('img[src*="/photos/"]').each((_, el) => {
    const name = ($(el).attr('alt') || '').replace(/～[^～]*～/g, '').trim();
    const src = ($(el).attr('src') || '').split('?')[0];
    if (name.length >= 1 && /[ぁ-んァ-ヾ一-龯]/.test(name) && !result.find(t => t.name === name))
      result.push({ name, image_url: src });
  });
  return result;
}

// ──────────── YOLU SPA (/prof/{id}/top.jpg, data-original) ────────────
async function getYoluSpa() {
  const html = await fetchHtml('https://www.yoluspa.com/staff/');
  const $ = cheerio.load(html);
  const result = [];
  $('img[data-original*="/prof/"]').each((_, el) => {
    const name = ($(el).attr('alt') || '').trim();
    const src = ($(el).attr('data-original') || '').split('?')[0];
    if (name.length >= 2 && /[ぁ-んァ-ヾ一-龯]/.test(name) && !/(トップ|ロゴ|YOLU)/.test(name) && !result.find(t => t.name === name))
      result.push({ name, image_url: src });
  });
  return result;
}

// ──────────── ミセスの教室 (/photos/ パターン) ────────────
async function getMrsKyoshitsu() {
  const html = await fetchHtml('https://classroom-of-mrs.com/girl');
  const $ = cheerio.load(html);
  const result = [];
  $('img[src*="/photos/"]').each((_, el) => {
    const name = ($(el).attr('alt') || '').replace(/\s*先生/, '').replace(/～[^～]*～/g, '').trim();
    const src = ($(el).attr('src') || '').split('?')[0];
    if (name.length >= 1 && /[ぁ-んァ-ヾ一-龯]/.test(name) && !result.find(t => t.name === name))
      result.push({ name, image_url: src });
  });
  return result;
}

// ──────────── Eden (Crayonsite, X才パターン) ────────────
async function getEden() {
  const html = await fetchHtml('https://2lpz8.crayonsite.com/p/3/');
  const text = html.replace(/<[^>]+>/g, ' ');
  const $ = cheerio.load(html);
  const nameMatches = [...text.matchAll(/([^\s<>{}\[\]（）()\d★☆♪]{2,6})\s+\d{2}才/g)].map(m => m[1].trim());
  const imgs = [];
  $('img[src*="crayonimg"]').each((_, el) => imgs.push($(el).attr('src')));
  const names = nameMatches.filter(n => /[ぁ-んァ-ヾ一-龯]/.test(n) && !/(Eden|システム|メンズ|エステ|エデン|Melty|和歌山)/.test(n));
  const unique = [...new Set(names)];
  return unique.map((name, i) => ({ name, image_url: imgs[i] || null }));
}

// ──────────── Clearflan (/pic/girl/ パターン) ────────────
async function getClearflan() {
  const html = await fetchHtml('https://clearflan.com/girllist');
  const $ = cheerio.load(html);
  const result = [];
  $('img[src*="/pic/girl/"]').each((_, el) => {
    const name = ($(el).attr('alt') || '').replace(/「([^」]+)」写真/, '$1').replace(/～[^～]*～/g, '').trim();
    const src = $(el).attr('src') || '';
    if (name.length >= 1 && /[ぁ-んァ-ヾ一-龯a-zA-Z]/.test(name) && !/(新規割|割引|キャンペーン|求人)/.test(name) && !result.find(t => t.name === name))
      result.push({ name, image_url: src });
  });
  return result;
}

// ──────────── royal.Crystal (estama.jp /cast/main/ パターン) ────────────
async function getRoyalCrystal() {
  const html = await fetchHtml('https://royal-crystal-wakayama.com/therapist/');
  const $ = cheerio.load(html);
  const result = [];
  $('img[src*="/cast/main/"]').each((_, el) => {
    const name = ($(el).attr('alt') || '').replace(/\(新人\)/g, '').replace(/（新人）/g, '').trim();
    const src = ($(el).attr('src') || '').split('?')[0];
    if (name.length >= 1 && /[ぁ-んァ-ヾ一-龯a-zA-Z]/.test(name) && !/(エステ|メンズ|和歌山|royal)/.test(name) && !result.find(t => t.name === name))
      result.push({ name, image_url: src });
  });
  return result;
}

// ──────────── エコde教室 (姓のみ、画像なし) ────────────
async function getEcoKyoshitsu() {
  return ['田尾','豊田','竹下','坂本','松本','山本','山田','木村','菊地','中尾']
    .map(name => ({ name, image_url: null }));
}

// ──────────── メイン処理 ────────────
const SHOPS = [
  { shopId: 'wakayama_wakayama_ideal',         fn: getIdeal,         label: 'ideal' },
  { shopId: 'wakayama_wakayama_yolu_spa',      fn: getYoluSpa,       label: 'YOLU SPA' },
  { shopId: 'wakayama_wakayama_mrs_kyoshitsu', fn: getMrsKyoshitsu,  label: 'ミセスの教室' },
  { shopId: 'wakayama_wakayama_eden',          fn: getEden,          label: 'Eden' },
  { shopId: 'wakayama_wakayama_clearflan',     fn: getClearflan,     label: 'Clearflan' },
  { shopId: 'wakayama_wakayama_royal_crystal', fn: getRoyalCrystal,  label: 'royal.Crystal' },
  { shopId: 'wakayama_wakayama_eco_kyoshitsu', fn: getEcoKyoshitsu,  label: 'エコde教室' },
  // キューピット・Melty Aroma: サイトダウンのためスキップ
];

console.log(`和歌山 セラピスト登録 (dry-run: ${DRY_RUN})\n`);
let totalInserted = 0, totalSkipped = 0;

for (const { shopId, fn, label } of SHOPS) {
  console.log(`\n--- ${label} ---`);
  let therapists = [];
  try {
    therapists = await fn();
    console.log(`  取得: ${therapists.length}名`);
  } catch(e) { console.error(`  ERROR: ${e.message}`); continue; }
  if (!therapists.length) { console.log('  取得なし'); continue; }

  const { data: existing } = await supabase.from('therapists').select('name').eq('shop_id', shopId);
  const existingNames = new Set((existing||[]).map(t => t.name.replace(/[\s　]/g,'')));

  let inserted = 0, skipped = 0;
  for (const t of therapists) {
    if (existingNames.has(t.name.replace(/[\s　]/g,''))) { skipped++; continue; }
    if (!DRY_RUN) {
      const { error } = await supabase.from('therapists').upsert({
        id: `${shopId}_${t.name.replace(/\s+/g,'_')}`,
        shop_id: shopId, name: t.name, image_url: t.image_url || null
      }, { onConflict: 'id' });
      if (error) { console.error(`  ERROR: ${t.name}: ${error.message}`); continue; }
    }
    inserted++;
  }
  console.log(`  登録: ${inserted}名 / スキップ: ${skipped}名`);
  totalInserted += inserted; totalSkipped += skipped;
}

console.log(`\n============================`);
console.log(`合計 登録: ${totalInserted}名 / スキップ: ${totalSkipped}名 (dry-run: ${DRY_RUN})`);
