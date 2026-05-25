/**
 * Aroma BANKER セラピスト写真修正
 * パターン: /images/therapist/{hash}.jpg  alt="(苗字(読み))名前" or "アロマバンカーの名前"
 * 実行: node scripts/maintenance/fix_aroma_banker.mjs [--dry-run]
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
const BASE = 'https://aroma-banker.com';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (DRY_RUN) console.log('[DRY RUN]\n');

async function uploadImage(imageUrl, fileName) {
  try {
    const res = await fetch(imageUrl, {
      headers: { 'User-Agent': UA, Referer: BASE + '/' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) { process.stdout.write(`[${res.status}]`); return null; }
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 512) return null;
    const ext = ct.includes('png') ? 'png' : 'jpg';
    const { error } = await supabase.storage.from(BUCKET)
      .upload(fileName, buf, { contentType: ct, upsert: true });
    if (error) { process.stdout.write(`[E]`); return null; }
    return supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
  } catch (e) { process.stdout.write(`[ERR]`); return null; }
}

// alt から名前を抽出
// "渚(なぎさ)れん" → "れん" / "アロマバンカーの月岡あかね" → "月岡あかね" / "矢口ひな" → "矢口ひな"
function extractName(alt) {
  let name = alt
    .replace(/^アロマバンカーの/, '')  // プレフィックス除去
    .replace(/\([^)]*\)/g, '')         // (読み仮名) 除去
    .replace(/（[^）]*）/g, '')        // （読み仮名）除去
    .replace(/\(\d+\)/g, '')           // (年齢) 除去
    .trim();

  // "苗字名前" 形式で苗字が漢字・名前がひらがな → 最後のひらがな部分を取得
  // 例: "渚れん" → 苗字"渚"は元々除去済み、"れん"のみ残る
  // ただし "月岡あかね" のような姓名形式はそのまま残す
  return name;
}

// ─── スクレイプ ──────────────────────────────────────────────────
console.log(`${BASE}/ 取得中...`);
const html = await (await fetch(BASE + '/', {
  headers: { 'User-Agent': UA, Referer: BASE + '/' },
  signal: AbortSignal.timeout(20000),
})).text();
const $ = cheerio.load(html);

const nameImageMap = new Map(); // extractedName → {url, hash}

$('img[src*="/images/therapist/"]').each((_, el) => {
  const src = $(el).attr('src') || '';
  const alt = ($(el).attr('alt') || '').trim();
  if (!alt || !src) return;
  // ロゴ・バナー除外
  if (/logo|banner|bnr|icon/i.test(src)) return;
  // 日本語名前でないものは除外
  if (!/[ぁ-んァ-ヾ一-龯]/.test(alt)) return;

  const hashMatch = src.match(/\/images\/therapist\/([a-f0-9]+\.(?:jpg|jpeg|png|gif|webp))/i);
  if (!hashMatch) return;

  const fullUrl = src.startsWith('http') ? src : BASE + src;
  const hash = hashMatch[1];
  const name = extractName(alt);

  if (name && name.length >= 2 && !nameImageMap.has(name)) {
    nameImageMap.set(name, { url: fullUrl, hash });
  }
});

console.log(`サイトから取得: ${nameImageMap.size}名`);
if (DRY_RUN) {
  for (const [n, info] of nameImageMap) {
    console.log(`  "${n}" → ${info.url.slice(-50)}`);
  }
}

// ─── DB 取得 ─────────────────────────────────────────────────────
const { data: shops } = await supabase.from('shops').select('id, name').ilike('website_url', '%aroma-banker%');
if (!shops?.length) { console.log('店舗なし'); process.exit(1); }
console.log(`\n対象店舗: ${shops.map(s => s.name).join(', ')}`);
const shopIds = shops.map(s => s.id);

const { data: nullT } = await supabase.from('therapists')
  .select('id, name, shop_id, image_url')
  .in('shop_id', shopIds)
  .is('image_url', null);

console.log(`DB写真なし: ${nullT?.length ?? 0}名`);

function findMatch(dbName) {
  if (nameImageMap.has(dbName)) return nameImageMap.get(dbName);
  // DB名がサイト名に含まれる（末尾一致 or 部分一致）
  for (const [siteName, info] of nameImageMap) {
    if (siteName.endsWith(dbName) && dbName.length >= 2) return info;
    if (dbName.endsWith(siteName) && siteName.length >= 2) return info;
    if (siteName.includes(dbName) && dbName.length >= 2) return info;
    if (dbName.includes(siteName) && siteName.length >= 2) return info;
  }
  return null;
}

if (DRY_RUN) {
  console.log('\n[マッチング確認]');
  for (const t of nullT || []) {
    const info = findMatch(t.name);
    if (info) console.log(`  ✅ "${t.name}" → ${info.url.slice(-40)}`);
    else console.log(`  ❓ "${t.name}" → 未マッチ`);
  }
  process.exit(0);
}

// ─── 更新 ────────────────────────────────────────────────────────
let updated = 0, notFound = 0, failed = 0;
const processedHashes = new Map();

for (const t of nullT || []) {
  const info = findMatch(t.name);
  if (!info) { process.stdout.write('?'); notFound++; continue; }

  let storageUrl;
  if (processedHashes.has(info.hash)) {
    storageUrl = processedHashes.get(info.hash);
  } else {
    const ext = info.hash.split('.').pop() || 'jpg';
    const fileName = `aroma_banker_${info.hash.split('.')[0].substring(0, 20)}.${ext}`;
    storageUrl = await uploadImage(info.url, fileName);
    processedHashes.set(info.hash, storageUrl);
    await sleep(150);
  }

  const { error } = await supabase.from('therapists')
    .update({ image_url: storageUrl ?? info.url })
    .eq('id', t.id);
  if (error) { console.log(`\n❌ ${t.name}: ${error.message}`); failed++; }
  else { process.stdout.write(storageUrl ? '+' : '.'); updated++; }
  await sleep(80);
}

console.log(`\n\n更新 ${updated}件 / 未マッチ ${notFound}件 / 失敗 ${failed}件`);
console.log('完了');
