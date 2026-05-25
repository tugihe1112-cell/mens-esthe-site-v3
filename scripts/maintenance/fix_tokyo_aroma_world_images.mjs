/**
 * Tokyo-Aroma-World（アロマリゾート）セラピスト写真修正
 * パターン: tokyo-aroma-world.jp/upload/cast/thumb_{castId}.jpg
 * 実行: node scripts/maintenance/fix_tokyo_aroma_world_images.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const BUCKET = 'therapist-images';
const BASE = 'https://tokyo-aroma-world.jp';
const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (DRY_RUN) console.log('[DRY RUN]\n');

// name → castId
const AROMA_WORLD_DATA = [
  ['平野つき', '50'],
  ['工藤みお', '49'],
  ['瀬名ののか', '48'],
  ['蒼井るな', '45'],
  ['姫野まき', '43'],
  ['花宮あまね', '42'],
  ['日高るい', '9'],
  ['東雲まゆ', '10'],
  ['観月こはる', '11'],
  ['大森なこ', '12'],
  ['斉藤ゆか', '13'],
  ['桃瀬りんか', '14'],
  ['水瀬かえで', '15'],
  ['日向まいか', '16'],
  ['井上りお', '17'],
  ['葉山あずさ', '18'],
  ['川崎おとは', '19'],
  ['中村むつみ', '20'],
  ['一ノ瀬ねね', '21'],
  ['成瀬ひまり', '22'],
  ['星川ななせ', '23'],
  ['佐々木えみ', '24'],
  ['高田みな', '25'],
  ['高橋みさき', '26'],
  ['有栖りず', '27'],
  ['月見まい', '28'],
  ['佐藤りな', '29'],
  ['大野あん', '31'],
  ['小林きい', '32'],
  ['藤井らん', '33'],
  ['松浦あやみ', '34'],
  ['桜木まお', '35'],
  ['百田つばさ', '36'],
  ['月森あゆり', '37'],
  ['松本るり', '38'],
  ['春山わかな', '39'],
  ['寺西あい', '40'],
  ['葉月すずな', '41'],
];

async function uploadImage(castId, fileName) {
  const imageUrl = `${BASE}/upload/cast/thumb_${castId}.jpg`;
  try {
    const res = await fetch(imageUrl, {
      headers: { ...UA, Referer: BASE + '/' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) { console.log(`\n  HTTP ${res.status}: thumb_${castId}.jpg`); return null; }
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

const { data: shops } = await supabase.from('shops').select('id, name').ilike('website_url', '%tokyo-aroma-world%');
if (!shops || shops.length === 0) { console.log('Tokyo-Aroma-Worldの店舗が見つかりません'); process.exit(1); }
console.log(`対象店舗: ${shops.map(s => s.id + ' ' + s.name).join(', ')}\n`);

if (DRY_RUN) {
  AROMA_WORLD_DATA.slice(0, 5).forEach(([n, c]) => console.log(`  ${n} → thumb_${c}.jpg`));
  process.exit(0);
}

let updated = 0, skipped = 0, notFound = 0, failed = 0;
const shopIds = shops.map(s => s.id);

for (const [name, castId] of AROMA_WORLD_DATA) {
  const { data: therapists } = await supabase.from('therapists').select('id, shop_id, image_url').in('shop_id', shopIds).eq('name', name);
  if (!therapists || therapists.length === 0) { process.stdout.write('?'); notFound++; continue; }
  const nullOnes = therapists.filter(t => !t.image_url);
  if (nullOnes.length === 0) { process.stdout.write('='); skipped++; continue; }
  const fileName = `tokyo_aroma_world_${castId}.jpg`;
  const storageUrl = await uploadImage(castId, fileName);
  await sleep(100);
  for (const t of nullOnes) {
    const { error } = await supabase.from('therapists').update({ image_url: storageUrl ?? null }).eq('id', t.id);
    if (error) { console.log(`\n❌ ${name}: ${error.message}`); failed++; }
    else { process.stdout.write(storageUrl ? '+' : 'n'); updated++; }
  }
  await sleep(80);
}
console.log(`\n\n更新 ${updated}件 / スキップ ${skipped}件 / 見つからず ${notFound}件 / 失敗 ${failed}件`);
console.log('\n完了');
