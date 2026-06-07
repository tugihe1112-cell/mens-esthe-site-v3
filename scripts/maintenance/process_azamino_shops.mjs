/**
 * あざみ野・センター南エリア 8店舗 登録スクリプト
 *   - む・む・むSPA   1位 ~90名  caskan CDN  (動的)
 *   - Cuas           2位   8名  aroma-tsushin (ハードコード)
 *   - honoka         3位  ~40名  optImg/ CMS  (動的)
 *   - AUDIENCE       4位  ~60名  caskan CDN  (動的)
 *   - KAHLUA MILK    6位  ~34名  WordPress   (ハードコード)
 *   - su:            7位   7名  /photos/    (ハードコード)
 *   - iDOL           9位  19名  /photos/    (動的)
 *   ※ MOANA あざみ野(5位)は溝の口で登録済み
 *   ※ LIEN(10位)は出張型のためスキップ
 *
 * 実行:
 *   node scripts/maintenance/process_azamino_shops.mjs --dry-run
 *   node scripts/maintenance/process_azamino_shops.mjs
 *   node scripts/maintenance/process_azamino_shops.mjs --shop mumumu
 *   node scripts/maintenance/process_azamino_shops.mjs --shop cuas
 *   node scripts/maintenance/process_azamino_shops.mjs --shop honoka
 *   node scripts/maintenance/process_azamino_shops.mjs --shop audience
 *   node scripts/maintenance/process_azamino_shops.mjs --shop kahlua
 *   node scripts/maintenance/process_azamino_shops.mjs --shop su
 *   node scripts/maintenance/process_azamino_shops.mjs --shop idol
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const DRY_RUN = process.argv.includes('--dry-run');
const shopArg = (() => { const i = process.argv.indexOf('--shop'); return i >= 0 ? process.argv[i+1] : null; })();
const run = (n) => !shopArg || shopArg === n;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';

async function uploadImage(src, key, referer) {
  if (!src) return null;
  try {
    const res = await fetch(src, { headers: { 'User-Agent': UA, ...(referer ? { 'Referer': referer } : {}) } });
    if (!res.ok) { process.stdout.write('!'); return null; }
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = src.split('?')[0].toLowerCase();
    const ct = ext.endsWith('.png') ? 'image/png' : (ext.endsWith('.webp') ? 'image/webp' : 'image/jpeg');
    const { error } = await supabase.storage.from('therapist-images').upload(`${key}.jpg`, buf, { contentType: ct, upsert: true });
    if (error) { process.stdout.write('E'); return null; }
    const { data } = supabase.storage.from('therapist-images').getPublicUrl(`${key}.jpg`);
    return data.publicUrl;
  } catch { process.stdout.write('!'); return null; }
}

async function registerShop(shop) {
  if (DRY_RUN) { console.log(`  [DRY] ${shop.id}`); return; }
  const { error } = await supabase.from('shops').upsert(shop, { onConflict: 'id' });
  if (error) console.error('  Shop error:', error.message);
  else console.log(`  ✅ ${shop.id}`);
}

async function registerTherapists(shopId, therapists, referer) {
  let ins = 0, skp = 0, err = 0;
  for (const t of therapists) {
    const tid = `${shopId}_${t.name}`;
    const { data: ex } = await supabase.from('therapists').select('id,image_url').eq('id', tid).single();
    if (ex?.image_url) { process.stdout.write('='); skp++; continue; }
    if (DRY_RUN) { process.stdout.write('+'); ins++; continue; }
    const url = await uploadImage(t.src, t.key, referer);
    const { error } = await supabase.from('therapists').upsert(
      { id: tid, shop_id: shopId, name: t.name, image_url: url },
      { onConflict: 'id' }
    );
    if (error) { err++; process.stdout.write('x'); }
    else { process.stdout.write(url ? '+' : 'n'); ins++; }
    await new Promise(r => setTimeout(r, 150));
  }
  console.log(`\n  挿入:${ins} スキップ:${skp} エラー:${err}`);
}

// caskan CDN 動的スクレイピング
async function fetchCaskan(url, keyPrefix) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  const html = await res.text();
  const items = [], seen = new Set();
  const NOISE = /早割|キャンペーン|新人セラピスト|会員様限定|DAY!!|comingsoon/i;
  const reg = /alt="([^"]+)"[^>]*src="(https:\/\/cdn2-caskan\.com\/caskan\/img\/cast_tmb\/\d+_(\d+)\.[^"]+)"/gi;
  const reg2 = /src="(https:\/\/cdn2-caskan\.com\/caskan\/img\/cast_tmb\/\d+_(\d+)\.[^"]+)"[^>]*alt="([^"]+)"/gi;
  let m;
  for (const [r, ni, si, srci] of [[reg, 1, 3, 2], [reg2, 3, 2, 1]]) {
    r.lastIndex = 0;
    while ((m = r.exec(html)) !== null) {
      const name = m[ni].trim();
      const castId = m[si];
      const src = m[srci];
      if (src.includes('comingsoon')) continue;
      if (!name || name.length < 2 || name.length > 15 || seen.has(name) || NOISE.test(name)) continue;
      seen.add(name);
      items.push({ name, castId, src, key: `${keyPrefix}_${castId}` });
    }
    if (items.length > 0) break;
  }
  return items;
}

// /photos/ 動的スクレイピング
async function fetchPhotos(url, keyPrefix, origin) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  const html = await res.text();
  const items = [], seen = new Set();
  const NOISE = /割引|キャンペーン|banner|logo|予約|コース|料金|spacer|icon|求人/i;
  const reg = /alt="([^"]+)"[^>]*src="([^"]+\/photos\/(\d+)\/[^"]+)"/gi;
  let m;
  while ((m = reg.exec(html)) !== null) {
    const name = m[1].replace(/\s*\(\d+\)\s*/g,'').replace(/[\s　]+/g,'').trim();
    const lid = m[3];
    if (!name || name.length < 2 || seen.has(name) || NOISE.test(name)) continue;
    if (!/[ぁ-んァ-ヾ一-龯]/.test(name)) continue;
    seen.add(name);
    items.push({ name, lid, src: `${origin}/photos/${lid}/moto_${lid}.jpg`, key: `${keyPrefix}_${lid}` });
  }
  return items;
}

