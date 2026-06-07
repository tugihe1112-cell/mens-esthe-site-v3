/**
 * 品川エリア 5店舗 登録スクリプト
 *   - メンエス大井町 (品川4位) 51名 — WordPress
 *   - Rose Aroma Spa (品川5位) 44名
 *   - HANA SPA (品川7位) 41名 — imgsrv.jp shop/135
 *   - Mの扉 (品川8位) 3名 — 画像なし
 *   - SPA Secret House (品川10位) 23名 — imgsrv.jp shop/102
 *
 * 実行:
 *   node scripts/maintenance/process_shinagawa_shops.mjs --dry-run
 *   node scripts/maintenance/process_shinagawa_shops.mjs
 *   node scripts/maintenance/process_shinagawa_shops.mjs --shop oimachi
 *   node scripts/maintenance/process_shinagawa_shops.mjs --shop rosespa
 *   node scripts/maintenance/process_shinagawa_shops.mjs --shop hanaspa
 *   node scripts/maintenance/process_shinagawa_shops.mjs --shop mdoor
 *   node scripts/maintenance/process_shinagawa_shops.mjs --shop spash
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

// ===== メンエス大井町 =====
const OIMACHI_SHOP = {
  id: 'tokyo_shinagawa_oimachi_mensesthe',
  name: 'メンエス大井町',
  website_url: 'https://oimachi-mensesthe.com/',
  schedule_url: 'https://oimachi-mensesthe.com/schedule/',
  image_url: 'https://oimachi-mensesthe.com/wp-content/uploads/2023/10/5b8f1e36e51bfeddb6f23ec1afebdf34.png',
  raw_data: { prefecture: '東京都', area: '品川' },
};
const OIMACHI_THERAPISTS = [
  { name: 'にこ',   src: 'https://oimachi-mensesthe.com/wp-content/uploads/2026/05/IMG_1503-scaled.jpeg' },
  { name: 'まりあ', src: 'https://oimachi-mensesthe.com/wp-content/uploads/2026/05/IMG_1473-scaled.jpeg' },
  { name: 'ゆず',   src: 'https://oimachi-mensesthe.com/wp-content/uploads/2026/05/IMG_1349-scaled.jpeg' },
  { name: 'こはる', src: 'https://oimachi-mensesthe.com/wp-content/uploads/2026/05/IMG_1344-scaled.jpeg' },
  { name: 'わかな', src: 'https://oimachi-mensesthe.com/wp-content/uploads/2026/04/IMG_1213.jpeg' },
  { name: 'あい',   src: 'https://oimachi-mensesthe.com/wp-content/uploads/2026/03/IMG_1119-1.jpeg' },
  { name: 'みらい', src: 'https://oimachi-mensesthe.com/wp-content/uploads/2026/02/IMG_1100-scaled.jpeg' },
  { name: 'しの',   src: 'https://oimachi-mensesthe.com/wp-content/uploads/2026/01/IMG_1043.jpeg' },
  { name: 'なお',   src: 'https://oimachi-mensesthe.com/wp-content/uploads/2026/01/IMG_1107.jpeg' },
  { name: 'あいり', src: 'https://oimachi-mensesthe.com/wp-content/uploads/2025/12/IMG_0896-scaled.jpeg' },
  { name: 'りか',   src: 'https://oimachi-mensesthe.com/wp-content/uploads/2025/11/IMG_0739-scaled.jpeg' },
  { name: 'なみ',   src: 'https://oimachi-mensesthe.com/wp-content/uploads/2025/10/IMG_0676-scaled.jpeg' },
  { name: 'うい',   src: 'https://oimachi-mensesthe.com/wp-content/uploads/2025/07/IMG_0318.jpeg' },
  { name: 'ゆあ',   src: 'https://oimachi-mensesthe.com/wp-content/uploads/2025/06/IMG_0148.jpeg' },
  { name: 'はる',   src: 'https://oimachi-mensesthe.com/wp-content/uploads/2025/06/IMG_0128.jpeg' },
  { name: 'はぬ',   src: 'https://oimachi-mensesthe.com/wp-content/uploads/2025/05/IMG_0088.jpeg' },
  { name: 'みじゅ', src: 'https://oimachi-mensesthe.com/wp-content/uploads/2025/05/IMG_0047.jpeg' },
  { name: 'かれん', src: 'https://oimachi-mensesthe.com/wp-content/uploads/2025/04/IMG_9964.jpeg' },
  { name: 'うる',   src: 'https://oimachi-mensesthe.com/wp-content/uploads/2025/02/IMG_9727-1.jpeg' },
  { name: 'ねね',   src: 'https://oimachi-mensesthe.com/wp-content/uploads/2025/02/IMG_9605-1.jpeg' },
  { name: 'のえる', src: 'https://oimachi-mensesthe.com/wp-content/uploads/2025/02/IMG_9553.jpeg' },
  { name: 'ゆい',   src: 'https://oimachi-mensesthe.com/wp-content/uploads/2025/02/IMG_9580.jpeg' },
  { name: 'さや',   src: 'https://oimachi-mensesthe.com/wp-content/uploads/2025/01/IMG_9332.jpeg' },
  { name: 'ぽめ',   src: 'https://oimachi-mensesthe.com/wp-content/uploads/2024/12/IMG_9002.jpeg' },
  { name: 'うみ',   src: 'https://oimachi-mensesthe.com/wp-content/uploads/2024/12/IMG_9004.jpeg' },
  { name: 'てあ',   src: 'https://oimachi-mensesthe.com/wp-content/uploads/2024/10/IMG_8740-2.jpeg' },
  { name: 'ふう',   src: 'https://oimachi-mensesthe.com/wp-content/uploads/2024/10/IMG_8731.jpeg' },
  { name: 'えみ',   src: 'https://oimachi-mensesthe.com/wp-content/uploads/2024/10/IMG_8553.jpeg' },
  { name: 'せいか', src: 'https://oimachi-mensesthe.com/wp-content/uploads/2024/09/IMG_8405.jpeg' },
  { name: 'おんぷ', src: 'https://oimachi-mensesthe.com/wp-content/uploads/2024/09/IMG_8358-1.jpeg' },
  { name: 'たまき', src: 'https://oimachi-mensesthe.com/wp-content/uploads/2024/08/IMG_8259-1.jpeg' },
  { name: 'しずく', src: 'https://oimachi-mensesthe.com/wp-content/uploads/2024/08/IMG_8227.jpeg' },
  { name: 'りおん', src: 'https://oimachi-mensesthe.com/wp-content/uploads/2024/08/IMG_8131-1.jpeg' },
  { name: 'はむ',   src: 'https://oimachi-mensesthe.com/wp-content/uploads/2024/08/IMG_8022.jpeg' },
  { name: 'みう',   src: 'https://oimachi-mensesthe.com/wp-content/uploads/2024/08/IMG_8083.jpeg' },
  { name: 'とわ',   src: 'https://oimachi-mensesthe.com/wp-content/uploads/2024/12/IMG_7940.jpeg' },
  { name: 'あや',   src: 'https://oimachi-mensesthe.com/wp-content/uploads/2024/11/IMG_7738.jpeg' },
  { name: 'しえる', src: 'https://oimachi-mensesthe.com/wp-content/uploads/2024/11/IMG_7603.jpeg' },
  { name: 'かのん', src: 'https://oimachi-mensesthe.com/wp-content/uploads/2024/09/IMG_7211.jpeg' },
  { name: 'なぎ',   src: 'https://oimachi-mensesthe.com/wp-content/uploads/2024/07/IMG_6598-1.jpeg' },
  { name: 'りんか', src: 'https://oimachi-mensesthe.com/wp-content/uploads/2024/06/IMG_6564-2.jpeg' },
  { name: 'えり',   src: 'https://oimachi-mensesthe.com/wp-content/uploads/2024/06/IMG_6504.jpeg' },
  { name: 'まゆ',   src: 'https://oimachi-mensesthe.com/wp-content/uploads/2024/06/IMG_6512.jpeg' },
  { name: 'かりん', src: 'https://oimachi-mensesthe.com/wp-content/uploads/2024/06/IMG_6477-1.jpeg' },
  { name: 'れん',   src: 'https://oimachi-mensesthe.com/wp-content/uploads/2024/05/IMG_8091.jpeg' },
  { name: 'のの',   src: 'https://oimachi-mensesthe.com/wp-content/uploads/2024/04/IMG_5179.jpeg' },
  { name: 'れいな', src: 'https://oimachi-mensesthe.com/wp-content/uploads/2024/01/IMG_4017.jpeg' },
  { name: 'めい',   src: 'https://oimachi-mensesthe.com/wp-content/uploads/2024/02/9055576E-9997-44FE-AB56-40FE17D75AB0.jpeg' },
  { name: 'ゆき',   src: 'https://oimachi-mensesthe.com/wp-content/uploads/2024/02/09F86D22-9B0D-4AB5-B0C5-123F2DD02EC6.jpeg' },
  { name: 'らぴ',   src: 'https://oimachi-mensesthe.com/wp-content/uploads/2025/06/IMG_0724-scaled.jpeg' },
  { name: 'らん',   src: 'https://oimachi-mensesthe.com/wp-content/uploads/2024/03/994568DB-BBFF-4BF2-808D-7F149FD247F6.jpeg' },
].map(t => ({ ...t, key: 'oimachi_' + t.src.split('/').pop().replace(/\.[^.]+$/, '').slice(0, 25) }));

// ===== Rose Aroma Spa =====
const ROSESPA_SHOP = {
  id: 'tokyo_shinagawa_oimachi_rose_aroma_spa',
  name: 'Rose Aroma Spa (ローズアロマスパ)',
  website_url: 'https://rose-aroma-spa.com/',
  schedule_url: 'https://rose-aroma-spa.com/schedule',
  image_url: 'https://rose-aroma-spa.com/theme/h1merd01/images/ogp.jpg',
  raw_data: { prefecture: '東京都', area: '品川' },
};
// 画像URL: /photos/{id}/{timestamp}-600_800_0.jpg (Chrome DOM抽出・全URL確認済み)
const ROSESPA_THERAPISTS = [
  { name: 'かれん',        src: null },  // nowprinting
  { name: '一ノ瀬 あやな', src: 'https://rose-aroma-spa.com/photos/87/20260603213234-600_800_0.jpg' },
  { name: '湊 あいか',     src: 'https://rose-aroma-spa.com/photos/85/20260504132129-600_800_0.jpg' },
  { name: '壇 れいか',     src: 'https://rose-aroma-spa.com/photos/78/20260420203449-20260405070208-S__21659687_0.jpg' },
  { name: 'ニコ',          src: 'https://rose-aroma-spa.com/photos/69/20260305142754-600_800_0.jpg' },
  { name: 'ゆき',          src: 'https://rose-aroma-spa.com/photos/18/20260305143029-600_800_0.jpg' },
  { name: 'なな',          src: 'https://rose-aroma-spa.com/photos/29/20260305143034-600_800_0.jpg' },
  { name: 'ケイコ',        src: 'https://rose-aroma-spa.com/photos/19/20260305142958-600_800_0.jpg' },
  { name: 'すず',          src: 'https://rose-aroma-spa.com/photos/11/20260327201709-600_800_0.jpg' },
  { name: 'まい',          src: 'https://rose-aroma-spa.com/photos/84/20260427121936-600_800_0.jpg' },
  { name: 'りん',          src: 'https://rose-aroma-spa.com/photos/12/20260305142806-600_800_0.jpg' },
  { name: 'ひなた',        src: 'https://rose-aroma-spa.com/photos/76/20260430113149-600_800_0.jpg' },
  { name: 'まみこ',        src: 'https://rose-aroma-spa.com/photos/79/20260416055629-600_800_0.jpg' },
  { name: '橘 ゆりか',    src: 'https://rose-aroma-spa.com/photos/83/20260427121929-600_800_0.jpg' },
  { name: 'あさひ',        src: 'https://rose-aroma-spa.com/photos/8/20260305142800-600_800_0.jpg' },
  { name: '高遠 めぐみ',   src: 'https://rose-aroma-spa.com/photos/80/20260416055623-600_800_0.jpg' },
  { name: 'れな',          src: 'https://rose-aroma-spa.com/photos/77/20260516134132-600_800_0.jpg' },
  { name: 'うみ',          src: 'https://rose-aroma-spa.com/photos/2/20260305142828-600_800_0.jpg' },
  { name: 'みお',          src: 'https://rose-aroma-spa.com/photos/22/20260424041211-600_800_0.jpg' },
  { name: '胡桃 りお',    src: 'https://rose-aroma-spa.com/photos/6/20260423183406-600_800_0.jpg' },
  { name: 'らん',          src: 'https://rose-aroma-spa.com/photos/32/20260305143046-600_800_0.jpg' },
  { name: 'さくら',        src: 'https://rose-aroma-spa.com/photos/81/20260416055617-600_800_0.jpg' },
  { name: 'まりあ',        src: 'https://rose-aroma-spa.com/photos/1/20260305142824-600_800_0.jpg' },
  { name: 'ゆり',          src: 'https://rose-aroma-spa.com/photos/75/20260312023629-600_800_0.jpg' },
  { name: 'あかり',        src: 'https://rose-aroma-spa.com/photos/33/20260305143040-600_800_0.jpg' },
  { name: 'みく',          src: 'https://rose-aroma-spa.com/photos/10/20260305142902-600_800_0.jpg' },
  { name: 'かな',          src: 'https://rose-aroma-spa.com/photos/71/20260305142749-600_800_0.jpg' },
  { name: 'なる',          src: 'https://rose-aroma-spa.com/photos/7/20260305142952-600_800_0.jpg' },
  { name: 'ひとか',        src: 'https://rose-aroma-spa.com/photos/26/20260305142940-600_800_0.jpg' },
  { name: 'はるの',        src: 'https://rose-aroma-spa.com/photos/72/20260307074038-600_800_0.jpg' },
  { name: 'ナターシャ',    src: 'https://rose-aroma-spa.com/photos/25/20260305143010-600_800_0.jpg' },
  { name: 'みなみ',        src: 'https://rose-aroma-spa.com/photos/9/20260305142856-600_800_0.jpg' },
  { name: 'ようこ',        src: 'https://rose-aroma-spa.com/photos/34/20260305143104-600_800_0.jpg' },
  { name: 'しの',          src: 'https://rose-aroma-spa.com/photos/5/20260305142839-600_800_0.jpg' },
  { name: 'やすこ',        src: 'https://rose-aroma-spa.com/photos/31/20260305143023-600_800_0.jpg' },
  { name: 'さな',          src: 'https://rose-aroma-spa.com/photos/13/20260305142912-600_800_0.jpg' },
  { name: 'こはく',        src: 'https://rose-aroma-spa.com/photos/3/20260305142833-600_800_0.jpg' },
  { name: 'えま',          src: 'https://rose-aroma-spa.com/photos/73/20260305142742-600_800_0.jpg' },
  { name: 'ゆい',          src: 'https://rose-aroma-spa.com/photos/21/20260305143052-600_800_0.jpg' },
  { name: 'しずか',        src: 'https://rose-aroma-spa.com/photos/15/20260305142917-600_800_0.jpg' },
  { name: 'せいら',        src: 'https://rose-aroma-spa.com/photos/16/20260305142923-600_800_0.jpg' },
  { name: 'しおり',        src: 'https://rose-aroma-spa.com/photos/17/20260305142929-600_800_0.jpg' },
  { name: 'あんり',        src: 'https://rose-aroma-spa.com/photos/23/20260305143110-600_800_0.jpg' },
  { name: 'みゆき',        src: 'https://rose-aroma-spa.com/photos/39/20260305143113-600_800_0.jpg' },
].map(t => ({ ...t, key: t.src ? 'rosespa_' + t.src.match(/\/photos\/(\d+)\//)?.[1] + '_' + t.src.split('/').pop().replace(/\.[^.]+$/, '').slice(0, 12) : null }));

// ===== HANA SPA (imgsrv.jp shop/135) =====
const HANASPA_SHOP = {
  id: 'tokyo_shinagawa_oimachi_hana_spa',
  name: 'HANA SPA',
  website_url: 'https://esthe-hanaspa.com/',
  schedule_url: 'https://esthe-hanaspa.com/schedule/',
  image_url: 'https://imgsrv.jp/shop/135/parts/og-image.png',
  raw_data: { prefecture: '東京都', area: '品川' },
};
const HANASPA_THERAPISTS = [
  { name: '月城えま',   hash: '8fb3898d12f9841ee4' }, { name: '有馬あんな',  hash: '2ea382039ebf91cd37' },
  { name: '篠原さやか', hash: '8690e6b06a21d1b0fa' }, { name: '小鳥遊かんな',hash: 'e5e8b3c77b9d13a5fe' },
  { name: '水城りこ',   hash: '52e52f36f8b3b1af12' }, { name: '松井ゆりな',  hash: '7dd22be48bcca7588a' },
  { name: '赤木あん',   hash: '490c33b55e3a9ba1e3' }, { name: '小林ゆうか',  hash: '830d3601b08011947e' },
  { name: '桜井らな',   hash: '9b729589d9d11f75d0' }, { name: '山本るな',    hash: '8acfe4006068e4410c' },
  { name: '吉川めい',   hash: '5ebb3451554759ad0a' }, { name: '鈴木あいり',  hash: '730bf1a87167e69c16' },
  { name: '皐月ゆり',   hash: '6ca5550a79ee767638' }, { name: '相原なお',    hash: '27e90182774681ace8' },
  { name: '夢乃あいか', hash: '5f835598ea9b9010c6' }, { name: '美月のあ',    hash: 'b1079f61eaf8f813a6' },
  { name: '栗山まろん', hash: 'ae8dc82505bbf4fac9' }, { name: '岡本なつき',  hash: '1acf6d2a708982cf1f' },
  { name: '神崎まゆ',   hash: '423f45b4c965746977' }, { name: '川瀬りかこ',  hash: '29f617be6e367e1d4d' },
  { name: '小波もも',   hash: '025bd76088d83732a8' }, { name: '神川みこ',    hash: 'fad36ce27964bf9300' },
  { name: '上坂ゆう',   hash: 'a88158828b1959689f' }, { name: '篠宮れんか',  hash: '228f6517a60037180c' },
  { name: '堀井ちさ',   hash: '61f876b35f153249c8' }, { name: '加藤れな',    hash: 'f65bcc4968fdded911' },
  { name: '沢井さや',   hash: 'a3801018d27c06669a' }, { name: '猫野じゅり',  hash: 'b7fae81196fc073ce1' },
  { name: '加賀見せな', hash: '60b6e231ac434e101d' }, { name: '柊らむ',      hash: '49b7ef7ceb0b63ad90' },
  { name: '椎名りあ',   hash: 'b55620cc27ec8b6e7c' }, { name: '広瀬みお',    hash: 'ee300e01d87e46b6c0' },
  { name: '愛内りん',   hash: 'b231f93fd49502b7ab' }, { name: '藤井さな',    hash: '48417ba142872dfb40' },
  { name: '岩花しの',   hash: '6866c6a1c065d7645c' }, { name: '長谷部りな',  hash: 'f2abc1335c5d0a5307' },
  { name: '黒田もも',   hash: '2cefad200cc1fda746' }, { name: '風間あんな',  hash: '06eff5552017470baf' },
  { name: '安達せな',   hash: 'bfdc2c3ebce3a97cd4' }, { name: '松高れん',    hash: '431948220c30e9f228' },
  { name: '志田まい',   hash: '483289ef6076931aec' },
].map(t => ({ name: t.name, src: `https://imgsrv.jp/shop/135/lady/${t.hash}.jpg`, key: `hanaspa_${t.hash.slice(0,18)}` }));

// ===== Mの扉 (3名・画像なし) =====
const MDOOR_SHOP = {
  id: 'tokyo_shinagawa_shinagawa_m_door',
  name: 'Mの扉',
  website_url: 'https://m-salon.tokyo/',
  schedule_url: 'https://m-salon.tokyo/schedule/',
  image_url: null,
  raw_data: { prefecture: '東京都', area: '品川' },
};
const MDOOR_NAMES = ['大宮 あい', '横山 あこ', '上田 れな'];

// ===== SPA Secret House (imgsrv.jp shop/102) =====
const SPASH_SHOP = {
  id: 'tokyo_shinagawa_oimachi_spa_secret_house',
  name: 'SPA Secret House (スパシークレットハウス)',
  website_url: 'https://spa-sh.com/',
  schedule_url: 'https://spa-sh.com/schedule/',
  image_url: 'https://imgsrv.jp/shop/102/parts/og-image.png',
  raw_data: { prefecture: '東京都', area: '品川' },
};
const SPASH_THERAPISTS = [
  { name: 'じゅり', hash: '377a266e313fc5509a' }, { name: 'みゆ',   hash: '9fa6b52ac9140834b8' },
  { name: 'みすず', hash: '5a5ebe938a214332c9' }, { name: 'りさ',   hash: 'f1bb3e1abb96e145a3' },
  { name: 'なな',   hash: 'ff9d6db4d5d8fc9c05' }, { name: 'りい',   hash: '2ca3929dd10fe7d88c' },
  { name: 'かれん', hash: 'd38994dd1923f908fc' }, { name: 'すみれ', hash: 'd25430905c090ce94b' },
  { name: 'ゆな',   hash: '6baf4a407f211b3ec6' }, { name: 'ななせ', hash: '47e246cd38afefb502' },
  { name: 'あや',   hash: 'b3fdbdd6400d9e8a21' }, { name: 'ひめか', hash: '68d3e10f468ba5b956' },
  { name: 'しおん', hash: '947d2ee24c66d5c980' }, { name: 'なこ',   hash: '0d92339fca62cbc914' },
  { name: 'さや',   hash: 'f35edb59680e646977' }, { name: 'まお',   hash: 'f965f79c2432095277' },
  { name: 'ゆうこ', hash: '519fb23bbcd0ccbdd4' }, { name: 'おとは', hash: '2691b36dd2edd7766c' },
  { name: 'りこ',   hash: 'a2f8ffb6462c71829c' }, { name: 'れいな', hash: '0cc46a71e36c894c31' },
  { name: 'ちなつ', hash: 'f299bb96fb081aaf2a' }, { name: 'ゆめ',   hash: '9f3bff69008e56b712' },
  { name: 'あみ',   hash: '8d30862e161eff0d2e' },
].map(t => ({ name: t.name, src: `https://imgsrv.jp/shop/102/lady/${t.hash}.jpg`, key: `spash_${t.hash.slice(0,18)}` }));

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
  if (error) console.error(`Shop error:`, error.message);
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
  console.log(`=== 品川5店舗 登録 (DRY_RUN=${DRY_RUN}) ===\n`);
  const run = (n) => !shopArg || shopArg === n;

  if (run('oimachi'))  { console.log(`--- メンエス大井町 ${OIMACHI_THERAPISTS.length}名 ---`); await registerShop(OIMACHI_SHOP); await registerTherapists(OIMACHI_SHOP.id, OIMACHI_THERAPISTS, 'https://oimachi-mensesthe.com'); }
  if (run('rosespa')) { console.log(`\n--- Rose Aroma Spa ${ROSESPA_THERAPISTS.length}名 ---`); await registerShop(ROSESPA_SHOP); await registerTherapists(ROSESPA_SHOP.id, ROSESPA_THERAPISTS, 'https://rose-aroma-spa.com'); }
  if (run('hanaspa')) { console.log(`\n--- HANA SPA ${HANASPA_THERAPISTS.length}名 ---`); await registerShop(HANASPA_SHOP); await registerTherapists(HANASPA_SHOP.id, HANASPA_THERAPISTS, 'https://esthe-hanaspa.com'); }
  if (run('mdoor'))   { console.log(`\n--- Mの扉 ${MDOOR_NAMES.length}名 ---`); await registerShop(MDOOR_SHOP); await registerTherapists(MDOOR_SHOP.id, MDOOR_NAMES, null); }
  if (run('spash'))   { console.log(`\n--- SPA Secret House ${SPASH_THERAPISTS.length}名 ---`); await registerShop(SPASH_SHOP); await registerTherapists(SPASH_SHOP.id, SPASH_THERAPISTS, 'https://spa-sh.com'); }

  console.log('\n=== 完了 ===');
}
main().catch(console.error);
