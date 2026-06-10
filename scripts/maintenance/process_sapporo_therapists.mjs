/**
 * 北海道 札幌 - セラピスト登録
 * LATTE(20名) / Chocolat(51名) / 札幌エステ研究所(72名) / コス×コス(17名) /
 * aroma Flan(25名) / ロリポップ(11名) / マダムの手(19名)
 *
 * 実行: node scripts/maintenance/process_sapporo_therapists.mjs [--dry-run]
 */
import fs from 'fs';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const DRY_RUN = process.argv.includes('--dry-run');

// ─── HELPERS ────────────────────────────────────────────────────────────────

async function fetchHtml(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' }
    });
    return await res.text();
  } catch (e) {
    console.warn(`  FETCH ERROR: ${url}`, e.message);
    return null;
  }
}

async function upsertTherapists(shopId, therapists) {
  let inserted = 0, skipped = 0, errors = 0;

  // 既存レコードを一括取得
  const { data: existing } = await supabase
    .from('therapists')
    .select('id')
    .eq('shop_id', shopId);
  const existingIds = new Set((existing || []).map(r => r.id));

  for (const t of therapists) {
    const id = `${shopId}_${t.name}`;
    if (existingIds.has(id)) { skipped++; continue; }

    if (DRY_RUN) {
      console.log(`  [DRY] + ${t.name} ${t.image_url ? '(画像あり)' : '(名前のみ)'}`);
      inserted++;
      continue;
    }

    const { error } = await supabase.from('therapists').insert({
      id,
      shop_id: shopId,
      name: t.name,
      image_url: t.image_url || null
    });
    if (error) {
      if (error.code === '23505') { skipped++; }
      else { console.error(`  ❌ ${t.name}:`, error.message); errors++; }
    } else {
      inserted++;
    }
  }
  return { inserted, skipped, errors };
}

// ─── SHOP DATA ───────────────────────────────────────────────────────────────

// ---- LATTE (estama shopId=39701) ----
async function processLatte() {
  const shopId = 'hokkaido_sapporo_sapporo_latte';
  const BASE = 'https://img.estama.jp/shop_data/00000039701/cast/main/357x556';

  const THERAPISTS = [
    ['ももか', '12lu0_20250601222635'],
    ['ゆきの', 'd4jwv_20251219013811'],
    ['すい',   'dgerj_20250712203338'],
    ['あい',   'bnool_20260210131716'],
    ['るる',   '6qykz_20260605154636'],
    ['のぞみ', '788ij_20251217164958'],
    ['みお',   '6o2ah_20251230145152'],
    ['ゆら',   '40d0o_20260409180821'],
    ['まみ',   '7yxek_20260331232650'],
    ['ひめか', '265fn_20260529221401'],
    ['らな',   '2a1n0_20251121190315'],
    ['りり',   '2xsdh_20241004190518'],
    ['みり',   '4mxl8_20260119175407'],
    ['もか',   '63t6u_20260129142517'],
    ['ゆめ',   '99vax_20260316185629'],
    ['まな',   'dbix3_20260606223212'],
    ['まりん', '6zy2n_20260430094058'],
    ['もも',   '9iqqw_20251004195641'],
    ['れん',   'c29wp_20251125230929'],
    ['ひな',   'ci379_20251120213909'],
  ];

  const therapists = THERAPISTS.map(([name, hash]) => ({
    name,
    image_url: `${BASE}/${hash}.jpg`
  }));

  const result = await upsertTherapists(shopId, therapists);
  console.log(`✅ LATTE: +${result.inserted} skip=${result.skipped} err=${result.errors}`);
}