// optImg/ 動的スクレイピング (Mirajour/Yorimichi/honoka系)
async function fetchOptImg(url, keyPrefix) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  const html = await res.text();
  const items = [], seen = new Set();
  const reg = /alt="([^"2][^"]{0,10})"[^>]*src="([^"]+\/optImg\/[^"]+)"/gi;
  let m;
  while ((m = reg.exec(html)) !== null) {
    const name = m[1].replace(/[\s　]+/g,'').trim();
    const src = m[2].split('?')[0];
    if (!name || name.endsWith('2') || name.length < 2 || name.length > 12 || seen.has(name)) continue;
    if (!/[ぁ-んァ-ヾ一-龯]/.test(name)) continue;
    seen.add(name);
    const fn = src.split('/').pop().slice(0,20);
    items.push({ name, src, key: `${keyPrefix}_${fn}` });
  }
  return items;
}

// ── Cuas ハードコードデータ (8名, aroma-tsushin.com CDN) ──────
const CUAS_THERAPISTS = [
  {name:'西園寺凛',  src:'https://aroma-tsushin.com/__admin/img_hp/staff_20110_1766999299788693.jpeg', key:'cuas_20110'},
  {name:'春名',      src:'https://aroma-tsushin.com/__admin/img_hp/staff_17008_1617214970801512.jpg',  key:'cuas_17008'},
  {name:'伊織',      src:'https://aroma-tsushin.com/__admin/img_hp/staff_19469_1715043729355398.jpeg', key:'cuas_19469'},
  {name:'萌野',      src:'https://aroma-tsushin.com/__admin/img_hp/staff_20109_1766996693715901.jpeg', key:'cuas_20109'},
  {name:'蒼井',      src:'https://aroma-tsushin.com/__admin/img_hp/staff_18856_1689049468302977.jpeg', key:'cuas_18856'},
  {name:'桃花',      src:'https://aroma-tsushin.com/__admin/img_hp/staff_20108_1766996297785792.jpeg', key:'cuas_20108'},
  {name:'優木',      src:'https://aroma-tsushin.com/__admin/img_hp/staff_18462_1672886155769151.jpeg', key:'cuas_18462'},
  {name:'舞川',      src:'https://aroma-tsushin.com/__admin/img_hp/staff_18264_1665227767167550.jpeg', key:'cuas_18264'},
];

