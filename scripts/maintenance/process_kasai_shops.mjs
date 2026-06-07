/**
 * 葛西・浦安エリア 9店舗 登録スクリプト
 *   - GIRIGIRILAND  (1位) 20名  /prof/{pid}/top.jpg
 *   - 内緒のカノジョ (2位) 20名  /prof/{pid}/top.jpg
 *   - Oblige        (3位) 38名  /staff/{HASH}/01.jpg
 *   - LaMer         (4位) 52名  S3バケット (lamer-bucket-prod)
 *   - AROMA VENUS   (5位) 20名  /prof/{pid}/top.jpg
 *   - NOBLE         (7位) 45名  /staff/{HASH}/01.jpg
 *   - Onikando      (8位) 38名  caskan.com CDN
 *   - UBU彼女       (9位) 43名  名前のみ (動的取得)
 *   - PhiPhiLei    (10位) 55名  /staff/{HASH}/01.jpg
 *
 * 実行:
 *   node scripts/maintenance/process_kasai_shops.mjs --dry-run
 *   node scripts/maintenance/process_kasai_shops.mjs
 *   node scripts/maintenance/process_kasai_shops.mjs --shop giri
 *   node scripts/maintenance/process_kasai_shops.mjs --shop naishoka
 *   node scripts/maintenance/process_kasai_shops.mjs --shop oblige
 *   node scripts/maintenance/process_kasai_shops.mjs --shop lamer
 *   node scripts/maintenance/process_kasai_shops.mjs --shop venus
 *   node scripts/maintenance/process_kasai_shops.mjs --shop noble
 *   node scripts/maintenance/process_kasai_shops.mjs --shop onikando
 *   node scripts/maintenance/process_kasai_shops.mjs --shop ubu
 *   node scripts/maintenance/process_kasai_shops.mjs --shop pipi
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const DRY_RUN = process.argv.includes('--dry-run');
const shopArg = (() => { const i = process.argv.indexOf('--shop'); return i >= 0 ? process.argv[i+1] : null; })();
const run = (n) => !shopArg || shopArg === n;

// ===== GIRIGIRILAND (西葛西1位) =====
const GIRI_SHOP = {
  id: 'tokyo_edogawa_nishikasai_girigiriland',
  name: 'GIRIGIRILAND (ギリギリランド)',
  website_url: 'https://www.girigiriland.net/',
  schedule_url: null,
  image_url: null,
  raw_data: { prefecture: '東京都', area: '葛西' },
};
const GIRI_RAW = [
  ['蒼空','161'],['咲良','157'],['詩乃','160'],['香里奈','156'],['天使','155'],
  ['森谷','125'],['石原','61'],['柚村','153'],['鳴海','151'],['藍沢','126'],
  ['藤崎','138'],['雨宮','132'],['天羽','133'],['観月','93'],['姫野','22'],
  ['七瀬','98'],['雪乃','111'],['絢野','137'],['神崎','69'],['木南','80'],
].map(([name, pid]) => ({name, src:`https://www.girigiriland.net/prof/${pid}/top.jpg`, key:`giri_${pid}`}));

// ===== 内緒のカノジョ (葛西2位) =====
const NAISHOKA_SHOP = {
  id: 'tokyo_edogawa_kasai_naishokano_kanojo',
  name: '内緒のカノジョ',
  website_url: 'https://www.naishokasai.net/',
  schedule_url: null,
  image_url: null,
  raw_data: { prefecture: '東京都', area: '葛西' },
};
const NAISHOKA_RAW = [
  ['りほ','135'],['あさみ','134'],['みつき','130'],['ゆいな','125'],['みお','102'],
  ['あすか','119'],['はるな','104'],['かんな','107'],['くみこ','131'],['りさ','7'],
  ['ふみの','113'],['あや','117'],['まゆ','121'],['さくら','124'],['ひかり','105'],
  ['めい','111'],['ななせ','103'],['あきな','99'],['みなみ','83'],['あかね','87'],
].map(([name, pid]) => ({name, src:`https://www.naishokasai.net/prof/${pid}/top.jpg`, key:`naishoka_${pid}`}));

// ===== Oblige (葛西3位) =====
const OBLIGE_SHOP = {
  id: 'tokyo_edogawa_kasai_oblige',
  name: 'Oblige (オブリージュ)',
  website_url: 'https://ob-lige.net/',
  schedule_url: 'https://ob-lige.net/schedule.php',
  image_url: null,
  raw_data: { prefecture: '東京都', area: '葛西' },
};
// 名前と画像HASH (名前に（）読み含む場合は除去済み)
const OBLIGE_RAW = [
  ['音瀬るな','4D6763C3'],['春野みつき','DD4C641C'],['蒼井さな','37CC57AC'],
  ['白石もも','5E257AE2'],['神白きい','DE961B74'],['黒木みゆ','3992994D'],
  ['秋元もえか','36C6D093'],['飛鳥きらり','BCD9A2DD'],['月乃もか','AA8CC1E3'],
  ['入間あずさ','22F51216'],['浜辺まい','F2F5FD0C'],['岡野はな','7F8A6935'],
  ['陽色りな','4852A3B2'],['恋口みほ','CD0CEF1C'],['石原れおな','D98C3FD7'],
  ['南野みなみ','02F1CD14'],['指原みお','58E5A015'],['松井みな','23117A14'],
  ['浅倉ゆい','508327A3'],['胡桃のあ','87FF8B48'],['滝沢じゅん','22113C95'],
  ['望月かれん','29F37604'],['西野えま','35635F8D'],['井上しずか','5E3B536C'],
  ['有栖ひな','64CBE470'],['島崎あすか','50A11DA5'],['霧谷りお','1D5EF52F'],
  ['榮倉まな','9FA86CD2'],['立花しおり','4715E814'],['今宮はるひ','DE8C2C64'],
  ['一之瀬みれい','C8C310FA'],['堀うらら','0BBD6BCC'],['桃木もえ','13CB64AA'],
  ['川口さくら','D2239811'],['鈴木ひかり','094FF07C'],['上村ゆき','AB38EFBF'],
  ['松井ななみ','E52DB1B4'],['沢口れいか','2FFAB69B'],
].map(([name, hash]) => ({name, src:`https://ob-lige.net/staff/${hash}/01.jpg`, key:`oblige_${hash.toLowerCase()}`}));

// ===== LaMer (浦安4位) S3バケット =====
const LAMER_SHOP = {
  id: 'chiba_urayasu_urayasu_lamer',
  name: 'LaMer (ラメール)',
  website_url: 'https://lamer-aroma.com/',
  schedule_url: null,
  image_url: null,
  raw_data: { prefecture: '千葉県', area: '浦安' },
};
const LAMER_S3 = 'https://lamer-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/';
const LAMER_RAW = [
  ['花宮もも','97','97/e8b6492e-17e4-47f4-a93d-fec7203f5a80.jpg'],
  ['白石りの','92','92/da1f8d86-b49f-4a77-88e0-716bf0c8f5e8.jpg'],
  ['桃瀬ねねこ','82','82/01627d2a-3274-4faf-b00a-d829127babe1.jpg'],
  ['神崎なぎさ','86','86/cd3525c0-2e83-4fb5-b369-3230a969cd6f.jpg'],
  ['八神ゆら','37','37/20b6150e-234f-490a-9ab0-62476c47075b.jpg'],
  ['黒崎りな','96','96/2e8c9e4d-1d2b-4193-831d-674803ed5850.jpg'],
  ['水野ひな','91','91/7a99e661-26c8-471f-9860-2ebbcd870885.jpg'],
  ['桜井みのり','66','66/f795f69e-7741-4567-bc58-7068faf7022b.jpg'],
  ['三日月るな','40','40/643fdcf5-221d-4bab-a5c8-997c291b071f.jpg'],
  ['小川まり','44','44/54ad6b97-c99f-4a06-bce7-4563ce2d3ecf.jpg'],
  ['羽川しゃる','84','84/9339ac6a-fd86-4925-914e-65066dbae8e2.jpg'],
  ['一ノ瀬ことね','63','63/e439759a-bde3-4263-9727-5673e659dd90.jpg'],
  ['夢乃みる','38','38/2cd0e30f-0600-4d15-862c-6fbd1cddb334.jpg'],
  ['羽咲きら','87','87/3e3d472d-7b2a-4c6d-967e-8ce9946322fc.jpg'],
  ['高峰ゆりあ','76','76/79eca088-27a6-4410-ad78-0dfe78185570.jpg'],
  ['夜桜える','95','95/1cdbe168-2254-4d6f-9045-f99b642cd076.jpg'],
  ['桔梗れな','80','80/7f21cbbc-ce79-4f6c-aafa-522f144ecabf.jpg'],
  ['神谷みり','94','94/f694e639-1186-4c0e-ab17-19c43dafcc7c.jpg'],
  ['椎名うた','52','52/ae3057dd-206e-47e1-b7c0-f2ae87e1d934.jpg'],
  ['朝比奈みれい','83','83/830734cc-dc1b-4fc1-a235-b23b3447bc04.jpg'],
  ['湊こはく','56','56/2817e62d-2f9b-44d6-8d16-241d9e372185.jpg'],
  ['西園みお','71','71/d0bfdee2-0683-45d5-ab2e-c1424b92d65c.jpg'],
  ['高橋まゆみ','33','33/d9133f82-d5a5-4c21-9739-846f8e203af3.jpg'],
  ['白鳥のぞみ','67','67/2bcf0a40-be25-4872-aa37-4ead6fa32494.jpg'],
  ['九条るか','73','73/c4eed1ca-a5f4-4266-bd53-b8241093d834.jpg'],
  ['神楽りり','57','57/d519fc2e-3036-42a0-ac64-1c0d376a0bed.jpg'],
  ['結城あい','78','78/34a095e6-45a7-4855-9982-21b9294f7d1a.jpg'],
  ['胡桃なな','93','93/797ef225-c6de-4896-a9b9-c6482e402d43.jpg'],
  ['渡辺ゆい','26','26/c7e805d3-eb2b-4731-a191-00049461782f.jpg'],
  ['長谷川ゆあ','65','65/d277b0fb-ff52-406a-8fa8-7e518e8e7be6.jpg'],
  ['星野じゅん','64','64/87ef08e7-e84d-4384-9697-c6022d37711b.jpg'],
  ['卯月ななせ','79','79/b646f5d4-2d0c-4d6d-abb0-4273fca8b9b1.jpg'],
  ['音井ふわ','41','41/2a33008e-cfbc-4347-8543-32c61100baed.jpg'],
  ['星乃ひかり','62','62/11b1f01a-df7e-4e94-bb1c-43b7bc9d131b.jpg'],
  ['矢沢つかさ','47','47/9f80106f-ef64-4cc1-a55d-f1463412dc66.jpg'],
  ['橘かおる','46','46/6f2b1cad-d9d0-4ca0-a506-8cb8098af2da.jpg'],
  ['蓮美りお','45','45/8f52f921-c2da-4a04-9ad9-84fab3577445.jpg'],
  ['白峰みく','77','77/2b11be1b-258a-42c9-860b-d1e6e722d71b.jpg'],
  ['如月あいか','68','68/236fcfbc-9765-46b4-afc1-f859dbbbc90f.jpg'],
  ['黒木もか','25','25/da6820ed-0046-425f-a716-2e0aeaf233f3.jpg'],
  ['水嶋はな','49','49/b5c446d0-c98d-494a-bd2b-171caf1822f8.jpg'],
  ['白咲かすみ','61','61/94a38ee8-e431-4080-848c-76e81891cb77.jpg'],
  ['篠宮れい','22','22/e1abeac9-d65a-45dd-915e-af9d1e76f82a.jpg'],
  ['桐谷みずほ','31','31/805e242e-17e5-4cdd-85a8-b8ad2b58fa51.jpg'],
  ['黒澤めぐみ','54','54/519266dd-016f-44c9-b4c8-0bc41cce6e60.jpg'],
  ['七海えま','43','43/7659e244-a716-4f1f-9315-bc632ca33e93.jpg'],
  ['風吹くるみ','58','58/f8c1e083-efd0-4b24-b702-0efbc3dcdcab.jpg'],
  ['白金あん','7','7/552e7d88-2a9f-4a9c-bef2-750801fd6283.jpg'],
  ['葉月りん','48','48/df7ee2bb-25d2-4290-bf9d-fdbe2ac513ee.jpg'],
  ['西村まひろ','74','74/cde27e9e-129a-4ca2-b3c6-f6f4b3264715.jpg'],
  ['佐野しおり','10','10/8e745d77-2e43-4fe3-8c5a-0e1fcf5da10e.jpg'],
  ['小泉もも','5','5/84c2b842-da37-40d5-bba4-5df425220102.jpg'],
].map(([name, id, path]) => ({name, src:`${LAMER_S3}${path}`, key:`lamer_${id}`}));

// ===== AROMA VENUS (西葛西5位) =====
const VENUS_SHOP = {
  id: 'tokyo_edogawa_nishikasai_aroma_venus',
  name: 'AROMA VENUS (アロマヴィーナス)',
  website_url: 'https://www.venusaroma.com/',
  schedule_url: null,
  image_url: null,
  raw_data: { prefecture: '東京都', area: '葛西' },
};
const VENUS_RAW = [
  ['水川','136'],['吉沢','45'],['黒島','120'],['川口','79'],['今田','82'],
  ['高畑','130'],['橋本','91'],['朝井','2'],['麻生','131'],['吉岡','137'],
  ['久保','134'],['小川','133'],['貴島','116'],['広末','121'],['木村','106'],
  ['上戸','111'],['有村','109'],['永野','98'],['安達','102'],['芳根','86'],
].map(([name, pid]) => ({name, src:`https://www.venusaroma.com/prof/${pid}/top.jpg`, key:`venus_${pid}`}));

// ===== NOBLE (西葛西7位) =====
const NOBLE_SHOP = {
  id: 'tokyo_edogawa_nishikasai_noble',
  name: 'NOBLE (ノーブル)',
  website_url: 'https://noble-esthe.com/',
  schedule_url: null,
  image_url: null,
  raw_data: { prefecture: '東京都', area: '葛西' },
};
const NOBLE_RAW = [
  ['春野','95C23D2D'],['音瀬','A4B19EA0'],['和泉','AE583CCA'],['白鳥','284D7256'],
  ['蒼井','64B058D8'],['遠藤','B3EE1DDB'],['帆風','060BF375'],['沢尻','30A3ECA4'],
  ['晴海','A99FC6E1'],['生田','5EFB3E59'],['桜井','F9D1CC56'],['雪村','4BA8BC63'],
  ['海乃','C09A0EFF'],['舞浜','8F197510'],['朝比奈','42ABE874'],['岡野','53BA1DC1'],
  ['飛鳥','4B970772'],['秋元','2455E7B9'],['神白','69D01F9D'],['月乃','9C7F136E'],
  ['恋口','1A3A01F3'],['浜辺','FD47CB74'],['石原','73B9A487'],['黒木','B1C5BF55'],
  ['入間','BF113826'],['南野','F8A9B134'],['浅倉','F34231B3'],['松井','D17647C6'],
  ['長瀬','683AC7AE'],['井川','3FED6352'],['指原','19D729C6'],['滝沢','44E86E38'],
  ['望田','17BCE1F4'],['西野','3C0A604B'],['有栖','FC8E1A57'],['立花','E53A70FE'],
  ['霧谷','3132837F'],['夏川','AFBA1DCB'],['榮倉','30D7BFED'],['一之瀬','375C45CA'],
  ['初白','52BFAC31'],['島崎','9DEB79F8'],['葉月','672D1B56'],['上原','FEB1DD7E'],
  ['松崎','7B9570F7'],
].map(([name, hash]) => ({name, src:`https://noble-esthe.com/staff/${hash}/01.jpg`, key:`noble_${hash.toLowerCase()}`}));

// ===== Onikando (葛西8位) caskan CDN =====
const ONIKANDO_SHOP = {
  id: 'tokyo_edogawa_kasai_onikando',
  name: 'Onikando (オニ感度)',
  website_url: 'https://oni-kando.com/',
  schedule_url: null,
  image_url: null,
  raw_data: { prefecture: '東京都', area: '葛西' },
};
async function fetchOnikandoTherapists() {
  const res = await fetch('https://oni-kando.com/therapist', { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  const items = [], seen = new Set();
  const reg = /src="(https:\/\/cdn2-caskan\.com\/caskan\/img\/cast_tmb\/\d+_(\d+)\.jpg)"\s*alt="([^"]+)"/g;
  let m;
  while ((m = reg.exec(html)) !== null) {
    const name = m[3].trim();
    const castId = m[2];
    if (!name || seen.has(name) || !/[ぁ-んァ-ヾ一-龯]/.test(name)) continue;
    if (/体験入店|割引|優待/.test(name)) continue;
    seen.add(name);
    items.push({name, castId, src: m[1], key: `onikando_${castId}`});
  }
  return items;
}

// ===== UBU彼女 (浦安9位) 名前のみ動的取得 =====
const UBU_SHOP = {
  id: 'chiba_urayasu_urayasu_ubukano',
  name: 'UBU彼女 (うぶカノ)',
  website_url: 'https://ubukano.com/',
  schedule_url: null,
  image_url: null,
  raw_data: { prefecture: '千葉県', area: '浦安' },
};
async function fetchUbuTherapists() {
  const res = await fetch('https://ubukano.com/staff', { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  const names = [], seen = new Set();
  const reg = /([一-龯ぁ-ん々]+\s*[一-龯ぁ-んA-Za-z]*)\s+\d{2}歳/g;
  let m;
  while ((m = reg.exec(html)) !== null) {
    const n = m[1].replace(/\s+/g, '').trim();
    if (n && n.length >= 2 && !seen.has(n) && !/HOME|THERAPIST|SCHEDULE|NEWS|RESERVE|SYSTEM|ACCESS|RECRUIT/.test(n)) {
      seen.add(n);
      names.push({name: n, src: null, key: null});
    }
  }
  return names;
}

// ===== PhiPhiLei (浦安10位) =====
const PIPI_SHOP = {
  id: 'chiba_urayasu_urayasu_phiphilei',
  name: 'PhiPhiLei Spa (ピピレイスパ)',
  website_url: 'https://phiphilei-spa.com/',
  schedule_url: null,
  image_url: null,
  raw_data: { prefecture: '千葉県', area: '浦安' },
};
const PIPI_RAW = [
  ['UI','D8DC1744'],['RUNA','B14BA631'],['YUZUKI','C12204C1'],['NAO','3AE0998E'],
  ['MITSUKI','31B4BC06'],['MANA','EC2C87BA'],['TOWA','847C4B1E'],['MARINA','D34B707C'],
  ['NOA','EFF4F1CC'],['AI','52C6E399'],['HARU','BFCC273F'],['YUKARI','BCF40976'],
  ['YUNO','0549D023'],['MIA','3D33A1C0'],['RIN','F813AC42'],['KII','CEC90F62'],
  ['MIYU','11051CA0'],['MOEKA','6030AE59'],['MOCA','14B3A821'],['HANA','CF36E751'],
  ['AZUSA','B216C7C7'],['KIRARI','FA024A6E'],['RINA','71D25C66'],['MIHO','B4A2DCE2'],
  ['REONA','45805336'],['MAI','5A22A7B2'],['HARUKA','4516EA49'],['MINAMI','E752F9F2'],
  ['MIO','8DBB9484'],['NAGISA','5B85DFC3'],['MINA','A4DDAB3A'],['YUI','693ECD53'],
  ['RIO','BC53A8F1'],['JUN','A3FA6D69'],['KAREN','2FA9BD34'],['EMA','C4BC8A85'],
  ['HINA','D66983B5'],['SHIORI','40A40EFA'],['RIKA','425E5439'],['MIKA','E6F0020C'],
  ['WAKANA','49D9F1CB'],['REIN','56FD0AAA'],['ASUKA','DECA598E'],['SAAR','6294F70B'],
  ['MOKO','9563AF4B'],['NANA','6D0EBA86'],['HIKARI','1D122C5F'],['MIREI','D036B937'],
  ['ERI','AC23E731'],['AAYA','FDD676F8'],['AIMI','4924781C'],['CHIFUYU','14950565'],
  ['EMI','705CE80E'],['HAZUKI','A97534D1'],['URARAA','1C40CAF3'],
].map(([name, hash]) => ({name, src:`https://phiphilei-spa.com/staff/${hash}/01.jpg`, key:`pipi_${hash.toLowerCase()}`}));

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
    const ct = ext === 'png' ? 'image/png' : 'image/jpeg';
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
      : (DRY_RUN && t.src ? '(ok)' : null);
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
  console.log(`=== 葛西・浦安9店舗 登録 (DRY_RUN=${DRY_RUN}) ===\n`);

  if (run('giri')) {
    console.log(`--- GIRIGIRILAND ${GIRI_RAW.length}名 ---`);
    await registerShop(GIRI_SHOP);
    await registerTherapists(GIRI_SHOP.id, GIRI_RAW, 'https://www.girigiriland.net');
  }
  if (run('naishoka')) {
    console.log(`\n--- 内緒のカノジョ ${NAISHOKA_RAW.length}名 ---`);
    await registerShop(NAISHOKA_SHOP);
    await registerTherapists(NAISHOKA_SHOP.id, NAISHOKA_RAW, 'https://www.naishokasai.net');
  }
  if (run('oblige')) {
    console.log(`\n--- Oblige ${OBLIGE_RAW.length}名 ---`);
    await registerShop(OBLIGE_SHOP);
    await registerTherapists(OBLIGE_SHOP.id, OBLIGE_RAW, 'https://ob-lige.net');
  }
  if (run('lamer')) {
    console.log(`\n--- LaMer ${LAMER_RAW.length}名 ---`);
    await registerShop(LAMER_SHOP);
    await registerTherapists(LAMER_SHOP.id, LAMER_RAW, 'https://lamer-aroma.com');
  }
  if (run('venus')) {
    console.log(`\n--- AROMA VENUS ${VENUS_RAW.length}名 ---`);
    await registerShop(VENUS_SHOP);
    await registerTherapists(VENUS_SHOP.id, VENUS_RAW, 'https://www.venusaroma.com');
  }
  if (run('noble')) {
    console.log(`\n--- NOBLE ${NOBLE_RAW.length}名 ---`);
    await registerShop(NOBLE_SHOP);
    await registerTherapists(NOBLE_SHOP.id, NOBLE_RAW, 'https://noble-esthe.com');
  }
  if (run('onikando')) {
    console.log('\n--- Onikando (caskan動的取得) ---');
    await registerShop(ONIKANDO_SHOP);
    if (DRY_RUN) { console.log('  [DRY] caskan CDNから動的取得 (約38名想定)'); }
    else {
      const th = await fetchOnikandoTherapists();
      console.log(`  ${th.length}名取得`);
      await registerTherapists(ONIKANDO_SHOP.id, th, 'https://oni-kando.com');
    }
  }
  if (run('ubu')) {
    console.log('\n--- UBU彼女 (動的取得・名前のみ) ---');
    await registerShop(UBU_SHOP);
    if (DRY_RUN) { console.log('  [DRY] ページから名前を動的取得 (約43名想定)'); }
    else {
      const th = await fetchUbuTherapists();
      console.log(`  ${th.length}名取得`);
      await registerTherapists(UBU_SHOP.id, th, null);
    }
  }
  if (run('pipi')) {
    console.log(`\n--- PhiPhiLei ${PIPI_RAW.length}名 ---`);
    await registerShop(PIPI_SHOP);
    await registerTherapists(PIPI_SHOP.id, PIPI_RAW, 'https://phiphilei-spa.com');
  }

  console.log('\n=== 完了 ===');
}
main().catch(console.error);
