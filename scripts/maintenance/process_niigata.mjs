/**
 * 新潟県 全shop＋セラピスト登録
 * 実行: node scripts/maintenance/process_niigata.mjs [--dry-run]
 *
 * 対象14店舗:
 *   新潟エリア(13): あろまえすて＠新潟・ナチュラルリフレ・THE PREMIUM SPA・アリュール・ベイビーズブレス
 *                   マイロ・愛ぃ撫・ルメア・ティラミス・マドンナグレイス・セルティック・リノア・猫時計
 *   長岡エリア(1):  ふたりきりSPA
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const isDryRun = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

// ─── SHOP データ ───────────────────────────────────────────────────────────────
const SHOPS = [
  {
    id: 'niigata_niigata_at_aroma',
    name: 'あろまえすて＠新潟',
    website_url: 'http://www.at-aroma-niigata.com/',
    schedule_url: 'http://www.at-aroma-niigata.com/staff',
    area: '新潟',
    prefecture: '新潟県',
    image_url: 'http://www.img-system.com/nologo/img/bn_title/bt_at.gif',
  },
  {
    id: 'niigata_niigata_natural_refre',
    name: 'ナチュラルリフレ',
    website_url: 'https://naturalrefre-niigata.com/',
    schedule_url: 'https://naturalrefre-niigata.com/schedule/',
    area: '新潟',
    prefecture: '新潟県',
    image_url: null,
  },
  {
    id: 'niigata_niigata_premium_spa',
    name: 'THE PREMIUM SPA 新潟',
    website_url: 'https://estama.jp/shop/38462/',
    schedule_url: 'https://estama.jp/shop/38462/schedule/',
    area: '新潟',
    prefecture: '新潟県',
    image_url: null,
  },
  {
    id: 'niigata_niigata_allure',
    name: 'アリュール',
    website_url: 'https://niigataaromaallure.weebly.com',
    schedule_url: null,
    area: '新潟',
    prefecture: '新潟県',
    image_url: null,
  },
  {
    id: 'niigata_niigata_babys_breath',
    name: 'ベイビーズブレス',
    website_url: 'https://babys-br.com/',
    schedule_url: 'https://babys-br.com/',
    area: '新潟',
    prefecture: '新潟県',
    image_url: null,
  },
  {
    id: 'niigata_niigata_myiro',
    name: 'マイロ',
    website_url: 'http://www.myiro-niigata.com/',
    schedule_url: 'http://www.myiro-niigata.com/staff',
    area: '新潟',
    prefecture: '新潟県',
    image_url: null,
  },
  {
    id: 'niigata_niigata_ai_bu',
    name: '愛ぃ撫',
    website_url: 'https://niigata-ai-bu.com/',
    schedule_url: 'https://niigata-ai-bu.com/schedule/',
    area: '新潟',
    prefecture: '新潟県',
    image_url: null,
  },
  {
    id: 'niigata_niigata_lumea',
    name: 'Lumea（ルメア）',
    website_url: 'https://estama.jp/shop/47578/',
    schedule_url: 'https://estama.jp/shop/47578/schedule/',
    area: '新潟',
    prefecture: '新潟県',
    image_url: null,
  },
  {
    id: 'niigata_niigata_tiramisu',
    name: 'Tiramisu（ティラミス）',
    website_url: 'https://estama.jp/shop/49229/',
    schedule_url: 'https://estama.jp/shop/49229/schedule/',
    area: '新潟',
    prefecture: '新潟県',
    image_url: null,
  },
  {
    id: 'niigata_niigata_madonna_grace',
    name: 'Madonna Grace（マドンナグレイス）',
    website_url: 'https://madonna-grace.com/',
    schedule_url: 'https://madonna-grace.com/',
    area: '新潟',
    prefecture: '新潟県',
    image_url: null,
  },
  {
    id: 'niigata_niigata_celtic',
    name: 'Celtic（セルティック）',
    website_url: 'https://celtic-niigata.com/',
    schedule_url: 'https://clover-niigata.blogspot.com/p/blog-page.html',
    area: '新潟',
    prefecture: '新潟県',
    image_url: null,
  },
  {
    id: 'niigata_niigata_rinoa',
    name: 'Rinoa（リノア）',
    website_url: 'https://estama.jp/shop/48295/',
    schedule_url: 'https://estama.jp/shop/48295/schedule/',
    area: '新潟',
    prefecture: '新潟県',
    image_url: null,
  },
  {
    id: 'niigata_niigata_nekokichi',
    name: '猫時計',
    website_url: 'http://www.relax-nekokichi.net/',
    schedule_url: 'http://www.relax-nekokichi.net/staff',
    area: '新潟',
    prefecture: '新潟県',
    image_url: null,
  },
  {
    id: 'niigata_nagaoka_futarikiri_spa',
    name: 'ふたりきりSPA 長岡',
    website_url: 'https://nagaoka-futarikiri-spa.com',
    schedule_url: 'https://nagaoka-futarikiri-spa.com',
    area: '長岡',
    prefecture: '新潟県',
    image_url: null,
  },
];

// ─── セラピストデータ ───────────────────────────────────────────────────────────

// estama 画像URLビルダー
const estama = (shopNum, hash, date) =>
  `https://img.estama.jp/shop_data/${String(shopNum).padStart(11, '0')}/cast/main/357x556/${hash}_${date}.jpg`;

// img-system.com 画像URLビルダー  stid/imgId → imgId をpathに使う
const imgsys = (imgId, filename) =>
  `https://www.img-system.com/nologo/staff/${imgId}/sq_200/${filename}.jpg`;

// VOTEC CMS (Madonna Grace)
const votec = (lid, filename) =>
  `https://madonna-grace.com/photos/${lid}/${filename}`;

const THERAPISTS = {
  // ─── あろまえすて＠新潟 (img-system.com) 19名 ─────────────────────────────
  niigata_niigata_at_aroma: [
    { name: '鈴',    imgId: '202906', fn: 'nnn_shop_media_7210_1764870762_6825019676931ca6a4f80a' },
    { name: '豹',    imgId: '216151', fn: 'nnn_shop_media_7210_1748519086_6834e12e02f4e' },
    { name: '璃兎',  imgId: '195849', fn: 'nnn_shop_media_7210_1745123022_661a14ce37a99' },
    { name: '蝶羽',  imgId: '210924', fn: 'nnn_shop_media_7210_1747497898_6813bc6a04b50' },
    { name: '実奈美', imgId: '213709', fn: 'nnn_shop_media_7210_1748519086_6834e12e01e23' },
    { name: '奈奈',  imgId: '146430', fn: 'nnn_shop_media_7210_1745123022_661a14ce2f8a4' },
    { name: '乃々華', imgId: '145421', fn: 'nnn_shop_media_7210_1745123022_661a14ce2e547' },
    { name: '咲菜',  imgId: '188216', fn: 'nnn_shop_media_7210_1745123022_661a14ce345b9' },
    { name: '椿',    imgId: '200280', fn: 'nnn_shop_media_7210_1745123022_661a14ce37168' },
    { name: '優華',  imgId: '158688', fn: 'nnn_shop_media_7210_1745123022_661a14ce30a1d' },
    { name: '樹里',  imgId: '210579', fn: 'nnn_shop_media_7210_1747497898_6813bc6a029b6' },
    { name: '羽海',  imgId: '212606', fn: 'nnn_shop_media_7210_1748519086_6834e12e00a82' },
    { name: '翠',    imgId: '176224', fn: 'nnn_shop_media_7210_1745123022_661a14ce32b3b' },
    { name: '里奈',  imgId: '208718', fn: 'nnn_shop_media_7210_1747497898_6813bc6a012e3' },
    { name: '可憐',  imgId: '158938', fn: 'nnn_shop_media_7210_1745123022_661a14ce30d6a' },
    { name: '真桜',  imgId: '215632', fn: 'nnn_shop_media_7210_1748519086_6834e12e02b45' },
    { name: '空奈',  imgId: '203113', fn: 'nnn_shop_media_7210_1745123022_661a14ce37e57' },
    { name: '小春',  imgId: '197719', fn: 'nnn_shop_media_7210_1745123022_661a14ce36538' },
    { name: '綾香',  imgId: '161139', fn: 'nnn_shop_media_7210_1745123022_661a14ce31438' },
  ],

  // ─── ナチュラルリフレ (estama 32160) 22名 ─────────────────────────────────
  niigata_niigata_natural_refre: [
    { name: '川上夕海', hash: 'b6led', date: '20260510185814' },
    { name: 'るな',    hash: '53ud7', date: '20260604141406' },
    { name: '原あかり', hash: 'd5i46', date: '20250319221454' },
    { name: '桜井美羽', hash: '72xva', date: '20260610145459' },
    { name: '小林ひな', hash: '9m59r', date: '20260613141302' },
    { name: 'あのん',  hash: 'hn4q0', date: '20260519123655' },
    { name: '川井',    hash: '5k95o', date: '20260505145011' },
    { name: '西野るる', hash: '4omzs', date: '20260228132222' },
    { name: '白田',    hash: '2hj8j', date: '20251211122853' },
    { name: '坂口ゆきか', hash: '6vdz1', date: '20260412064603' },
    { name: '高原まこと', hash: '9dxja', date: '20260325141600' },
    { name: '桃山ゆいな', hash: '1bm2r', date: '20260308225727' },
    { name: '天野',    hash: '61iov', date: '20250323201554' },
    { name: 'ララ',    hash: 'ekhi3', date: '20260407095702' },
    { name: '間',      hash: '5eb5c', date: '20251207122056' },
    { name: 'ちあき',  hash: '34h7r', date: '20260511023147' },
    { name: 'あみ',    hash: 'crqg1', date: '20250929142351' },
    { name: '遠藤ましろ', hash: '9dzdl', date: '20260509133203' },
    { name: '杉村らん', hash: '1g7sh', date: '20260404171816' },
    { name: '月島',    hash: '8wfxm', date: '20250906182721' },
    { name: '渡辺',    hash: 'aeblt', date: '20260513083312' },
    { name: '前田',    hash: 'bo3jk', date: '20260502233655' },
  ].map(t => ({ ...t, shopNum: 32160 })),

  // ─── THE PREMIUM SPA 新潟 (estama 38462) 40名 ─────────────────────────────
  niigata_niigata_premium_spa: [
    { name: '湊りさ',      hash: '6mh6m', date: '20260511043500' },
    { name: '朝宮しおん',  hash: '9g15u', date: '20260511044637' },
    { name: '白井のどか',  hash: 'e2gvu', date: '20260511044133' },
    { name: '綾瀬りな',   hash: '1nukw', date: '20260511044608' },
    { name: '速水せいか',  hash: '5rhqp', date: '20260511045411' },
    { name: '高梨みなみ',  hash: '3oy5t', date: '20260511044539' },
    { name: '花沢さら',   hash: 'boykn', date: '20260511045147' },
    { name: '一ノ瀬せり',  hash: 'ck7j3', date: '20260511045506' },
    { name: '天乃みみ',   hash: 'bxv3i', date: '20260517171310' },
    { name: '水上もか',   hash: 'cfo04', date: '20260612204655' },
    { name: '葵ゆゆ',     hash: 'eihj4', date: '20260511045309' },
    { name: '小鳥ちゃん', hash: '332r0', date: '20260511043435' },
    { name: '柏木ゆら',   hash: '59tqo', date: '20260511043846' },
    { name: '白川みれい',  hash: '11itn', date: '20260511044233' },
    { name: '黒木ありさ',  hash: 'e94ih', date: '20260511044038' },
    { name: '星宮りおん',  hash: 'a1lue', date: '20260513014931' },
    { name: '皇てん',     hash: 'z5w4f', date: '20260511045022' },
    { name: '神楽せな',   hash: '6rkgt', date: '20260511043600' },
    { name: '星乃みゆ',   hash: '24ijt', date: '20260511043949' },
    { name: '姫乃まゆ',   hash: 'f3wr6', date: '20260511044015' },
    { name: '水城びび',   hash: 'b9l49', date: '20260511044306' },
    { name: '鈴宮ちひろ',  hash: 'eb8pz', date: '20260511044917' },
    { name: '広瀬るな',   hash: 'edv5m', date: '20260511044427' },
    { name: '甘愛もも',   hash: '8xgj7', date: '20260511043309' },
    { name: '月宮みる',   hash: '852rq', date: '20260511045126' },
    { name: '姫川ゆき',   hash: '5j5hv', date: '20260511045039' },
    { name: '桃瀬るあ',   hash: '74ac9', date: '20260511045342' },
    { name: '伊集院かづき', hash: '2iwdw', date: '20260511043329' },
    { name: '桃井まこ',   hash: 'bg95b', date: '20260511043916' },
    { name: '君島あも',   hash: '9w57q', date: '20260511043536' },
    { name: '夢乃りりか',  hash: 'aiwte', date: '20260511043742' },
    { name: '九条れな',   hash: '3wqc0', date: '20260511045528' },
    { name: '七瀬しほ',   hash: '1duno', date: '20260511044400' },
    { name: '九十九ひな',  hash: '96dfl', date: '20260511045101' },
    { name: '天草なぎさ',  hash: '9v6ps', date: '20260513124402' },
    { name: '美咲ゆうな',  hash: '4kw2k', date: '20260511045444' },
    { name: '綾波レイ',   hash: '9180v', date: '20260511044449' },
    { name: '胡蝶あすか',  hash: '401na', date: '20260511045003' },
    { name: 'ミセスジェシカ', hash: 'dml76', date: '20260511043637' },
    { name: '白星さや',   hash: '5i22u', date: '20260511043407' },
  ].map(t => ({ ...t, shopNum: 38462 })),

  // ─── マイロ (img-system.com) 20名 ────────────────────────────────────────
  niigata_niigata_myiro: [
    { name: 'るあ',  imgId: '206461', fn: 'nnn_shop_media_7208_1747497895_6813bc5749af2' },
    { name: 'かんな', imgId: '171273', fn: 'nnn_shop_media_7208_1745123019_661a14cb39db3' },
    { name: 'えれな', imgId: '209071', fn: 'nnn_shop_media_7208_1747497895_6813bc574782a' },
    { name: 'しおり', imgId: '147318', fn: 'nnn_shop_media_7208_1745123019_661a14cb2f4d3' },
    { name: 'みな',  imgId: '211075', fn: 'nnn_shop_media_7208_1747497895_6813bc574865b' },
    { name: 'えりか', imgId: '149463', fn: 'nnn_shop_media_7208_1745123019_661a14cb2fa22' },
    { name: 'あやか', imgId: '214649', fn: 'nnn_shop_media_7208_1748519083_6834e12b2ae4c' },
    { name: 'めい',  imgId: '183747', fn: 'nnn_shop_media_7208_1745123019_661a14cb337af' },
    { name: 'ゆめ',  imgId: '216323', fn: 'nnn_shop_media_7208_1748519083_6834e12b2bf10' },
    { name: 'あむ',  imgId: '214905', fn: 'nnn_shop_media_7208_1748519083_6834e12b2b2d1' },
    { name: 'なぎさ', imgId: '215177', fn: 'nnn_shop_media_7208_1748519083_6834e12b2b6c3' },
    { name: 'なお',  imgId: '215354', fn: 'nnn_shop_media_7208_1748519083_6834e12b2b9e4' },
    { name: 'なな',  imgId: '198138', fn: 'nnn_shop_media_7208_1745123019_661a14cb367b8' },
    { name: 'みか',  imgId: '175292', fn: 'nnn_shop_media_7208_1745123019_661a14cb323e8' },
    { name: 'さら',  imgId: '172690', fn: 'nnn_shop_media_7208_1745123019_661a14cb31f42' },
    { name: 'あおい', imgId: '212691', fn: 'nnn_shop_media_7208_1748519083_6834e12b29ae0' },
    { name: 'あすか', imgId: '214290', fn: 'nnn_shop_media_7208_1748519083_6834e12b2a6e0' },
    { name: 'あかり', imgId: '211061', fn: 'nnn_shop_media_7208_1747497895_6813bc574837e' },
    { name: 'りな',  imgId: '204528', fn: 'nnn_shop_media_7208_1745123019_661a14cb38189' },
    { name: 'のん',  imgId: '197918', fn: 'nnn_shop_media_7208_1745123019_661a14cb35f1d' },
  ],

  // ─── 愛ぃ撫 (estama 43435) 20名 ───────────────────────────────────────────
  niigata_niigata_ai_bu: [
    { name: 'さゆり', hash: '97zni', date: '20250520121025' },
    { name: 'そら',  hash: '18ku1', date: '20260529150758' },
    { name: 'のあ',  hash: '9dune', date: '20260217153400' },
    { name: 'めい',  hash: '24ntn', date: '20250708102517' },
    { name: 'まい',  hash: 'c6awh', date: '20260603155151' },
    { name: 'あすか', hash: 'nmdjt', date: '20251224201411' },
    { name: 'まゆか', hash: 'c2x6y', date: '20250831084108' },
    { name: 'ゆい',  hash: '349ww', date: '20250909210522' },
    { name: 'ななせ', hash: '33ulg', date: '20260609103421' },
    { name: 'るの',  hash: '2p7g8', date: '20250929114038' },
    { name: 'あんな', hash: '7y28x', date: '20250726105721' },
    { name: 'なこ',  hash: 'ds7uc', date: '20260527175416' },
    { name: 'まりな', hash: '7a9iu', date: '20250905115808' },
    { name: 'あやみ', hash: 'erppf', date: '20250520145924' },
    { name: 'えりか', hash: '7wmo6', date: '20260323082609' },
    { name: 'ゆな',  hash: '9xgh4', date: '20260402142750' },
    { name: 'りあ',  hash: '3kb85', date: '20260503191829' },
    { name: 'きょうか', hash: '9w97f', date: '20260504214200' },
    { name: 'まるこ', hash: 'be0u4', date: '20260611152042' },
    { name: 'はる',  hash: 'dj0om', date: '20250615225510' },
  ].map(t => ({ ...t, shopNum: 43435 })),

  // ─── Lumea ルメア (estama 47578) 27名 ─────────────────────────────────────
  niigata_niigata_lumea: [
    { name: '遥月 このみ', hash: 'aqbdg', date: '20260510032936' },
    { name: '広瀬 ちひろ', hash: 'ev91f', date: '20260425125809' },
    { name: '速水 まや',  hash: '9qpia', date: '20260421145412' },
    { name: '麻倉 ゆい',  hash: '3vgkd', date: '20260422104544' },
    { name: '愛崎 ひめの', hash: '1t0u6', date: '20260409104005' },
    { name: '鳳 あんず',  hash: '7ggpq', date: '20260318100203' },
    { name: '柴咲 れん',  hash: '99ngw', date: '20260316230506' },
    { name: '秋月 つむぎ', hash: '3phus', date: '20260424193919' },
    { name: '立花 もえ',  hash: '73hgz', date: '20251103042450' },
    { name: '一条 みさき', hash: 'ear4f', date: '20251102230920' },
    { name: '椿 かれん',  hash: 'ep1ab', date: '20251103010109' },
    { name: '沙乙女 けい', hash: '4nhj5', date: '20251102232755' },
    { name: '椎名 ありさ', hash: '601q4', date: '20251102235245' },
    { name: '桐原 みおり', hash: 'eqbra', date: '20251103004252' },
    { name: '小湊 めい',  hash: '6b2zg', date: '20251102233050' },
    { name: '望月 めぐ',  hash: '9qiqd', date: '20251103000807' },
    { name: '小南 りか',  hash: 'c7xwx', date: '20251127034244' },
    { name: '折原 ゆり',  hash: 'ey22h', date: '20251103005646' },
    { name: '睦月 みお',  hash: '1mlfo', date: '20260203200001' },
    { name: '南雲 みみ',  hash: '2fchh', date: '20251103004529' },
    { name: '七瀬 はるか', hash: '2feqb', date: '20260302094406' },
    { name: '宇佐美 らな', hash: 'exkfl', date: '20251107192631' },
    { name: '卯月 すみれ', hash: 'a2n73', date: '20251127022301' },
    { name: '瀬川 れな',  hash: '7zvdl', date: '20251127022340' },
    { name: '綾瀬 のあ',  hash: null,    date: null },  // no image
    { name: '甘夢 しの',  hash: 'file_a2gle', date: '20260128215033' },
    { name: '愛沢 ここ',  hash: '1xqo8', date: '20260130230143' },
  ].map(t => ({ ...t, shopNum: 47578 })),

  // ─── Tiramisu ティラミス (estama 49229) 19名 ───────────────────────────────
  niigata_niigata_tiramisu: [
    { name: 'みもざ',  hash: 'g2ko1', date: '20260605223542' },
    { name: 'あおい',  hash: '6e374', date: '20260511143701' },
    { name: 'いりま',  hash: '247wa', date: '20260504193805' },
    { name: 'さくら',  hash: 'bxyn6', date: '20260206120949' },
    { name: 'はな',   hash: '18v4h', date: '20260506221430' },
    { name: 'れん',   hash: '92x69', date: '20260206120918' },
    { name: 'りら',   hash: null,    date: null },
    { name: 'りんどう', hash: null,    date: null },
    { name: 'ここあ',  hash: '5buxy', date: '20260108192220' },
    { name: 'かすみ',  hash: '5ge1t', date: '20260410205505' },
    { name: 'せり',   hash: '7n9ei', date: '20260407201524' },
    { name: 'しおん',  hash: 'b3dsn', date: '20260104124147' },
    { name: 'かのん',  hash: '9x4io', date: '20260110201314' },
    { name: 'すず',   hash: null,    date: null },
    { name: 'ゆり',   hash: 'b3nf7', date: '20260510092948' },
    { name: 'あやめ',  hash: '6egbe', date: '20260510093051' },
    { name: 'あじさい', hash: '3puql', date: '20260407201553' },
    { name: 'ゆき',   hash: null,    date: null },
    { name: 'なな',   hash: '908c8', date: '20260510093242' },
  ].map(t => ({ ...t, shopNum: 49229 })),

  // ─── Madonna Grace マドンナグレイス (VOTEC CMS) 18名 ──────────────────────
  niigata_niigata_madonna_grace: [
    { name: '伊藤さくら',  lid: 3,  fn: '20260201204452-995.png' },
    { name: '青山すみれ',  lid: 28, fn: '20260201204452-995.png' },
    { name: '宝条つかさ',  lid: 13, fn: '20260201204452-995.png' },
    { name: '小林はな',   lid: 24, fn: '20260201204452-995.png' },
    { name: '綾瀬さら',   lid: 29, fn: '20260201204452-995.png' },
    { name: '高城なな',   lid: 27, fn: '20260201204452-995.png' },
    { name: '如月りお',   lid: 22, fn: '20260201204452-995.png' },
    { name: '椎名まゆ',   lid: 26, fn: '20260201204452-995.png' },
    { name: '秋元まなつ',  lid: 23, fn: '20260201204452-995.png' },
    { name: '桜庭さくらこ', lid: 21, fn: '20260201204452-995.png' },
    { name: '一条るい',   lid: 20, fn: '20260201204452-995.png' },
    { name: '成瀬みう',   lid: 18, fn: '20260201204452-995.png' },
    { name: '岡田まこと',  lid: 11, fn: '20260201204452-995.png' },
    { name: '月島みづき',  lid: 25, fn: '20260201204452-995.png' },
    { name: '日向ほのか',  lid: 19, fn: '20260201204452-995.png' },
    { name: '天音いのり',  lid: 10, fn: '20260201204452-995.png' },
    { name: '相沢れい',   lid: 5,  fn: '20260201204452-995.png' },
    { name: '田中ふうか',  lid: 7,  fn: '20260201204452-995.png' },
  ],

  // ─── Rinoa リノア (estama 48295) 11名 ─────────────────────────────────────
  niigata_niigata_rinoa: [
    { name: '滝沢 まい',  hash: '2ypsl', date: '20251130020422' },
    { name: '黒川 あまね', hash: 'mv0iz', date: '20251130021106' },
    { name: '小日向 りお', hash: 'e9esj', date: '20260218194751' },
    { name: '川維 ゆい',  hash: '682rh', date: '20260327112557' },
    { name: '成瀬 ゆあ',  hash: '8kjjr', date: '20251130020446' },
    { name: '天使 りりむ', hash: '48tjc', date: '20260125205923' },
    { name: '深月 かなの', hash: 'c4ljs', date: '20260219111948' },
    { name: '夏音 あゆ',  hash: 'b49xv', date: '20260430235802' },
    { name: '雨音ひびき',  hash: 'd6naf', date: '20260502101309' },
    { name: '桜咲 りん',  hash: 'ss7j6', date: '20260313153310' },
    { name: '叶衣 かえで', hash: '41uxj', date: '20251211165439' },
  ].map(t => ({ ...t, shopNum: 48295 })),

  // ─── 猫時計 nekokichi (img-system.com) 16名 ──────────────────────────────
  niigata_niigata_nekokichi: [
    { name: 'まい',  imgId: '164255', fn: 'nnn_shop_media_7212_1745123025_661a14d101285' },
    { name: 'まりん', imgId: '190677', fn: 'nnn_shop_media_7212_1745123025_661a14d1059c1' },
    { name: 'よもぎ', imgId: '192752', fn: 'nnn_shop_media_7212_1745123025_661a14d106381' },
    { name: 'むぎ',  imgId: '200405', fn: 'nnn_shop_media_7212_1745123025_661a14d108c8d' },
    { name: 'りこ',  imgId: '210004', fn: 'nnn_shop_media_7212_1747497902_6813bc6e04b47' },
    { name: 'アキ',  imgId: '214725', fn: 'nnn_shop_media_7212_1748519090_6834e13224b0c' },
    { name: 'おもち', imgId: '215517', fn: 'nnn_shop_media_7212_1748519090_6834e1322cda8' },
    { name: 'ここ',  imgId: '135521', fn: 'nnn_shop_media_7212_1745123025_661a14d12ae6a' },
    { name: 'ゆいな', imgId: '181377', fn: 'nnn_shop_media_7212_1745123025_661a14d102fd7' },
    { name: 'はづき', imgId: '190248', fn: 'nnn_shop_media_7212_1745123025_661a14d1054c2' },
    { name: 'ドラミ', imgId: '193274', fn: 'nnn_shop_media_7212_1745123025_661a14d106b83' },
    { name: 'さくら', imgId: '200177', fn: 'nnn_shop_media_7212_1745123025_661a14d1087f4' },
    { name: 'みなみ', imgId: '204388', fn: 'nnn_shop_media_7212_1745123025_661a14d10a16f' },
    { name: 'るか',  imgId: '209221', fn: 'nnn_shop_media_7212_1747497902_6813bc6e04252' },
    { name: 'たぴ',  imgId: '215152', fn: 'nnn_shop_media_7212_1748519090_6834e1322936d' },
    { name: 'ナナ',  imgId: '215392', fn: 'nnn_shop_media_7212_1748519090_6834e1322ba57' },
  ],

  // ─── ふたりきりSPA 長岡 (WordPress) 20名 名前のみ ─────────────────────────
  niigata_nagaoka_futarikiri_spa: [
    { name: '花宮りり' },
    { name: '水瀬りこ' },
    { name: '小嶋ひまり' },
    { name: '三上じゅん' },
    { name: '愛澤みれい' },
    { name: '神崎ちひろ' },
    { name: '目黒なぎ' },
    { name: '藤咲みゆ' },
    { name: '坂口みみ' },
    { name: '蒼井ゆい' },
    { name: '有村まこ' },
    { name: '小宮ほたる' },
    { name: '柊のどか' },
    { name: '石川りな' },
    { name: '綾瀬ありな' },
    { name: '北野こなみ' },
    { name: '藤堂える' },
    { name: '三浦ありす' },
    { name: '楠本りか' },
    { name: '沢口あいら' },
  ],
};

// ─── 画像取得 & Storage アップロード ─────────────────────────────────────────
async function uploadImage(url, fileKey, referer = null) {
  try {
    const headers = { 'User-Agent': 'Mozilla/5.0' };
    if (referer) headers['Referer'] = referer;
    const res = await fetch(url, { headers });
    if (!res.ok) { console.log(`  ⚠️ fetch ${res.status}: ${url}`); return null; }
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = url.includes('.png') ? 'png' : 'jpg';
    const path = `${fileKey}.${ext}`;
    const { error } = await supabase.storage
      .from('therapist-images')
      .upload(path, buf, { contentType: ext === 'png' ? 'image/png' : 'image/jpeg', upsert: true });
    if (error) { console.log(`  ⚠️ storage: ${error.message}`); return null; }
    const { data: { publicUrl } } = supabase.storage.from('therapist-images').getPublicUrl(path);
    return publicUrl;
  } catch (e) {
    console.log(`  ⚠️ ${e.message}`);
    return null;
  }
}

// og:image取得
async function getOgImage(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, redirect: 'follow' });
    const html = await res.text();
    const m = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)
           || html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i);
    return m ? m[1] : null;
  } catch { return null; }
}

// ─── 画像URL生成 ──────────────────────────────────────────────────────────────
function getTherapistImageUrl(shopId, t) {
  // estama shops
  if (t.shopNum && t.hash && t.date) {
    return estama(t.shopNum, t.hash, t.date);
  }
  // img-system.com shops
  if (t.imgId && t.fn) {
    return imgsys(t.imgId, t.fn);
  }
  // Madonna Grace (VOTEC)
  if (t.lid !== undefined && t.fn) {
    return null; // fetch individually below
  }
  return null;
}

// ─── メイン ──────────────────────────────────────────────────────────────────
async function main() {
  console.log(`🌸 新潟県 全店舗登録 (${isDryRun ? 'DRY RUN' : '本実行'})`);

  // 1. Shop登録
  console.log('\n═══ STEP 1: Shop登録 ═══');
  for (const shop of SHOPS) {
    console.log(`\n📍 ${shop.name} (${shop.id})`);
    const { data: existing } = await supabase.from('shops').select('id').eq('id', shop.id).single();
    if (existing) {
      console.log('  既存 → スキップ');
      continue;
    }

    // og:image取得
    let imageUrl = shop.image_url;
    if (!isDryRun && !imageUrl && shop.website_url) {
      imageUrl = await getOgImage(shop.website_url);
      console.log(`  og:image: ${imageUrl || 'null'}`);
    }

    if (!isDryRun) {
      const { error } = await supabase.from('shops').upsert({
        id: shop.id,
        name: shop.name,
        website_url: shop.website_url,
        schedule_url: shop.schedule_url,
        image_url: imageUrl,
        raw_data: {
          prefecture: shop.prefecture,
          area: shop.area,
        },
      });
      if (error) console.log(`  ❌ ${error.message}`);
      else console.log(`  ✅ 登録完了`);
    } else {
      console.log(`  [DRY] upsert: ${shop.name}`);
    }
  }

  // 2. セラピスト登録
  console.log('\n═══ STEP 2: セラピスト登録 ═══');
  for (const [shopId, therapists] of Object.entries(THERAPISTS)) {
    console.log(`\n👥 ${shopId} (${therapists.length}名)`);

    const { data: existing } = await supabase
      .from('therapists').select('id, name, image_url').eq('shop_id', shopId);
    const existingMap = new Map((existing || []).map(t => [t.name, t]));

    let inserted = 0, skipped = 0, errors = 0;

    for (const t of therapists) {
      const ex = existingMap.get(t.name);
      if (ex && ex.image_url) { skipped++; continue; }

      let imageUrl = null;

      if (!isDryRun) {
        // estama直接URL (Storage不要 - CDNから直接)
        if (t.shopNum && t.hash && t.date) {
          imageUrl = estama(t.shopNum, t.hash, t.date);
        }
        // img-system.com → Storage
        else if (t.imgId && t.fn) {
          const srcUrl = imgsys(t.imgId, t.fn);
          const key = `niigata_imgsys_${t.imgId}`;
          imageUrl = await uploadImage(srcUrl, key);
        }
        // Madonna Grace VOTEC → Storage
        else if (t.lid !== undefined) {
          // fetch the individual page to get actual filename
          try {
            const res = await fetch(`https://madonna-grace.com/therapist/${t.lid}/`);
            const html = await res.text();
            const m = html.match(/\/photos\/\d+\/([^"']+)/);
            if (m) {
              const srcUrl = `https://madonna-grace.com/photos/${t.lid}/${m[1]}`;
              const key = `madonna_grace_${t.lid}`;
              imageUrl = await uploadImage(srcUrl, key, 'https://madonna-grace.com/');
            }
          } catch {}
        }

        if (ex) {
          await supabase.from('therapists').update({ image_url: imageUrl }).eq('id', ex.id);
        } else {
          const { error } = await supabase.from('therapists').upsert({
            id: `${shopId}_${t.name}`,
            shop_id: shopId,
            name: t.name,
            image_url: imageUrl,
          });
          if (error) { console.log(`  ❌ ${t.name}: ${error.message}`); errors++; continue; }
        }
        inserted++;
        if (inserted % 10 === 0) console.log(`  ... ${inserted}名登録済`);
      } else {
        console.log(`  + ${t.name}`);
        inserted++;
      }
    }
    console.log(`  ✅ 新規+${inserted} スキップ=${skipped} エラー=${errors}`);
  }

  console.log('\n🎉 新潟県 全店舗登録完了!');
}

main().catch(console.error);