// ---- Chocolat (caskan castId) ----
async function processChocolat() {
  const shopId = 'hokkaido_sapporo_sapporo_chocolat';
  const BASE = 'https://cdn2-caskan.com/caskan/img/cast_tmb';

  const THERAPISTS = [
    ['なつ',   '5780716',  '1779897498'],
    ['ここ',   '0912732',  '1779684893'],
    ['まゆ',   '3145076',  '1779529387'],
    ['りん',   '3956730',  '1779420226'],
    ['りりか', '4492200',  '1779088813'],
    ['れいな', '7593779',  '1779074009'],
    ['かほ',   '5614903',  '1778986045'],
    ['かれん', '3463473',  '1778673476'],
    ['そら',   '5755749',  '1777653279'],
    ['なのは', '7095080',  '1777543293'],
    ['のん',   '4560786',  '1777277478'],
    ['あいり', '7585416',  '1776858551'],
    ['ここあ', '2616033',  '1776852945'],
    ['せつな', '1129732',  '1776671261'],
    ['まりな', '1395441',  '1776571452'],
    ['あき',   '3660360',  '1776864891'],
    ['ゆうか', '8954739',  '1775912309'],
    ['ゆの',   '6568046',  '1774254678'],
    ['ゆずは', '2045744',  '1773831063'],
    ['せな',   '5131137',  '1773654199'],
    ['すい',   '0339250',  '1772356199'],
    ['みかん', '8027179',  '1774253010'],
    ['ひより', '5479719',  '1778229593'],
    ['ゆいな', '7742620',  '1771390141'],
    ['りょう', '2285775',  '1771239498'],
    ['まき',   '9775174',  '1769075393'],
    ['ななみ', '8216350',  '1767516298'],
    ['いおり', '6238233',  '1766367065'],
    ['さら',   '0400824',  '1765541656'],
    ['るみ',   '9853827',  '1764847580'],
    ['ゆら',   '8767502',  '1763010430'],
    ['むむ',   '6494328',  '1761974151'],
    ['みお',   '2855973',  '1771418974'],
    ['みれい', '5530561',  '1761319738'],
    ['みいな', '2625741',  '1761319743'],
    ['さくら', '7624357',  '1761319748'],
    ['ひまり', '9587590',  '1773642738'],
    ['ひな',   '1791638',  '1761319773'],
    ['じゅり', '5455813',  '1773131094'],
    ['みなみ', '1974517',  '1761319783'],
    ['その',   '6868374',  '1770357690'],
    ['るな',   '2550858',  '1776872115'],
    ['まお',   '5805507',  '1761319807'],
    ['あい',   '1232387',  '1761319812'],
    ['みな',   '1023293',  '1761319863'],
    ['ゆうな', '2615779',  '1761319822'],
    ['もか',   '4291287',  '1761319833'],
    ['まな',   '8632693',  '1761319840'],
    ['らむ',   '7052406',  '1761319846'],
    ['えみ',   '5684849',  '1771854055'],
    ['えな',   '8647057',  '1777043889'],
  ];

  const therapists = THERAPISTS.map(([name, castId, ts]) => ({
    name,
    image_url: `${BASE}/${ts}_${castId}.jpg`
  }));

  const result = await upsertTherapists(shopId, therapists);
  console.log(`✅ Chocolat: +${result.inserted} skip=${result.skipped} err=${result.errors}`);
}

