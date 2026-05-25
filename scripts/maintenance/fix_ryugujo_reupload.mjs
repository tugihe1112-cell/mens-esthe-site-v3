/**
 * 竜宮城 セラピスト写真 ファイル名衝突修正・再アップロード
 *
 * 【問題】
 * uploadImage() で therapistId.replace(/[^\w-]/g, '_') としていたため
 * 日本語名が全部 _ に変換され、同じ文字数の名前が同一ファイル名になって
 * upsert: true で上書き → 複数のセラピストが同じ写真を指す状態になっていた
 *
 * 【修正方針】
 * ソース画像URLのファイル名（IMG_2644.jpg など）をそのままストレージ名に使う
 * → 各セラピストの写真ファイルは固有名なので衝突しない
 *
 * 処理フロー:
 * 1. キャストページをスクレイプして 名前→sourceUrl マップを構築
 * 2. 人形町店の全セラピストを正しいファイル名で再アップロード
 * 3. 他4店舗を人形町店の新URLで更新（名前で紐付け）
 *
 * 実行: node scripts/maintenance/fix_ryugujo_reupload.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const BUCKET = 'therapist-images';
const NINGYOCHO_ID = 'tokyo_chuo_ningyocho_ryugujo';
const OTHER_SHOPS = [
  'tokyo_chuo_ginza_ryugujo',
  'shizuoka_numazu_ryugujo',
  'tokyo_koto_monzennakacho_ryugujo',
  'tokyo_ota_kamata_ryugujo',
];
const BASE = 'https://esthe-ryugujo.com';
const UA = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Referer': 'https://esthe-ryugujo.com/',
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (DRY_RUN) console.log('[DRY RUN]\n');

// ─── STEP 1: キャストページをスクレイプ ───────────────────────────────────────
console.log('キャストページ取得中...');
const castRes = await fetch(`${BASE}/cast/`, { headers: UA, signal: AbortSignal.timeout(20000) });
const html = await castRes.text();
const $ = cheerio.load(html);

// 名前 → 元サイト画像URL マップ
const scrapeMap = new Map(); // name → wp-content URL
$('li.therapist-box').each((_, li) => {
  const img = $(li).find('.photo > a > img');
  const name = img.attr('alt')?.trim();
  let src = img.attr('src') || '';
  if (!name || !src.includes('wp-content/uploads')) return;
  if (!src.startsWith('http')) src = `${BASE}${src}`;
  scrapeMap.set(name, src);
});
console.log(`スクレイプ取得: ${scrapeMap.size}名\n`);

if (scrapeMap.size === 0) {
  console.error('キャストページ取得失敗。中断します。');
  process.exit(1);
}

// ─── ファイル名生成（衝突しない方法）────────────────────────────────────────
function makeFileName(sourceUrl) {
  // URLからベースネームを取得: .../IMG_2644-scaled.jpeg → IMG_2644-scaled.jpeg
  const base = sourceUrl.split('/').pop().split('?')[0];
  // 拡張子を正規化
  const ext = (base.match(/\.(jpg|jpeg|png|gif|webp)$/i)?.[1] || 'jpg').toLowerCase();
  const safeExt = ext === 'jpeg' ? 'jpg' : ext;
  // ベースネームから拡張子を除いた部分を安全化
  const stem = base.replace(/\.[^.]+$/, '').replace(/[^\w-]/g, '_');
  return `${stem}.${safeExt}`;
}

// ─── 画像アップロード ────────────────────────────────────────────────────────
async function uploadImage(sourceUrl) {
  try {
    const res = await fetch(sourceUrl, { headers: UA, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/') || ct.includes('svg')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 512) return null;

    const fileName = makeFileName(sourceUrl);
    const ext = fileName.split('.').pop();
    const contentType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

    const { error } = await supabase.storage.from(BUCKET)
      .upload(fileName, buf, { contentType, upsert: true });
    if (error) { console.error(`  Storage エラー: ${error.message}`); return null; }

    return supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
  } catch (e) {
    console.error(`  例外: ${e.message}`);
    return null;
  }
}

// ─── STEP 2: 人形町店を再アップロード ────────────────────────────────────────
console.log('=== STEP 2: 人形町店 再アップロード ===');
const { data: ningyochoTherapists } = await supabase
  .from('therapists').select('id, name, image_url').eq('shop_id', NINGYOCHO_ID);

console.log(`人形町店: ${ningyochoTherapists?.length || 0}名`);

// 新しい 名前→Storage URL マップ（他店舗の更新用）
const newStorageMap = new Map();

let uploaded = 0, reused = 0, notFound = 0;

for (const t of (ningyochoTherapists || [])) {
  const sourceUrl = scrapeMap.get(t.name);

  if (!sourceUrl) {
    // キャストページに名前がない（削除済みキャスト等）→ 現状維持
    console.log(`  [スキップ] ${t.name} — キャストページ未掲載`);
    if (t.image_url?.includes('supabase')) newStorageMap.set(t.name, t.image_url);
    notFound++;
    continue;
  }

  const expectedFileName = makeFileName(sourceUrl);
  const expectedStorageUrl = supabase.storage.from(BUCKET).getPublicUrl(expectedFileName).data.publicUrl;

  // すでに正しいファイル名でアップ済みかチェック
  if (t.image_url === expectedStorageUrl) {
    process.stdout.write('=');
    newStorageMap.set(t.name, expectedStorageUrl);
    reused++;
    continue;
  }

  if (DRY_RUN) {
    const fn = makeFileName(sourceUrl);
    console.log(`  [再アップ] ${t.name}`);
    console.log(`    現在: ${t.image_url?.slice(-40) || 'null'}`);
    console.log(`    新規: ${fn} ← ${sourceUrl.slice(-40)}`);
    newStorageMap.set(t.name, expectedStorageUrl); // dry-run でも次STEPのため登録
    uploaded++;
    continue;
  }

  // 再アップロード
  const newUrl = await uploadImage(sourceUrl);
  if (newUrl) {
    const { error } = await supabase.from('therapists').update({ image_url: newUrl }).eq('id', t.id);
    if (error) {
      process.stdout.write('x');
    } else {
      process.stdout.write('+');
      newStorageMap.set(t.name, newUrl);
      uploaded++;
    }
  } else {
    process.stdout.write('!');
    notFound++;
  }
  await sleep(80);
}

if (!DRY_RUN) process.stdout.write('\n');
console.log(`人形町店: 再アップ ${uploaded}名 / スキップ(正常) ${reused}名 / 未掲載 ${notFound}名\n`);

// ─── STEP 3: 他4店舗を新URLで更新 ────────────────────────────────────────────
console.log('=== STEP 3: 他4店舗 URL更新 ===');
console.log(`新 Storage マップ: ${newStorageMap.size}名\n`);

let totalUpdated = 0, totalSkipped = 0;

for (const shopId of OTHER_SHOPS) {
  console.log(`--- ${shopId} ---`);
  const { data: therapists } = await supabase
    .from('therapists').select('id, name, image_url').eq('shop_id', shopId);

  let updated = 0, skipped = 0, missing = 0;

  for (const t of (therapists || [])) {
    const correctUrl = newStorageMap.get(t.name);

    if (!correctUrl) {
      // 人形町店に同名がいない → 変更なし
      missing++;
      continue;
    }

    if (t.image_url === correctUrl) {
      // すでに正しいURL
      skipped++;
      continue;
    }

    if (DRY_RUN) {
      if (t.image_url !== correctUrl) {
        console.log(`  [更新予定] ${t.name}`);
        console.log(`    現在: ${t.image_url?.slice(-50) || 'null'}`);
        console.log(`    新規: ${correctUrl.slice(-50)}`);
      }
      updated++;
      continue;
    }

    const { error } = await supabase.from('therapists').update({ image_url: correctUrl }).eq('id', t.id);
    if (error) {
      process.stdout.write('x');
    } else {
      process.stdout.write('.');
      updated++;
    }
  }

  if (!DRY_RUN) process.stdout.write('\n');
  console.log(`  更新: ${updated}名 / スキップ(正常): ${skipped}名 / 人形町マップ外: ${missing}名`);
  totalUpdated += updated;
  totalSkipped += skipped;
}

console.log(`\n=== 完了 ===`);
console.log(`他4店舗 合計: 更新 ${totalUpdated}名 / スキップ ${totalSkipped}名`);
