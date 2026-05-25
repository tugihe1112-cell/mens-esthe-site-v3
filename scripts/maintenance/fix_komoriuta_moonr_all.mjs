/**
 * ミセスの子守唄・ミセスムーンR (大阪・兵庫) 写真一括修正
 * キャストページ: /gals/ → wcms/gals/images/{id}/ パターン
 *
 * 子守唄: alt="名前【読み】" → 名前は【の前
 * ムーンR: alt="名前" (平仮名のみ)
 *
 * 実行: node scripts/maintenance/fix_komoriuta_moonr_all.mjs [--dry-run]
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

async function fetchHtml(url, referer) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Referer: referer || url },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.text();
}

async function uploadImage(imageUrl, fileName, referer) {
  try {
    const res = await fetch(imageUrl, {
      headers: { 'User-Agent': UA, Referer: referer },
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
    if (error) { process.stdout.write(`[E:${error.message.slice(0,20)}]`); return null; }
    return supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
  } catch (e) { process.stdout.write(`[ERR]`); return null; }
}

/**
 * /gals/ ページからセラピスト名と画像URLを抽出
 * @param {string} galsUrl  例: https://mrs-komoriuta.com/gals/
 * @param {string} nameMode 'bracket'=名前【読み】形式 / 'plain'=altそのまま
 */
async function scrapeGalsPage(galsUrl, nameMode) {
  const html = await fetchHtml(galsUrl, galsUrl.replace('/gals/', '/'));
  const $ = cheerio.load(html);
  const map = new Map(); // name → imageUrl (絶対URL)
  const base = new URL(galsUrl).origin;

  // data-original (lazy load) で wcms/gals を取得
  $('img[data-original*="/wcms/gals/images/"]').each((_, el) => {
    const src = $(el).attr('data-original') || '';
    let alt = ($(el).attr('alt') || '').trim();
    if (!alt || !src) return;

    // no_image や空を除外
    if (src.includes('no_image') || src.includes('np.jpg') || src.includes('np_')) return;

    // 名前抽出
    let name;
    if (nameMode === 'bracket') {
      // "名前【読み】" → 名前（子守唄）
      name = alt.split('【')[0].trim();
    } else if (nameMode === 'fullwidth') {
      // "唯月　ゆづき" → 唯月（ムーンR兵庫: 全角スペース区切り）
      name = alt.split('　')[0].trim();
    } else {
      // plain: altそのまま（ムーンR大阪: 平仮名のみ）
      // "和希　かずき" のように全角スペース+読みが含まれる場合、両方登録
      name = alt.replace(/セラピ.*$/, '').trim();
    }

    if (!name || name.length < 2 || name.length > 10) return;
    if (/キャンペーン|お知らせ|ランキング|スケジュール/.test(name)) return;

    // 画像URLを絶対パスに（data-original は相対パスの場合が多い）
    const imgUrl = src.startsWith('http') ? src : base + (src.startsWith('/') ? src : '/' + src);
    if (!map.has(name)) map.set(name, imgUrl);

    // 全角スペース区切りの場合、漢字部分・読み部分の両方を登録（かずき/和希 問題対策）
    if (name.includes('　')) {
      const parts = name.split('　');
      for (const part of parts) {
        const p = part.trim();
        if (p && p.length >= 2 && !map.has(p)) map.set(p, imgUrl);
      }
    }
  });

  return map;
}

/**
 * 店舗の写真なしセラピストを更新
 */
