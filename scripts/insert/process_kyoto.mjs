/**
 * 京都 一括処理
 * 1. クイーンズプレミアム 削除
 * 2. 旧ID 1184_1〜5 削除
 * 3. Pure White: price_system更新 + /cast/ セラピスト画像更新
 * 4. ゆりかご 京都: URL/price設定 + /therapist/ セラピスト挿入
 *
 * 実行: node scripts/insert/process_kyoto.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const ua = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function uploadImage(imageUrl, therapistId) {
  try {
    const res = await fetch(imageUrl, { headers: { 'User-Agent': ua['User-Agent'] }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 512) return null;
    const ext = (imageUrl.match(/\.(jpg|jpeg|png|gif|webp)/i)?.[1] || 'jpg').toLowerCase();
    const safeExt = ext === 'jpeg' ? 'jpg' : ext;
    const safeId = therapistId.replace(/[^\w-]/g, '_');
    const fileName = `${safeId}.${safeExt}`;
    const { error } = await supabase.storage.from('therapist-images')
      .upload(fileName, buf, { contentType: `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}`, upsert: true });
    if (error) throw error;
    return supabase.storage.from('therapist-images').getPublicUrl(fileName).data.publicUrl;
  } catch { return null; }
}

async function uploadShopLogo(imageUrl, shopId) {
  try {
    const res = await fetch(imageUrl, { headers: { 'User-Agent': ua['User-Agent'] }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 512) return null;
    const ext = (imageUrl.match(/\.(jpg|jpeg|png|gif|webp)/i)?.[1] || 'jpg').toLowerCase();
    const safeExt = ext === 'jpeg' ? 'jpg' : ext;
    const { error } = await supabase.storage.from('shop-logos')
      .upload(`${shopId}.${safeExt}`, buf, { contentType: `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}`, upsert: true });
    if (error) throw error;
    return supabase.storage.from('shop-logos').getPublicUrl(`${shopId}.${safeExt}`).data.publicUrl;
  } catch { return null; }
}

// ============================================================
// 1. クイーンズプレミアム 削除
// ============================================================
console.log('=== 1. クイーンズプレミアム 削除 ===');
const QUEENS_ID = 'kyoto_kyoto_station_queens_premium';
if (!DRY_RUN) {
  await supabase.from('therapists').delete().eq('shop_id', QUEENS_ID);
  const { error } = await supabase.from('shops').delete().eq('id', QUEENS_ID);
  console.log(error ? `❌ ${error.message}` : `✅ 削除完了: ${QUEENS_ID}`);
} else {
  console.log(`  [DRY] 削除予定: ${QUEENS_ID}`);
}

// ============================================================
// 2. 旧ID削除
// ============================================================
console.log('\n=== 2. 旧ID削除 ===');
const OLD_IDS = ['1184_1','1184_2','1184_3','1184_4','1184_5'];
for (const id of OLD_IDS) {
  const { data } = await supabase.from('shops').select('id').eq('id', id).maybeSingle();
  if (!data) { console.log(`  スキップ(存在しない): ${id}`); continue; }
  if (!DRY_RUN) {
    await supabase.from('therapists').delete().eq('shop_id', id);
    await supabase.from('shops').delete().eq('id', id);
    console.log(`  ✅ 削除: ${id}`);
  } else {
    console.log(`  [DRY] 削除予定: ${id}`);
  }
}

// ============================================================
// 3. Pure White price_system更新 + セラピスト画像
// ============================================================
console.log('\n=== 3. Pure White ===');
const PW_ID = 'kyoto_senbon_sanjo_pure_white';
const PW_PRICE = { "60": 12000, "75": 14000, "90": 16000, "105": 18000, "120": 20000 };

if (!DRY_RUN) {
  const { error } = await supabase.from('shops').update({ price_system: PW_PRICE }).eq('id', PW_ID);
  console.log(error ? `❌ price_system更新失敗` : `✅ price_system: ${JSON.stringify(PW_PRICE)}`);
} else {
  console.log(`  [DRY] price: ${JSON.stringify(PW_PRICE)}`);
}

// /cast/ ページからセラピスト画像取得
console.log('  /cast/ 画像取得中...');
const pwRes = await fetch('https://purewhite-aroma.com/cast/', { headers: ua });
const pwHtml = await pwRes.text();
const $pw = cheerio.load(pwHtml);

// DBの全セラピストを名前→IDマップに
const { data: pwTherapists } = await supabase.from('therapists').select('id,name,image_url').eq('shop_id', PW_ID);
const pwNameToId = {};
for (const t of (pwTherapists || [])) pwNameToId[t.name] = t.id;

let pwUpdated = 0, pwNotFound = 0;
const pwSeen = new Set();

$pw('img[alt*="Pure White"]').each((_, el) => {
  const alt = $pw(el).attr('alt') || '';
  const src = $pw(el).attr('src') || '';
  if (!src || !src.includes('upload/cast/')) return;

  // alt: "Pure White (ピュアホワイト) 朝陽　あお" → "朝陽　あお"
  const nameMatch = alt.match(/\)\s+(.+)$/);
  if (!nameMatch) return;
  const name = nameMatch[1].trim();
  if (pwSeen.has(name)) return;
  pwSeen.add(name);

  const therapistId = pwNameToId[name];
  if (!therapistId) { pwNotFound++; return; }

  const fullSrc = src.startsWith('http') ? src : `https://purewhite-aroma.com${src}`;

  if (DRY_RUN) {
    console.log(`  [DRY] ${name} → ${fullSrc.slice(0, 70)}`);
    return;
  }

  // 非同期で処理するために配列に積む
  (async () => {
    const stored = await uploadImage(fullSrc, therapistId);
    const { error } = await supabase.from('therapists').update({ image_url: stored || fullSrc }).eq('id', therapistId);
    if (!error) pwUpdated++;
  })();
});

if (!DRY_RUN) {
  await sleep(5000); // 非同期アップロード待ち
  // 正確なカウントは後で確認
  console.log(`  ✅ 画像更新処理完了 (${pwSeen.size}名対象, ${pwNotFound}名DB不一致)`);
} else {
  console.log(`  対象: ${pwSeen.size}名, DB不一致: ${pwNotFound}名`);
}

// ============================================================
// 4. ゆりかご 京都
// ============================================================
console.log('\n=== 4. ゆりかご 京都 ===');
const YK_ID = 'shiga_otsu_station_yurikago';
const YK_PRICE = { "70": 13000, "90": 15000, "120": 19000, "150": 23000, "180": 27000 };
const YK_BASE = 'https://yurikago-kyoto.com';

if (!DRY_RUN) {
  const { error } = await supabase.from('shops').update({
    website_url: YK_BASE,
    schedule_url: `${YK_BASE}/schedule/`,
    price_system: YK_PRICE,
  }).eq('id', YK_ID);
  console.log(error ? `❌ 基本情報更新失敗` : `✅ URL/price設定完了`);
}

// 店舗画像 (OGP)
const ykTopRes = await fetch(YK_BASE, { headers: ua }).catch(() => null);
if (ykTopRes?.ok) {
  const ykTopHtml = await ykTopRes.text();
  const $yk0 = cheerio.load(ykTopHtml);
  const ogImg = $yk0('meta[property="og:image"]').attr('content');
  if (ogImg && !DRY_RUN) {
    const fullOgp = ogImg.startsWith('http') ? ogImg : new URL(ogImg, YK_BASE).href;
    const stored = await uploadShopLogo(fullOgp, YK_ID);
    if (stored) {
      await supabase.from('shops').update({ image_url: stored }).eq('id', YK_ID);
      console.log(`  ✅ 店舗画像: ${stored}`);
    } else {
      console.log(`  ⚠️ 店舗画像アップロード失敗: ${ogImg}`);
    }
  } else if (ogImg) {
    console.log(`  [DRY] og:image: ${ogImg}`);
  }
}

// /therapist/ WordPress スクレイプ
const ykRes = await fetch(`${YK_BASE}/therapist/`, { headers: ua });
const ykHtml = await ykRes.text();
const $yk = cheerio.load(ykHtml);

// 既存セラピスト削除
const { count: ykExisting } = await supabase.from('therapists').select('id', { count: 'exact', head: true }).eq('shop_id', YK_ID);
if (ykExisting > 0 && !DRY_RUN) {
  await supabase.from('therapists').delete().eq('shop_id', YK_ID);
  console.log(`  既存 ${ykExisting}名 削除`);
}

const ykTherapists = [];
const ykSeen = new Set();

$yk('img[alt]').each((_, el) => {
  const alt = $yk(el).attr('alt') || '';
  const src = $yk(el).attr('src') || $yk(el).attr('data-src') || '';
  if (!src || !src.includes('wp-content/uploads')) return;

  // alt: "晴嵐（せいらん）5/3デビュー" → name = "晴嵐"
  const nameMatch = alt.match(/^([ぁ-んァ-ヾ一-龯々]{1,10})[（(「\s]/);
  if (!nameMatch) return;
  const name = nameMatch[1].trim();
  if (ykSeen.has(name) || !name) return;
  ykSeen.add(name);

  const fullSrc = src.startsWith('http') ? src : `${YK_BASE}${src}`;
  ykTherapists.push({ name, imgSrc: fullSrc });
});

console.log(`  取得: ${ykTherapists.length}名`);
ykTherapists.slice(0, 5).forEach(t => console.log(`    ${t.name} 📷`));
if (ykTherapists.length > 5) console.log(`    ...他${ykTherapists.length - 5}名`);

if (!DRY_RUN && ykTherapists.length > 0) {
  let ykInserted = 0;
  process.stdout.write('  挿入中: ');
  for (const t of ykTherapists) {
    const therapistId = `${YK_ID}_${t.name}`;
    const stored = await uploadImage(t.imgSrc, therapistId);
    const { error } = await supabase.from('therapists').upsert({
      id: therapistId, shop_id: YK_ID, name: t.name,
      age: null, height: null, cup: null,
      image_url: stored || t.imgSrc,
    });
    if (!error) { ykInserted++; process.stdout.write('.'); }
    else process.stdout.write('x');
    await sleep(100);
  }
  console.log(`\n  ✅ 挿入: ${ykInserted}/${ykTherapists.length}名`);
} else if (DRY_RUN) {
  console.log('  [DRY RUN]');
}

console.log('\n完了');
