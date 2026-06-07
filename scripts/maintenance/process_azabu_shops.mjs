/**
 * 麻布十番・六本木エリア 3店舗 登録スクリプト
 *   - CAMERON (cameron-esthe.net) — 84名
 *   - デジャヴ東京 (dejavu-tokyo.net) — 200名
 *   - Spa Lanikai (resortlanikai.com) — 72名
 *
 * 実行:
 *   node scripts/maintenance/process_azabu_shops.mjs --dry-run
 *   node scripts/maintenance/process_azabu_shops.mjs
 *   node scripts/maintenance/process_azabu_shops.mjs --shop cameron
 *   node scripts/maintenance/process_azabu_shops.mjs --shop dejavu
 *   node scripts/maintenance/process_azabu_shops.mjs --shop lanikai
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

// ===== CAMERON =====
const CAMERON_SHOP = {
  id: 'tokyo_minato_azabujuban_cameron',
  name: 'CAMERON (キャメロン)',
  website_url: 'https://cameron-esthe.net/',
  schedule_url: 'https://cameron-esthe.net/schedules/',
  image_url: null,
  raw_data: { prefecture: '東京都', area: '麻布十番' },
};

// 画像: https://cameron-esthe.net/vars/imgs/profiles/{id}/prof_thumb_1_s.jpg
// id=null = デフォルト画像（prof_thumb.jpg）= 写真なし
const CAMERON_THERAPISTS = [
  { name: 'ゆめ',   id: 8   }, { name: 'はるか', id: 24  }, { name: 'みき',   id: 133 },
  { name: 'あいり', id: 168 }, { name: 'ゆら',   id: 170 }, { name: 'みれい', id: 101 },
  { name: 'まり',   id: 163 }, { name: 'みいな', id: 141 }, { name: 'みさ',   id: 11  },
  { name: 'まい',   id: 21  }, { name: 'うみ',   id: null }, { name: 'そのか', id: null },
  { name: 'のあ',   id: 41  }, { name: 'れん',   id: null }, { name: 'ちな',   id: 49  },
  { name: 'ななお', id: 16  }, { name: 'れい',   id: 52  }, { name: 'えり',   id: 86  },
  { name: 'らん',   id: 75  }, { name: 'ひな',   id: 72  }, { name: 'かなの', id: 99  },
  { name: 'ひまり', id: 61  }, { name: 'りあ',   id: 38  }, { name: 'まき',   id: 94  },
  { name: 'えな',   id: 90  }, { name: 'まゆ',   id: 92  }, { name: 'りか',   id: 116 },
  { name: 'あいな', id: 166 }, { name: 'さな',   id: 223 }, { name: 'まな',   id: 115 },
  { name: 'みゆ',   id: 146 }, { name: 'れみ',   id: null }, { name: 'さら',   id: null },
  { name: 'あおい', id: 213 }, { name: 'せいな', id: 214 }, { name: 'はに',   id: null },
  { name: 'みお',   id: 218 }, { name: 'おと',   id: 219 }, { name: 'ねね',   id: 209 },
  { name: 'はる',   id: 202 }, { name: 'ひより', id: 203 }, { name: 'もか',   id: 118 },
  { name: 'りりあ', id: 169 }, { name: 'めい',   id: 200 }, { name: 'あすか', id: 216 },
  { name: 'ゆずき', id: null }, { name: 'ひめか', id: 97  }, { name: 'もも',   id: 123 },
  { name: 'るい',   id: 148 }, { name: 'りお',   id: 180 }, { name: 'ゆきの', id: 112 },
  { name: 'もな',   id: 113 }, { name: 'りんか', id: 111 }, { name: 'りら',   id: null },
  { name: 'さくら', id: 196 }, { name: 'るな',   id: null }, { name: 'まりん', id: 176 },
  { name: 'うる',   id: 167 }, { name: 'ゆらの', id: 110 }, { name: 'みな',   id: 114 },
  { name: 'あゆ',   id: 121 }, { name: 'ゆか',   id: 197 }, { name: 'ゆう',   id: 198 },
  { name: 'かれん', id: 210 }, { name: 'ちか',   id: 211 }, { name: 'さき',   id: 217 },
  { name: 'なみ',   id: 188 }, { name: 'あいか', id: null }, { name: 'ゆい',   id: 183 },
  { name: 'こはる', id: null }, { name: 'めぐ',   id: 145 }, { name: 'ありさ', id: 164 },
  { name: 'みみ',   id: 171 }, { name: 'ことは', id: 174 }, { name: '清華',   id: 186 },
  { name: 'ゆり',   id: 179 }, { name: 'ひめ',   id: 181 }, { name: 'あやな', id: 184 },
  { name: 'のん',   id: 185 }, { name: 'さゆり', id: null }, { name: '麗花',   id: 195 },
  { name: 'ゆみ',   id: 194 }, { name: 'ほのか', id: 199 }, { name: 'れあ',   id: null },
  { name: 'なな',   id: 225 },
].map(t => ({
  ...t,
  imgUrl: t.id ? `https://cameron-esthe.net/vars/imgs/profiles/${t.id}/prof_thumb_1_s.jpg` : null,
}));

// ===== デジャヴ東京 =====
const DEJAVU_SHOP = {
  id: 'tokyo_minato_nishiazabu_dejavu_tokyo',
  name: 'デジャヴ東京 (Dejavu TOKYO)',
  website_url: 'https://dejavu-tokyo.net/',
  schedule_url: 'https://dejavu-tokyo.net/schedule',
  image_url: null,
  raw_data: { prefecture: '東京都', area: '麻布十番' },
};

// 画像: https://dejavu-tokyo.net/photos/{lid}/raw_{lid}.{ext}
// LEON SPAと同じパターン
const DEJAVU_THERAPISTS = [
  { name: '西野とうか',    lid: 630, ext: 'jpeg' }, { name: '吉野なのは',  lid: 629, ext: 'jpeg' },
  { name: '真野こはる',    lid: 628, ext: 'jpeg' }, { name: '星野つむぎ',  lid: 627, ext: 'jpg'  },
  { name: '吉岡あまね',    lid: 626, ext: 'jpeg' }, { name: '宝生れい',    lid: 625, ext: 'jpeg' },
  { name: 'かなで',        lid: 624, ext: 'jpeg' }, { name: 'かな',        lid: 623, ext: 'jpeg' },
  { name: 'みりあ',        lid: 622, ext: 'jpeg' }, { name: 'らら',        lid: 621, ext: 'jpg'  },
  { name: '愛野みな',      lid: 620, ext: 'jpeg' }, { name: 'しおん',      lid: 619, ext: 'jpeg' },
  { name: '二宮はる',      lid: 618, ext: 'jpg'  }, { name: '姫宮くろえ',  lid: 617, ext: 'jpeg' },
  { name: '神崎ひかり',    lid: 616, ext: 'jpeg' }, { name: '片山すずな',  lid: 615, ext: 'jpg'  },
  { name: '藤原みつき',    lid: 614, ext: 'jpeg' }, { name: '月城さや',    lid: 611, ext: 'jpeg' },
  { name: '松本なみえ',    lid: 610, ext: 'jpeg' }, { name: '黒崎いちか',  lid: 608, ext: 'jpeg' },
  { name: '神楽うい',      lid: 606, ext: 'jpg'  }, { name: '白百合めろ',  lid: 605, ext: 'jpg'  },
  { name: '朝比奈のあ',    lid: 603, ext: 'jpg'  }, { name: '三上せいな',  lid: 602, ext: 'jpeg' },
  { name: '桜井あみ',      lid: 598, ext: 'jpeg' }, { name: '天野みれい',  lid: 589, ext: 'jpeg' },
  { name: '日向あむ',      lid: 587, ext: 'jpg'  }, { name: '恵のん',      lid: 585, ext: 'jpg'  },
  { name: '相澤かすみ',    lid: 583, ext: 'jpg'  }, { name: '高宮つき',    lid: 582, ext: 'jpeg' },
  { name: '海風あいら',    lid: 581, ext: 'jpeg' }, { name: '岸谷るか',    lid: 580, ext: 'jpg'  },
  { name: '天宮みゆ',      lid: 579, ext: 'jpeg' }, { name: '七道くう',    lid: 577, ext: 'jpeg' },
  { name: '結城める',      lid: 574, ext: 'jpg'  }, { name: '七瀬らな',    lid: 570, ext: 'jpg'  },
  { name: '山下あいか',    lid: 569, ext: 'jpeg' }, { name: '白鳥いずみ',  lid: 566, ext: 'jpg'  },
  { name: '佐々木ゆきな',  lid: 565, ext: 'jpg'  }, { name: '芹沢りお',    lid: 564, ext: 'jpg'  },
  { name: '咲野みこ',      lid: 563, ext: 'jpg'  }, { name: '安藤みな',    lid: 562, ext: 'jpg'  },
  { name: '有栖せりか',    lid: 561, ext: 'jpg'  }, { name: '神宮寺うるは', lid: 560, ext: 'jpeg' },
  { name: '天音みさき',    lid: 559, ext: 'jpg'  }, { name: '瀬尾まりか',  lid: 558, ext: 'jpg'  },
  { name: '吉田まよ',      lid: 557, ext: 'jpg'  }, { name: '南れいこ',    lid: 554, ext: 'jpeg' },
  { name: '山下なのか',    lid: 553, ext: 'jpeg' }, { name: '小野寺りりこ', lid: 552, ext: 'jpg'  },
  { name: '白河さらら',    lid: 551, ext: 'jpeg' }, { name: '南雲あいみ',  lid: 549, ext: 'jpg'  },
  { name: '水瀬せいら',    lid: 548, ext: 'jpg'  }, { name: '泉あこ',      lid: 545, ext: 'jpg'  },
  { name: '白鳥ここは',    lid: 542, ext: 'jpeg' }, { name: '飯田こはる',  lid: 541, ext: 'jpeg' },
  { name: '観月りょう',    lid: 539, ext: 'jpeg' }, { name: '及川ふゆ',    lid: 538, ext: 'jpg'  },
  { name: '折原らん',      lid: 537, ext: 'jpeg' }, { name: '佐藤あや',    lid: 535, ext: 'jpeg' },
  { name: '華月ゆずか',    lid: 534, ext: 'jpg'  }, { name: '花沢こころ',  lid: 533, ext: 'jpeg' },
  { name: 'えま',          lid: 531, ext: 'jpeg' }, { name: '深山あさみ',  lid: 526, ext: 'jpeg' },
  { name: '椿れい',        lid: 525, ext: 'jpeg' }, { name: '愛須りか',    lid: 523, ext: 'jpeg' },
  { name: 'のん',          lid: 517, ext: 'jpeg' }, { name: '藤咲あすか',  lid: 515, ext: 'jpeg' },
  { name: '秋山こゆき',    lid: 513, ext: 'jpeg' }, { name: '浅田まみ',    lid: 512, ext: 'jpg'  },
  { name: '大澤さや',      lid: 511, ext: 'jpeg' }, { name: '大島まいか',  lid: 508, ext: 'jpeg' },
  { name: '愛野みな2',     lid: 631, ext: 'jpg'  }, { name: '白咲みさ',    lid: 503, ext: 'jpeg' },
  { name: '黒江あいこ',    lid: 498, ext: 'jpeg' }, { name: 'ひとみ',      lid: 497, ext: 'jpeg' },
  { name: '白石うた',      lid: 493, ext: 'jpeg' }, { name: '伊藤あおい',  lid: 492, ext: 'jpg'  },
  { name: '南野さわ',      lid: 491, ext: 'jpeg' }, { name: '箱崎あや',    lid: 490, ext: 'jpeg' },
  { name: '長谷りおな',    lid: 488, ext: 'jpeg' }, { name: '一宮すい',    lid: 486, ext: 'jpeg' },
  { name: '椎名すみれ',    lid: 485, ext: 'jpg'  }, { name: '白峰ひらり',  lid: 482, ext: 'jpg'  },
  { name: '立石ゆいな',    lid: 474, ext: 'jpg'  }, { name: '澤井まな',    lid: 471, ext: 'jpg'  },
  { name: '篠宮ひなた',    lid: 470, ext: 'jpg'  }, { name: '倉木ちなつ',  lid: 466, ext: 'jpg'  },
  { name: '堤沢こと',      lid: 464, ext: 'jpeg' }, { name: 'てぃな',      lid: 463, ext: 'jpeg' },
  { name: '川添りな',      lid: 458, ext: 'jpg'  }, { name: '田中さら',    lid: 457, ext: 'jpeg' },
  { name: '春野ゆづき',    lid: 455, ext: 'jpg'  }, { name: '杉本みいな',  lid: 452, ext: 'jpeg' },
  { name: '近藤せいら',    lid: 449, ext: 'jpeg' }, { name: '早瀬のぞみ',  lid: 443, ext: 'jpg'  },
  { name: '三谷しずく',    lid: 437, ext: 'jpeg' }, { name: '三宅すず',    lid: 435, ext: 'jpg'  },
  { name: '大橋さら',      lid: 427, ext: 'jpeg' }, { name: '龍宮れいな',  lid: 423, ext: 'jpeg' },
  { name: '北野もえか',    lid: 418, ext: 'jpeg' }, { name: '工藤さつき',  lid: 415, ext: 'jpeg' },
  { name: '奥田ゆの',      lid: 414, ext: 'jpeg' }, { name: '北川れん',    lid: 413, ext: 'jpeg' },
  { name: '木村ひなみ',    lid: 412, ext: 'jpg'  }, { name: '桃沢るる',    lid: 409, ext: 'jpeg' },
  { name: '月島あかり',    lid: 404, ext: 'jpeg' }, { name: '川添みさき',  lid: 397, ext: 'jpg'  },
  { name: '楠本ゆうき',    lid: 396, ext: 'jpg'  }, { name: '白雪ゆあ',    lid: 388, ext: 'jpg'  },
  { name: '黒川さや',      lid: 386, ext: 'jpg'  }, { name: '小西まあみ',  lid: 385, ext: 'jpeg' },
  { name: '山城もえ',      lid: 398, ext: 'jpg'  }, { name: '滝沢さくら',  lid: 374, ext: 'jpg'  },
  { name: '竹内もえ',      lid: 373, ext: 'jpeg' }, { name: '一ノ瀬みやび', lid: 368, ext: 'jpeg' },
  { name: '水瀬ことは',    lid: 375, ext: 'jpg'  }, { name: '近藤りり',    lid: 312, ext: 'jpg'  },
  { name: '西田はるか',    lid: 309, ext: 'jpg'  }, { name: '稲本ゆり',    lid: 307, ext: 'jpg'  },
  { name: '松村さき',      lid: 305, ext: 'jpg'  }, { name: '木村のえ',    lid: 304, ext: 'jpg'  },
  { name: '吉川もえの',    lid: 298, ext: 'jpg'  }, { name: '一条みなみ',  lid: 310, ext: 'jpeg' },
  { name: '瀬戸めあり',    lid: 292, ext: 'jpg'  }, { name: '谷あすか',    lid: 295, ext: 'jpg'  },
  { name: '喜多川あん',    lid: 294, ext: 'jpg'  }, { name: '杉本もな',    lid: 299, ext: 'jpeg' },
  { name: '真白るな',      lid: 287, ext: 'jpg'  }, { name: '飯島ひかる',  lid: 286, ext: 'jpg'  },
  { name: '坂下ゆずか',    lid: 282, ext: 'jpg'  }, { name: '木下れい',    lid: 279, ext: 'jpg'  },
  { name: '近藤なぎ',      lid: 277, ext: 'jpg'  }, { name: '三谷ゆう',    lid: 276, ext: 'jpg'  },
  { name: '福田ゆな',      lid: 271, ext: 'jpg'  }, { name: '成田あゆみ',  lid: 268, ext: 'jpg'  },
  { name: '井上みお',      lid: 264, ext: 'jpg'  }, { name: '永野きほ',    lid: 263, ext: 'jpg'  },
  { name: '葉月ゆりな',    lid: 260, ext: 'jpg'  }, { name: '工藤せな',    lid: 259, ext: 'jpg'  },
  { name: '一ノ瀬もも',    lid: 258, ext: 'jpg'  }, { name: '有村しほ',    lid: 256, ext: 'jpg'  },
  { name: '楠木りこ',      lid: 248, ext: 'jpg'  }, { name: '松浦かえで',  lid: 245, ext: 'jpg'  },
  { name: '津代ここ',      lid: 242, ext: 'jpg'  }, { name: '佐野まい',    lid: 241, ext: 'jpg'  },
  { name: '桜井かれん',    lid: 239, ext: 'jpg'  }, { name: '朝比奈まり',  lid: 238, ext: 'jpg'  },
  { name: '栗山にいな',    lid: 237, ext: 'jpg'  }, { name: '和泉まや',    lid: 232, ext: 'jpg'  },
  { name: '星野れな',      lid: 229, ext: 'jpg'  }, { name: '伊藤まりん',  lid: 228, ext: 'jpg'  },
  { name: '山本ひな',      lid: 227, ext: 'jpg'  }, { name: '新田そら',    lid: 225, ext: 'jpg'  },
  { name: '茉白うる',      lid: 224, ext: 'jpg'  }, { name: '白咲まや',    lid: 215, ext: 'jpg'  },
  { name: '矢田くるみ',    lid: 211, ext: 'jpg'  }, { name: '三井りん',    lid: 201, ext: 'jpg'  },
  { name: '宮下なぎ',      lid: 199, ext: 'jpeg' }, { name: '木下みいあ',  lid: 197, ext: 'jpg'  },
  { name: '田辺せんり',    lid: 195, ext: 'jpg'  }, { name: '美波あずさ',  lid: 191, ext: 'jpg'  },
  { name: '倉田ゆず',      lid: 188, ext: 'jpg'  }, { name: '谷口ゆあ',    lid: 183, ext: 'jpg'  },
  { name: '日野原みさと',  lid: 179, ext: 'jpg'  }, { name: '広瀬ひまり',  lid: 178, ext: 'jpg'  },
  { name: '須藤さえ',      lid: 175, ext: 'jpg'  }, { name: '橋本まなみ',  lid: 173, ext: 'jpg'  },
  { name: '白石きょうか',  lid: 174, ext: 'jpg'  }, { name: '石原さな',    lid: 171, ext: 'jpg'  },
  { name: '成瀬めい',      lid: 169, ext: 'jpg'  }, { name: '上条ゆな',    lid: 167, ext: 'jpg'  },
  { name: '高畑まりあ',    lid: 166, ext: 'jpg'  }, { name: '葉山かおり',  lid: 146, ext: 'jpg'  },
  { name: '木崎まどか',    lid: 137, ext: 'jpg'  }, { name: '平田ゆうな',  lid: 118, ext: 'jpg'  },
  { name: '高橋ほのか',    lid: 117, ext: 'jpg'  }, { name: '白石あや',    lid: 115, ext: 'jpg'  },
  { name: '蒼井はな',      lid: 126, ext: 'jpg'  }, { name: '美咲ありさ',  lid: 136, ext: 'jpg'  },
  { name: '香坂ゆず',      lid: 79,  ext: 'jpg'  }, { name: '清水まほ',    lid: 78,  ext: 'jpg'  },
  { name: '白崎るな',      lid: 125, ext: 'jpg'  }, { name: '市原いと',    lid: 8,   ext: 'jpg'  },
  { name: '成瀬もも',      lid: 11,  ext: 'jpg'  }, { name: '結城あい',    lid: 14,  ext: 'jpg'  },
  { name: '鈴村まり',      lid: 17,  ext: 'jpg'  }, { name: '橘ましろ',    lid: 2,   ext: 'jpg'  },
  { name: '北条ゆい',      lid: 24,  ext: 'jpg'  }, { name: '堀越ゆり',    lid: 25,  ext: 'jpg'  },
  { name: '長谷川みら',    lid: 3,   ext: 'jpg'  }, { name: '一咲かんな',  lid: 28,  ext: 'jpg'  },
  { name: '夢乃らん',      lid: 32,  ext: 'jpg'  }, { name: '明神みやび',  lid: 34,  ext: 'jpg'  },
  { name: '真鍋しゅり',    lid: 36,  ext: 'jpg'  }, { name: '一ノ瀬りこ',  lid: 39,  ext: 'jpg'  },
  { name: '橋本れな',      lid: 43,  ext: 'jpg'  }, { name: '七海せな',    lid: 44,  ext: 'jpg'  },
  { name: '白坂はな',      lid: 45,  ext: 'jpg'  }, { name: '加藤あいり',  lid: 48,  ext: 'jpg'  },
].map(t => ({ ...t, imgUrl: `https://dejavu-tokyo.net/photos/${t.lid}/raw_${t.lid}.${t.ext}` }));

// ===== Spa Lanikai =====
const LANIKAI_SHOP = {
  id: 'tokyo_minato_azabujuban_spa_lanikai',
  name: 'Spa Lanikai (スパラニカイ)',
  website_url: 'https://www.resortlanikai.com/',
  schedule_url: 'https://www.resortlanikai.com/schedule',
  image_url: null,
  raw_data: { prefecture: '東京都', area: '麻布十番' },
};

const LANIKAI_THERAPISTS = [
  { name: '葉月りお',    lid: 69,  ext: 'jpeg' }, { name: '美空せりな', lid: 3,   ext: 'jpeg' },
  { name: '小園はるか',  lid: 92,  ext: 'jpeg' }, { name: '華山るん',   lid: 110, ext: 'jpeg' },
  { name: '竹内える',    lid: 22,  ext: 'jpg'  }, { name: '塩原りょう', lid: 107, ext: 'jpeg' },
  { name: '坂口ひなの',  lid: 71,  ext: 'jpeg' }, { name: '山川つばさ', lid: 5,   ext: 'jpg'  },
  { name: '華原うみ',    lid: 15,  ext: 'jpg'  }, { name: '姫乃ありさ', lid: 60,  ext: 'jpeg' },
  { name: '真白あすみ',  lid: 109, ext: 'jpeg' }, { name: '春乃ゆり',   lid: 17,  ext: 'jpg'  },
  { name: '美咲えま',    lid: 23,  ext: 'jpg'  }, { name: '神楽じゅり', lid: 11,  ext: 'jpg'  },
  { name: '森園りあん',  lid: 9,   ext: 'jpg'  }, { name: '庄司もな',   lid: 53,  ext: 'jpeg' },
  { name: '小倉まりあ',  lid: 1,   ext: 'jpg'  }, { name: '双木りん',   lid: 12,  ext: 'jpg'  },
  { name: '安達くれあ',  lid: 28,  ext: 'jpg'  }, { name: '長澤らん',   lid: 13,  ext: 'jpg'  },
  { name: '戸田りんか',  lid: 81,  ext: 'jpeg' }, { name: '高梨くらん', lid: 26,  ext: 'jpg'  },
  { name: '長瀬りこ',    lid: 27,  ext: 'jpg'  }, { name: '西本みあ',   lid: 87,  ext: 'jpeg' },
  { name: '七海のあ',    lid: 20,  ext: 'jpg'  }, { name: '沢村れん',   lid: 108, ext: 'jpeg' },
  { name: '山口ゆめか',  lid: 30,  ext: 'jpeg' }, { name: '一ノ瀬あい', lid: 94,  ext: 'jpeg' },
  { name: '叶えりか',    lid: 104, ext: 'jpeg' }, { name: '白石ゆら',   lid: 101, ext: 'jpeg' },
  { name: '千堂みか',    lid: 24,  ext: 'jpeg' }, { name: '安室こころ', lid: 99,  ext: 'jpg'  },
  { name: '門倉いのり',  lid: 100, ext: 'jpg'  }, { name: '琴坂きこ',   lid: 31,  ext: 'jpg'  },
  { name: '花宮みさ',    lid: 97,  ext: 'jpeg' }, { name: '峯山しん',   lid: 98,  ext: 'jpeg' },
  { name: '望月まりん',  lid: 89,  ext: 'jpeg' }, { name: '森田りな',   lid: 63,  ext: 'jpeg' },
  { name: '音無きょうこ', lid: 96,  ext: 'jpg'  }, { name: '羽田まみ',   lid: 72,  ext: 'jpeg' },
  { name: '牧野こなつ',  lid: 29,  ext: 'jpg'  }, { name: '東野ともみ', lid: 83,  ext: 'jpg'  },
  { name: '小峰ゆあ',    lid: 79,  ext: 'jpeg' }, { name: '三木さあや', lid: 66,  ext: 'jpg'  },
  { name: '河北れみ',    lid: 65,  ext: 'jpeg' }, { name: '麻美しずく', lid: 19,  ext: 'jpg'  },
  { name: '上原ばにら',  lid: 25,  ext: 'jpg'  }, { name: '元木なな',   lid: 77,  ext: 'jpeg' },
  { name: '桜井じゅん',  lid: 14,  ext: 'jpg'  }, { name: '要しおん',   lid: 90,  ext: 'jpeg' },
  { name: '天宮なのか',  lid: 2,   ext: 'jpeg' }, { name: '琥珀かれん', lid: 73,  ext: 'jpeg' },
  { name: '小森ゆん',    lid: 70,  ext: 'jpg'  }, { name: '佐野ひなみ', lid: 10,  ext: 'jpeg' },
  { name: '筒井まほ',    lid: 62,  ext: 'jpeg' }, { name: '上杉すずな', lid: 47,  ext: 'jpg'  },
  { name: '鳥井るか',    lid: 64,  ext: 'jpeg' }, { name: '桜宮そら',   lid: 32,  ext: 'jpg'  },
  { name: '小黒みみ',    lid: 34,  ext: 'jpg'  }, { name: '矢吹みる',   lid: 35,  ext: 'jpg'  },
  { name: '河田ゆいな',  lid: 37,  ext: 'jpg'  }, { name: '中川MIKU',   lid: 38,  ext: 'jpg'  },
  { name: '黒川かすみ',  lid: 40,  ext: 'jpg'  }, { name: '西岡いぶき', lid: 41,  ext: 'jpg'  },
  { name: '清水のん',    lid: 44,  ext: 'jpg'  }, { name: '麻生くるみ', lid: 46,  ext: 'jpg'  },
  { name: '松本めぐみ',  lid: 48,  ext: 'jpg'  }, { name: '桐谷さな',   lid: 49,  ext: 'jpg'  },
  { name: '林ゆうり',    lid: 50,  ext: 'jpg'  }, { name: '幡乃なゆ',   lid: 51,  ext: 'jpg'  },
  { name: '小野寺りり',  lid: 52,  ext: 'jpg'  }, { name: '藤木れの',   lid: 45,  ext: 'jpg'  },
].map(t => ({ ...t, imgUrl: `https://www.resortlanikai.com/photos/${t.lid}/raw_${t.lid}.${t.ext}` }));

// ===== 共通 =====
async function uploadImage(imgUrl, key, referer) {
  try {
    const res = await fetch(imgUrl, { headers: { Referer: referer, 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = imgUrl.split('.').pop().toLowerCase();
    const ct = ext === 'png' ? 'image/png' : 'image/jpeg';
    const { error } = await supabase.storage.from('therapist-images').upload(`${key}.jpg`, buf, { contentType: ct, upsert: true });
    if (error) return null;
    const { data } = supabase.storage.from('therapist-images').getPublicUrl(`${key}.jpg`);
    return data.publicUrl;
  } catch { return null; }
}

async function registerShop(s) {
  if (DRY_RUN) { console.log(`[DRY] Shop: ${s.name}`); return; }
  const { error } = await supabase.from('shops').upsert(s, { onConflict: 'id' });
  if (error) console.error('Shop error:', error.message);
  else console.log(`✅ ${s.id}`);
}

async function registerTherapists(shopId, therapists, prefix, referer) {
  let ins = 0, skp = 0, err = 0;
  for (const t of therapists) {
    const tid = `${shopId}_${t.name}`;
    const { data: ex } = await supabase.from('therapists').select('id,image_url').eq('id', tid).single();
    if (ex?.image_url) { process.stdout.write('='); skp++; continue; }
    const key = `${prefix}_${t.lid || t.id || t.name.replace(/[^\w]/g,'_')}`;
    let url = null;
    if (t.imgUrl) url = DRY_RUN ? t.imgUrl : await uploadImage(t.imgUrl, key, referer);
    const { error } = DRY_RUN ? {} : await supabase.from('therapists').upsert({ id: tid, shop_id: shopId, name: t.name, image_url: url }, { onConflict: 'id' });
    if (error) { console.error(`\n✗ ${t.name}`); err++; }
    else { process.stdout.write(t.imgUrl ? '+' : 'n'); ins++; }
    await new Promise(r => setTimeout(r, 250));
  }
  console.log(`\n挿入: ${ins} / スキップ: ${skp} / エラー: ${err}`);
}

async function main() {
  console.log(`=== 麻布十番・六本木 3店舗 (DRY_RUN=${DRY_RUN}) ===\n`);
  const runC = !shopArg || shopArg === 'cameron';
  const runD = !shopArg || shopArg === 'dejavu';
  const runL = !shopArg || shopArg === 'lanikai';

  if (runC) {
    console.log(`--- CAMERON ${CAMERON_THERAPISTS.length}名 ---`);
    await registerShop(CAMERON_SHOP);
    await registerTherapists(CAMERON_SHOP.id, CAMERON_THERAPISTS, 'cameron', 'https://cameron-esthe.net');
  }
  if (runD) {
    console.log(`\n--- デジャヴ東京 ${DEJAVU_THERAPISTS.length}名 ---`);
    await registerShop(DEJAVU_SHOP);
    await registerTherapists(DEJAVU_SHOP.id, DEJAVU_THERAPISTS, 'dejavu', 'https://dejavu-tokyo.net');
  }
  if (runL) {
    console.log(`\n--- Spa Lanikai ${LANIKAI_THERAPISTS.length}名 ---`);
    await registerShop(LANIKAI_SHOP);
    await registerTherapists(LANIKAI_SHOP.id, LANIKAI_THERAPISTS, 'lanikai', 'https://www.resortlanikai.com');
  }
}

main().catch(console.error);