async function processShop(urlPart, galsUrl, nameMode, prefix) {
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`取得: ${galsUrl}`);

  // サイトから名前→画像URL取得
  let nameImageMap;
  try {
    nameImageMap = await scrapeGalsPage(galsUrl, nameMode);
  } catch (e) {
    console.log(`❌ 取得失敗: ${e.message}`);
    return;
  }
  console.log(`サイトから取得: ${nameImageMap.size}名`);
  if (DRY_RUN) {
    for (const [n, u] of nameImageMap) {
      console.log(`  ${n} → ...${u.slice(-50)}`);
    }
  }

  // DB: 対象店舗 + 写真なしセラピスト
  const { data: shops } = await supabase.from('shops').select('id, name').ilike('website_url', `%${urlPart}%`);
  if (!shops?.length) { console.log(`  → 店舗が見つかりません (${urlPart})`); return; }
  console.log(`対象店舗: ${shops.map(s => s.name).join(', ')}`);
  const shopIds = shops.map(s => s.id);

  const { data: nullT } = await supabase.from('therapists')
    .select('id, name, shop_id, image_url')
    .in('shop_id', shopIds)
    .is('image_url', null);

  if (!nullT?.length) { console.log('  → 写真なしセラピストなし'); return; }
  console.log(`DB写真なし: ${nullT.length}名`);

  // マッチング確認
  const matched = nullT.filter(t => nameImageMap.has(t.name));
  const notFoundList = nullT.filter(t => !nameImageMap.has(t.name));
  console.log(`マッチ: ${matched.length}名 / 未マッチ: ${notFoundList.length}名`);
  if (notFoundList.length > 0 && notFoundList.length <= 20) {
    console.log(`未マッチ名: ${notFoundList.map(t => t.name).join('、')}`);
  }

  if (DRY_RUN) return;

  // 更新（同一名前の複数店舗対応）
  const processedNames = new Set();
  let updated = 0, notFound = 0, failed = 0;

  for (const t of nullT) {
    const imageUrl = nameImageMap.get(t.name);
    if (!imageUrl) { process.stdout.write('?'); notFound++; continue; }

    // 同一名前は1回だけアップロード
    let storageUrl;
    if (processedNames.has(t.name)) {
      // すでにアップロード済み → DBから取得
      const { data: sibling } = await supabase.from('therapists')
        .select('image_url').in('shop_id', shopIds).eq('name', t.name).not('image_url', 'is', null).limit(1);
      storageUrl = sibling?.[0]?.image_url ?? imageUrl;
    } else {
      processedNames.add(t.name);
      const galsId = imageUrl.match(/\/gals\/images\/(\d+)\//)?.[1] || t.name;
      const ext = (imageUrl.match(/\.(jpe?g|png|gif|webp)/i)?.[1] || 'jpg').toLowerCase();
      const safeExt = ext === 'jpeg' ? 'jpg' : ext;
      const fileName = `${prefix}_${galsId}.${safeExt}`;
      storageUrl = await uploadImage(imageUrl, fileName, galsUrl.replace('/gals/', '/'));
      await sleep(120);
    }

    const { error } = await supabase.from('therapists')
      .update({ image_url: storageUrl ?? imageUrl })
      .eq('id', t.id);
    if (error) { console.log(`\n❌ ${t.name}: ${error.message}`); failed++; }
    else { process.stdout.write(storageUrl ? '+' : '.'); updated++; }
    await sleep(80);
  }

  console.log(`\n更新 ${updated}件 / 未マッチ ${notFound}件 / 失敗 ${failed}件`);
}

// ─── 実行 ──────────────────────────────────────────────────────────
// 子守唄: /list/profile?uid= パターン → galsページURLは /gals/
await processShop(
  'komoriuta',
  'https://mrs-komoriuta.com/gals/',
  'bracket',   // alt="名前【読み】"
  'komoriuta'
);

// ムーンR 大阪
await processShop(
  'moonr.jp',
  'https://www.moonr.jp/gals/',
  'plain',     // alt="名前"
  'moonr_osaka'
);

// ムーンR 兵庫
await processShop(
  'moor-kobe',
  'https://moor-kobe.jp/gals/',
  'fullwidth',  // alt="唯月　ゆづき" (全角スペース+読み仮名)
  'moonr_hyogo'
);

console.log('\n\n全処理完了');
