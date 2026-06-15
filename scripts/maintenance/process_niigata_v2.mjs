/**
 * 新潟県 全shop＋セラピスト登録 (並列高速版)
 * 実行: node scripts/maintenance/process_niigata_v2.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const isDryRun = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

// 並列実行ヘルパー (最大N並列)
async function pAll(items, fn, concurrency = 8) {
  const results = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const r = await Promise.all(batch.map(fn));
    results.push(...r);
  }
  return results;
}

// ─── URLビルダー ──────────────────────────────────────────────────────────────
const estama = (shopNum, hash, date) =>
  `https://img.estama.jp/shop_data/${String(shopNum).padStart(11,'0')}/cast/main/357x556/${hash}_${date}.jpg`;
const imgsys = (imgId, fn) =>
  `https://www.img-system.com/nologo/staff/${imgId}/sq_200/${fn}.jpg`;

// ─── SHOP データ ───────────────────────────────────────────────────────────────
const SHOPS = [
  { id:'niigata_niigata_at_aroma',      name:'あろまえすて＠新潟',            website_url:'http://www.at-aroma-niigata.com/',       schedule_url:'http://www.at-aroma-niigata.com/staff',       area:'新潟', prefecture:'新潟県', image_url:'http://www.img-system.com/nologo/img/bn_title/bt_at.gif' },
  { id:'niigata_niigata_natural_refre', name:'ナチュラルリフレ',              website_url:'https://naturalrefre-niigata.com/',        schedule_url:'https://naturalrefre-niigata.com/schedule/',  area:'新潟', prefecture:'新潟県', image_url:null },
  { id:'niigata_niigata_premium_spa',   name:'THE PREMIUM SPA 新潟',         website_url:'https://estama.jp/shop/38462/',            schedule_url:'https://estama.jp/shop/38462/schedule/',      area:'新潟', prefecture:'新潟県', image_url:null },
  { id:'niigata_niigata_allure',        name:'アリュール',                    website_url:'https://niigataaromaallure.weebly.com',    schedule_url:null,                                          area:'新潟', prefecture:'新潟県', image_url:null },
  { id:'niigata_niigata_babys_breath',  name:'ベイビーズブレス',              website_url:'https://babys-br.com/',                   schedule_url:'https://babys-br.com/',                       area:'新潟', prefecture:'新潟県', image_url:null },
  { id:'niigata_niigata_myiro',         name:'マイロ',                        website_url:'http://www.myiro-niigata.com/',            schedule_url:'http://www.myiro-niigata.com/staff',          area:'新潟', prefecture:'新潟県', image_url:null },
  { id:'niigata_niigata_ai_bu',         name:'愛ぃ撫',                        website_url:'https://niigata-ai-bu.com/',               schedule_url:'https://niigata-ai-bu.com/schedule/',         area:'新潟', prefecture:'新潟県', image_url:null },
  { id:'niigata_niigata_lumea',         name:'Lumea（ルメア）',               website_url:'https://estama.jp/shop/47578/',            schedule_url:'https://estama.jp/shop/47578/schedule/',      area:'新潟', prefecture:'新潟県', image_url:null },
  { id:'niigata_niigata_tiramisu',      name:'Tiramisu（ティラミス）',        website_url:'https://estama.jp/shop/49229/',            schedule_url:'https://estama.jp/shop/49229/schedule/',      area:'新潟', prefecture:'新潟県', image_url:null },
  { id:'niigata_niigata_madonna_grace', name:'Madonna Grace（マドンナグレイス）', website_url:'https://madonna-grace.com/',           schedule_url:'https://madonna-grace.com/',                  area:'新潟', prefecture:'新潟県', image_url:null },
  { id:'niigata_niigata_celtic',        name:'Celtic（セルティック）',         website_url:'https://celtic-niigata.com/',             schedule_url:'https://clover-niigata.blogspot.com/p/blog-page.html', area:'新潟', prefecture:'新潟県', image_url:null },
  { id:'niigata_niigata_rinoa',         name:'Rinoa（リノア）',               website_url:'https://estama.jp/shop/48295/',            schedule_url:'https://estama.jp/shop/48295/schedule/',      area:'新潟', prefecture:'新潟県', image_url:null },
  { id:'niigata_niigata_nekokichi',     name:'猫時計',                        website_url:'http://www.relax-nekokichi.net/',          schedule_url:'http://www.relax-nekokichi.net/staff',        area:'新潟', prefecture:'新潟県', image_url:null },
  { id:'niigata_nagaoka_futarikiri_spa',name:'ふたりきりSPA 長岡',           website_url:'https://nagaoka-futarikiri-spa.com',       schedule_url:'https://nagaoka-futarikiri-spa.com',          area:'長岡', prefecture:'新潟県', image_url:null },
];

// ─── セラピストデータ ───────────────────────────────────────────────────────────

const AT_AROMA = [
  { name:'鈴',    imgId:'202906', fn:'nnn_shop_media_7210_1764870762_6825019676931ca6a4f80a' },
  { name:'豹',    imgId:'216151', fn:'nnn_shop_media_7210_1748519086_6834e12e02f4e' },
  { name:'璃兎',  imgId:'195849', fn:'nnn_shop_media_7210_1745123022_661a14ce37a99' },
  { name:'蝶羽',  imgId:'210924', fn:'nnn_shop_media_7210_1747497898_6813bc6a04b50' },
  { name:'実奈美', imgId:'213709', fn:'nnn_shop_media_7210_1748519086_6834e12e01e23' },
  { name:'奈奈',  imgId:'146430', fn:'nnn_shop_media_7210_1745123022_661a14ce2f8a4' },
  { name:'乃々華', imgId:'145421', fn:'nnn_shop_media_7210_1745123022_661a14ce2e547' },
  { name:'咲菜',  imgId:'188216', fn:'nnn_shop_media_7210_1745123022_661a14ce345b9' },
  { name:'椿',    imgId:'200280', fn:'nnn_shop_media_7210_1745123022_661a14ce37168' },
  { name:'優華',  imgId:'158688', fn:'nnn_shop_media_7210_1745123022_661a14ce30a1d' },
  { name:'樹里',  imgId:'210579', fn:'nnn_shop_media_7210_1747497898_6813bc6a029b6' },
  { name:'羽海',  imgId:'212606', fn:'nnn_shop_media_7210_1748519086_6834e12e00a82' },
  { name:'翠',    imgId:'176224', fn:'nnn_shop_media_7210_1745123022_661a14ce32b3b' },
  { name:'里奈',  imgId:'208718', fn:'nnn_shop_media_7210_1747497898_6813bc6a012e3' },
  { name:'可憐',  imgId:'158938', fn:'nnn_shop_media_7210_1745123022_661a14ce30d6a' },
  { name:'真桜',  imgId:'215632', fn:'nnn_shop_media_7210_1748519086_6834e12e02b45' },
  { name:'空奈',  imgId:'203113', fn:'nnn_shop_media_7210_1745123022_661a14ce37e57' },
  { name:'小春',  imgId:'197719', fn:'nnn_shop_media_7210_1745123022_661a14ce36538' },
  { name:'綾香',  imgId:'161139', fn:'nnn_shop_media_7210_1745123022_661a14ce31438' },
];

const MYIRO = [
  { name:'るあ',  imgId:'206461', fn:'nnn_shop_media_7208_1747497895_6813bc5749af2' },
  { name:'かんな', imgId:'171273', fn:'nnn_shop_media_7208_1745123019_661a14cb39db3' },
  { name:'えれな', imgId:'209071', fn:'nnn_shop_media_7208_1747497895_6813bc574782a' },
  { name:'しおり', imgId:'147318', fn:'nnn_shop_media_7208_1745123019_661a14cb2f4d3' },
  { name:'みな',  imgId:'211075', fn:'nnn_shop_media_7208_1747497895_6813bc574865b' },
  { name:'えりか', imgId:'149463', fn:'nnn_shop_media_7208_1745123019_661a14cb2fa22' },
  { name:'あやか', imgId:'214649', fn:'nnn_shop_media_7208_1748519083_6834e12b2ae4c' },
  { name:'めい',  imgId:'183747', fn:'nnn_shop_media_7208_1745123019_661a14cb337af' },
  { name:'ゆめ',  imgId:'216323', fn:'nnn_shop_media_7208_1748519083_6834e12b2bf10' },
  { name:'あむ',  imgId:'214905', fn:'nnn_shop_media_7208_1748519083_6834e12b2b2d1' },
  { name:'なぎさ', imgId:'215177', fn:'nnn_shop_media_7208_1748519083_6834e12b2b6c3' },
  { name:'なお',  imgId:'215354', fn:'nnn_shop_media_7208_1748519083_6834e12b2b9e4' },
  { name:'なな',  imgId:'198138', fn:'nnn_shop_media_7208_1745123019_661a14cb367b8' },
  { name:'みか',  imgId:'175292', fn:'nnn_shop_media_7208_1745123019_661a14cb323e8' },
  { name:'さら',  imgId:'172690', fn:'nnn_shop_media_7208_1745123019_661a14cb31f42' },
  { name:'あおい', imgId:'212691', fn:'nnn_shop_media_7208_1748519083_6834e12b29ae0' },
  { name:'あすか', imgId:'214290', fn:'nnn_shop_media_7208_1748519083_6834e12b2a6e0' },
  { name:'あかり', imgId:'211061', fn:'nnn_shop_media_7208_1747497895_6813bc574837e' },
  { name:'りな',  imgId:'204528', fn:'nnn_shop_media_7208_1745123019_661a14cb38189' },
  { name:'のん',  imgId:'197918', fn:'nnn_shop_media_7208_1745123019_661a14cb35f1d' },
];

const NEKOKICHI = [
  { name:'まい',  imgId:'164255', fn:'nnn_shop_media_7212_1745123025_661a14d101285' },
  { name:'まりん', imgId:'190677', fn:'nnn_shop_media_7212_1745123025_661a14d1059c1' },
  { name:'よもぎ', imgId:'192752', fn:'nnn_shop_media_7212_1745123025_661a14d106381' },
  { name:'むぎ',  imgId:'200405', fn:'nnn_shop_media_7212_1745123025_661a14d108c8d' },
  { name:'りこ',  imgId:'210004', fn:'nnn_shop_media_7212_1747497902_6813bc6e04b47' },
  { name:'アキ',  imgId:'214725', fn:'nnn_shop_media_7212_1748519090_6834e13224b0c' },
  { name:'おもち', imgId:'215517', fn:'nnn_shop_media_7212_1748519090_6834e1322cda8' },
  { name:'ここ',  imgId:'135521', fn:'nnn_shop_media_7212_1745123025_661a14d12ae6a' },
  { name:'ゆいな', imgId:'181377', fn:'nnn_shop_media_7212_1745123025_661a14d102fd7' },
  { name:'はづき', imgId:'190248', fn:'nnn_shop_media_7212_1745123025_661a14d1054c2' },
  { name:'ドラミ', imgId:'193274', fn:'nnn_shop_media_7212_1745123025_661a14d106b83' },
  { name:'さくら', imgId:'200177', fn:'nnn_shop_media_7212_1745123025_661a14d1087f4' },
  { name:'みなみ', imgId:'204388', fn:'nnn_shop_media_7212_1745123025_661a14d10a16f' },
  { name:'るか',  imgId:'209221', fn:'nnn_shop_media_7212_1747497902_6813bc6e04252' },
  { name:'たぴ',  imgId:'215152', fn:'nnn_shop_media_7212_1748519090_6834e1322936d' },
  { name:'ナナ',  imgId:'215392', fn:'nnn_shop_media_7212_1748519090_6834e1322ba57' },
];

const NATURAL_REFRE = [
  { name:'川上夕海', shopNum:32160, hash:'b6led', date:'20260510185814' },
  { name:'るな',    shopNum:32160, hash:'53ud7', date:'20260604141406' },
  { name:'原あかり', shopNum:32160, hash:'d5i46', date:'20250319221454' },
  { name:'桜井美羽', shopNum:32160, hash:'72xva', date:'20260610145459' },
  { name:'小林ひな', shopNum:32160, hash:'9m59r', date:'20260613141302' },
  { name:'あのん',  shopNum:32160, hash:'hn4q0', date:'20260519123655' },
  { name:'川井',    shopNum:32160, hash:'5k95o', date:'20260505145011' },
  { name:'西野るる', shopNum:32160, hash:'4omzs', date:'20260228132222' },
  { name:'白田',    shopNum:32160, hash:'2hj8j', date:'20251211122853' },
  { name:'坂口ゆきか', shopNum:32160, hash:'6vdz1', date:'20260412064603' },
  { name:'高原まこと', shopNum:32160, hash:'9dxja', date:'20260325141600' },
  { name:'桃山ゆいな', shopNum:32160, hash:'1bm2r', date:'20260308225727' },
  { name:'天野',    shopNum:32160, hash:'61iov', date:'20250323201554' },
  { name:'ララ',    shopNum:32160, hash:'ekhi3', date:'20260407095702' },
  { name:'間',      shopNum:32160, hash:'5eb5c', date:'20251207122056' },
  { name:'ちあき',  shopNum:32160, hash:'34h7r', date:'20260511023147' },
  { name:'あみ',    shopNum:32160, hash:'crqg1', date:'20250929142351' },
  { name:'遠藤ましろ', shopNum:32160, hash:'9dzdl', date:'20260509133203' },
  { name:'杉村らん', shopNum:32160, hash:'1g7sh', date:'20260404171816' },
  { name:'月島',    shopNum:32160, hash:'8wfxm', date:'20250906182721' },
  { name:'渡辺',    shopNum:32160, hash:'aeblt', date:'20260513083312' },
  { name:'前田',    shopNum:32160, hash:'bo3jk', date:'20260502233655' },
];

const PREMIUM_SPA = [
  { name:'湊りさ',      shopNum:38462, hash:'6mh6m', date:'20260511043500' },
  { name:'朝宮しおん',  shopNum:38462, hash:'9g15u', date:'20260511044637' },
  { name:'白井のどか',  shopNum:38462, hash:'e2gvu', date:'20260511044133' },
  { name:'綾瀬りな',   shopNum:38462, hash:'1nukw', date:'20260511044608' },
  { name:'速水せいか',  shopNum:38462, hash:'5rhqp', date:'20260511045411' },
  { name:'高梨みなみ',  shopNum:38462, hash:'3oy5t', date:'20260511044539' },
  { name:'花沢さら',   shopNum:38462, hash:'boykn', date:'20260511045147' },
  { name:'一ノ瀬せり',  shopNum:38462, hash:'ck7j3', date:'20260511045506' },
  { name:'天乃みみ',   shopNum:38462, hash:'bxv3i', date:'20260517171310' },
  { name:'水上もか',   shopNum:38462, hash:'cfo04', date:'20260612204655' },
  { name:'葵ゆゆ',     shopNum:38462, hash:'eihj4', date:'20260511045309' },
  { name:'小鳥ちゃん', shopNum:38462, hash:'332r0', date:'20260511043435' },
  { name:'柏木ゆら',   shopNum:38462, hash:'59tqo', date:'20260511043846' },
  { name:'白川みれい',  shopNum:38462, hash:'11itn', date:'20260511044233' },
  { name:'黒木ありさ',  shopNum:38462, hash:'e94ih', date:'20260511044038' },
  { name:'星宮りおん',  shopNum:38462, hash:'a1lue', date:'20260513014931' },
  { name:'皇てん',     shopNum:38462, hash:'z5w4f', date:'20260511045022' },
  { name:'神楽せな',   shopNum:38462, hash:'6rkgt', date:'20260511043600' },
  { name:'星乃みゆ',   shopNum:38462, hash:'24ijt', date:'20260511043949' },
  { name:'姫乃まゆ',   shopNum:38462, hash:'f3wr6', date:'20260511044015' },
  { name:'水城びび',   shopNum:38462, hash:'b9l49', date:'20260511044306' },
  { name:'鈴宮ちひろ',  shopNum:38462, hash:'eb8pz', date:'20260511044917' },
  { name:'広瀬るな',   shopNum:38462, hash:'edv5m', date:'20260511044427' },
  { name:'甘愛もも',   shopNum:38462, hash:'8xgj7', date:'20260511043309' },
  { name:'月宮みる',   shopNum:38462, hash:'852rq', date:'20260511045126' },
  { name:'姫川ゆき',   shopNum:38462, hash:'5j5hv', date:'20260511045039' },
  { name:'桃瀬るあ',   shopNum:38462, hash:'74ac9', date:'20260511045342' },
  { name:'伊集院かづき', shopNum:38462, hash:'2iwdw', date:'20260511043329' },
  { name:'桃井まこ',   shopNum:38462, hash:'bg95b', date:'20260511043916' },
  { name:'君島あも',   shopNum:38462, hash:'9w57q', date:'20260511043536' },
  { name:'夢乃りりか',  shopNum:38462, hash:'aiwte', date:'20260511043742' },
  { name:'九条れな',   shopNum:38462, hash:'3wqc0', date:'20260511045528' },
  { name:'七瀬しほ',   shopNum:38462, hash:'1duno', date:'20260511044400' },
  { name:'九十九ひな',  shopNum:38462, hash:'96dfl', date:'20260511045101' },
  { name:'天草なぎさ',  shopNum:38462, hash:'9v6ps', date:'20260513124402' },
  { name:'美咲ゆうな',  shopNum:38462, hash:'4kw2k', date:'20260511045444' },
  { name:'綾波レイ',   shopNum:38462, hash:'9180v', date:'20260511044449' },
  { name:'胡蝶あすか',  shopNum:38462, hash:'401na', date:'20260511045003' },
  { name:'ミセスジェシカ', shopNum:38462, hash:'dml76', date:'20260511043637' },
  { name:'白星さや',   shopNum:38462, hash:'5i22u', date:'20260511043407' },
];

const AI_BU = [
  { name:'さゆり', shopNum:43435, hash:'97zni', date:'20250520121025' },
  { name:'そら',  shopNum:43435, hash:'18ku1', date:'20260529150758' },
  { name:'のあ',  shopNum:43435, hash:'9dune', date:'20260217153400' },
  { name:'めい',  shopNum:43435, hash:'24ntn', date:'20250708102517' },
  { name:'まい',  shopNum:43435, hash:'c6awh', date:'20260603155151' },
  { name:'あすか', shopNum:43435, hash:'nmdjt', date:'20251224201411' },
  { name:'まゆか', shopNum:43435, hash:'c2x6y', date:'20250831084108' },
  { name:'ゆい',  shopNum:43435, hash:'349ww', date:'20250909210522' },
  { name:'ななせ', shopNum:43435, hash:'33ulg', date:'20260609103421' },
  { name:'るの',  shopNum:43435, hash:'2p7g8', date:'20250929114038' },
  { name:'あんな', shopNum:43435, hash:'7y28x', date:'20250726105721' },
  { name:'なこ',  shopNum:43435, hash:'ds7uc', date:'20260527175416' },
  { name:'まりな', shopNum:43435, hash:'7a9iu', date:'20250905115808' },
  { name:'あやみ', shopNum:43435, hash:'erppf', date:'20250520145924' },
  { name:'えりか', shopNum:43435, hash:'7wmo6', date:'20260323082609' },
  { name:'ゆな',  shopNum:43435, hash:'9xgh4', date:'20260402142750' },
  { name:'りあ',  shopNum:43435, hash:'3kb85', date:'20260503191829' },
  { name:'きょうか', shopNum:43435, hash:'9w97f', date:'20260504214200' },
  { name:'まるこ', shopNum:43435, hash:'be0u4', date:'20260611152042' },
  { name:'はる',  shopNum:43435, hash:'dj0om', date:'20250615225510' },
];

const LUMEA = [
  { name:'遥月 このみ', shopNum:47578, hash:'aqbdg', date:'20260510032936' },
  { name:'広瀬 ちひろ', shopNum:47578, hash:'ev91f', date:'20260425125809' },
  { name:'速水 まや',  shopNum:47578, hash:'9qpia', date:'20260421145412' },
  { name:'麻倉 ゆい',  shopNum:47578, hash:'3vgkd', date:'20260422104544' },
  { name:'愛崎 ひめの', shopNum:47578, hash:'1t0u6', date:'20260409104005' },
  { name:'鳳 あんず',  shopNum:47578, hash:'7ggpq', date:'20260318100203' },
  { name:'柴咲 れん',  shopNum:47578, hash:'99ngw', date:'20260316230506' },
  { name:'秋月 つむぎ', shopNum:47578, hash:'3phus', date:'20260424193919' },
  { name:'立花 もえ',  shopNum:47578, hash:'73hgz', date:'20251103042450' },
  { name:'一条 みさき', shopNum:47578, hash:'ear4f', date:'20251102230920' },
  { name:'椿 かれん',  shopNum:47578, hash:'ep1ab', date:'20251103010109' },
  { name:'沙乙女 けい', shopNum:47578, hash:'4nhj5', date:'20251102232755' },
  { name:'椎名 ありさ', shopNum:47578, hash:'601q4', date:'20251102235245' },
  { name:'桐原 みおり', shopNum:47578, hash:'eqbra', date:'20251103004252' },
  { name:'小湊 めい',  shopNum:47578, hash:'6b2zg', date:'20251102233050' },
  { name:'望月 めぐ',  shopNum:47578, hash:'9qiqd', date:'20251103000807' },
  { name:'小南 りか',  shopNum:47578, hash:'c7xwx', date:'20251127034244' },
  { name:'折原 ゆり',  shopNum:47578, hash:'ey22h', date:'20251103005646' },
  { name:'睦月 みお',  shopNum:47578, hash:'1mlfo', date:'20260203200001' },
  { name:'南雲 みみ',  shopNum:47578, hash:'2fchh', date:'20251103004529' },
  { name:'七瀬 はるか', shopNum:47578, hash:'2feqb', date:'20260302094406' },
  { name:'宇佐美 らな', shopNum:47578, hash:'exkfl', date:'20251107192631' },
  { name:'卯月 すみれ', shopNum:47578, hash:'a2n73', date:'20251127022301' },
  { name:'瀬川 れな',  shopNum:47578, hash:'7zvdl', date:'20251127022340' },
  { name:'綾瀬 のあ',  shopNum:47578, hash:null,   date:null },
  { name:'甘夢 しの',  shopNum:47578, hash:'file_a2gle', date:'20260128215033' },
  { name:'愛沢 ここ',  shopNum:47578, hash:'1xqo8', date:'20260130230143' },
];

const TIRAMISU = [
  { name:'みもざ',  shopNum:49229, hash:'g2ko1', date:'20260605223542' },
  { name:'あおい',  shopNum:49229, hash:'6e374', date:'20260511143701' },
  { name:'いりま',  shopNum:49229, hash:'247wa', date:'20260504193805' },
  { name:'さくら',  shopNum:49229, hash:'bxyn6', date:'20260206120949' },
  { name:'はな',   shopNum:49229, hash:'18v4h', date:'20260506221430' },
  { name:'れん',   shopNum:49229, hash:'92x69', date:'20260206120918' },
  { name:'りら',   shopNum:49229, hash:null,   date:null },
  { name:'りんどう', shopNum:49229, hash:null,   date:null },
  { name:'ここあ',  shopNum:49229, hash:'5buxy', date:'20260108192220' },
  { name:'かすみ',  shopNum:49229, hash:'5ge1t', date:'20260410205505' },
  { name:'せり',   shopNum:49229, hash:'7n9ei', date:'20260407201524' },
  { name:'しおん',  shopNum:49229, hash:'b3dsn', date:'20260104124147' },
  { name:'かのん',  shopNum:49229, hash:'9x4io', date:'20260110201314' },
  { name:'すず',   shopNum:49229, hash:null,   date:null },
  { name:'ゆり',   shopNum:49229, hash:'b3nf7', date:'20260510092948' },
  { name:'あやめ',  shopNum:49229, hash:'6egbe', date:'20260510093051' },
  { name:'あじさい', shopNum:49229, hash:'3puql', date:'20260407201553' },
  { name:'ゆき',   shopNum:49229, hash:null,   date:null },
  { name:'なな',   shopNum:49229, hash:'908c8', date:'20260510093242' },
];

const RINOA = [
  { name:'滝沢 まい',  shopNum:48295, hash:'2ypsl', date:'20251130020422' },
  { name:'黒川 あまね', shopNum:48295, hash:'mv0iz', date:'20251130021106' },
  { name:'小日向 りお', shopNum:48295, hash:'e9esj', date:'20260218194751' },
  { name:'川維 ゆい',  shopNum:48295, hash:'682rh', date:'20260327112557' },
  { name:'成瀬 ゆあ',  shopNum:48295, hash:'8kjjr', date:'20251130020446' },
  { name:'天使 りりむ', shopNum:48295, hash:'48tjc', date:'20260125205923' },
  { name:'深月 かなの', shopNum:48295, hash:'c4ljs', date:'20260219111948' },
  { name:'夏音 あゆ',  shopNum:48295, hash:'b49xv', date:'20260430235802' },
  { name:'雨音ひびき',  shopNum:48295, hash:'d6naf', date:'20260502101309' },
  { name:'桜咲 りん',  shopNum:48295, hash:'ss7j6', date:'20260313153310' },
  { name:'叶衣 かえで', shopNum:48295, hash:'41uxj', date:'20251211165439' },
];

const MADONNA_GRACE = [
  { name:'伊藤さくら',  lid:3  },
  { name:'青山すみれ',  lid:28 },
  { name:'宝条つかさ',  lid:13 },
  { name:'小林はな',   lid:24 },
  { name:'綾瀬さら',   lid:29 },
  { name:'高城なな',   lid:27 },
  { name:'如月りお',   lid:22 },
  { name:'椎名まゆ',   lid:26 },
  { name:'秋元まなつ',  lid:23 },
  { name:'桜庭さくらこ', lid:21 },
  { name:'一条るい',   lid:20 },
  { name:'成瀬みう',   lid:18 },
  { name:'岡田まこと',  lid:11 },
  { name:'月島みづき',  lid:25 },
  { name:'日向ほのか',  lid:19 },
  { name:'天音いのり',  lid:10 },
  { name:'相沢れい',   lid:5  },
  { name:'田中ふうか',  lid:7  },
];

const FUTARIKIRI = [
  { name:'花宮りり' }, { name:'水瀬りこ' }, { name:'小嶋ひまり' }, { name:'三上じゅん' },
  { name:'愛澤みれい' }, { name:'神崎ちひろ' }, { name:'目黒なぎ' }, { name:'藤咲みゆ' },
  { name:'坂口みみ' }, { name:'蒼井ゆい' }, { name:'有村まこ' }, { name:'小宮ほたる' },
  { name:'柊のどか' }, { name:'石川りな' }, { name:'綾瀬ありな' }, { name:'北野こなみ' },
  { name:'藤堂える' }, { name:'三浦ありす' }, { name:'楠本りか' }, { name:'沢口あいら' },
];

// ─── ユーティリティ ───────────────────────────────────────────────────────────
async function getOgImage(url) {
  try {
    const res = await fetch(url, { headers:{ 'User-Agent':'Mozilla/5.0' }, signal: AbortSignal.timeout(5000) });
    const html = await res.text();
    const m = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)
           || html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i);
    return m ? m[1] : null;
  } catch { return null; }
}

async function uploadImage(url, fileKey, referer = null) {
  try {
    const headers = { 'User-Agent':'Mozilla/5.0' };
    if (referer) headers['Referer'] = referer;
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = url.includes('.png') ? 'png' : 'jpg';
    const path = `${fileKey}.${ext}`;
    const { error } = await supabase.storage.from('therapist-images')
      .upload(path, buf, { contentType: ext==='png' ? 'image/png' : 'image/jpeg', upsert: true });
    if (error) return null;
    const { data:{ publicUrl } } = supabase.storage.from('therapist-images').getPublicUrl(path);
    return publicUrl;
  } catch { return null; }
}

async function batchUpsert(table, rows) {
  if (!rows.length) return;
  const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' });
  if (error) console.log(`  ❌ upsert error: ${error.message}`);
}

// ─── メイン ──────────────────────────────────────────────────────────────────
async function main() {
  const t0 = Date.now();
  console.log(`🌸 新潟県 全店舗登録 (${isDryRun ? 'DRY RUN' : '本実行'}) 並列高速版`);

  // ── 1. Shops: og:image並列取得 + 一括upsert ──────────────────────────────
  console.log('\n[1/5] Shop登録...');
  const { data: existingShops } = await supabase.from('shops').select('id').in('id', SHOPS.map(s=>s.id));
  const existingShopIds = new Set((existingShops||[]).map(s=>s.id));

  const shopRows = await pAll(SHOPS, async (shop) => {
    let imageUrl = shop.image_url;
    if (!isDryRun && !imageUrl && shop.website_url) {
      imageUrl = await getOgImage(shop.website_url);
    }
    return {
      id: shop.id, name: shop.name,
      website_url: shop.website_url, schedule_url: shop.schedule_url,
      image_url: imageUrl,
      raw_data: { prefecture: shop.prefecture, area: shop.area },
    };
  }, 14); // all in parallel

  if (!isDryRun) {
    await batchUpsert('shops', shopRows);
    console.log(`  ✅ ${SHOPS.length}店舗 upsert完了`);
  } else {
    shopRows.forEach(s => console.log(`  [DRY] ${s.name} image=${s.image_url||'null'}`));
  }

  // ── 2. estama therapists (CDN URL直接, Storage不要) ───────────────────────
  console.log('\n[2/5] estama セラピスト登録...');
  const estamaGroups = [
    { shopId:'niigata_niigata_natural_refre', list: NATURAL_REFRE },
    { shopId:'niigata_niigata_premium_spa',   list: PREMIUM_SPA },
    { shopId:'niigata_niigata_ai_bu',         list: AI_BU },
    { shopId:'niigata_niigata_lumea',         list: LUMEA },
    { shopId:'niigata_niigata_tiramisu',      list: TIRAMISU },
    { shopId:'niigata_niigata_rinoa',         list: RINOA },
  ];
  const estamaRows = [];
  for (const { shopId, list } of estamaGroups) {
    for (const t of list) {
      estamaRows.push({
        id: `${shopId}_${t.name}`,
        shop_id: shopId,
        name: t.name,
        image_url: (t.hash && t.date) ? estama(t.shopNum, t.hash, t.date) : null,
      });
    }
  }
  if (!isDryRun) {
    await batchUpsert('therapists', estamaRows);
    console.log(`  ✅ ${estamaRows.length}名 upsert完了`);
  } else {
    console.log(`  [DRY] ${estamaRows.length}名 予定`);
  }

  // ── 3. img-system therapists (並列fetch+upload) ───────────────────────────
  console.log('\n[3/5] img-system セラピスト登録...');
  const imgsysGroups = [
    { shopId:'niigata_niigata_at_aroma',  list: AT_AROMA },
    { shopId:'niigata_niigata_myiro',     list: MYIRO },
    { shopId:'niigata_niigata_nekokichi', list: NEKOKICHI },
  ];
  const allImgsys = imgsysGroups.flatMap(({ shopId, list }) =>
    list.map(t => ({ shopId, ...t }))
  );

  const imgsysRows = await pAll(allImgsys, async (t) => {
    let imageUrl = null;
    if (!isDryRun) {
      const srcUrl = imgsys(t.imgId, t.fn);
      imageUrl = await uploadImage(srcUrl, `niigata_imgsys_${t.imgId}`);
    }
    return { id:`${t.shopId}_${t.name}`, shop_id:t.shopId, name:t.name, image_url:imageUrl };
  }, 8); // 8並列

  if (!isDryRun) {
    await batchUpsert('therapists', imgsysRows);
    const withImg = imgsysRows.filter(r=>r.image_url).length;
    console.log(`  ✅ ${imgsysRows.length}名 upsert完了 (画像あり${withImg}名)`);
  } else {
    console.log(`  [DRY] ${imgsysRows.length}名 予定`);
  }

  // ── 4. Madonna Grace (並列ページfetch + 並列upload) ───────────────────────
  console.log('\n[4/5] Madonna Grace セラピスト登録...');
  const madonnaRows = await pAll(MADONNA_GRACE, async (t) => {
    let imageUrl = null;
    if (!isDryRun) {
      try {
        const res = await fetch(`https://madonna-grace.com/therapist/${t.lid}/`,
          { headers:{ 'User-Agent':'Mozilla/5.0' }, signal: AbortSignal.timeout(8000) });
        const html = await res.text();
        const m = html.match(/\/photos\/\d+\/([^"'\s]+)/);
        if (m) {
          const srcUrl = `https://madonna-grace.com/photos/${t.lid}/${m[1]}`;
          imageUrl = await uploadImage(srcUrl, `madonna_grace_${t.lid}`, 'https://madonna-grace.com/');
        }
      } catch {}
    }
    return { id:`niigata_niigata_madonna_grace_${t.name}`, shop_id:'niigata_niigata_madonna_grace', name:t.name, image_url:imageUrl };
  }, 5); // 5並列 (礼儀程度に制限)

  if (!isDryRun) {
    await batchUpsert('therapists', madonnaRows);
    const withImg = madonnaRows.filter(r=>r.image_url).length;
    console.log(`  ✅ ${madonnaRows.length}名 upsert完了 (画像あり${withImg}名)`);
  } else {
    console.log(`  [DRY] ${madonnaRows.length}名 予定`);
  }

  // ── 5. ふたりきりSPA (名前のみ) ───────────────────────────────────────────
  console.log('\n[5/5] ふたりきりSPA 長岡...');
  const futarikiriRows = FUTARIKIRI.map(t => ({
    id:`niigata_nagaoka_futarikiri_spa_${t.name}`,
    shop_id:'niigata_nagaoka_futarikiri_spa',
    name:t.name,
    image_url:null,
  }));
  if (!isDryRun) {
    await batchUpsert('therapists', futarikiriRows);
    console.log(`  ✅ ${futarikiriRows.length}名 upsert完了`);
  } else {
    console.log(`  [DRY] ${futarikiriRows.length}名 予定`);
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  const total = estamaRows.length + imgsysRows.length + madonnaRows.length + futarikiriRows.length;
  console.log(`\n🎉 完了! 合計${total}名 (${elapsed}秒)`);
}

main().catch(console.error);
