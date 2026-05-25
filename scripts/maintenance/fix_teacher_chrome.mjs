/**
 * 女教師の秘め事 セラピスト写真修正（Chrome DOM抽出データ使用）
 * パターン: /photos/{id}/{timestamp}-{filename}.{ext}
 * 実行: node scripts/maintenance/fix_teacher_chrome.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const BUCKET = 'therapist-images';
const BASE = 'https://teachersecret2025.com';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (DRY_RUN) console.log('[DRY RUN]\n');

// Chrome DOM抽出データ（teachersecret2025.com/girl から取得）
// alt: "苗字 名前" 形式（半角スペース区切り）
const TEACHER_DATA = [
  ['小川 ひなの', 'https://teachersecret2025.com/photos/55/20260421222514-ogawa01.jpg'],
  ['花宮 瑠々', 'https://teachersecret2025.com/photos/53/20260419081344-ChatGPT%20Image%202026%E5%B9%B44%E6%9C%8818%E6%97%A5%2020_18_44.jpg'],
  ['二宮 旭', 'https://teachersecret2025.com/photos/50/20260418190351-ChatGPT%20Image%202026%E5%B9%B44%E6%9C%8818%E6%97%A5%2019_03_26.png'],
  ['岡田 紗羅', 'https://teachersecret2025.com/photos/49/20260418201326-ChatGPT%20Image%202026%E5%B9%B44%E6%9C%8818%E6%97%A5%2020_11_33.png'],
  ['東雲 桃南', 'https://teachersecret2025.com/photos/46/20260418185346-ChatGPT%20Image%202026%E5%B9%B44%E6%9C%8818%E6%97%A5%2018_25_31.png'],
  ['星乃 綺羅々', 'https://teachersecret2025.com/photos/39/20260418191326-ChatGPT%20Image%202026%E5%B9%B44%E6%9C%8818%E6%97%A5%2019_13_15.png'],
  ['松島 琉璃', 'https://teachersecret2025.com/photos/36/20250814173428-abe13.jpg'],
  ['根本 莉愛', 'https://teachersecret2025.com/photos/33/20260418193801-ChatGPT%20Image%202026%E5%B9%B44%E6%9C%8818%E6%97%A5%2019_37_03.png'],
  ['西宮 七星', 'https://teachersecret2025.com/photos/14/20250321124052-nisimiya08.jpg'],
  ['倉持 理恵', 'https://teachersecret2025.com/photos/4/20250326132716-kuramoti14.jpg'],
  ['小峰 絵梨', 'https://teachersecret2025.com/photos/8/20250321124327-komine13.jpg'],
  ['渡邊 美桜', 'https://teachersecret2025.com/photos/5/20241229181949-watanabe11.jpg'],
  ['江野 愛理', 'https://teachersecret2025.com/photos/11/20241231160932-eno12.jpg'],
  ['橘 一華', 'https://teachersecret2025.com/photos/6/20241228024320-tatibana11.jpg'],
  ['矢澤 光', 'https://teachersecret2025.com/photos/2/20250401185228-yazawa13.jpg'],
  ['楠 楓', 'https://teachersecret2025.com/photos/22/20250321123958-kusunoki02.jpg'],
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
const { data: shops } = await supabase.from('shops').select('id, name').ilike('website_url', '%teachersecret%');
if (!shops?.length) { console.log('店舗なし'); process.exit(1); }
console.log(`対象店舗: ${shops.map(s => s.name).join(', ')}`);
const shopIds = shops.map(s => s.id);

const { data: nullT } = await supabase.from('therapists')
  .select('id, name, shop_id, image_url')
  .in('shop_id', shopIds)
  .is('image_url', null);

console.log(`DB写真なし: ${nullT?.length ?? 0}名`);

// nameImageMap: スペースあり/なし両方で登録
const nameImageMap = new Map();
for (const [siteName, url] of TEACHER_DATA) {
  nameImageMap.set(siteName, url);
  nameImageMap.set(siteName.replace(/\s/g, ''), url);
  nameImageMap.set(siteName.replace(/\s/g, '　'), url); // 全角スペース
}

function findMatch(dbName) {
  if (nameImageMap.has(dbName)) return { url: nameImageMap.get(dbName), siteName: dbName };
  const noSpace = dbName.replace(/[\s　]/g, '');
  for (const [siteName, url] of TEACHER_DATA) {
    const siteNoSpace = siteName.replace(/[\s　]/g, '');
    if (siteNoSpace === noSpace) return { url, siteName };
    // suffix match: DB "ひなの" → site "小川 ひなの"
    if (siteNoSpace.endsWith(noSpace) && noSpace.length >= 2) return { url, siteName };
    if (noSpace.endsWith(siteNoSpace) && siteNoSpace.length >= 2) return { url, siteName };
  }
  return null;
}

if (DRY_RUN) {
  console.log('\n[マッチング確認]');
  const matched = (nullT || []).filter(t => findMatch(t.name));
  const notFoundList = (nullT || []).filter(t => !findMatch(t.name));
  console.log(`マッチ: ${matched.length}名`);
  matched.forEach(t => {
    const m = findMatch(t.name);
    console.log(`  ✅ "${t.name}" → "${m.siteName}"`);
  });
  console.log(`未マッチ: ${notFoundList.length}名`);
  notFoundList.forEach(t => console.log(`  ❓ "${t.name}"`));
  process.exit(0);
}

// 更新
let updated = 0, notFound = 0, failed = 0;
const processedUrls = new Map();

for (const t of nullT || []) {
  const match = findMatch(t.name);
  if (!match) { process.stdout.write('?'); notFound++; continue; }

  let storageUrl;
  if (processedUrls.has(match.url)) {
    storageUrl = processedUrls.get(match.url);
  } else {
    const photoIdMatch = match.url.match(/\/photos\/(\d+)\//);
    const photoId = photoIdMatch?.[1] || Date.now();
    const extMatch = match.url.match(/\.(jpg|jpeg|png|webp)(\?|$)/i);
    const ext = extMatch?.[1]?.toLowerCase().replace('jpeg', 'jpg') || 'jpg';
    const fileName = `teacher_photo_${photoId}.${ext}`;
    storageUrl = await uploadImage(match.url, fileName);
    processedUrls.set(match.url, storageUrl);
    await sleep(150);
  }

  const { error } = await supabase.from('therapists')
    .update({ image_url: storageUrl ?? match.url })
    .eq('id', t.id);
  if (error) { console.log(`\n❌ ${t.name}: ${error.message}`); failed++; }
  else { process.stdout.write(storageUrl ? '+' : '.'); updated++; }
  await sleep(80);
}

console.log(`\n\n更新 ${updated}件 / 未マッチ ${notFound}件 / 失敗 ${failed}件`);
console.log('完了');
