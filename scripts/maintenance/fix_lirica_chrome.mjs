/**
 * LIRICA OSAKA セラピスト写真修正（Chrome DOM抽出データ使用）
 * defcon URL: https://lirica-osaka.com/def/con?p=upload/cast/thumb_{id}.jpg
 * back URL:   https://lirica-osaka.com/back_image/54.jpg
 * 実行: node scripts/maintenance/fix_lirica_chrome.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const BUCKET = 'therapist-images';
const BASE = 'https://lirica-osaka.com';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (DRY_RUN) console.log('[DRY RUN]\n');

// Chrome DOM抽出データ（window._liricaData から取得、imgPath ありのみ）
const LIRICA_DATA = [
  ['谷本れいか', `${BASE}/back_image/54.jpg`],
  ['星乃るる', `${BASE}/def/con?p=upload/cast/thumb_577.jpg`],
  ['愛舞みぃ', `${BASE}/def/con?p=upload/cast/thumb_249.jpg`],
  ['ゆずりはいのり', `${BASE}/def/con?p=upload/cast/thumb_142.jpg`],
  ['蒼井そら', `${BASE}/def/con?p=upload/cast/thumb_539.jpg`],
  ['京楽ゆら', `${BASE}/def/con?p=upload/cast/thumb_356.jpg`],
  ['かんな', `${BASE}/def/con?p=upload/cast/thumb_479.jpg`],
  ['中島あい', `${BASE}/def/con?p=upload/cast/thumb_196.jpg`],
  ['晴ノ日さくら', `${BASE}/def/con?p=upload/cast/thumb_268.jpg`],
  ['天羽ゆの', `${BASE}/def/con?p=upload/cast/thumb_424.jpg`],
  ['野々花なのか', `${BASE}/def/con?p=upload/cast/thumb_273.jpg`],
  ['青葉るり', `${BASE}/def/con?p=upload/cast/thumb_411.jpg`],
  ['木崎さき', `${BASE}/def/con?p=upload/cast/thumb_405.jpg`],
  ['冨松はるな', `${BASE}/def/con?p=upload/cast/thumb_352.jpg`],
  ['ち-', `${BASE}/def/con?p=upload/cast/thumb_477.jpg`],
  ['ヒストリア', `${BASE}/def/con?p=upload/cast/thumb_478.jpg`],
  ['間宮みや', `${BASE}/def/con?p=upload/cast/thumb_355.jpg`],
  ['七瀬なな', `${BASE}/def/con?p=upload/cast/thumb_172.jpg`],
  ['美愛乃えみ', `${BASE}/def/con?p=upload/cast/thumb_473.jpg`],
  ['瀬木きせき', `${BASE}/def/con?p=upload/cast/thumb_491.jpg`],
  ['きほ', `${BASE}/def/con?p=upload/cast/thumb_494.jpg`],
  ['いちの聖', `${BASE}/def/con?p=upload/cast/thumb_523.jpg`],
  ['三上りお', `${BASE}/def/con?p=upload/cast/thumb_212.jpg`],
  ['真冬虹まゆき', `${BASE}/def/con?p=upload/cast/thumb_267.jpg`],
  ['白石莉奈', `${BASE}/def/con?p=upload/cast/thumb_524.jpg`],
  ['うみ', `${BASE}/def/con?p=upload/cast/thumb_520.jpg`],
  ['真城せりな', `${BASE}/def/con?p=upload/cast/thumb_514.jpg`],
  ['愛川おとは', `${BASE}/def/con?p=upload/cast/thumb_525.jpg`],
  ['高砂りんご', `${BASE}/def/con?p=upload/cast/thumb_528.jpg`],
  ['千早ちはる', `${BASE}/def/con?p=upload/cast/thumb_364.jpg`],
  ['立花みさ', `${BASE}/def/con?p=upload/cast/thumb_486.jpg`],
  ['神木玲', `${BASE}/def/con?p=upload/cast/thumb_420.jpg`],
];

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
    const ext = ct.includes('png') ? 'png' : ct.includes('webp') ? 'webp' : 'jpg';
    const { error } = await supabase.storage.from(BUCKET)
      .upload(fileName, buf, { contentType: ct, upsert: true });
    if (error) { process.stdout.write(`[E]`); return null; }
    return supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
  } catch (e) { process.stdout.write(`[ERR]`); return null; }
}

// DB取得
const { data: shops } = await supabase.from('shops').select('id, name').ilike('website_url', '%lirica-osaka%');
if (!shops?.length) { console.log('店舗なし'); process.exit(1); }
console.log(`対象店舗: ${shops.map(s => s.name).join(', ')}`);
const shopIds = shops.map(s => s.id);

const { data: nullT } = await supabase.from('therapists')
  .select('id, name, shop_id, image_url')
  .in('shop_id', shopIds)
  .is('image_url', null);

console.log(`DB写真なし: ${nullT?.length ?? 0}名`);

// nameImageMap 作成
const nameImageMap = new Map(LIRICA_DATA);

function findMatch(dbName) {
  if (nameImageMap.has(dbName)) return nameImageMap.get(dbName);
  // スペース除去マッチ
  const noSpace = dbName.replace(/[\s　]/g, '');
  for (const [siteName, url] of nameImageMap) {
    if (siteName.replace(/[\s　]/g, '') === noSpace) return url;
    if (siteName.endsWith(dbName) && dbName.length >= 2) return url;
    if (dbName.endsWith(siteName) && siteName.length >= 2) return url;
  }
  return null;
}

if (DRY_RUN) {
  console.log('\n[マッチング確認]');
  const matched = (nullT || []).filter(t => findMatch(t.name));
  const notFoundList = (nullT || []).filter(t => !findMatch(t.name));
  console.log(`マッチ: ${matched.length}名`);
  matched.forEach(t => console.log(`  ✅ "${t.name}"`));
  console.log(`未マッチ: ${notFoundList.length}名`);
  notFoundList.forEach(t => console.log(`  ❓ "${t.name}"`));
  process.exit(0);
}

// 更新
let updated = 0, notFound = 0, failed = 0;
const processedUrls = new Map();

for (const t of nullT || []) {
  const imageUrl = findMatch(t.name);
  if (!imageUrl) { process.stdout.write('?'); notFound++; continue; }

  let storageUrl;
  if (processedUrls.has(imageUrl)) {
    storageUrl = processedUrls.get(imageUrl);
  } else {
    // ファイル名: castIdから生成
    const thumbMatch = imageUrl.match(/thumb_(\d+)/);
    const backMatch = imageUrl.match(/back_image\/(\d+)/);
    const id = thumbMatch?.[1] || backMatch?.[1] || Date.now();
    const fileName = `lirica_${id}.jpg`;
    storageUrl = await uploadImage(imageUrl, fileName);
    processedUrls.set(imageUrl, storageUrl);
    await sleep(150);
  }

  const { error } = await supabase.from('therapists')
    .update({ image_url: storageUrl ?? imageUrl })
    .eq('id', t.id);
  if (error) { console.log(`\n❌ ${t.name}: ${error.message}`); failed++; }
  else { process.stdout.write(storageUrl ? '+' : '.'); updated++; }
  await sleep(80);
}

console.log(`\n\n更新 ${updated}件 / 未マッチ ${notFound}件 / 失敗 ${failed}件`);
console.log('完了');
