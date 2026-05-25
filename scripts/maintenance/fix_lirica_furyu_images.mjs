/**
 * LIRICA OSAKA・Fu-Ryu（フウリュウ）セラピスト写真修正
 * パターン: /upload/cast/thumb_{castId}.jpg
 * 実行: node scripts/maintenance/fix_lirica_furyu_images.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const BUCKET = 'therapist-images';
const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (DRY_RUN) console.log('[DRY RUN]\n');

// LIRICA OSAKA 41名: name → castId
const LIRICA_DATA = [
  ['桜庭えみり', '569'],
  ['松本ゆりあ', '565'],
  ['百瀬ティアラ', '99'],
  ['白石めぐ', '442'],
  ['花咲しずく', '63'],
  ['愛舞みぃ', '249'],
  ['ゆずりはいのり', '142'],
  ['橘　あいか', '495'],
  ['桜井ココ', '180'],
  ['ゆめ', '538'],
  ['蒼井そら', '539'],
  ['京楽ゆら', '356'],
  ['はる', '546'],
  ['上条ももね', '547'],
  ['かんな', '479'],
  ['小島りのん', '233'],
  ['晴ノ日さくら', '268'],
  ['野々花なのか', '273'],
  ['木浪なる', '343'],
  ['明司りな', '36'],
  ['木崎さき', '405'],
  ['冨松はるな', '352'],
  ['間宮みや', '355'],
  ['七瀬なな', '172'],
  ['美愛乃えみ', '473'],
  ['響ゆうか', '361'],
  ['瀬木きせき', '491'],
  ['きほ', '494'],
  ['いちの聖', '523'],
  ['大沢ゆい', '490'],
  ['三上りお', '212'],
  ['真冬虹まゆき', '267'],
  ['白石莉奈', '524'],
  ['うみ', '520'],
  ['真城せりな', '514'],
  ['愛川おとは', '525'],
  ['ひすいひなた', '493'],
  ['高砂りんご', '528'],
  ['立花みさ', '486'],
  ['神木玲', '420'],
];

// Fu-Ryu 54名: name → castId
const FURYU_DATA = [
  ['ひめ', '468'],
  ['もも', '467'],
  ['じゅな', '466'],
  ['みな', '464'],
  ['みき', '462'],
  ['るな', '460'],
  ['せり', '459'],
  ['まどか', '457'],
  ['りえ', '456'],
  ['みれい', '451'],
  ['れみ', '449'],
  ['さあや', '447'],
  ['さつき', '446'],
  ['みく', '443'],
  ['のあ', '439'],
  ['らむ', '433'],
  ['ゆき', '432'],
  ['そら', '430'],
  ['みさと', '429'],
  ['とあ', '428'],
  ['あやな', '426'],
  ['いと', '424'],
  ['なるせ', '422'],
  ['かずは', '421'],
  ['さき', '417'],
  ['ひかり', '416'],
  ['らら', '412'],
  ['あおい', '410'],
  ['やよい', '409'],
  ['まお', '400'],
  ['めぐみ', '398'],
  ['らん', '393'],
  ['つかさ', '391'],
  ['ことの', '386'],
  ['さら', '385'],
  ['なな', '382'],
  ['べる', '373'],
  ['ひなの', '370'],
  ['ゆり', '368'],
  ['ももな', '360'],
  ['ゆめ', '323'],
  ['まや', '58'],
  ['るい', '12'],
  ['りあ', '326'],
  ['じゅん', '191'],
  ['すず', '211'],
  ['れん', '148'],
  ['ななこ', '277'],
  ['みなみ', '283'],
  ['かえで', '298'],
  ['れいか', '300'],
  ['かれん', '337'],
  ['めい', '355'],
  ['さくら', '64'],
];

async function uploadImage(imageUrl, fileName, referer) {
  try {
    const res = await fetch(imageUrl, {
      headers: { ...UA, Referer: referer },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) { console.log(`\n  HTTP ${res.status}: ${imageUrl.slice(-40)}`); return null; }
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 512) return null;
    const { error } = await supabase.storage.from(BUCKET)
      .upload(fileName, buf, { contentType: 'image/jpeg', upsert: true });
    if (error) { console.log(`\n  Storage: ${error.message}`); return null; }
    return supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
  } catch (e) { console.log(`\n  fetch error: ${e.message}`); return null; }
}

async function processShop(domainPart, data, prefix, siteBase) {
  const { data: shops } = await supabase.from('shops').select('id, name').ilike('website_url', `%${domainPart}%`);
  if (!shops || shops.length === 0) { console.log(`${domainPart} の店舗が見つかりません`); return; }
  console.log(`\n対象店舗: ${shops.map(s => s.id + ' ' + s.name).join(', ')}`);
  const shopIds = shops.map(s => s.id);
  let updated = 0, skipped = 0, notFound = 0, failed = 0;

  for (const [name, castId] of data) {
    // DB name might be stored without full-width spaces — try both
    const namesToTry = [name, name.replace(/　/g, ' '), name.replace(/　/g, '')];
    let therapists = null;
    for (const n of namesToTry) {
      const { data: res } = await supabase.from('therapists').select('id, shop_id, image_url').in('shop_id', shopIds).eq('name', n);
      if (res && res.length > 0) { therapists = res; break; }
    }
    if (!therapists || therapists.length === 0) { process.stdout.write('?'); notFound++; continue; }
    const nullOnes = therapists.filter(t => !t.image_url);
    if (nullOnes.length === 0) { process.stdout.write('='); skipped++; continue; }
    const imageUrl = `${siteBase}/upload/cast/thumb_${castId}.jpg`;
    const fileName = `${prefix}_${castId}.jpg`;
    const storageUrl = await uploadImage(imageUrl, fileName, siteBase + '/');
    await sleep(100);
    for (const t of nullOnes) {
      const { error } = await supabase.from('therapists').update({ image_url: storageUrl ?? null }).eq('id', t.id);
      if (error) { console.log(`\n❌ ${name}: ${error.message}`); failed++; }
      else { process.stdout.write(storageUrl ? '+' : 'n'); updated++; }
    }
    await sleep(80);
  }
  console.log(`\n更新 ${updated}件 / スキップ ${skipped}件 / 見つからず ${notFound}件 / 失敗 ${failed}件`);
}

if (DRY_RUN) {
  console.log(`【LIRICA OSAKA】 ${LIRICA_DATA.length}名`);
  LIRICA_DATA.slice(0, 3).forEach(([n, c]) => console.log(`  ${n} → thumb_${c}.jpg`));
  console.log(`\n【Fu-Ryu】 ${FURYU_DATA.length}名`);
  FURYU_DATA.slice(0, 3).forEach(([n, c]) => console.log(`  ${n} → thumb_${c}.jpg`));
  process.exit(0);
}

console.log('=== LIRICA OSAKA ===');
await processShop('lirica-osaka', LIRICA_DATA, 'lirica', 'https://lirica-osaka.com');

console.log('\n=== Fu-Ryu（フウリュウ）===');
await processShop('furyu.net', FURYU_DATA, 'furyu', 'https://furyu.net');

console.log('\n完了');