// ── KAHLUA MILK ハードコードデータ (34名, WordPress) ──────────
const KAHLUA_THERAPISTS = [
  {name:'香月あまね',  src:'https://kahlua-esthe.com/wp-content/uploads/2026/06/IMG_1001.jpeg',          key:'kahlua_IMG_1001'},
  {name:'あすか',      src:'https://kahlua-esthe.com/wp-content/uploads/2026/05/IMG_0816-1.jpeg',         key:'kahlua_IMG_0816_1'},
  {name:'愛川ひとみ',  src:'https://kahlua-esthe.com/wp-content/uploads/2026/04/IMG_0543.jpeg',           key:'kahlua_IMG_0543'},
  {name:'笹木わかな',  src:'https://kahlua-esthe.com/wp-content/uploads/2025/11/IMG_9984.jpeg',           key:'kahlua_IMG_9984'},
  {name:'楠ましろ',    src:'https://kahlua-esthe.com/wp-content/uploads/2025/09/IMG_9797.jpeg',           key:'kahlua_IMG_9797'},
  {name:'琴音いずみ',  src:'https://kahlua-esthe.com/wp-content/uploads/2025/10/IMG_8581.jpeg',           key:'kahlua_IMG_8581'},
  {name:'浅野みなみ',  src:'https://kahlua-esthe.com/wp-content/uploads/2023/02/IMG_0747.jpeg',           key:'kahlua_IMG_0747'},
  {name:'岸谷みりあ',  src:'https://kahlua-esthe.com/wp-content/uploads/2026/01/IMG_9426.jpeg',           key:'kahlua_IMG_9426'},
  {name:'綾瀬りか',    src:'https://kahlua-esthe.com/wp-content/uploads/2025/09/IMG_9191.jpeg',           key:'kahlua_IMG_9191'},
  {name:'藍沢せいか',  src:'https://kahlua-esthe.com/wp-content/uploads/2025/09/IMG_9286.jpeg',           key:'kahlua_IMG_9286'},
  {name:'結城しおん',  src:'https://kahlua-esthe.com/wp-content/uploads/2025/08/IMG_8781.jpeg',           key:'kahlua_IMG_8781'},
  {name:'星咲のの',    src:'https://kahlua-esthe.com/wp-content/uploads/2025/07/IMG_8362.jpeg',           key:'kahlua_IMG_8362'},
  {name:'みつき',      src:'https://kahlua-esthe.com/wp-content/uploads/2025/05/IMG_7620.jpeg',           key:'kahlua_IMG_7620'},
  {name:'島袋さな',    src:'https://kahlua-esthe.com/wp-content/uploads/2025/02/IMG_6832.jpeg',           key:'kahlua_IMG_6832'},
  {name:'橘彩芽',      src:'https://kahlua-esthe.com/wp-content/uploads/2025/01/IMG_6654.jpeg',           key:'kahlua_IMG_6654'},
  {name:'富永りさ',    src:'https://kahlua-esthe.com/wp-content/uploads/2023/02/ac104cbb757720ff7ad5005a9f182cb0.jpg', key:'kahlua_ac104cbb'},
  {name:'葉月みるく',  src:'https://es-men.com/kahlua-milk/wp-content/uploads/2023/02/484BE587-4E92-4B9F-9FE0-60C569DC4F6A.jpeg', key:'kahlua_484BE587'},
  {name:'荒木りな',    src:'https://kahlua-esthe.com/wp-content/uploads/2024/12/IMG_6054.jpeg',           key:'kahlua_IMG_6054'},
  {name:'上条あんな',  src:'https://kahlua-esthe.com/wp-content/uploads/2024/11/1.jpg',                   key:'kahlua_1'},
  {name:'甘羽ゆかり',  src:'https://kahlua-esthe.com/wp-content/uploads/2024/09/IMG_5578.jpeg',           key:'kahlua_IMG_5578'},
  {name:'天野みや',    src:'https://es-men.com/kahlua-milk/wp-content/uploads/2023/09/IMG_1431.jpeg',     key:'kahlua_IMG_1431'},
  {name:'桜井そら',    src:'https://kahlua-esthe.com/wp-content/uploads/2024/09/IMG_5609.jpeg',           key:'kahlua_IMG_5609'},
  {name:'神谷けい',    src:'https://kahlua-esthe.com/wp-content/uploads/2024/09/IMG_5553.png',            key:'kahlua_IMG_5553'},
  {name:'佐藤フウナ',  src:'https://kahlua-esthe.com/wp-content/uploads/2024/08/IMG_5392.jpeg',           key:'kahlua_IMG_5392'},
  {name:'乙藤ことは',  src:'https://es-men.com/kahlua-milk/wp-content/uploads/2023/09/IMG_1606.png',      key:'kahlua_IMG_1606'},
  {name:'佐藤ゆあん',  src:'https://kahlua-esthe.com/wp-content/uploads/2024/06/IMG_4577.jpeg',           key:'kahlua_IMG_4577'},
  {name:'北条リルカ',  src:'https://kahlua-esthe.com/wp-content/uploads/2024/07/IMG_5042.jpeg',           key:'kahlua_IMG_5042'},
  {name:'白川あや',    src:'https://kahlua-esthe.com/wp-content/uploads/2024/04/IMG_3803.jpeg',           key:'kahlua_IMG_3803'},
  {name:'望月もか',    src:'https://kahlua-esthe.com/wp-content/uploads/2024/04/IMG_3795.jpeg',           key:'kahlua_IMG_3795'},
  {name:'青山りさ',    src:'https://kahlua-esthe.com/wp-content/uploads/2024/05/S__185671731.jpg',        key:'kahlua_S__185671731'},
  {name:'愛沢えり',    src:'https://kahlua-esthe.com/wp-content/uploads/2024/02/IMG_3440.jpeg',           key:'kahlua_IMG_3440'},
  {name:'白石えりな',  src:'https://es-men.com/kahlua-milk/wp-content/uploads/2023/04/0A937919-CFB7-4082-83B8-E0FC1DF1EE06.jpeg', key:'kahlua_0A937919'},
  {name:'藤沢ゆうな',  src:'https://es-men.com/kahlua-milk/wp-content/uploads/2023/10/IMG_2160.jpeg',     key:'kahlua_IMG_2160k'},
  {name:'あまいみかん', src:'https://es-men.com/kahlua-milk/wp-content/uploads/2023/04/IMG_0100.jpeg',    key:'kahlua_IMG_0100'},
];

