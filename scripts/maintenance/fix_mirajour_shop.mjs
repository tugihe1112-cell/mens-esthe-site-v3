/**
 * Mirajour (60026) shop情報修正 + セラピスト登録
 * - raw_data.prefecture が 'shops_backup.json' になっているのを修正
 * - /itemList.html から セラピスト取得（/optImg/1004130/item/ パス）
 * 実行: node scripts/maintenance/fix_mirajour_shop.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const SHOP_ID = '60026';
const BASE = 'https://total-beauty-salon.net';
const BUCKET = 'therapist-images';
const UA = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Referer': 'https://total-beauty-salon.net/',
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (DRY_RUN) console.log('[DRY RUN]\n');

// ─── 1. shop情報修正 ──────────────────────────────────────────────────────────
console.log('=== 1. Mirajour shop情報確認・修正 ===');
const { data: shop } = await supabase.from('shops').select('id, name, raw_data, website_url').eq('id', SHOP_ID).single();
if (!shop) {
  console.log(`❌ shop ${SHOP_ID} が見つかりません`);
  process.exit(1);
}

console.log(`現在: name="${shop.name}" prefecture="${shop.raw_data?.prefecture}" website="${shop.website_url}"`);

const fixedRawData = {
  ...(shop.raw_data || {}),
  prefecture: '大阪府',
  area: '大阪',
  city: '大阪市',
  name: shop.raw_data?.name || 'Mirajour (ミラジュール)',
};

if (!DRY_RUN) {
  const { error } = await supabase.from('shops').update({
    raw_data: fixedRawData,
    website_url: shop.website_url || `${BASE}/`,
  }).eq('id', SHOP_ID);
  if (error) console.log(`❌ shop更新エラー: ${error.message}`);
  else console.log('✅ shop.raw_data.prefecture → 大阪府 に修正');
} else {
  console.log(`[DRY RUN] prefecture: '${shop.raw_data?.prefecture}' → '大阪府'`);
}

await sleep(500);

// ─── 2. セラピスト取得 ────────────────────────────────────────────────────────
console.log('\n=== 2. セラピスト取得 (/itemList.html) ===');

const isNoise = (name) => {
  if (!name || name.length === 0) return true;
  if (name.length > 15) return true;
  if (/エステ|メンズ|求人|体験|新規|イベント|キャンペーン|ランキング|スタッフ|セラピスト/i.test(name)) return true;
  return false;
};

async function uploadImage(imageUrl, fileName) {
  try {
    const res = await fetch(imageUrl, { headers: UA, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/') || ct.includes('svg')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 512) return null;
    const ext = (imageUrl.match(/\.(jpg|jpeg|png|gif|webp)/i)?.[1] || 'jpg').toLowerCase();
    const safeExt = ext === 'jpeg' ? 'jpg' : ext;
    const { error } = await supabase.storage.from(BUCKET)
      .upload(fileName, buf, { contentType: `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}`, upsert: true });
    if (error) { console.error(`  Storage: ${error.message}`); return null; }
    return supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
  } catch { return null; }
}

let html;
try {
  const res = await fetch(`${BASE}/itemList.html`, { headers: UA, signal: AbortSignal.timeout(15000) });
  console.log(`HTTP: ${res.status}`);
  html = await res.text();
} catch (e) {
  console.log(`❌ 取得失敗: ${e.message}`);
  process.exit(1);
}

const $ = cheerio.load(html);
const therapistMap = new Map(); // name → imageUrl

// パターン1: /optImg/1004130/item/ パス + alt=名前
$('img[src*="/optImg/"]').each((_, el) => {
  const alt = ($(el).attr('alt') || '').trim();
  let src = $(el).attr('src') || '';
  if (isNoise(alt)) return;
  if (!src.startsWith('http')) src = `${BASE}${src}`;
  if (!therapistMap.has(alt)) therapistMap.set(alt, src);
});

// パターン2: 日本語altを持つimg（上記で取れなかった場合）
if (therapistMap.size === 0) {
  $('img').each((_, el) => {
    const alt = ($(el).attr('alt') || '').trim();
    let src = $(el).attr('src') || '';
    if (!alt || isNoise(alt)) return;
    if (!/[ぁ-んァ-ヾ一-龯]/.test(alt)) return;
    if (!src.startsWith('http')) src = `${BASE}${src}`;
    if (!therapistMap.has(alt)) therapistMap.set(alt, src);
  });
}

console.log(`取得: ${therapistMap.size}名`);
if (therapistMap.size === 0) {
  console.log('⚠️ セラピストが見つかりません。サイト構造を確認してください。');
  // imgのsrc一覧を出力
  const srcs = [];
  $('img').each((_, el) => {
    const src = ($(el).attr('src') || '').slice(0, 80);
    const alt = ($(el).attr('alt') || '').slice(0, 20);
    if (src && !src.includes('logo') && !src.includes('.svg')) srcs.push(`alt="${alt}" ${src}`);
  });
  console.log('imgサンプル:');
  srcs.slice(0, 10).forEach(s => console.log(`  ${s}`));
  process.exit(0);
}

if (DRY_RUN) {
  for (const [name, url] of therapistMap) console.log(`  ${name} → ${url.slice(0, 80)}`);
  process.exit(0);
}

// ─── 3. 挿入 ─────────────────────────────────────────────────────────────────
console.log('\n=== 3. セラピスト挿入 ===');
let inserted = 0, skipped = 0, failed = 0;

for (const [name, imageUrl] of therapistMap) {
  const id = `${SHOP_ID}_${name}`;
  const { data: existing } = await supabase.from('therapists').select('id').eq('id', id).single();
  if (existing) { process.stdout.write('='); skipped++; continue; }

  const base = imageUrl.split('/').pop().split('?')[0];
  const stem = base.replace(/\.[^.]+$/, '').replace(/[^\w-]/g, '_').slice(0, 40);
  const ext = (base.match(/\.(jpg|jpeg|png|webp)/i)?.[1] || 'jpg').toLowerCase();
  const safeExt = ext === 'jpeg' ? 'jpg' : ext;
  const fileName = `mirajour_${stem}.${safeExt}`;

  const storageUrl = await uploadImage(imageUrl, fileName);
  await sleep(80);

  const { error } = await supabase.from('therapists').insert({
    id, shop_id: SHOP_ID, name, image_url: storageUrl ?? imageUrl,
  });
  if (error) { console.log(`\n❌ ${name}: ${error.message}`); failed++; }
  else { process.stdout.write(storageUrl ? '+' : '.'); inserted++; }
  await sleep(80);
}

console.log(`\n\n完了: 挿入 ${inserted}名 / スキップ ${skipped}名 / 失敗 ${failed}名`);
