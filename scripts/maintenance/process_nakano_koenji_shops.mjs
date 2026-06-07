/**
 * 中野・高円寺エリア 6店舗 登録スクリプト
 *   - Salvador (中野5位) 32名  /data/staff/{sid}/stf_{hash}.jpg (PREMIUM SPA CMS)
 *   - Spaflame (高円寺6位) 54名  /image_girl/{gid}/01.jpg
 *   - JJ 中野 (中野7位) 17名  /images/gals/{castId}-7-...jpg
 *   - Room one (高円寺8位) 17名  /koenji/gazou/{folder}/{file}.jpg
 *   - マダムの楽園 (高円寺9位) 31名  /images_staff/{sid}/01_{ts}.jpg
 *   - Allie (高円寺10位) 47名  /therapist_img/{tid}_1.webp
 *
 * 実行:
 *   node scripts/maintenance/process_nakano_koenji_shops.mjs --dry-run
 *   node scripts/maintenance/process_nakano_koenji_shops.mjs
 *   node scripts/maintenance/process_nakano_koenji_shops.mjs --shop salvador
 *   node scripts/maintenance/process_nakano_koenji_shops.mjs --shop spaflame
 *   node scripts/maintenance/process_nakano_koenji_shops.mjs --shop jj
 *   node scripts/maintenance/process_nakano_koenji_shops.mjs --shop roomone
 *   node scripts/maintenance/process_nakano_koenji_shops.mjs --shop madam
 *   node scripts/maintenance/process_nakano_koenji_shops.mjs --shop allie
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

// ===== Salvador (中野5位) =====
const SALVADOR_SHOP = {
  id: 'tokyo_nakano_nakano_salvador',
  name: 'Salvador (サルバドール)',
  website_url: 'https://salvador.men-este.net/',
  schedule_url: 'https://salvador.men-este.net/schedule.html',
  image_url: null,
  raw_data: { prefecture: '東京都', area: '中野' },
};
// PREMIUM SPA CMS: /data/staff/{sid}/stf_{hash}.jpg
// 動的取得（ページから background-image を抽出）
async function fetchSalvadorTherapists() {
  const res = await fetch('https://salvador.men-este.net/therapist.html', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const html = await res.text();
  const items = [], seen = new Set();
  // background-image: url('.../data/staff/{sid}/stf_{hash}.jpg')
  const bgReg = /background-image:\s*url\(['"]?(https?:\/\/salvador\.men-este\.net\/data\/staff\/(\d+)\/stf_[^'")\s]+)['"]?\)/g;
  let m;
  // 名前はテキストノードから
  const nameReg = /(?:NEW\s+)?([A-Z]{2,10})\s*\(\d+\)/g;
  const allNames = [], allUrls = [];
  let nm;
  while ((nm = nameReg.exec(html)) !== null) {
    if (!allNames.includes(nm[1])) allNames.push(nm[1]);
  }
  while ((m = bgReg.exec(html)) !== null) {
    const url = m[1], sid = m[2];
    if (!allUrls.some(u => u.sid === sid)) allUrls.push({ url, sid });
  }
  // 順番通りに対応（ページ上の出現順）
  const minLen = Math.min(allNames.length, allUrls.length);
  for (let i = 0; i < minLen; i++) {
    const name = allNames[i];
    if (seen.has(name)) continue;
    seen.add(name);
    items.push({ name, src: allUrls[i].url, key: `salvador_${allUrls[i].sid}` });
  }
  return items;
}

// ===== Spaflame (高円寺6位) =====
const SPAFLAME_SHOP = {
  id: 'tokyo_suginami_koenji_spaflame',
  name: 'Spaflame (スパフレイム)',
  website_url: 'https://spa-flame.com/',
  schedule_url: 'https://spa-flame.com/schedule/',
  image_url: null,
  raw_data: { prefecture: '東京都', area: '高円寺' },
};
const SPAFLAME_RAW = [
  ['つむぎ','123'],['のあ','121'],['ここ','120'],['らん','118'],['くみ','115'],
  ['とわ','113'],['ふたば','112'],['るりか','111'],['セイラ','109'],['さき','108'],
  ['優','107'],['れいか','105'],['ひめか','104'],['あいの','103'],['ありす','101'],
  ['ゆりな','100'],['ゆあ','96'],['もえ','92'],['まい','91'],['芽依','89'],
  ['りお','88'],['音羽','87'],['ミイ','85'],['リリー','83'],['みゆめ','80'],
  ['ひな','79'],['まや','76'],['はな','75'],['ゆたか','72'],['みお','69'],
  ['ねね','68'],['あんな','66'],['静香','65'],['夏菜子','64'],['みゆき','60'],
  ['恵麻','58'],['桃香','55'],['るり','51'],['凛','50'],['はるか','47'],
  ['みおり','46'],['よしの','44'],['なな','39'],['めぐ','38'],['きょうこ','34'],
  ['りえ','31'],['まりあ','30'],['ほのか','26'],['えみり','14'],['みき','13'],
  ['みか','12'],['あや','9'],['はるな','7'],['小鳥','6'],
].map(([name, gid]) => ({
  name,
  src: `https://spa-flame.com/image_girl/${gid}/01.jpg`,
  key: `spaflame_${gid}`,
}));

// ===== JJ 中野 (中野7位) =====
const JJ_SHOP = {
  id: 'tokyo_nakano_nakano_jj',
  name: 'JJ (ジェイジェイ) 中野店',
  website_url: 'https://www.spa-jj.tokyo/',
  schedule_url: null,
  image_url: null,
  raw_data: { prefecture: '東京都', area: '中野' },
};
// 動的取得
async function fetchJJTherapists() {
  const res = await fetch('https://www.spa-jj.tokyo/cast.html', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const html = await res.text();
  const items = [], seen = new Set();
  // img src="/images/gals/{castId}-7-..." の castId と、直後の漢字名を対応
  const imgReg = /<img[^>]+src="\/images\/gals\/(\d+)-[^"]*"[^>]*>/g;
  const nameReg = /<[^>]+>([^\s<]{2,8})\s+[ぁ-ん]{2,6}\s+\d+歳/g;
  const castIds = [], names = [];
  let m, nm;
  while ((m = imgReg.exec(html)) !== null) castIds.push(m[1]);
  while ((nm = nameReg.exec(html)) !== null) names.push(nm[1].trim());
  const minLen = Math.min(castIds.length, names.length);
  for (let i = 0; i < minLen; i++) {
    const name = names[i];
    if (seen.has(name)) continue;
    seen.add(name);
    // 画像URLはページから直接抽出
    const urlM = html.match(new RegExp(`/images/gals/${castIds[i]}-[^"]+`));
    const src = urlM ? `https://www.spa-jj.tokyo${urlM[0]}` : null;
    items.push({ name, gid: castIds[i], src, key: `jj_${castIds[i]}` });
  }
  return items;
}

// ===== Room one (高円寺8位) =====
const ROOMONE_SHOP = {
  id: 'tokyo_suginami_koenji_room_one',
  name: 'Room one (ルームワン)',
  website_url: 'https://www.aroma-yuim.com/koenji/',
  schedule_url: 'https://www.aroma-yuim.com/koenji/koenji-r1top.html',
  image_url: null,
  raw_data: { prefecture: '東京都', area: '高円寺' },
};
const BASE_R1 = 'https://www.aroma-yuim.com';
const ROOMONE_RAW = [
  ['小峰', `${BASE_R1}/koenji/gazou/101komine/2026.03komine4-2.jpg`],
  ['愛内', `${BASE_R1}/koenji/gazou/0100aiuti/2025.12.aiuti1-2.jpg`],
  ['天海', `${BASE_R1}/koenji/gazou/099amami/amami2-2.jpg`],
  ['片瀬', `${BASE_R1}/koenji/gazou/093katase/katase2025.08-12-2.jpg`],
  ['幸村', `${BASE_R1}/koenji/gazou/087yukimura/yukimura7-2.jpg`],
  ['森満', `${BASE_R1}/koenji/gazou/081morimitu/morimitu1.2024.6-1-21.jpg`],
  ['黒木', `${BASE_R1}/koenji/gazou/080kuroki/20243.03.30kuroki2-2.jpg`],
  ['有坂', `${BASE_R1}/029ariska/2023.04/2023.04arisaka1-3.jpg`],
  ['藤崎', `${BASE_R1}/koenji/gazou/026fujisaki/fujisaki5..jpg`],
  ['工藤', `${BASE_R1}/koenji/gazou/012kudou/kudou2021-4-1.jpg`],
  ['神咲', `${BASE_R1}/001kanzaki/2022.02.23/2022.02-2-1.jpg`],
  ['小川', `${BASE_R1}/035ogawa/2021.06/ogawa10-2.jpg`],
  ['平瀬', `${BASE_R1}/koenji/gazou/076hirase/2023.11hirase1-2.jpg`],
  ['相沢', `${BASE_R1}/koenji/gazou/028aizawa/aizawa1-1.jpg`],
  ['吉沢', `${BASE_R1}/koenji/gazou/075yosizawa/20231.10yosizawa2-2.jpg`],
  ['松岡', `${BASE_R1}/koenji/gazou/055matuoka/matuoka2022.3-2.jpg`],
  ['ゆみ',  `${BASE_R1}/koenji/gazou/082yumi/202411.06yumi2-1.jpg`],
].map(([name, src]) => ({
  name,
  src,
  key: `roomone_${src.split('/').slice(-2,-1)[0].replace(/[^a-z0-9]/gi,'').toLowerCase().slice(0,16)}`,
}));

// ===== マダムの楽園 (高円寺9位) =====
const MADAM_SHOP = {
  id: 'tokyo_suginami_koenji_madam_rakuen',
  name: 'マダムの楽園',
  website_url: 'https://madam-tokyo.net/',
  schedule_url: 'https://madam-tokyo.net/schedule/',
  image_url: null,
  raw_data: { prefecture: '東京都', area: '高円寺' },
};
// [name, sid, timestamp]
const MADAM_RAW = [
  ['蒼井','84','1778835246'],['宮瀬','3','1638287354'],['長谷川','70','1729311072'],
  ['倉田','64','1726676988'],['佐藤','77','1773597787'],['櫻井','73','1774504042'],
  ['藍川','80','1770193018'],['清水','78','1754603039'],['小西','44','1699549322'],
  ['岩崎','60','1713615324'],['南','11','1725598491'],['松本','83','1774440216'],
  ['杉浦','21','1680891587'],['坂井','33','1725598468'],['長澤','67','1721032140'],
  ['水野','27','1693812365'],['春木','61','1715566389'],['里中','65','1731152192'],
  ['青木','51','1706069450'],['工藤','58','1711024448'],['桜木','14','1659164524'],
  ['美嶋','35','1695721246'],['橘','28','1695299911'],['如月','26','1693557685'],
  ['栗田','40','1697089382'],['篠田','25','1693315552'],['本田','19','1671341729'],
  ['吉沢','20','1671792455'],['高山','16','1694839176'],['中野','15','1661840457'],
  ['安藤','6','1640461290'],
].map(([name, sid, ts]) => ({
  name,
  src: `https://madam-tokyo.net/images_staff/${sid}/01_${ts}.jpg`,
  key: `madam_${sid}`,
}));

// ===== Allie 高円寺 (高円寺10位) =====
const ALLIE_SHOP = {
  id: 'tokyo_suginami_koenji_allie',
  name: 'Allie (アリー) 高円寺店',
  website_url: 'https://allie-kichijoji.jp/',
  schedule_url: 'https://allie-kichijoji.jp/schedule/',
  image_url: null,
  raw_data: { prefecture: '東京都', area: '高円寺' },
};
const ALLIE_RAW = [
  ['夜空まふゆ','414'],['須賀かな','412'],['山田りん','411'],['桜庭ゆいな','410'],['吉沢かんな','409'],
  ['白咲のえ','406'],['春宮ひより','407'],['若葉はるか','405'],['山本まいか','402'],['八乙女ゆら','398'],
  ['咲間ほのか','391'],['楠木かえで','388'],['小鳥ひまり','385'],['辻ことみ','383'],['高峯あんず','382'],
  ['池田ちか','380'],['八木まい','376'],['雛森ねね','392'],['胡桃まや','364'],['村井みう','351'],
  ['浜辺しずく','347'],['稲葉もえ','332'],['堀口りか','327'],['夢乃ふうか','326'],['篠原しほ','322'],
  ['上宮ちな','317'],['白雪はく','314'],['芦田まこ','311'],['大槻ゆか','309'],['真野めい','308'],
  ['華本かれん','401'],['木南こはる','265'],['宮条れな','396'],['牧野のぞみ','307'],['水野なみ','263'],
  ['有栖まりあ','234'],['佐藤あみ','199'],['早川ましろ','181'],['一条えみか','180'],['柚月りお','297'],
  ['栗山あかり','168'],['月島さら','140'],['小桜みき','177'],['天乃なな','135'],['黒崎まゆ','97'],
  ['安西りんか','134'],['七海ゆうな','59'],
].map(([name, tid]) => ({
  name,
  src: `https://allie-kichijoji.jp/therapist_img/${tid}_1.webp`,
  key: `allie_${tid}`,
}));

// ===== 共通ユーティリティ =====
async function uploadImage(imgUrl, key, referer) {
  try {
    const headers = { 'User-Agent': 'Mozilla/5.0' };
    if (referer) headers['Referer'] = referer;
    const res = await fetch(imgUrl, { headers });
    if (!res.ok) { process.stdout.write('!'); return null; }
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = imgUrl.split('?')[0].split('.').pop().toLowerCase();
    const ct = (ext === 'png') ? 'image/png' : (ext === 'webp' ? 'image/webp' : 'image/jpeg');
    const { error } = await supabase.storage.from('therapist-images').upload(`${key}.jpg`, buf, { contentType: ct, upsert: true });
    if (error) { process.stdout.write('!'); return null; }
    const { data } = supabase.storage.from('therapist-images').getPublicUrl(`${key}.jpg`);
    return data.publicUrl;
  } catch { process.stdout.write('!'); return null; }
}

async function registerShop(s) {
  if (DRY_RUN) { console.log(`[DRY] Shop: ${s.id}`); return; }
  const { error } = await supabase.from('shops').upsert(s, { onConflict: 'id' });
  if (error) console.error('Shop error:', error.message);
  else console.log(`✅ shop: ${s.id}`);
}

async function registerTherapists(shopId, therapists, referer) {
  let ins = 0, skp = 0, err = 0;
  for (const t of therapists) {
    const tid = `${shopId}_${t.name}`;
    const { data: ex } = await supabase.from('therapists').select('id,image_url').eq('id', tid).single();
    if (ex?.image_url) { process.stdout.write('='); skp++; continue; }
    const url = (!DRY_RUN && t.src && t.key)
      ? await uploadImage(t.src, t.key, referer)
      : (DRY_RUN && t.src ? t.src : null);
    if (DRY_RUN) { process.stdout.write(url ? '+' : 'n'); ins++; continue; }
    const { error } = await supabase.from('therapists').upsert(
      { id: tid, shop_id: shopId, name: t.name, image_url: url },
      { onConflict: 'id' }
    );
    if (error) { console.error(`\n✗ ${t.name}`); err++; }
    else { process.stdout.write(url ? '+' : 'n'); ins++; }
    await new Promise(r => setTimeout(r, 200));
  }
  console.log(`\n挿入:${ins} スキップ:${skp} エラー:${err}`);
}

async function main() {
  console.log(`=== 中野・高円寺6店舗 登録 (DRY_RUN=${DRY_RUN}) ===\n`);
  const run = (n) => !shopArg || shopArg === n;

  if (run('salvador')) {
    console.log('--- Salvador (動的取得中) ---');
    await registerShop(SALVADOR_SHOP);
    if (!DRY_RUN) {
      const therapists = await fetchSalvadorTherapists();
      console.log(`${therapists.length}名取得`);
      await registerTherapists(SALVADOR_SHOP.id, therapists, 'https://salvador.men-este.net');
    } else {
      console.log('[DRY] Salvador: 本実行時にページから動的取得します (約32名想定)');
    }
  }

  if (run('spaflame')) {
    console.log(`\n--- Spaflame ${SPAFLAME_RAW.length}名 ---`);
    await registerShop(SPAFLAME_SHOP);
    await registerTherapists(SPAFLAME_SHOP.id, SPAFLAME_RAW, 'https://spa-flame.com');
  }

  if (run('jj')) {
    console.log('\n--- JJ 中野 (動的取得中) ---');
    await registerShop(JJ_SHOP);
    if (!DRY_RUN) {
      const therapists = await fetchJJTherapists();
      console.log(`${therapists.length}名取得`);
      await registerTherapists(JJ_SHOP.id, therapists, 'https://www.spa-jj.tokyo');
    } else {
      console.log('[DRY] JJ: 本実行時にページから動的取得します (約17名想定)');
    }
  }

  if (run('roomone')) {
    console.log(`\n--- Room one ${ROOMONE_RAW.length}名 ---`);
    await registerShop(ROOMONE_SHOP);
    await registerTherapists(ROOMONE_SHOP.id, ROOMONE_RAW, 'https://www.aroma-yuim.com');
  }

  if (run('madam')) {
    console.log(`\n--- マダムの楽園 ${MADAM_RAW.length}名 ---`);
    await registerShop(MADAM_SHOP);
    await registerTherapists(MADAM_SHOP.id, MADAM_RAW, 'https://madam-tokyo.net');
  }

  if (run('allie')) {
    console.log(`\n--- Allie ${ALLIE_RAW.length}名 ---`);
    await registerShop(ALLIE_SHOP);
    await registerTherapists(ALLIE_SHOP.id, ALLIE_RAW, 'https://allie-kichijoji.jp');
  }

  console.log('\n=== 完了 ===');
}
main().catch(console.error);
