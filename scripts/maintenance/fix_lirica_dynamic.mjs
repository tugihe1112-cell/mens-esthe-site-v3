/**
 * LIRICA OSAKA 写真なしセラピスト 動的スクレイプ版
 * /cast/ ページの def/con URL + h3名前 を動的に取得して更新
 * （一部はvideo要素でJS描画のため取得不可）
 * 実行: node scripts/maintenance/fix_lirica_dynamic.mjs [--dry-run]
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
const BASE_URL = 'https://lirica-osaka.com';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (DRY_RUN) console.log('[DRY RUN]\n');

async function uploadImage(imageUrl, fileName) {
  try {
    // def/con URL（タイムスタンプ付き）そのまま取得
    const res = await fetch(imageUrl, {
      headers: { 'User-Agent': UA, Referer: BASE_URL + '/cast/' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) { process.stdout.write(`[${res.status}]`); return null; }
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 512) return null;
    const ext = (imageUrl.match(/\.(jpe?g|png|gif|webp)/i)?.[1] || 'jpg').toLowerCase();
    const safeExt = ext === 'jpeg' ? 'jpg' : ext;
    const { error } = await supabase.storage.from(BUCKET)
      .upload(fileName, buf, { contentType: `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}`, upsert: true });
    if (error) { process.stdout.write(`[E]`); return null; }
    return supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
  } catch (e) { process.stdout.write(`[ERR]`); return null; }
}

// ─── /cast/ スクレイプ ───────────────────────────────────────────
console.log(`${BASE_URL}/cast/ 取得中...`);
const html = await (await fetch(BASE_URL + '/cast/', {
  headers: { 'User-Agent': UA, Referer: BASE_URL + '/' },
  signal: AbortSignal.timeout(20000),
})).text();
const $ = cheerio.load(html);

// 方針: img[src*="def/con"] を見つけ、最も近い h3 から名前を取得
const nameImageMap = new Map(); // name → {url, castId}

// パターン1: img の src に def/con が含まれる要素
$('img[src*="def/con"]').each((_, el) => {
  const src = $(el).attr('src') || '';
  const alt = ($(el).attr('alt') || '').trim();
  const castId = src.match(/thumb_(\d+)/)?.[1];
  if (!castId) return;

  // altから名前（"リリカ大阪 名前" → 名前）
  let name = alt.replace(/リリカ大阪[\s　]*/g, '').trim();
  if (!name && src) {
    // 近くのh3から名前取得
    const $container = $(el).closest('li, article, div.cast, div.item, div.staff');
    name = $container.find('h3, .name, .c-panel__name').first().text()
      .replace(/\(\d+\)/, '').replace(/★.*$/, '').trim();
  }
  if (name) {
    const defconUrl = src.startsWith('http') ? src : BASE_URL + src;
    if (!nameImageMap.has(name)) nameImageMap.set(name, { url: defconUrl, castId });
  }
});

// パターン2: def/con が href や style に含まれるコンテナ
$('[src*="def/con?p="], [href*="def/con?p="]').each((_, el) => {
  const src = $(el).attr('src') || $(el).attr('href') || '';
  const castId = src.match(/thumb_(\d+)/)?.[1];
  if (!castId) return;
  const $container = $(el).closest('li, article, div.cast, .cast-item');
  let name = $container.find('h3, .name').first().text()
    .replace(/\(\d+\)/, '').replace(/★.*$/, '').trim();
  if (name && !nameImageMap.has(name)) {
    const defconUrl = src.startsWith('http') ? src : BASE_URL + src;
    nameImageMap.set(name, { url: defconUrl, castId });
  }
});

