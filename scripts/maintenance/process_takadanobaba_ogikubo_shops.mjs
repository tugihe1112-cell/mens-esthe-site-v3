/**
 * 高田馬場・荻窪・品川 5店舗 登録スクリプト
 *   - R,s SPA (高田馬場) 48名
 *   - 高田馬場ナースクリニック 30名（画像なし）
 *   - Casablanca (荻窪) 18名
 *   - Natural SPA (荻窪) 17名 caskan.com CDN
 *   - SPA LOUNGE (大井町) 8名（画像なし）
 *
 * 実行:
 *   node scripts/maintenance/process_takadanobaba_ogikubo_shops.mjs --dry-run
 *   node scripts/maintenance/process_takadanobaba_ogikubo_shops.mjs
 *   node scripts/maintenance/process_takadanobaba_ogikubo_shops.mjs --shop rsspa
 *   node scripts/maintenance/process_takadanobaba_ogikubo_shops.mjs --shop nurse
 *   node scripts/maintenance/process_takadanobaba_ogikubo_shops.mjs --shop casablanca
 *   node scripts/maintenance/process_takadanobaba_ogikubo_shops.mjs --shop natural
 *   node scripts/maintenance/process_takadanobaba_ogikubo_shops.mjs --shop spalounge
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const DRY_RUN = process.argv.includes('--dry-run');
const shopArg = (() => { const i = process.argv.indexOf('--shop'); return i >= 0 ? process.argv[i+1] : null; })();

// ===== R,s SPA =====
const RSSPA_SHOP = {
  id: 'tokyo_shinjuku_takadanobaba_rsspa',
  name: 'R,s SPA (アールズスパ)',
  website_url: 'https://rs-spa.com/',
  schedule_url: 'https://rs-spa.com/schedule/',
  image_url: 'https://rs-spa.com/wp-content/uploads/2025/05/hh-logo.png',
  raw_data: { prefecture: '東京都', area: '高田馬場' },
};
const RSSPA_THERAPISTS = [
  { name: 'みき',      src: 'https://rs-spa.com/wp-content/uploads/2025/09/3609_20250918115417_600_800_0.jpg' },
  { name: 'なる',      src: 'https://rs-spa.com/wp-content/uploads/2025/08/3432_20250815145654_600_800_0.jpg' },
  { name: 'ふうか',    src: 'https://rs-spa.com/wp-content/uploads/2026/04/5CYX9IUZiKqNYxe1778988351_1778988392.jpg' },
  { name: 'なつ',      src: 'https://rs-spa.com/wp-content/uploads/2026/04/iauS0gBDbKhcTR51776260987_1776261495.jpg' },
  { name: 'しおん',    src: 'https://rs-spa.com/wp-content/uploads/2026/04/CwD9D2VZIkeAGl91776315132_1776315172.jpg' },
  { name: 'あゆか',    src: 'https://rs-spa.com/wp-content/uploads/2025/09/3268_20250927143217_600_800_0.jpg' },
  { name: 'りり',      src: 'https://rs-spa.com/wp-content/uploads/2025/03/4ejAigkrWKTcDKM1757505681_1757505704_0-1.jpg' },
  { name: 'ろり',      src: 'https://rs-spa.com/wp-content/uploads/2024/07/S__28360826_0.jpg' },
  { name: 'ありす',    src: 'https://rs-spa.com/wp-content/uploads/2023/04/S__6619167.jpg' },
  { name: 'なな',      src: 'https://rs-spa.com/wp-content/uploads/2022/09/S__2220072.jpg' },
  { name: 'すい',      src: 'https://rs-spa.com/wp-content/uploads/2026/03/tsaB8NzuM2GmixW1774145953_1774146131.jpg' },
  { name: 'うさ',      src: 'https://rs-spa.com/wp-content/uploads/2026/02/4188_20260225144601_600_800_0.jpg' },
  { name: 'しおね',    src: 'https://rs-spa.com/wp-content/uploads/2025/10/3728_20251010181533_600_800_0.jpg' },
  { name: 'まどか',    src: 'https://rs-spa.com/wp-content/uploads/2026/04/4484_20260416230921_600_800_0.jpg' },
  { name: 'ゆうな',    src: 'https://rs-spa.com/wp-content/uploads/2026/04/4807_20260418031024_600_800_0.jpg' },
  { name: 'ゆうり',    src: 'https://rs-spa.com/wp-content/uploads/2026/03/4QJr1WF8Y4zBVWI1772531381_1772531447.jpg' },
  { name: 'れんか',    src: 'https://rs-spa.com/wp-content/uploads/2024/08/5.jpg' },
  { name: 'せいな',    src: 'https://rs-spa.com/wp-content/uploads/2026/03/qGHbFc5LsfteB671774144697_1774144778.jpg' },
  { name: 'かや',      src: 'https://rs-spa.com/wp-content/uploads/2025/12/zQKU9madEILrOeW1768643159_1768643200.jpg' },
  { name: 'きさき',    src: 'https://rs-spa.com/wp-content/uploads/2025/11/i8T80kcwVp63pzo1764574074_1764574096.jpg' },
  { name: 'ゆきの',    src: 'https://rs-spa.com/wp-content/uploads/2025/11/3928_20251129191108_600_800_0.jpg' },
  { name: 'つき',      src: 'https://rs-spa.com/wp-content/uploads/2026/03/8cFhXD7PH3wVmzy1772532845_1772532948.jpg' },
  { name: 'さく',      src: 'https://rs-spa.com/wp-content/uploads/2026/03/NQgAZSEgYJ0fEPW1771266320_1771266366_0.jpg' },
  { name: 'みかさ',    src: 'https://rs-spa.com/wp-content/uploads/2026/03/2sLaS2WdIaXu9ae1771760268_1771760287.jpg' },
  { name: 'まり',      src: 'https://rs-spa.com/wp-content/uploads/2025/12/gs3WquUVzsgikqC1765702540_1765702592.jpg' },
  { name: 'みずき',    src: 'https://rs-spa.com/wp-content/uploads/2025/12/4Nw23IKoXc6g7zV1768048712_1768048749.jpg' },
  { name: 'らら',      src: 'https://rs-spa.com/wp-content/uploads/2025/06/1911_20250627164711_600_800_0.jpg' },
  { name: 'いぶき',    src: 'https://rs-spa.com/wp-content/uploads/2022/12/S__2785376.jpg' },
  { name: 'みみ',      src: 'https://rs-spa.com/wp-content/uploads/2025/06/1933_20250627164731_600_800_0.jpg' },
  { name: 'ゆめの',    src: 'https://rs-spa.com/wp-content/uploads/2025/09/3356_20250927135437_600_800_0.jpg' },
  { name: 'えりか',    src: 'https://rs-spa.com/wp-content/uploads/2025/06/2674_20250627164650_600_800_0.jpg' },
  { name: 'のの',      src: 'https://rs-spa.com/wp-content/uploads/2025/06/1851_20250627164846_600_800_0.jpg' },
  { name: 'らむ',      src: 'https://rs-spa.com/wp-content/uploads/2025/08/3262_20250804164204_600_800_0.jpg' },
  { name: 'みゆ',      src: 'https://rs-spa.com/wp-content/uploads/2025/09/3550_20250910214451_600_800_0.jpg' },
  { name: 'みなみ',    src: 'https://rs-spa.com/wp-content/uploads/2025/02/ZLkKJdhOqdT7wxu1754133132_1754133212.jpg' },
  { name: 'おと',      src: 'https://rs-spa.com/wp-content/uploads/2025/06/3013_20250627164749_600_800_0.jpg' },
  { name: 'かのん',    src: 'https://rs-spa.com/wp-content/uploads/2025/11/PQfR4vtWwtkb0jU1764579374_1764579435.jpg' },
  { name: 'みつ',      src: 'https://rs-spa.com/wp-content/uploads/2025/12/d1w4UPrEdx2LxEL1768213832_1768214034.jpg' },
  { name: 'りか',      src: 'https://rs-spa.com/wp-content/uploads/2025/06/1902_20250627164815_600_800_0.jpg' },
  { name: 'ひより',    src: 'https://rs-spa.com/wp-content/uploads/2025/07/3088_20250710155638_600_800_0.jpg' },
  { name: 'りさ',      src: 'https://rs-spa.com/wp-content/uploads/2025/07/6JEU0FKznTAaueM1751877344_1751877376.jpg' },
  { name: 'みあ',      src: 'https://rs-spa.com/wp-content/uploads/2025/10/3645_20251008132129_600_800_0.jpg' },
  { name: 'もえ',      src: 'https://rs-spa.com/wp-content/uploads/2026/04/MZtAivCDa3KZbqn1775547207_1775547230.jpg' },
  { name: 'りま',      src: 'https://rs-spa.com/wp-content/uploads/2026/05/bilbxRJ7Z6ouPcr1780113795_1780113835.jpg' },
  { name: 'ゆき',      src: 'https://rs-spa.com/wp-content/uploads/2026/05/at8VKyl82JXr5br1780509005_1780509076.jpg' },
  { name: 'いろは',    src: 'https://rs-spa.com/wp-content/uploads/2026/04/KJAtxulWeAaei1j1774608520_1774608560.jpg' },
  { name: 'あのちゃん',src: 'https://rs-spa.com/wp-content/uploads/2026/04/sFSeMwko35VBhFo1776861352_1776861471.jpg' },
  { name: 'ひめか',    src: 'https://rs-spa.com/wp-content/uploads/2026/06/5iuUSPHhKUPvzg71780479291_1780479328.jpg' },
].map(t => ({ ...t, key: 'rsspa_' + t.src.split('/').pop().replace(/\.[^.]+$/, '').slice(0, 25) }));

// ===== 高田馬場ナースクリニック (画像なし) =====
const NURSE_SHOP = {
  id: 'tokyo_shinjuku_takadanobaba_nurse_clinic',
  name: '高田馬場ナースクリニック',
  website_url: 'https://baba-nurse.com/',
  schedule_url: 'https://baba-nurse.com/schedule/',
  image_url: null,
  raw_data: { prefecture: '東京都', area: '高田馬場' },
};
const NURSE_NAMES = ['しおり','かえ','もも','さな','ゆあ','成瀬','せいな','しの','みさき','あまね',
  'まいぴ','かなめ','ミオ','えれな','ゆきの','さあや','ここあ','るか','なの','うあ',
  'あおい','きら','さく','めろ','ならく','ふわり','ありさ','こなた','らい','みりな'];

// ===== Casablanca =====
const CASA_SHOP = {
  id: 'tokyo_suginami_ogikubo_casablanca',
  name: 'Casablanca (カサブランカ)',
  website_url: 'https://casablanca.mens-relaxation.com/',
  schedule_url: 'https://casablanca.mens-relaxation.com/schedule/',
  image_url: 'https://casablanca.mens-relaxation.com/wp-content/uploads/2024/10/aaa.png',
  raw_data: { prefecture: '東京都', area: '荻窪' },
};
const CASA_THERAPISTS = [
  { name: '真宮',   fn: 'IMG_1901.jpeg' },{ name: '胡蝶',  fn: 'IMG_1875.jpeg' },
  { name: '愛田',   fn: 'IMG_1853.jpeg' },{ name: '松嶋',  fn: 'IMG_1709.jpeg' },
  { name: '青山',   fn: 'IMG_1628.jpeg' },{ name: '葉月',  fn: 'IMG_0135.jpeg' },
  { name: '北本',   fn: 'IMG_1574.jpeg' },{ name: '竹内',  fn: 'IMG_1368.jpeg' },
  { name: '愛川',   fn: 'IMG_1128.jpeg' },{ name: '桜',    fn: 'IMG_0947.jpeg' },
  { name: '目白',   fn: 'IMG_0650.jpeg' },{ name: '佐々木',fn: 'IMG_0437.jpeg' },
  { name: '仲間',   fn: 'IMG_0530.jpeg' },{ name: '瀬戸',  fn: 'IMG_0416.jpeg' },
  { name: '長谷川', fn: 'IMG_0241.jpeg' },{ name: '桃瀬',  fn: 'IMG_0255.jpeg' },
  { name: '加賀谷', fn: 'IMG_0143.jpeg' },{ name: '斉藤',  fn: 'IMG_1305.jpeg' },
].map(t => ({
  name: t.name,
  src: `https://casablanca.mens-relaxation.com/wp-content/uploads/${t.fn}`,
  key: 'casablanca_' + t.fn.replace(/\.[^.]+$/, ''),
}));

// ===== Natural SPA (caskan.com CDN) =====
const NATURAL_SHOP = {
  id: 'tokyo_suginami_ogikubo_natural_spa',
  name: 'Natural SPA (ナチュラルスパ)',
  website_url: 'https://www.naturalspa-ogkb.com/',
  schedule_url: 'https://www.naturalspa-ogkb.com/schedule',
  image_url: null,
  raw_data: { prefecture: '東京都', area: '荻窪' },
};
const NATURAL_THERAPISTS = [
  { name: 'もか',   fn: '1727423737_9229308.jpg' },{ name: 'まりの', fn: '1727357933_4153071.jpg' },
  { name: 'るか',   fn: '1727433450_4549293.jpg' },{ name: 'あおい', fn: '1770527068_3129610.jpg' },
  { name: 'あいさ', fn: '1727440902_7044284.jpg' },{ name: 'りこ',   fn: '1727360793_1376104.jpg' },
  { name: 'じゅり', fn: '1728798183_7172907.jpg' },{ name: 'あやか', fn: '1750346319_1600793.jpg' },
  { name: 'ゆき',   fn: '1732975460_5498061.jpg' },{ name: 'れい',   fn: '1734440365_3969356.jpeg' },
  { name: 'くるみ', fn: '1743839638_5357031.jpg' },{ name: 'みゆう', fn: '1755232460_9760241.jpg' },
  { name: 'さつき', fn: '1769153732_0420539.jpg' },{ name: 'ゆい',   fn: '1737697501_7459417.jpg' },
  { name: 'ななみ', fn: '1778587587_7691693.jpg' },{ name: 'しおん', fn: '1727423760_9960065.jpg' },
  { name: 'えみか', fn: '1739091236_5421150.jpg' },
].map(t => ({
  name: t.name,
  src: `https://cdn2-caskan.com/caskan/img/cast_tmb/${t.fn}`,
  key: 'naturalspa_' + t.fn.replace(/\.[^.]+$/, '').slice(0, 22),
}));

// ===== SPA LOUNGE (画像なし) =====
const LOUNGE_SHOP = {
  id: 'tokyo_shinagawa_oimachi_spa_lounge',
  name: 'SPA LOUNGE (スパラウンジ)',
  website_url: 'https://esthe-spa-lounge.com/',
  schedule_url: 'https://esthe-spa-lounge.com/schedule/',
  image_url: null,
  raw_data: { prefecture: '東京都', area: '品川' },
};
const LOUNGE_NAMES = ['うらら','みれい','かずは','てるみ','やすの','えりか','ことね','くれは'];

// ===== 共通 =====
async function uploadImage(imgUrl, key, referer) {
  try {
    const headers = { 'User-Agent': 'Mozilla/5.0' };
    if (referer) headers['Referer'] = referer;
    const res = await fetch(imgUrl, { headers });
    if (!res.ok) { process.stdout.write('!'); return null; }
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = imgUrl.split('?')[0].split('.').pop().toLowerCase();
    const ct = ext === 'png' ? 'image/png' : 'image/jpeg';
    const { error } = await supabase.storage.from('therapist-images').upload(`${key}.jpg`, buf, { contentType: ct, upsert: true });
    if (error) { process.stdout.write('!'); return null; }
    const { data } = supabase.storage.from('therapist-images').getPublicUrl(`${key}.jpg`);
    return data.publicUrl;
  } catch { process.stdout.write('!'); return null; }
}

async function registerShop(s) {
  if (DRY_RUN) { console.log(`[DRY] Shop: ${s.name}`); return; }
  const { error } = await supabase.from('shops').upsert(s, { onConflict: 'id' });
  if (error) console.error(`Shop error ${s.id}:`, error.message);
  else console.log(`✅ ${s.id}`);
}

async function registerTherapists(shopId, therapists, referer) {
  let ins = 0, skp = 0, err = 0;
  for (const t of therapists) {
    const name = typeof t === 'string' ? t : t.name;
    const src  = typeof t === 'string' ? null : t.src;
    const key  = typeof t === 'string' ? null : t.key;
    const tid  = `${shopId}_${name}`;
    const { data: ex } = await supabase.from('therapists').select('id,image_url').eq('id', tid).single();
    if (ex?.image_url) { process.stdout.write('='); skp++; continue; }
    const url = (!DRY_RUN && src && key) ? await uploadImage(src, key, referer) : (DRY_RUN && src ? src : null);
    const record = { id: tid, shop_id: shopId, name, image_url: url };
    if (!DRY_RUN) {
      const { error } = await supabase.from('therapists').upsert(record, { onConflict: 'id' });
      if (error) { console.error(`\n✗ ${name}`); err++; }
      else { process.stdout.write(url ? '+' : 'n'); ins++; }
    } else { process.stdout.write(src ? '+' : 'n'); ins++; }
    await new Promise(r => setTimeout(r, 200));
  }
  console.log(`\n挿入: ${ins} / スキップ: ${skp} / エラー: ${err}`);
}

async function main() {
  console.log(`=== 5店舗 登録 (DRY_RUN=${DRY_RUN}) ===\n`);
  const run = (name) => !shopArg || shopArg === name;

  if (run('rsspa'))      { console.log(`--- R,s SPA ${RSSPA_THERAPISTS.length}名 ---`); await registerShop(RSSPA_SHOP); await registerTherapists(RSSPA_SHOP.id, RSSPA_THERAPISTS, 'https://rs-spa.com'); }
  if (run('nurse'))      { console.log(`\n--- ナースクリニック ${NURSE_NAMES.length}名 ---`); await registerShop(NURSE_SHOP); await registerTherapists(NURSE_SHOP.id, NURSE_NAMES, null); }
  if (run('casablanca')) { console.log(`\n--- Casablanca ${CASA_THERAPISTS.length}名 ---`); await registerShop(CASA_SHOP); await registerTherapists(CASA_SHOP.id, CASA_THERAPISTS, 'https://casablanca.mens-relaxation.com'); }
  if (run('natural'))    { console.log(`\n--- Natural SPA ${NATURAL_THERAPISTS.length}名 ---`); await registerShop(NATURAL_SHOP); await registerTherapists(NATURAL_SHOP.id, NATURAL_THERAPISTS, 'https://www.naturalspa-ogkb.com'); }
  if (run('spalounge'))  { console.log(`\n--- SPA LOUNGE ${LOUNGE_NAMES.length}名 ---`); await registerShop(LOUNGE_SHOP); await registerTherapists(LOUNGE_SHOP.id, LOUNGE_NAMES, null); }

  console.log('\n=== 完了 ===');
}
main().catch(console.error);