// ---- 札幌エステ研究所 (fileId /files/{id}/1.jpg) ----
async function processLabo() {
  const shopId = 'hokkaido_sapporo_sapporo_labo';
  const BASE = 'https://esthetic-labo.net/files';

  // [fileId, name]
  const THERAPISTS = [
    [384,  'みに'],
    [479,  'まりん'],
    [480,  'まい'],
    [478,  'りり'],
    [476,  'さな'],
    [465,  '空元みく'],
    [452,  '星野るい'],
    [474,  '海月あかり'],
    [396,  '白雪きらら'],
    [453,  '桜庭ひな'],
    [455,  '桜伊りの'],
    [414,  '青木あい'],
    [466,  '黒澤りんか'],
    [463,  'きなこ'],
    [448,  'かのん'],
    [475,  '宝城いろは'],
    [458,  '一条ゆうな'],
    [456,  '真野えりな'],
    [421,  '若菜みお'],
    [408,  '香坂さえ'],
    [389,  '坂井のどか'],
    [462,  'こなつ'],
    [28,   '崎村あいな'],
    [432,  '香澄ねね'],
    [366,  '相川りあ'],
    [461,  '初音りこ'],
    [468,  'らん'],
    [446,  '北原あや'],
    [400,  '石田しおね'],
    [460,  '森山みさき'],
    [382,  'もえ'],
    [375,  '西野ゆり'],
    [447,  'くるみ'],
    [148,  'めぐみ'],
    [473,  '佐伯しおり'],
    [454,  '綾瀬えま'],
    [450,  '藤崎さや'],
    [441,  '葉山しずく'],
    [442,  '小鳥遊ちづる'],
    [136,  '新垣さやか'],
    [444,  '望月めい'],
    [153,  '牧野'],
    [286,  '米倉りつか'],
    [338,  '庄司みな'],
    [443,  '橋本あみ'],
    [186,  '立花みさ'],
    [415,  '冬月みみ'],
    [411,  '安達もも'],
    [33,   '早坂りか'],
    [386,  'りりあ'],
    [103,  'うた'],
    [363,  '風間あすか'],
    [381,  '目黒みる'],
    [276,  '七瀬みゆう'],
    [376,  '卯月ことね'],
    [293,  '熊谷ゆら'],
    [229,  '伊東ちあき'],
    [354,  '如月るな'],
    [356,  '新沼みりな'],
    [268,  '安達もも2'],
    [412,  '天音かれん'],
    [449,  'まお'],
    [419,  '佐久間ひとみ'],
    [292,  'れい'],
    [470,  '七海ひまり'],
    [164,  '椎名のの'],
    [350,  '阿部ゆうか'],
  ];

  const therapists = THERAPISTS.map(([fileId, name]) => ({
    name,
    image_url: `${BASE}/${fileId}/1.jpg`
  }));

  const result = await upsertTherapists(shopId, therapists);
  console.log(`✅ 札幌エステ研究所: +${result.inserted} skip=${result.skipped} err=${result.errors}`);
}

// ---- コス×コス (estama shopId=32318) ----
async function processCoscos() {
  const shopId = 'hokkaido_sapporo_sapporo_coscos';
  const BASE = 'https://img.estama.jp/shop_data/00000032318/cast/main/357x556';

  const THERAPISTS = [
    ['かえで', 'eywmn_20260530182737'],
    ['えり',   'akrt5_20260530175437'],
    ['きき',   'c9kuh_20260524104055'],
    ['しおん', '32803_20260604194340'],
    ['なおみ', '6llfu_20260530183812'],
    ['みほ',   'eu2uy_20260530183403'],
    ['のの',   'cpvtz_20260530180144'],
    ['いの',   '676s1_20260530184339'],
    ['めあり', '620jm_20260530181656'],
    ['えれな', '17ncy_20241202144406'],
    ['りの',   '2prs0_20260530182430'],
    ['みずき', 'dqv3r_20260530180921'],
    ['りんか', '1a0y8_20260530181308'],
    ['むぎ',   '3l02u_20260530185755'],
    ['ゆり',   '5ctva_20260530185703'],
    ['かぐら', '1bm4l_20260530185616'],
    ['もな',   '40xrc_20260530185526'],
  ];

  const therapists = THERAPISTS.map(([name, hash]) => ({
    name,
    image_url: `${BASE}/${hash}.jpg`
  }));

  const result = await upsertTherapists(shopId, therapists);
  console.log(`✅ コス×コス: +${result.inserted} skip=${result.skipped} err=${result.errors}`);
}

// ---- aroma Flan (WordPress wp-content scraping) ----
async function processFlan() {
  const shopId = 'hokkaido_sapporo_sapporo_flan';

  // 名前のみ（画像なし）
  const NAME_ONLY = ['まゆ', 'しおん', 'ゆいか', 'あやね', 'よる', 'かおり',
    'れむ', 'るい', 'みあ', 'こころ', 'じゅり', 'ひま', 'ちょこ', 'あお', 'らむ'];

  // WordPress 画像あり - ハッシュ → 動的URL取得
  const WITH_IMAGE_NAMES = ['すみれ', 'あおい', 'まりの', 'レイ', 'こはな',
    'さや', 'のどか', 'みずき', 'ひらり', 'りま'];

  console.log('  Fetching aroma Flan therapist page...');
  const html = await fetchHtml('https://flan-sapporo.com/cast/');
  const therapists = [];

  if (html) {
    const $ = cheerio.load(html);
    // WordPress wp-content/uploads 画像
    const found = {};
    $('img[src*="wp-content/uploads"]').each((_, el) => {
      const src = $(el).attr('src') || '';
      const alt = $(el).attr('alt') || '';
      if (!src || src.includes('300x300') || src.includes('150x150')) return;
      // altが日本語名かチェック
      const name = alt.trim();
      if (name && /[ぁ-んァ-ヾァ-ン一-龯ｦ-ﾟ]/.test(name) && !found[name]) {
        // 300x450サイズを優先
        const imgUrl = src.replace(/-\d+x\d+\./, '.').replace(/-scaled\./, '.');
        found[name] = imgUrl;
      }
    });

    // 名前のみリストのセラピストを追加
    for (const name of WITH_IMAGE_NAMES) {
      therapists.push({ name, image_url: found[name] || null });
    }
  } else {
    // fetchできなかった場合は名前のみで登録
    for (const name of WITH_IMAGE_NAMES) {
      therapists.push({ name, image_url: null });
    }
  }

  // 名前のみ
  for (const name of NAME_ONLY) {
    therapists.push({ name, image_url: null });
  }

  const result = await upsertTherapists(shopId, therapists);
  console.log(`✅ aroma Flan: +${result.inserted} skip=${result.skipped} err=${result.errors}`);
}

