/**
 * 中野・三軒茶屋・錦糸町 4店舗 登録スクリプト
 *   - Lucky Cat (中野1位) 90名 — ml_11_1パターン
 *   - ADAMAS (中野2位) 24名 — ハッシュURL
 *   - エルドラド (三軒茶屋1位) 118名 — caskan.com CDN
 *   - Garden SPA (錦糸町1位) 110名 — /photos/{id}/moto_{id}.jpg
 *
 * 実行:
 *   node scripts/maintenance/process_nakano_sangenjaya_kinshicho.mjs --dry-run
 *   node scripts/maintenance/process_nakano_sangenjaya_kinshicho.mjs
 *   node scripts/maintenance/process_nakano_sangenjaya_kinshicho.mjs --shop luckycat
 *   node scripts/maintenance/process_nakano_sangenjaya_kinshicho.mjs --shop adamas
 *   node scripts/maintenance/process_nakano_sangenjaya_kinshicho.mjs --shop eldorado
 *   node scripts/maintenance/process_nakano_sangenjaya_kinshicho.mjs --shop gardensp
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

// ===== Lucky Cat (中野1位) =====
const LUCKYCAT_SHOP = {
  id: 'tokyo_nakano_nakano_lucky_cat',
  name: 'Lucky Cat (ラッキーキャット)',
  website_url: 'http://www.lucky-cat.tokyo/',
  schedule_url: 'http://www.lucky-cat.tokyo/schedule/',
  image_url: 'http://www.lucky-cat.tokyo/asset/img/logo.png',
  raw_data: { prefecture: '東京都', area: '中野' },
};
const LUCKYCAT_RAW = [
  ['のあ','8377'],['るか','8383'],['アユニ','8381'],['こころ','8409'],['ひまり','8891'],
  ['ななせ','8442'],['あめ','9499'],['すい','8852'],['るね','9173'],['みみ','9472'],
  ['さくら','9454'],['そら','9424'],['もえ','9448'],['れある','9475'],['もね','9385'],
  ['かすみ','9451'],['れい','9297'],['ゆず','9383'],['えり','9406'],['あいる','9412'],
  ['かな','9402'],['ゆめか','8403'],['みい','9279'],['はな','8400'],['すみれ','8782'],
  ['ありあ','9231'],['めろ','9127'],['にいな','9490'],['りりあ','9445'],['なる','9057'],
  ['くらら','9195'],['きら','9321'],['ゆき','9436'],['まどか','9300'],['あや','9439'],
  ['ゆいり','9386'],['ゆの','9192'],['ゆら','9408'],['みお','9415'],['るな','9392'],
  ['くう','9389'],['きらり','9379'],['しおん','9358'],['しずく','9207'],['あみ','9209'],
  ['らぴ','9213'],['りゅあ','8861'],['きこ','9020'],['えま','9179'],['まな','9176'],
  ['ことり','9303'],['みずき','9211'],['まゆ','9228'],['せいら','9276'],['白川あまね','9217'],
  ['かのん','9200'],['のら','9234'],['しほ','9182'],['うい','8871'],['つばさ','9199'],
  ['うさぎ','9153'],['みな','8873'],['せいな','9044'],['みなみ','9075'],['かえで','8414'],
  ['サラ','8957'],['なの','9032'],['なな','9047'],['るる','9034'],['ちな','8723'],
  ['ふゆ','8639'],['なゆ','8770'],['めい','8669'],['りんか','8917'],['かりん','8521'],
  ['ゆあ','8650'],['あかね','8718'],['まなか','8482'],['しの','8391'],['りさ','8444'],
  ['るあ','8412'],['みづき','8395'],['ひなみ','8397'],['みゆ','8385'],['みく','8405'],
  ['あずき',null],['うな',null],['ひな','9268'],['はち','8375'],['りり','9090'],
].map(([name, id]) => ({
  name,
  src: id ? `http://www.lucky-cat.tokyo/images/ml_11_1_${id}.jpeg` : null,
  key: id ? `luckycat_${id}` : null,
}));

// ===== ADAMAS (中野2位) =====
const ADAMAS_SHOP = {
  id: 'tokyo_nakano_nakano_adamas',
  name: 'ADAMAS (アダマス)',
  website_url: 'https://a-adamas.com/',
  schedule_url: 'https://a-adamas.com/schedule/',
  image_url: null,
  raw_data: { prefecture: '東京都', area: '中野' },
};
const ADAMAS_THERAPISTS = [
  { name: '葉月ななみ', src: 'https://a-adamas.com/wp-content/uploads/49529a346bd67407f473a1980.jpg' },
  { name: '並木いろは', src: 'https://a-adamas.com/wp-content/uploads/546598baf2e72b448d3b02bbe.jpg' },
  { name: '戸田ゆいか', src: 'https://a-adamas.com/wp-content/uploads/S__62939139.jpg' },
  { name: '花園いずみ', src: 'https://a-adamas.com/wp-content/uploads/a311eaf9452da5501f569077c.jpg' },
  { name: '村瀬あゆみ', src: 'https://a-adamas.com/wp-content/uploads/IMG_9438.jpeg' },
  { name: '美咲めいさ', src: 'https://a-adamas.com/wp-content/uploads/d602bf90a39e5b5aee9a6389b.jpg' },
  { name: '柴崎みらい', src: 'https://a-adamas.com/wp-content/uploads/d1a6d7867d587966d412cea69.jpg' },
  { name: '水城じゅり', src: 'https://a-adamas.com/wp-content/uploads/0d1a20d96d026094c84d1c77e.jpg' },
  { name: '瀧本あんな', src: 'https://a-adamas.com/wp-content/uploads/ee091277c8ee56b7ff17bd7c4.jpg' },
  { name: '浜辺りお',   src: 'https://a-adamas.com/wp-content/uploads/da8fb5f869dc9c901dde84957.jpg' },
  { name: '楠すず',     src: 'https://a-adamas.com/wp-content/uploads/35af2fab13ad24a547fdda3f3.jpg' },
  { name: '音島ひとみ', src: 'https://a-adamas.com/wp-content/uploads/9a5e4f6e934172594542bc5bf.jpg' },
  { name: '上原あかり', src: 'https://a-adamas.com/wp-content/uploads/ca3df5427b58a8d73c69d18c0.jpg' },
  { name: '川井もな',   src: 'https://a-adamas.com/wp-content/uploads/d1e1b63e62deeed99013bbcc2.jpg' },
  { name: '白花うい',   src: 'https://a-adamas.com/wp-content/uploads/d08c2c1204fb291810db8ac54.jpg' },
  { name: '七海えみか', src: 'https://a-adamas.com/wp-content/uploads/58f632d6bd3988c9990e89a3f.jpg' },
  { name: '咲間ゆの',   src: 'https://a-adamas.com/wp-content/uploads/eb17bc0d0befc300ac4295672.jpg' },
  { name: '水野ゆめ',   src: 'https://a-adamas.com/wp-content/uploads/e217963fc74f45bfc5333d466.jpg' },
  { name: '柊まどか',   src: 'https://a-adamas.com/wp-content/uploads/33f8a5b8ea629ac48de86a13a.jpg' },
  { name: '白咲るな',   src: 'https://a-adamas.com/wp-content/uploads/9cc40936af5ff5d0e1f5079f1.jpg' },
  { name: '姫野えま',   src: 'https://a-adamas.com/wp-content/uploads/IMG_8984.jpeg' },
  { name: '仁科みあ',   src: 'https://a-adamas.com/wp-content/uploads/IMG_2316.jpeg' },
  { name: '士道あやめ', src: 'https://a-adamas.com/wp-content/uploads/d0f13afe7b6acd966cca48f6b.jpg' },
  { name: '音羽うた',   src: 'https://a-adamas.com/wp-content/uploads/d1585553c410dccfb8e4c2a8d.jpg' },
].map(t => ({ ...t, key: 'adamas_' + t.src.split('/').pop().replace(/\.[^.]+$/, '').slice(0, 22) }));

// ===== エルドラド (三軒茶屋1位) caskan.com CDN =====
const ELDORADO_SHOP = {
  id: 'tokyo_setagaya_sangenjaya_eldorado',
  name: 'エルドラド',
  website_url: 'https://eldorado-esthe.com/',
  schedule_url: 'https://eldorado-esthe.com/schedule',
  image_url: null,
  raw_data: { prefecture: '東京都', area: '三軒茶屋' },
};
// caskan.com CDN 118名 — スクリプト内でChromeデータをそのまま使用
// ファイルが長くなるため、動的取得方式に変更
const ELDORADO_BASE = 'https://eldorado-esthe.com';

// ===== Garden SPA (錦糸町1位) /photos/{id}/moto_{id}.jpg =====
const GARDENSP_SHOP = {
  id: 'tokyo_sumida_kinshicho_garden_spa',
  name: 'Garden SPA (ガーデンスパ)',
  website_url: 'https://gardenspa-official.com/',
  schedule_url: 'https://gardenspa-official.com/schedule',
  image_url: null,
  raw_data: { prefecture: '東京都', area: '錦糸町' },
};
const GARDENSP_RAW = [
  ['川上るか','379'],['白石りの','448'],['梓こころ','423'],['北山なぎ','410'],['桃園るい','474'],
  ['此花もえ','486'],['美咲のあ','485'],['三上かりん','418'],['滝沢さら','489'],['真白きい','505'],
  ['深見るな','503'],['友江そら','502'],['愛川まい','496'],['佐々木しのん','494'],['一条そな','501'],
  ['最上わか','341'],['桃瀬ありす','100'],['初音いよ','429'],['早坂りむ','465'],['鳴海めあ','454'],
  ['鷲尾あやか','446'],['宇野かれん','401'],['廣瀬むぎ','479'],['桜木ひなの','430'],['音羽ゆら','403'],
  ['清宮なの','442'],['愛良うゆ','484'],['夢乃しおん','459'],['西野さや','313'],['藍色のの','393'],
  ['伊澄わかな','499'],['小野町りん','480'],['蒼井ミリア','468'],['永井あみ','473'],['式波ゆうき','492'],
  ['天野めいさ','457'],['ニーナ','258'],['福田なのか','467'],['白川あかり','447'],['朝日りお','380'],
  ['南なつ','355'],['羽川つばさ','451'],['未来おと','450'],['川浜ふうあ','461'],['五条ふみか','460'],
  ['藤田めぐ','449'],['夏目まな','448'],['橋本すい','444'],['白咲ゆあ','435'],['小日向とわ','440'],
  ['音夢れむ','453'],['未歩れあ','452'],['神崎ナナ','463'],['新井ゆうな','466'],['美谷あやめ','456'],
  ['浅野ひめ','381'],['椎名うらん','422'],['成瀬せな','434'],['木下いおり','413'],['春陽リマ','394'],
  ['日野ゆりな','497'],['天月まなみ','415'],['桜庭いちか',''],['柚原すずめ','402'],['静河みつり','400'],
  ['日向うた','353'],['椿レオ','367'],['天使くるみ','398'],['乙葉めあり','359'],['一乃もえ','414'],
  ['花園もあ','441'],['玉井かほ','204'],['三田あいり','294'],['湊ここな','409'],['向井さらん','392'],
  ['土屋みつき','365'],['石原りつ','364'],['友田ひより','298'],['九野もえ','362'],['鳳月かのん','356'],
  ['鈴音すずか','357'],['宝鐘ジュリア','387'],['北崎ほのか','345'],['一ノ瀬くみ','310'],['中西ちか','167'],
  ['苺谷れな','63'],['春咲みりあ','78'],['大崎なな','117'],['野々宮りえ','225'],['白咲せいな','337'],
  ['高瀬りおん','223'],['武田れな','130'],['松嶋くれあ','155'],['鈴江らん','103'],['神宮寺りん','200'],
  ['夏目ここ','116'],['柊さおり','208'],['中森のあ','218'],['中本かなみ','236'],['七瀬ゆり','277'],
  ['東條えみり','329'],['山田まいん','330'],['佐伯れい','334'],['神里こころ','324'],['宮脇ほのか','326'],
  ['河合りむ','285'],['梓わかな','300'],['大森さとみ','212'],['未来みい','308'],['松岡こころ','305'],
].map(([name, id]) => ({
  name,
  src: id ? `https://gardenspa-official.com/photos/${id}/moto_${id}.jpg` : null,
  key: id ? `gardensp_${id}` : null,
}));

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
  if (error) console.error('Shop error:', error.message);
  else console.log(`✅ ${s.id}`);
}

async function registerTherapists(shopId, therapists, referer) {
  let ins = 0, skp = 0, err = 0;
  for (const t of therapists) {
    const tid = `${shopId}_${t.name}`;
    const { data: ex } = await supabase.from('therapists').select('id,image_url').eq('id', tid).single();
    if (ex?.image_url) { process.stdout.write('='); skp++; continue; }
    const url = (!DRY_RUN && t.src && t.key) ? await uploadImage(t.src, t.key, referer) : (DRY_RUN && t.src ? t.src : null);
    const { error } = DRY_RUN ? { error: null } : await supabase.from('therapists').upsert({ id: tid, shop_id: shopId, name: t.name, image_url: url }, { onConflict: 'id' });
    if (!DRY_RUN && error) { console.error(`\n✗ ${t.name}`); err++; }
    else { process.stdout.write(url ? '+' : 'n'); ins++; }
    await new Promise(r => setTimeout(r, 200));
  }
  console.log(`\n挿入: ${ins} / スキップ: ${skp} / エラー: ${err}`);
}

async function fetchEldoradoTherapists() {
  // Chrome で取得済みデータを直接スクレイプ
  const res = await fetch('https://eldorado-esthe.com/therapist', { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  // alt属性から名前と caskan.com URL を抽出
  const therapists = [];
  const seen = new Set();
  const regex = /alt="([^"]{2,12})"[^>]*src="(https:\/\/cdn2-caskan\.com\/caskan\/img\/cast_tmb\/[^"]+)"/g;
  let m;
  while ((m = regex.exec(html)) !== null) {
    const name = m[1].trim().replace(/【[^】]*】/g,'').trim();
    if (!name || seen.has(name) || !/[ぁ-んァ-ヾ一-龯]/.test(name)) continue;
    seen.add(name);
    const fn = m[2].split('/').pop();
    therapists.push({ name, src: m[2], key: `eldorado_${fn.replace(/\.[^.]+$/,'').slice(0,22)}` });
  }
  return therapists;
}

async function main() {
  console.log(`=== 4店舗 登録 (DRY_RUN=${DRY_RUN}) ===\n`);
  const run = (n) => !shopArg || shopArg === n;

  if (run('luckycat')) {
    console.log(`--- Lucky Cat ${LUCKYCAT_RAW.length}名 ---`);
    await registerShop(LUCKYCAT_SHOP);
    await registerTherapists(LUCKYCAT_SHOP.id, LUCKYCAT_RAW, 'http://www.lucky-cat.tokyo');
  }
  if (run('adamas')) {
    console.log(`\n--- ADAMAS ${ADAMAS_THERAPISTS.length}名 ---`);
    await registerShop(ADAMAS_SHOP);
    await registerTherapists(ADAMAS_SHOP.id, ADAMAS_THERAPISTS, 'https://a-adamas.com');
  }
  if (run('eldorado')) {
    console.log(`\n--- エルドラド (fetch中) ---`);
    await registerShop(ELDORADO_SHOP);
    if (!DRY_RUN) {
      const therapists = await fetchEldoradoTherapists();
      console.log(`${therapists.length}名取得`);
      await registerTherapists(ELDORADO_SHOP.id, therapists, 'https://eldorado-esthe.com');
    } else {
      console.log('[DRY] エルドラド: 本実行時にHTMLをfetchして取得します');
    }
  }
  if (run('gardensp')) {
    console.log(`\n--- Garden SPA ${GARDENSP_RAW.length}名 ---`);
    await registerShop(GARDENSP_SHOP);
    await registerTherapists(GARDENSP_SHOP.id, GARDENSP_RAW, 'https://gardenspa-official.com');
  }

  console.log('\n=== 完了 ===');
}
main().catch(console.error);