// パターン3: HTMLテキストから def/con URL と h3名前を正規表現でペアリング
const htmlText = $.html();
const articlePattern = /<(?:li|article)[^>]*>([\s\S]*?)<\/(?:li|article)>/g;
let articleMatch;
while ((articleMatch = articlePattern.exec(htmlText)) !== null) {
  const block = articleMatch[1];
  const defconMatch = block.match(/def\/con\?[^"']*p=upload\/cast\/thumb_(\d+)\.(\w+)[^"']*/);
  const h3Match = block.match(/<h3[^>]*>([^<]+)/);
  if (defconMatch && h3Match) {
    const castId = defconMatch[1];
    const ext = defconMatch[2];
    let name = h3Match[1].replace(/\(\d+\)/, '').replace(/★.*$/, '').replace(/⒲/g, '').trim();
    name = name.replace(/リリカ大阪[\s　]*/g, '').trim();
    if (name && !nameImageMap.has(name)) {
      const defconUrl = `${BASE_URL}/def/con?x=270&p=upload/cast/thumb_${castId}.${ext}`;
      nameImageMap.set(name, { url: defconUrl, castId });
    }
  }
}

console.log(`サイトから取得: ${nameImageMap.size}名（画像URL付き）`);
if (DRY_RUN) {
  for (const [n, info] of nameImageMap) {
    console.log(`  "${n}" → castId=${info.castId}`);
  }
}

// ─── DB 取得 ─────────────────────────────────────────────────────
const { data: shops } = await supabase.from('shops').select('id, name').ilike('website_url', '%lirica-osaka%');
if (!shops?.length) { console.log('店舗なし'); process.exit(1); }
console.log(`\n対象店舗: ${shops.map(s => s.name).join(', ')}`);
const shopIds = shops.map(s => s.id);

const { data: nullT } = await supabase.from('therapists')
  .select('id, name, shop_id, image_url')
  .in('shop_id', shopIds)
  .is('image_url', null);

console.log(`DB写真なし: ${nullT?.length ?? 0}名`);

// 名前マッチング（完全一致 or 部分一致）
function findMatch(dbName) {
  if (nameImageMap.has(dbName)) return nameImageMap.get(dbName);
  // "橘　あいか" → "あいか" などの部分マッチ（全角スペース区切り）
  for (const [siteName, info] of nameImageMap) {
    if (siteName.includes('　')) {
      const parts = siteName.split('　');
      if (parts.some(p => p.trim() === dbName)) return info;
    }
    if (siteName.includes(' ')) {
      const parts = siteName.split(' ');
      if (parts.some(p => p.trim() === dbName)) return info;
    }
  }
  // DB名がサイト名に含まれる（または逆）
  for (const [siteName, info] of nameImageMap) {
    if (siteName.includes(dbName) && dbName.length >= 3) return info;
    if (dbName.includes(siteName) && siteName.length >= 3) return info;
  }
  return null;
}

if (DRY_RUN) {
  console.log('\n[マッチング確認]');
  const matched = (nullT || []).filter(t => findMatch(t.name));
  const notFoundList = (nullT || []).filter(t => !findMatch(t.name));
  console.log(`マッチ: ${matched.length}名`);
  matched.forEach(t => {
    const info = findMatch(t.name);
    console.log(`  ✅ "${t.name}" → castId=${info.castId}`);
  });
  console.log(`未マッチ: ${notFoundList.length}名`);
  notFoundList.forEach(t => console.log(`  ❓ "${t.name}"`));
  process.exit(0);
}

// ─── 更新 ────────────────────────────────────────────────────────
let updated = 0, notFound = 0, failed = 0;
const processedCastIds = new Map();

for (const t of nullT || []) {
  const info = findMatch(t.name);
  if (!info) { process.stdout.write('?'); notFound++; continue; }

  let storageUrl;
  if (processedCastIds.has(info.castId)) {
    storageUrl = processedCastIds.get(info.castId);
  } else {
    const fileName = `lirica_cast_${info.castId}.jpg`;
    storageUrl = await uploadImage(info.url, fileName);
    processedCastIds.set(info.castId, storageUrl);
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
