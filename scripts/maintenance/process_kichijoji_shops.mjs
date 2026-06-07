/**
 * 吉祥寺・三鷹エリア 8店舗 登録スクリプト
 *   - Yorimichi (1位) ~130名  optImg CMS (動的取得)
 *   - moshimo   (2位)   33名  /data/staff/{sid}/stf_{hash}.webp
 *   - ROOKIE    (4位)   20名  /upload/cast/thumb_{id}.jpg
 *   - まろん    (5位)   51名  caskan.com CDN
 *   - エステ美人マダム (6位) 7名  名前のみ
 *   - APEX      (7位)   16名  caskan.com CDN
 *   - Aroma ELLA(9位)  ~25名  S3バケット (動的取得)
 *   - Mspa      (10位)  75名  /data/staff/{sid}/stf_{hash}.jpg
 *
 * 実行:
 *   node scripts/maintenance/process_kichijoji_shops.mjs --dry-run
 *   node scripts/maintenance/process_kichijoji_shops.mjs
 *   node scripts/maintenance/process_kichijoji_shops.mjs --shop yorimichi
 *   node scripts/maintenance/process_kichijoji_shops.mjs --shop moshimo
 *   node scripts/maintenance/process_kichijoji_shops.mjs --shop rookie
 *   node scripts/maintenance/process_kichijoji_shops.mjs --shop marron
 *   node scripts/maintenance/process_kichijoji_shops.mjs --shop madamu
 *   node scripts/maintenance/process_kichijoji_shops.mjs --shop apex
 *   node scripts/maintenance/process_kichijoji_shops.mjs --shop ella
 *   node scripts/maintenance/process_kichijoji_shops.mjs --shop mspa
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const DRY_RUN = process.argv.includes('--dry-run');
const shopArg = (() => { const i = process.argv.indexOf('--shop'); return i >= 0 ? process.argv[i+1] : null; })();
const run = (n) => !shopArg || shopArg === n;

// ===== Yorimichi (吉祥寺1位) =====
const YORIMICHI_SHOP = {
  id: 'tokyo_musashino_kichijoji_yorimichi',
  name: 'Yorimichi (よりみち)',
  website_url: 'https://kichijoji-igokochi.com/',
  schedule_url: 'https://kichijoji-igokochi.com/scheduleAll.html',
  image_url: null,
  raw_data: { prefecture: '東京都', area: '吉祥寺' },
};
async function fetchYorimichi() {
  const res = await fetch('https://kichijoji-igokochi.com/itemList.html', { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  const items = [], seen = new Set();
  const reg = /src="(\/optImg\/\d+\/item\/\d+\/\d+_320_0\.(?:jpg|jpeg|png))"[^>]*alt="([^"]+)"/g;
  let m;
  while ((m = reg.exec(html)) !== null) {
    const rawName = m[2].trim();
    if (rawName.endsWith('2') || rawName.endsWith('3')) continue;
    const name = rawName;
    if (!name || seen.has(name) || !/[ぁ-んァ-ヾ一-龯]/.test(name)) continue;
    seen.add(name);
    const src = `https://kichijoji-igokochi.com${m[1].replace('_320_0.', '_640_0.')}`;
    const itemId = m[1].match(/\/item\/(\d+)\//)?.[1];
    items.push({ name, src, key: `yorimichi_${itemId}` });
  }
  return items;
}

// ===== moshimo (吉祥寺2位) PREMIUM SPA CMS =====
const MOSHIMO_SHOP = {
  id: 'tokyo_musashino_kichijoji_moshimo',
  name: 'moshimo... (もしも)',
  website_url: 'https://menesth-moshimo.com/',
  schedule_url: null,
  image_url: null,
  raw_data: { prefecture: '東京都', area: '吉祥寺' },
};
const MOSHIMO_RAW = [
  ['南れいら','85','stf_6a23d0112d778.webp'],['かすみ','84','stf_69d5f0cbb8ed9.webp'],
  ['しおり','83','stf_69c257bb747e7.webp'],['もか','81','stf_6974d72fa7401.webp'],
  ['愛染もな','17','stf_691c7b32abf11.webp'],['みらい','44','stf_686af6da236ce.webp'],
  ['きらら','30','stf_69d5f12b4389b.webp'],['あかり','62','stf_673c9b20f3a58.webp'],
  ['まお','50','stf_691c822a38c07.webp'],['森ひかり','65','stf_68aeda70043de.webp'],
  ['るき','74','stf_69ba1e5252a16.webp'],['初音ゆう','27','stf_6778d97cbe830.webp'],
  ['れな','76','stf_6964efb3beb19.webp'],['かいり','80','stf_695ad4dee670b.webp'],
  ['あやか','82','stf_69778edd9e2ba.webp'],['まぎ','78','stf_691d4ab2c2699.webp'],
  ['みお','72','stf_68adb3c409af4.webp'],['かえで','37','stf_65e80b26777d8.webp'],
  ['ここな友紀','33','stf_65fbfcfb802be.webp'],['南りさ','71','stf_68720ffc56716.webp'],
  ['るな','75','stf_6914c9632d6c8.webp'],['なぎ','70','stf_6850cb9c2527a.webp'],
  ['えま','69','stf_68034fe92e029.webp'],['きほ','67','stf_67beccd0b4ef3.webp'],
  ['せな','64','stf_677fc8bc5cb64.webp'],['なつめ','61','stf_6731979599671.webp'],
  ['佐野らん','42','stf_66939a92e660c.webp'],['もも','49','stf_669b30c9d474d.webp'],
  ['よつば','52','stf_66b710ec6a665.webp'],['のの','43','stf_65fd33e873d86.webp'],
  ['りお','36','stf_6601aa821ed2f.webp'],['椎名つばさ','25','stf_65b745726381b.webp'],
  ['桜ななみ','22','stf_65dc5fb92a11a.webp'],
].map(([name, sid, hash]) => ({
  name, src: `https://menesth-moshimo.com/data/staff/${sid}/${hash}`, key: `moshimo_${sid}`
}));

// ===== ROOKIE 三鷹 (4位) =====
const ROOKIE_SHOP = {
  id: 'tokyo_mitaka_mitaka_rookie',
  name: 'ROOKIE (ルーキー) 三鷹ルーム',
  website_url: 'https://rookie-esthe.com/',
  schedule_url: 'https://rookie-esthe.com/schedule/',
  image_url: null,
  raw_data: { prefecture: '東京都', area: '三鷹' },
};
const ROOKIE_RAW = [
  ['なつ','40'],['せいら','39'],['りか','37'],['はれ','36'],['みなみ','21'],
  ['ゆあ','12'],['れな','13'],['れみ','15'],['みみ','11'],['かりん','10'],
  ['ありす','17'],['せりな','16'],['桃瀬あいり','33'],['らん','18'],['ゆな','19'],
  ['もか','22'],['ひなの','24'],['のん','26'],['ふゆ','35'],['ゆう','25'],
].map(([name, id]) => ({
  name, src: `https://rookie-esthe.com/upload/cast/thumb_${id}.jpg`, key: `rookie_${id}`
}));

// ===== まろん 吉祥寺 (5位) caskan.com CDN =====
const MARRON_SHOP = {
  id: 'tokyo_musashino_kichijoji_marron',
  name: 'まろん 吉祥寺ルーム',
  website_url: 'https://aroma-marron.com/',
  schedule_url: null,
  image_url: null,
  raw_data: { prefecture: '東京都', area: '吉祥寺' },
};
const MARRON_RAW = [
  ['佐々木えな','3580235'],['環いろは','8790066'],['天笠ひまり','7954675'],
  ['日向りま','7604620'],['羽月ともえ','4024231'],['優木ともみ','0170666'],
  ['三浦あすか','2752802'],['神楽もも','3562901'],['白石まり','4206988'],
  ['広瀬つむぎ','7536976'],['朝倉しおり','0887266'],['宮坂なな','6479697'],
  ['百瀬まな','3365479'],['小澤まゆ','8593343'],['深月いと','3186772'],
  ['春香ゆり','8235830'],['椎名さえ','7662274'],['織田ゆうり','5258102'],
  ['松倉ゆうか','1129698'],['雪平かおり','9038324'],['橋本かな','6363836'],
  ['白川ひなた','3733286'],['真山つかさ','2598880'],['姫川あいか','4809155'],
  ['水川ちりこ','3032239'],['聖のん','6041294'],['椿るい','4454756'],
  ['木嶋ゆき','0672524'],['宗井みれい','8178912'],['川野めい','7969541'],
  ['藤原ゆか','1592584'],['櫻井みこと','6419446'],['夏川さや','0218317'],
  ['柚月しほ','9913773'],['如月れい','0852215'],['内藤しずか','2791221'],
  ['蒼井みう','5797442'],['一条みほ','8205385'],['小松あや','3590068'],
  ['藤沢さき','0473464'],['瀬戸あやめ','0174681'],['叶こころ','7898684'],
  ['早瀬くるみ','3880194'],['天音りん','1288235'],['天野はるか','8049869'],
  ['森咲あおい','7375463'],['大城りり','9216401'],['川原めぐみ','0975557'],
  ['小笠原かれん','2464808'],['釈ゆな','1511753'],['藤森あき','2042148'],
].map(([name, castId]) => ({
  // caskan CDN: URLはタイムスタンプ付きなので動的取得する
  name, castId, src: null, key: `marron_${castId}`
}));
async function fetchMarronTherapists() {
  const res = await fetch('https://aroma-marron.com/therapist', { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  // caskan URL: src="https://cdn2-caskan.com/caskan/img/cast_tmb/{ts}_{castId}.jpg"
  const castMap = {};
  const reg = /src="(https:\/\/cdn2-caskan\.com\/caskan\/img\/cast_tmb\/\d+_(\d+)\.jpg)"/g;
  let m;
  while ((m = reg.exec(html)) !== null) castMap[m[2]] = m[1];
  return MARRON_RAW.map(t => ({ ...t, src: castMap[t.castId] || null }));
}

// ===== エステ美人マダム 三鷹 (6位) =====
const MADAMU_SHOP = {
  id: 'tokyo_mitaka_mitaka_esthe_madamu',
  name: 'エステ美人マダム 三鷹店',
  website_url: 'https://mitaka.esthe-madamu.com/',
  schedule_url: null,
  image_url: null,
  raw_data: { prefecture: '東京都', area: '三鷹' },
};
const MADAMU_RAW = [
  { name: 'ひめな' }, { name: 'かのん' }, { name: 'ゆりな' },
  { name: 'ひより' }, { name: 'ほのか' }, { name: 'かえで' }, { name: 'ひな' },
].map(t => ({ ...t, src: null, key: null }));

// ===== APEX 吉祥寺 (7位) caskan.com CDN =====
const APEX_SHOP = {
  id: 'tokyo_musashino_kichijoji_apex',
  name: 'APEX (エイペックス)',
  website_url: 'https://apex-kichijoji.com/',
  schedule_url: null,
  image_url: null,
  raw_data: { prefecture: '東京都', area: '吉祥寺' },
};
const APEX_RAW = [
  ['蝶乃いぶき','7465586'],['工藤ゆり','4577400'],['葉月','7793554'],
  ['舞咲あゆ','5621604'],['浅倉まい','6003923'],['小紅はるか','0320342'],
  ['千夏','3679423'],['沢海あやか','5994992'],['一花','6837698'],
  ['愛沢','4287466'],['もも','8349786'],['双葉ふうか','9609300'],
  ['美波七海','1757794'],['一ノ瀬','1818230'],['白峯莉子','6472611'],
  ['白石芽郁','5833871'],
].map(([name, castId]) => ({ name, castId, src: null, key: `apex_${castId}` }));
async function fetchApexTherapists() {
  const res = await fetch('https://apex-kichijoji.com/therapist', { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  const castMap = {};
  const reg = /src="(https:\/\/cdn2-caskan\.com\/caskan\/img\/cast_tmb\/\d+_(\d+)\.jpg)"/g;
  let m;
  while ((m = reg.exec(html)) !== null) castMap[m[2]] = m[1];
  return APEX_RAW.map(t => ({ ...t, src: castMap[t.castId] || null }));
}

// ===== Aroma ELLA 三鷹 (9位) S3バケット =====
const ELLA_SHOP = {
  id: 'tokyo_mitaka_mitaka_aroma_ella',
  name: 'Aroma ELLA (アロマエラ)',
  website_url: 'https://aroma-ella.com/',
  schedule_url: null,
  image_url: null,
  raw_data: { prefecture: '東京都', area: '三鷹' },
};
async function fetchEllaTherapists() {
  const res = await fetch('https://aroma-ella.com/therapist', { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  const items = [], seen = new Set();
  // S3 URL: /uploads/therapist_image/image1/{imgId}/{uuid}.jpg
  const imgReg = /src="(https:\/\/aromaella-bucket-prod\.s3[^"]+\/image1\/(\d+)\/[^"]+\.jpg)"/g;
  const nameReg = /<[^>]+>([ぁ-んァ-ヾ一-龯々a-zA-Z\s]{2,12})(?:\s*\(\d+歳\))?\s*<\/[^>]+>/g;
  // HTMLをブロックに分割してname+urlを対応付け
  const blocks = html.split(/<\/(?:li|article|div class="cast|div class="therapist)/i);
  for (const block of blocks) {
    const imgM = block.match(/src="(https:\/\/aromaella-bucket-prod\.s3[^"]+\/image1\/(\d+)\/[^"]+\.jpg)"/);
    if (!imgM) continue;
    const imgId = imgM[2];
    const src = imgM[1];
    // ブロック内テキストから名前
    const txt = block.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const nm = txt.match(/([ぁ-んァ-ヾ一-龯々]{2,8}(?:\s*[ぁ-んァ-ヾ一-龯々]{1,6})?)/);
    const name = nm?.[1]?.replace(/\s+/g, '').trim();
    if (!name || seen.has(imgId) || !name || name.length < 2) continue;
    seen.add(imgId);
    items.push({ name, src, key: `ella_${imgId}` });
  }
  return items;
}

// ===== Mspa 吉祥寺 (10位) PREMIUM SPA CMS =====
const MSPA_SHOP = {
  id: 'tokyo_musashino_kichijoji_mspa',
  name: 'Mspa (エムスパ)',
  website_url: 'https://mspasalon.com/',
  schedule_url: null,
  image_url: null,
  raw_data: { prefecture: '東京都', area: '吉祥寺' },
};
const MSPA_BASE = 'https://mspasalon.com/data/staff';
const MSPA_RAW = [
  ['まな','81','stf_6a22929d5ed8f.jpg'],['ばんび','91','stf_6a203c90e69c0.jpg'],
  ['れんか','92','stf_6a2015720e335.jpg'],['あんり','90','stf_6a2002f14fd56.jpg'],
  ['そら','89','stf_6a1dc883cae95.jpg'],['れあ','88','stf_6a16d7ebe8d9d.jpg'],
  ['せな','85','stf_6a0dd54418064.jpg'],['てぃな','87','stf_6a12c4b9c6924.jpg'],
  ['らら','86','stf_6a0ee061d3b69.jpg'],['もも','84','stf_6a0d8cfbcfc44.jpg'],
  ['ゆな','73','stf_69e0b296837fc.jpg'],['めろ','83','stf_6a06d6100d5c3.jpg'],
  ['かのん','82','stf_6a0590bf75065.jpg'],['ありさ','80','stf_69f57d9e1ee54.jpg'],
  ['なみ','78','stf_69eb14d61c0a0.jpg'],['みやび','74','stf_69e0b3534b382.jpg'],
  ['わかな','72','stf_69e0b1b083cad.jpg'],['えみり','77','stf_69e0b6decd0be.jpg'],
  ['なる','76','stf_69e0b6416f48a.jpg'],['りょうか','18','stf_6995bad8d5281.jpg'],
  ['しの','25','stf_6995d3019f3d2.jpg'],['あやね','30','stf_6995d8b861e2f.jpg'],
  ['らん','35','stf_6996cf7808a00.jpg'],['みずき','31','stf_6996cc2127993.jpg'],
  ['まみ','39','stf_6996d424d7a3f.jpg'],['るね','42','stf_6996d7bcea964.jpg'],
  ['あいり','43','stf_6996dad860f74.jpg'],['るな','44','stf_6996dbd888978.jpg'],
  ['かれん','46','stf_6996e0bbd3e9d.jpg'],['早乙女ひびき','45','stf_6996e02566f18.jpg'],
  ['るる','48','stf_6996e19e01acd.jpg'],['かえで','54','stf_6996ecb48e69b.jpg'],
  ['まり','70','stf_69bd5fa8ceb5c.jpg'],['りか','69','stf_69bd5dcf3898a.jpg'],
  ['りりな','71','stf_69bd6074cbf9b.jpg'],['ありす','68','stf_699874579a7b1.jpg'],
  ['らむ','67','stf_699873fcc2a19.jpg'],['ゆきの','66','stf_6998733c9228c.jpg'],
  ['みゆ','65','stf_6998726443c87.jpg'],['すい','64','stf_699871a01f3c2.jpg'],
  ['あおい','63','stf_69987016909b8.jpg'],['あん','62','stf_69986fbe4e31b.jpg'],
  ['れん','61','stf_69986f4d063bf.jpg'],['りあ','60','stf_69985c53de244.jpg'],
  ['いく','59','stf_69985b9e80fe9.jpg'],['にじほ','58','stf_69985b0e19b97.jpg'],
  ['莉央','57','stf_69985a552b8d3.jpg'],['えな','56','stf_69985526255f2.jpg'],
  ['のの','55','stf_6996ed691d14d.jpg'],['なお','53','stf_6996ec1aaa33e.jpg'],
  ['さや','52','stf_6996e6f9d4a54.jpg'],['あさひ','51','stf_6996e5dd93c20.jpg'],
  ['うか','50','stf_6996e4c3e1b2a.jpg'],['こまつ','49','stf_6996e27158e2d.jpg'],
  ['ゆあん','40','stf_6996d50eab8db.jpg'],['ひかり','38','stf_6996d39d7221a.jpg'],
  ['うい','36','stf_6996d0905add1.jpg'],['るい','34','stf_6996ce60e7528.jpg'],
  ['あむ','33','stf_6996cd2eda7d0.jpg'],['てん','29','stf_6995d7a2a8ab8.jpg'],
  ['もえか','28','stf_6995d66834377.jpg'],['みらい','27','stf_6995d5afda47e.jpg'],
  ['ゆめ','26','stf_6995d3ae7a157.jpg'],['えりか','24','stf_6995d12463026.jpg'],
  ['あいみ','23','stf_6995c9db55431.jpg'],['のあ','22','stf_6995c84aae25b.jpg'],
  ['あみ','21','stf_6995c6f07917b.jpg'],['みお','19','stf_6995c59f28af3.jpg'],
  ['ゆか','17','stf_6995ba4fed352.jpg'],['みれい','16','stf_6995b818d1970.jpg'],
  ['ゆゆ','15','stf_6995b7976f633.jpg'],['ゆうき','14','stf_6995b70b75034.jpg'],
  ['ゆい','13','stf_6995b220adebb.jpg'],['るる2','47','stf_6996e17847cb9.jpg'],
].map(([name, sid, hash]) => ({
  name, src: `${MSPA_BASE}/${sid}/${hash}`, key: `mspa_${sid}`
}));

// ===== 共通ユーティリティ =====
async function uploadImage(imgUrl, key, referer) {
  if (!imgUrl) return null;
  try {
    const headers = { 'User-Agent': 'Mozilla/5.0' };
    if (referer) headers['Referer'] = referer;
    const res = await fetch(imgUrl, { headers });
    if (!res.ok) { process.stdout.write('!'); return null; }
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = imgUrl.split('?')[0].split('.').pop().toLowerCase();
    const ct = ext === 'png' ? 'image/png' : (ext === 'webp' ? 'image/webp' : 'image/jpeg');
    const { error } = await supabase.storage.from('therapist-images').upload(`${key}.jpg`, buf, { contentType: ct, upsert: true });
    if (error) { process.stdout.write('!'); return null; }
    const { data } = supabase.storage.from('therapist-images').getPublicUrl(`${key}.jpg`);
    return data.publicUrl;
  } catch { process.stdout.write('!'); return null; }
}

async function registerShop(s) {
  if (DRY_RUN) { console.log(`[DRY] ${s.id}`); return; }
  const { error } = await supabase.from('shops').upsert(s, { onConflict: 'id' });
  if (error) console.error('Shop error:', error.message);
  else console.log(`✅ ${s.id}`);
}

async function registerTherapists(shopId, therapists, referer) {
  let ins = 0, skp = 0, err = 0;
  for (const t of therapists) {
    const tid = `${shopId}_${t.name}`;
    const { data: ex } = await supabase.from('therapists').select('id,image_url').eq('id', tid).single();
    if (ex?.image_url) { process.stdout.write('='); skp++; continue; }
    const url = (!DRY_RUN && t.src && t.key)
      ? await uploadImage(t.src, t.key, referer)
      : (DRY_RUN && t.src ? '(preview)' : null);
    if (DRY_RUN) { process.stdout.write(url ? '+' : 'n'); ins++; continue; }
    const { error } = await supabase.from('therapists').upsert(
      { id: tid, shop_id: shopId, name: t.name, image_url: url },
      { onConflict: 'id' }
    );
    if (error) { err++; process.stdout.write('x'); }
    else { process.stdout.write(url ? '+' : 'n'); ins++; }
    await new Promise(r => setTimeout(r, 200));
  }
  console.log(`\n  挿入:${ins} スキップ:${skp} エラー:${err}`);
}

async function main() {
  console.log(`=== 吉祥寺・三鷹8店舗 登録 (DRY_RUN=${DRY_RUN}) ===\n`);

  if (run('yorimichi')) {
    console.log('--- Yorimichi (動的取得) ---');
    await registerShop(YORIMICHI_SHOP);
    if (DRY_RUN) { console.log('  [DRY] 本実行時にoptImg一覧を動的取得 (約130名想定)'); }
    else {
      const th = await fetchYorimichi();
      console.log(`  ${th.length}名取得`);
      await registerTherapists(YORIMICHI_SHOP.id, th, 'https://kichijoji-igokochi.com');
    }
  }

  if (run('moshimo')) {
    console.log(`\n--- moshimo ${MOSHIMO_RAW.length}名 ---`);
    await registerShop(MOSHIMO_SHOP);
    await registerTherapists(MOSHIMO_SHOP.id, MOSHIMO_RAW, 'https://menesth-moshimo.com');
  }

  if (run('rookie')) {
    console.log(`\n--- ROOKIE ${ROOKIE_RAW.length}名 ---`);
    await registerShop(ROOKIE_SHOP);
    await registerTherapists(ROOKIE_SHOP.id, ROOKIE_RAW, 'https://rookie-esthe.com');
  }

  if (run('marron')) {
    console.log('\n--- まろん (caskan動的取得) ---');
    await registerShop(MARRON_SHOP);
    if (DRY_RUN) { console.log(`  [DRY] ${MARRON_RAW.length}名 caskan CDN`); }
    else {
      const th = await fetchMarronTherapists();
      console.log(`  ${th.filter(t=>t.src).length}/${th.length}件URL取得`);
      await registerTherapists(MARRON_SHOP.id, th, 'https://aroma-marron.com');
    }
  }

  if (run('madamu')) {
    console.log(`\n--- エステ美人マダム ${MADAMU_RAW.length}名 (名前のみ) ---`);
    await registerShop(MADAMU_SHOP);
    await registerTherapists(MADAMU_SHOP.id, MADAMU_RAW, null);
  }

  if (run('apex')) {
    console.log('\n--- APEX (caskan動的取得) ---');
    await registerShop(APEX_SHOP);
    if (DRY_RUN) { console.log(`  [DRY] ${APEX_RAW.length}名 caskan CDN`); }
    else {
      const th = await fetchApexTherapists();
      console.log(`  ${th.filter(t=>t.src).length}/${th.length}件URL取得`);
      await registerTherapists(APEX_SHOP.id, th, 'https://apex-kichijoji.com');
    }
  }

  if (run('ella')) {
    console.log('\n--- Aroma ELLA (S3動的取得) ---');
    await registerShop(ELLA_SHOP);
    if (DRY_RUN) { console.log('  [DRY] S3バケットから動的取得 (約25名想定)'); }
    else {
      const th = await fetchEllaTherapists();
      console.log(`  ${th.length}名取得`);
      await registerTherapists(ELLA_SHOP.id, th, 'https://aroma-ella.com');
    }
  }

  if (run('mspa')) {
    console.log(`\n--- Mspa ${MSPA_RAW.length}名 ---`);
    await registerShop(MSPA_SHOP);
    await registerTherapists(MSPA_SHOP.id, MSPA_RAW, 'https://mspasalon.com');
  }

  console.log('\n=== 完了 ===');
}
main().catch(console.error);
