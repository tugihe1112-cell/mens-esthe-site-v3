/**
 * 明大前ANNEX セラピスト写真修正
 * CDN: aroma-tsushin.com/__admin/img_hp/staff_{staffId}_{ts}.jpg
 * alt: "名前（年齢）T... B... W... H..." → 名前は（の前
 * 実行: node scripts/maintenance/fix_annex_meidaimae_images.mjs [--dry-run]
 */
import fs from 'fs';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const BUCKET = 'therapist-images';
const SITE_URL = 'https://aroma-annex.com/therapist/';
const REFERER = 'https://aroma-annex.com/';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (DRY_RUN) console.log('[DRY RUN]\n');

// 名前抽出: "神田（35）T158..." → "神田" / "佐野 (33）..." → "佐野"
function extractName(alt) {
  return alt.replace(/[\s　]*[（(（(（]\d.*/, '').trim();
}

// staffId抽出: "https://aroma-tsushin.com/__admin/img_hp/staff_9267_17128...jpg" → "9267"
function extractStaffId(src) {
  const m = src.match(/staff_(\d+)_\d+\.(jpe?g|JPG|PNG)/i);
  return m ? m[1] : null;
}

// 1枚目の写真か判定（_2_ や _3_ が入っていないもの）
function isFirstPhoto(src) {
  return !/staff_\d+_[23]_\d+/.test(src);
}

async function uploadImage(imageUrl, fileName) {
  try {
    const res = await fetch(imageUrl, {
      headers: { 'User-Agent': UA, 'Referer': REFERER },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) { console.log(`\n  HTTP ${res.status}: ${imageUrl.slice(-60)}`); return null; }
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 512) return null;
    const ext = imageUrl.match(/\.(jpe?g|JPG|png|gif|webp)/i)?.[1]?.toLowerCase() || 'jpg';
    const safeExt = ext === 'jpeg' ? 'jpg' : ext;
    const { error } = await supabase.storage.from(BUCKET)
      .upload(fileName, buf, { contentType: `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}`, upsert: true });
    if (error) { console.log(`\n  Storage: ${error.message}`); return null; }
    return supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
  } catch (e) { console.log(`\n  fetch error: ${e.message}`); return null; }
}

// ─── スクレイプ ──────────────────────────────────────────────────
console.log(`${SITE_URL} 取得中...`);
const html = await (await fetch(SITE_URL, {
  headers: { 'User-Agent': UA, Referer: REFERER },
  signal: AbortSignal.timeout(15000),
})).text();

const $ = cheerio.load(html);

// 1枚目の写真のみ取得（名前→imageUrl）
const nameImageMap = new Map();
$('img[src*="aroma-tsushin.com/__admin/img_hp/staff"]').each((_, el) => {
  const src = $(el).attr('src') || '';
  if (!isFirstPhoto(src)) return;
  const alt = $(el).attr('alt') || '';
  const name = extractName(alt);
  if (!name || name.length > 8) return;
  // no_image はスキップ
  if (src.includes('no_image')) return;
  if (!nameImageMap.has(name)) nameImageMap.set(name, src);
});

console.log(`サイトから取得: ${nameImageMap.size}名`);
if (DRY_RUN) {
  for (const [name, url] of nameImageMap) {
    console.log(`  ${name} → ...${url.slice(-50)}`);
  }
}

// ─── DB 取得 ────────────────────────────────────────────────────
const { data: shops } = await supabase.from('shops').select('id, name').ilike('website_url', '%aroma-annex%');
if (!shops?.length) { console.log('店舗が見つかりません'); process.exit(1); }
console.log(`\n対象店舗: ${shops.map(s => `${s.id} ${s.name}`).join(', ')}`);
const shopIds = shops.map(s => s.id);

const { data: nullTherapists } = await supabase.from('therapists')
  .select('id, name, shop_id, image_url')
  .in('shop_id', shopIds)
  .is('image_url', null);

console.log(`DB写真なし: ${nullTherapists?.length ?? 0}名`);

if (!nullTherapists?.length) { console.log('写真なしセラピストはいません'); process.exit(0); }

// ─── 更新 ────────────────────────────────────────────────────────
if (DRY_RUN) {
  console.log('\n[マッチング確認]');
  for (const t of nullTherapists) {
    const url = nameImageMap.get(t.name);
    if (url) {
      const staffId = extractStaffId(url);
      console.log(`  ✅ ${t.name} → staff_${staffId} ...${url.slice(-40)}`);
    } else {
      console.log(`  ❓ ${t.name} → サイトに見つからず`);
    }
  }
  process.exit(0);
}

let updated = 0, skipped = 0, notFound = 0, failed = 0;

for (const t of nullTherapists) {
  const imageUrl = nameImageMap.get(t.name);
  if (!imageUrl) {
    process.stdout.write('?');
    notFound++;
    continue;
  }
  const staffId = extractStaffId(imageUrl);
  const ext = imageUrl.match(/\.(jpe?g|JPG|png)/i)?.[1]?.toLowerCase() || 'jpg';
  const safeExt = ext === 'jpeg' ? 'jpg' : ext;
  const fileName = `annex_meidaimae_staff_${staffId}.${safeExt}`;

  const storageUrl = await uploadImage(imageUrl, fileName);
  await sleep(100);

  const { error } = await supabase.from('therapists')
    .update({ image_url: storageUrl ?? imageUrl })
    .eq('id', t.id);

  if (error) {
    console.log(`\n❌ ${t.name}: ${error.message}`);
    failed++;
  } else {
    process.stdout.write(storageUrl ? '+' : '.');
    updated++;
  }
  await sleep(80);
}

console.log(`\n\n更新 ${updated}件 / スキップ ${skipped}件 / 見つからず ${notFound}件 / 失敗 ${failed}件`);
console.log('完了');
