/**
 * LEON SPA Gold / LEON SPA セラピスト写真修正
 * パターン: /photos/{id}/raw_{id}.jpg?{ts}  alt=名前
 * 実行: node scripts/maintenance/fix_leon_spa_images.mjs [--dry-run]
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
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (DRY_RUN) console.log('[DRY RUN]\n');

async function uploadImage(imageUrl, fileName, referer) {
  try {
    // タイムスタンプクエリを除去した安定URLで取得
    const cleanUrl = imageUrl.split('?')[0];
    const res = await fetch(cleanUrl, {
      headers: { 'User-Agent': UA, Referer: referer },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) { process.stdout.write(`[${res.status}]`); return null; }
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 512) return null;
    const ext = (cleanUrl.match(/\.(jpe?g|png|gif|webp)/i)?.[1] || 'jpg').toLowerCase();
    const safeExt = ext === 'jpeg' ? 'jpg' : ext;
    const { error } = await supabase.storage.from(BUCKET)
      .upload(fileName, buf, { contentType: `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}`, upsert: true });
    if (error) { process.stdout.write(`[E]`); return null; }
    return supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
  } catch (e) { process.stdout.write(`[ERR]`); return null; }
}

// 名前抽出: "楓(かえで)" → "楓" / "ここ" → "ここ"
function extractName(alt) {
  return alt.split('(')[0].split('（')[0].trim();
}

async function processShop(baseUrl, urlPart, prefix) {
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`取得: ${baseUrl}`);

  const html = await (await fetch(baseUrl, {
    headers: { 'User-Agent': UA, Referer: baseUrl },
    signal: AbortSignal.timeout(20000),
  })).text();
  const $ = cheerio.load(html);

  // /photos/{id}/raw_{id}.jpg パターン
  const nameImageMap = new Map(); // name → {url, photoId}
  $('img[src*="/photos/"]').each((_, el) => {
    const src = $(el).attr('src') || '';
    const alt = ($(el).attr('alt') || '').trim();
    if (!alt || !src.match(/\/photos\/\d+\/raw_\d+/)) return;
    // ロゴ・バナー除外
    if (src.includes('logo') || src.includes('banner') || src.includes('bnr')) return;

    const photoId = src.match(/\/photos\/(\d+)\//)?.[1];
    if (!photoId) return;

    const name = extractName(alt);
    if (!name || name.length < 1 || name.length > 10) return;

    if (!nameImageMap.has(name)) nameImageMap.set(name, { url: src, photoId });
  });

  console.log(`サイトから取得: ${nameImageMap.size}名`);

  // DB: 対象店舗 + 写真なし
  const { data: shops } = await supabase.from('shops').select('id, name').ilike('website_url', `%${urlPart}%`);
  if (!shops?.length) { console.log('店舗なし'); return; }
  console.log(`対象店舗: ${shops.map(s => s.name).join(', ')}`);
  const shopIds = shops.map(s => s.id);

  const { data: nullT } = await supabase.from('therapists')
    .select('id, name, shop_id, image_url')
    .in('shop_id', shopIds)
    .is('image_url', null);

  if (!nullT?.length) { console.log('写真なしなし'); return; }
  console.log(`DB写真なし: ${nullT.length}名`);

  const matched = nullT.filter(t => nameImageMap.has(t.name));
  const notFoundList = nullT.filter(t => !nameImageMap.has(t.name));
  console.log(`マッチ: ${matched.length}名 / 未マッチ: ${notFoundList.length}名`);
  if (notFoundList.length > 0) console.log(`未マッチ: ${notFoundList.map(t => t.name).join('、')}`);

  if (DRY_RUN) {
    matched.slice(0, 5).forEach(t => {
      const info = nameImageMap.get(t.name);
      console.log(`  ✅ ${t.name} → photoId=${info.photoId}`);
    });
    return;
  }

  let updated = 0, notFound = 0, failed = 0;
  const processed = new Set();

  for (const t of nullT) {
    const info = nameImageMap.get(t.name);
    if (!info) { process.stdout.write('?'); notFound++; continue; }

    let storageUrl;
    if (processed.has(t.name)) {
      const { data: sib } = await supabase.from('therapists')
        .select('image_url').in('shop_id', shopIds).eq('name', t.name).not('image_url', 'is', null).limit(1);
      storageUrl = sib?.[0]?.image_url ?? info.url;
    } else {
      processed.add(t.name);
      const ext = (info.url.match(/\.(jpe?g|png|gif|webp)/i)?.[1] || 'jpg').toLowerCase();
      const safeExt = ext === 'jpeg' ? 'jpg' : ext;
      const fileName = `${prefix}_photo_${info.photoId}.${safeExt}`;
      storageUrl = await uploadImage(info.url, fileName, baseUrl);
      await sleep(120);
    }

    const { error } = await supabase.from('therapists')
      .update({ image_url: storageUrl ?? info.url })
      .eq('id', t.id);
    if (error) { console.log(`\n❌ ${t.name}: ${error.message}`); failed++; }
    else { process.stdout.write(storageUrl ? '+' : '.'); updated++; }
    await sleep(80);
  }

  console.log(`\n更新 ${updated}件 / 未マッチ ${notFound}件 / 失敗 ${failed}件`);
}

await processShop('https://leonspa-gold.com/', 'leonspa-gold', 'leon_gold');
await processShop('https://leonspa.net/', 'leonspa.net', 'leon_spa');

console.log('\n完了');