// ── su: ハードコードデータ (7名, /photos/) ─────────────────────
const SU_THERAPISTS = [
  {name:'ちゃんリエ', src:'https://relaxation-su.net/photos/2/moto_2.jpg',   key:'su_2'},
  {name:'星野',       src:'https://relaxation-su.net/photos/13/moto_13.jpg', key:'su_13'},
  {name:'明莉',       src:'https://relaxation-su.net/photos/7/moto_7.jpg',   key:'su_7'},
  {name:'蒼井',       src:'https://relaxation-su.net/photos/10/moto_10.jpg', key:'su_10'},
  {name:'花咲',       src:'https://relaxation-su.net/photos/5/moto_5.jpg',   key:'su_5'},
  {name:'七瀬',       src:'https://relaxation-su.net/photos/3/moto_3.jpg',   key:'su_3'},
  {name:'天海',       src:'https://relaxation-su.net/photos/1/moto_1.jpg',   key:'su_1'},
];

// ── 店舗定義 ──────────────────────────────────────────────────
const SHOPS = [
  {
    arg: 'mumumu',
    shop: { id: 'kanagawa_yokohama_azamino_mumumu_spa', name: 'む・む・むSPA (ムムムスパ) あざみ野', website_url: 'https://mumumu-sap.com/', schedule_url: 'https://mumumu-sap.com/schedule', image_url: null, raw_data: { prefecture: '神奈川県', area: 'あざみ野' } },
    fetchFn: () => fetchCaskan('https://mumumu-sap.com/therapist', 'mumumu'),
    referer: null,
  },
  {
    arg: 'cuas',
    shop: { id: 'kanagawa_yokohama_azamino_cuas', name: 'Cuas (キュアス)', website_url: 'https://cuas-azamino.com/', schedule_url: null, image_url: null, raw_data: { prefecture: '神奈川県', area: 'あざみ野' } },
    fetchFn: async () => CUAS_THERAPISTS,
    referer: 'https://cuas-azamino.com/',
  },
  {
    arg: 'honoka',
    shop: { id: 'kanagawa_yokohama_center_minami_honoka', name: 'honoka (ほのか) センター南', website_url: 'https://honoka-yokohama.com/', schedule_url: 'https://honoka-yokohama.com/scheduleAll.html', image_url: null, raw_data: { prefecture: '神奈川県', area: 'センター南' } },
    fetchFn: () => fetchOptImg('https://honoka-yokohama.com/itemList.html', 'honoka'),
    referer: 'https://honoka-yokohama.com/',
  },
  {
    arg: 'audience',
    shop: { id: 'kanagawa_yokohama_aoba_audience', name: 'AUDIENCE (オーディエンス)', website_url: 'https://audience-spa.com/', schedule_url: 'https://audience-spa.com/schedule', image_url: null, raw_data: { prefecture: '神奈川県', area: 'あざみ野' } },
    fetchFn: () => fetchCaskan('https://audience-spa.com/therapist', 'audience'),
    referer: null,
  },
  {
    arg: 'kahlua',
    shop: { id: 'kanagawa_yokohama_aoba_kahlua_milk', name: 'KAHLUA MILK (カルーアミルク)', website_url: 'https://kahlua-esthe.com/', schedule_url: 'https://kahlua-esthe.com/schedule/', image_url: null, raw_data: { prefecture: '神奈川県', area: '青葉台' } },
    fetchFn: async () => KAHLUA_THERAPISTS,
    referer: 'https://kahlua-esthe.com/',
  },
  {
    arg: 'su',
    shop: { id: 'kanagawa_yokohama_nagatsuta_su', name: 'su: (スゥ)', website_url: 'https://relaxation-su.net/', schedule_url: 'https://relaxation-su.net/schedule', image_url: null, raw_data: { prefecture: '神奈川県', area: 'あざみ野' } },
    fetchFn: async () => SU_THERAPISTS,
    referer: 'https://relaxation-su.net/',
  },
  {
    arg: 'idol',
    shop: { id: 'kanagawa_yokohama_center_minami_idol', name: 'iDOL (アイドル) センター南', website_url: 'https://idol-official.com/', schedule_url: 'https://idol-official.com/schedule', image_url: null, raw_data: { prefecture: '神奈川県', area: 'センター南' } },
    fetchFn: () => fetchPhotos('https://idol-official.com/girl', 'idol', 'https://idol-official.com'),
    referer: 'https://idol-official.com/',
  },
];

async function main() {
  console.log(`=== あざみ野・センター南 7店舗 登録 (DRY_RUN=${DRY_RUN}) ===\n`);
  for (const { arg, shop, fetchFn, referer } of SHOPS) {
    if (!run(arg)) continue;
    console.log(`--- ${shop.name} ---`);
    await registerShop(shop);
    const therapists = await fetchFn();
    console.log(`  ${therapists.length}名取得`);
    if (therapists.length === 0) { console.log('  ⚠️ 取得失敗'); continue; }
    await registerTherapists(shop.id, therapists, referer);
  }
  console.log('\n=== 完了 ===');
}
main().catch(console.error);