// ---- ロリポップ (名前のみ) ----
async function processLollipop() {
  const shopId = 'hokkaido_sapporo_sapporo_lollipop';

  const NAMES = ['ゆきな', 'さらさ', 'ももな', 'まこと', 'ゆめ',
    'あおい', 'つばさ', 'るか', 'まひろ', 'ゆあ', 'みるく'];

  const therapists = NAMES.map(name => ({ name, image_url: null }));
  const result = await upsertTherapists(shopId, therapists);
  console.log(`✅ ロリポップ: +${result.inserted} skip=${result.skipped} err=${result.errors}`);
}

// ---- マダムの手 (aroma-tsushin CDN) ----
async function processMadam() {
  const shopId = 'hokkaido_sapporo_sapporo_madam';
  const BASE = 'https://aroma-tsushin.com/__admin/img_hp';

  const THERAPISTS = [
    ['ルイ',   `${BASE}/staff_9659_171802625846411.jpeg`],
    ['トモミ', `${BASE}/staff_20127_1771749904488541.jpg`],
    ['ナツコ', `${BASE}/staff_8207_1559814786574594.jpg`],
    ['リカ',   `${BASE}/staff_8211_174559739453650.jpg`],
    ['アズサ', `${BASE}/staff_8213_1559815450242090.jpg`],
    ['アム',   `${BASE}/staff_8212_1559815169224659.jpg`],
    ['メグミ', `${BASE}/staff_17920_1648220441271335.jpeg`],
    ['マコト', `${BASE}/staff_8206_1745602312869303.jpg`],
    ['ヨシノ', `${BASE}/staff_8209_1559814835251236.jpg`],
    ['ミナヨ', `${BASE}/staff_19032_1695811489906073.jpg`],
    ['ユミ',   `${BASE}/staff_9658_1559826477556209.jpg`],
    ['ユキノ', `${BASE}/staff_19265_1704432209238564.jpeg`],
    ['エリ',   `${BASE}/staff_8205_1559814702562923.jpg`],
    ['リン',   `${BASE}/staff_19072_1697284941763957.jpg`],
    ['イズミ', `${BASE}/staff_17860_1645314585546906.jpg`],
    ['ユリ',   `${BASE}/staff_19114_1698120024662209.jpg`],
    ['アンナ', null],
    ['ミサコ', null],
    ['アキ',   null],
  ];

  const therapists = THERAPISTS.map(([name, image_url]) => ({ name, image_url }));
  const result = await upsertTherapists(shopId, therapists);
  console.log(`✅ マダムの手: +${result.inserted} skip=${result.skipped} err=${result.errors}`);
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`🎌 北海道 札幌 セラピスト登録${DRY_RUN ? ' [DRY RUN]' : ''}\n`);

  await processLatte();
  await processChocolat();
  await processLabo();
  await processCoscos();
  await processFlan();
  await processLollipop();
  await processMadam();

  console.log('\n完了。次: node scripts/maintenance/process_aromaria_sapporo.mjs');
  console.log('         node scripts/maintenance/process_goddess_sapporo.mjs');
}

main().catch(console.error);
