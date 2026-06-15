/**
 * process_okinawa.mjs
 * 沖縄県 shop + therapist 登録
 * 対象: 那覇13店舗（CLUB ULTRA / LOHAS / Blue Liz / 美らエス / more more / C-CLOVE
 *        Reveur / Happy / Parco / MANDOM / MICHELIN / HARMONY / ウィズ）
 * Usage: node scripts/maintenance/process_okinawa.mjs [--dry-run]
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const DRY_RUN = process.argv.includes('--dry-run');
if (DRY_RUN) console.log('=== DRY RUN ===');
else console.log('=== LIVE RUN ===');

// ── helpers ──────────────────────────────────────────────────────────────────
async function getOgImage(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(10000),
    });
    const html = await res.text();
    const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)?.[1]
      || html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)?.[1];
    return og || null;
  } catch { return null; }
}

async function uploadImage(imageUrl, storageKey, referer = null) {
  if (!imageUrl) return null;
  try {
    const headers = { 'User-Agent': 'Mozilla/5.0' };
    if (referer) headers['Referer'] = referer;
    const res = await fetch(imageUrl, { headers, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const ct = res.headers.get('content-type') || 'image/jpeg';
    const ext = ct.includes('png') ? 'png' : ct.includes('webp') ? 'webp' : ct.includes('gif') ? 'gif' : 'jpg';
    const key = storageKey.includes('.') ? storageKey : `${storageKey}.${ext}`;
    const { error } = await supabase.storage
      .from('therapist-images')
      .upload(key, buf, { contentType: ct, upsert: true });
    if (error) { console.warn(`  Storage upload fail: ${key}`, error.message); return null; }
    const { data: { publicUrl } } = supabase.storage.from('therapist-images').getPublicUrl(key);
    return publicUrl;
  } catch (e) { console.warn(`  fetch fail: ${imageUrl}`, e.message); return null; }
}

const pAll = (fns, concurrency = 4) => new Promise((resolve, reject) => {
  const results = [];
  let idx = 0, running = 0, done = 0;
  const next = () => {
    while (running < concurrency && idx < fns.length) {
      const i = idx++;
      running++;
      Promise.resolve(fns[i]()).then(r => {
        results[i] = r; running--; done++;
        if (done === fns.length) resolve(results);
        else next();
      }).catch(reject);
    }
  };
  next();
});

function cleanName(n) {
  return n
    .replace(/[☆⭐︎♡★♠♣♦◆◇○●]/g, '')
    .replace(/【[^】]*】/g, '')
    .replace(/\([^()]*\)/g, '')  // (年齢) 等
    .replace(/（[^）]*）/g, '')
    .replace(/\s*(新人|体験入店|S級|激アツ|一押し|イチオシ|癒し系|Ｓ級)\s*/g, '')
    .replace(/[♪◇◆]/g, '')
    .replace(/[A-Za-z]+$/, '')   // 末尾ローマ字除去
    .trim();
}

// ── Shop definitions ──────────────────────────────────────────────────────────
const SHOPS = [
  // 那覇
  { id: 'okinawa_naha_blue_liz',   name: 'Blue Liz (ブルーリズ)',   website_url: 'https://est-blueliz.com/',         area: '那覇',  prefecture: '沖縄県' },
  { id: 'okinawa_naha_club_ultra', name: 'CLUB ULTRA (クラブウルトラ)', website_url: 'https://club-ultra.com/',        area: '那覇',  prefecture: '沖縄県' },
  { id: 'okinawa_naha_churaesu',   name: '美らエス',                 website_url: 'https://churaesu.com/',           area: '那覇',  prefecture: '沖縄県' },
  { id: 'okinawa_naha_lohas',      name: 'LOHAS (ロハス)',           website_url: 'https://lohas-official.com/s/',   area: '那覇',  prefecture: '沖縄県' },
  { id: 'okinawa_naha_moremore',   name: 'more more (モアモア)',     website_url: 'https://moremore-esthe.jp/',      area: '那覇',  prefecture: '沖縄県' },
  { id: 'okinawa_naha_cclove',     name: 'C-CLOVE',                 website_url: 'https://c-clove.com/',            area: '那覇',  prefecture: '沖縄県' },
  { id: 'okinawa_naha_reveur',     name: 'Reveur (レヴール)',        website_url: 'https://www3.daysnavi.info/web/?no=643000', area: '那覇', prefecture: '沖縄県' },
  { id: 'okinawa_naha_happy',      name: 'Happy (ハッピー)',         website_url: 'https://www2.daysnavi.info/web/?no=955000', area: '那覇', prefecture: '沖縄県' },
  { id: 'okinawa_naha_parco',      name: 'Parco (パルコ)',           website_url: 'https://www3.daysnavi.info/web/?no=804000', area: '那覇', prefecture: '沖縄県' },
  // 沖縄市
  { id: 'okinawa_okinawa_mandom',  name: 'MANDOM (マンダム)',        website_url: 'https://www3.daysnavi.info/web/?no=641000', area: '沖縄市', prefecture: '沖縄県' },
  { id: 'okinawa_okinawa_michelin',name: 'MICHELIN (ミシュラン)',     website_url: 'https://www3.daysnavi.info/web/?no=159000', area: '沖縄市', prefecture: '沖縄県' },
  { id: 'okinawa_okinawa_harmony', name: 'HARMONY (ハーモニー)',      website_url: 'https://www3.daysnavi.info/web/?no=156000', area: '沖縄市', prefecture: '沖縄県' },
  // うるま市
  { id: 'okinawa_uruma_wiz',       name: 'ウィズ (With)',            website_url: 'https://www2.daysnavi.info/web/?no=979000', area: 'うるま市', prefecture: '沖縄県' },
];

// ── Therapist data ─────────────────────────────────────────────────────────────

// Blue Liz (18名) — WordPress wp-content, Referer required
const BLUE_LIZ = [
  { name: 'REIKA',  src: 'https://est-blueliz.com/wp-content/uploads/2026/05/S__26378266.jpg' },
  { name: 'NOA',    src: 'https://est-blueliz.com/wp-content/uploads/2026/04/S__24682528_0.jpg' },
  { name: 'KANNA',  src: 'https://est-blueliz.com/wp-content/uploads/2026/03/S__25780226.jpg' },
  { name: 'RIN',    src: 'https://est-blueliz.com/wp-content/uploads/2026/02/50d93b7fc07a0771a725e13b37646aaa.png' },
  { name: 'MIKOTO', src: 'https://est-blueliz.com/wp-content/uploads/2026/02/27ac12cf9f66e7d9cc5606f3cc9ace10.png' },
  { name: 'MINAMI', src: 'https://est-blueliz.com/wp-content/uploads/2026/02/S__20693033.jpg' },
  { name: 'RISA',   src: 'https://est-blueliz.com/wp-content/uploads/2026/02/45a9e2a55a416b9d029a5891d317bebb.png' },
  { name: 'YUA',    src: 'https://est-blueliz.com/wp-content/uploads/2026/01/S__20045836.jpg' },
  { name: 'MIRAI',  src: 'https://est-blueliz.com/wp-content/uploads/2026/01/S__19660808_0.jpg' },
  { name: 'WAKO',   src: 'https://est-blueliz.com/wp-content/uploads/2025/12/27269_0.jpg' },
  { name: 'SUI',    src: 'https://est-blueliz.com/wp-content/uploads/2025/11/S__19054646_0.jpg' },
  { name: 'NATSU',  src: 'https://est-blueliz.com/wp-content/uploads/2025/02/S__16769070.jpg' },
  { name: 'RUI',    src: 'https://est-blueliz.com/wp-content/uploads/2025/02/S__36888731_0.jpg' },
  { name: 'AYAKA',  src: 'https://est-blueliz.com/wp-content/uploads/2024/02/S__4088112.jpg' },
  { name: 'MAO',    src: 'https://est-blueliz.com/wp-content/uploads/2024/03/S__24403974.jpg' },
  { name: 'Lino',   src: 'https://est-blueliz.com/wp-content/uploads/2025/07/fffsfefe.jpg' },
  { name: 'RIO',    src: 'https://est-blueliz.com/wp-content/uploads/2025/05/S__10436657_0.jpg' },
  { name: 'AINO',   src: 'https://est-blueliz.com/wp-content/uploads/2025/05/S__9666739_0.jpg' },
];

// CLUB ULTRA (27名) — direct photo URLs
const CLUB_ULTRA = [
  { lid: '63', name: 'まゆ',   src: 'https://club-ultra.com/photos/63/20251128061810-signal-2025-11-28-061242.jpeg' },
  { lid: '62', name: 'まお',   src: 'https://club-ultra.com/photos/62/20251128061137-まお１.jpeg' },
  { lid: '61', name: 'かのん', src: 'https://club-ultra.com/photos/61/20251128060725-signal-2025-07-07-211412.jpeg' },
  { lid: '60', name: 'ひめ',   src: 'https://club-ultra.com/photos/60/20251128060421-IMG_8536.jpg' },
  { lid: '59', name: 'ゆか',   src: 'https://club-ultra.com/photos/59/20251128055258-signal-2025-11-28-054212.jpeg' },
  { lid: '58', name: 'かなた', src: 'https://club-ultra.com/photos/58/20251128053514-IMG_2375.jpg' },
  { lid: '57', name: 'あき',   src: 'https://club-ultra.com/photos/57/20251128053239-signal-2025-11-28-005323_002.jpeg' },
  { lid: '56', name: 'エイミー', src: 'https://club-ultra.com/photos/56/20251128034848-signal-2025-11-26-185340.jpeg' },
  { lid: '55', name: 'ノア',   src: 'https://club-ultra.com/photos/55/20251128030655-signal-2025-11-28-005337_003.jpeg' },
  { lid: '54', name: 'ラナ',   src: 'https://club-ultra.com/photos/54/20251128025439-signal-2025-11-28-005312_002.jpeg' },
  { lid: '53', name: 'しおり', src: 'https://club-ultra.com/photos/53/20251128024252-signal-2025-07-23-154931.jpeg' },
  { lid: '52', name: 'ゆあ',   src: 'https://club-ultra.com/photos/52/20251128021344-signal-2025-11-28-005337_007.jpeg' },
  { lid: '51', name: 'りん',   src: 'https://club-ultra.com/photos/51/20251128020252-signal-2025-11-28-015758.jpeg' },
  { lid: '50', name: 'ねね',   src: 'https://club-ultra.com/photos/50/20251128015625-signal-2025-11-28-005337_002.jpeg' },
  { lid: '49', name: 'よる',   src: 'https://club-ultra.com/photos/49/20251128014422-IMG_3995.jpg' },
  { lid: '48', name: 'かおり', src: 'https://club-ultra.com/photos/48/20251128012540-signal-2025-11-28-005323_004.jpeg' },
  { lid: '27', name: 'ほのか', src: 'https://club-ultra.com/photos/27/20251128035522-signal-2025-05-09-214401-1.jpg' },
  { lid: '25', name: 'りな',   src: 'https://club-ultra.com/photos/25/20251128030110-IMG_7529.jpg' },
  { lid: '24', name: 'すず',   src: 'https://club-ultra.com/photos/24/20251128035911-signal-2025-07-05-142915.JPG' },
  { lid: '22', name: 'ひびき', src: 'https://club-ultra.com/photos/22/20251128055853-IMG_0416.jpg' },
  { lid: '21', name: 'せん',   src: 'https://club-ultra.com/photos/21/20251128024547-562028149354267138.jpg' },
  { lid: '16', name: 'まゆ2',  src: 'https://club-ultra.com/photos/16/20240730113805-img1_20240605014730.jpg' },
  { lid: '13', name: 'ソラン', src: 'https://club-ultra.com/photos/13/20240730112954-img1_20240626210423.jpg' },
  { lid: '10', name: 'にこ',   src: 'https://club-ultra.com/photos/10/20240730112557-img1_20240701155134.jpg' },
  { lid: '9',  name: 'ほたる', src: null },
  { lid: '8',  name: 'めい',   src: 'https://club-ultra.com/photos/8/20251128035230-signal-2025-05-09-105207.jpeg' },
  { lid: '5',  name: 'えま',   src: 'https://club-ultra.com/photos/5/20251128022539-signal-2025-11-28-005312_007.jpeg' },
];

// 美らエス (19名) — estama CDN (strip ?f=webp for upload)
const CHURAESU = [
  { name: '知念みく',   hash: '9tu2b',  src: 'https://img.estama.jp/shop_data/00000043129/cast/main/357x556/9tu2b_20260513223528.jpg?f=webp' },
  { name: '赤嶺なな',   hash: '826vj',  src: 'https://img.estama.jp/shop_data/00000043129/cast/main/357x556/826vj_20260603120535.jpg?f=webp' },
  { name: '天願ひより', hash: 'xhu7m',  src: 'https://img.estama.jp/shop_data/00000043129/cast/main/357x556/xhu7m_20260308163029.jpg?f=webp' },
  { name: '知花さき',   hash: '553wt',  src: 'https://img.estama.jp/shop_data/00000043129/cast/main/357x556/553wt_20250605143402.jpg?f=webp' },
  { name: '玉城みれあ', hash: '6ct7p',  src: 'https://img.estama.jp/shop_data/00000043129/cast/main/357x556/6ct7p_20260527060302.jpg?f=webp' },
  { name: '高良ゆあ',   hash: '4gcch',  src: 'https://img.estama.jp/shop_data/00000043129/cast/main/357x556/4gcch_20260330223431.jpg?f=webp' },
  { name: '仲吉りあ',   hash: '99h7a',  src: 'https://img.estama.jp/shop_data/00000043129/cast/main/357x556/99h7a_20250612140134.jpg?f=webp' },
  { name: '屋良ひまわり', hash: '8k06i', src: 'https://img.estama.jp/shop_data/00000043129/cast/main/357x556/8k06i_20260129191530.jpg?f=webp' },
  { name: '伊波そら',   hash: 'mbtis',  src: 'https://img.estama.jp/shop_data/00000043129/cast/main/357x556/mbtis_20260423084422.jpg?f=webp' },
  { name: '照屋ななせ', hash: '8jed2',  src: 'https://img.estama.jp/shop_data/00000043129/cast/main/357x556/8jed2_20250605223917.jpg?f=webp' },
  { name: '上間みらい', hash: '5i1fw',  src: 'https://img.estama.jp/shop_data/00000043129/cast/main/357x556/5i1fw_20260425170219.jpg?f=webp' },
  { name: '城間りん',   hash: '1o4rb',  src: 'https://img.estama.jp/shop_data/00000043129/cast/main/357x556/1o4rb_20260423050127.jpg?f=webp' },
  { name: '安里いちか', hash: '9zmvx',  src: 'https://img.estama.jp/shop_data/00000043129/cast/main/357x556/9zmvx_20260508085440.jpg?f=webp' },
  { name: '神里りな',   hash: 'cap1x',  src: 'https://img.estama.jp/shop_data/00000043129/cast/main/357x556/cap1x_20260115231028.jpg?f=webp' },
  { name: '花城ここね', hash: '7bbmr',  src: 'https://img.estama.jp/shop_data/00000043129/cast/main/357x556/7bbmr_20260502165729.jpg?f=webp' },
  { name: '我如古ゆうな', hash: '3g72r', src: 'https://img.estama.jp/shop_data/00000043129/cast/main/357x556/3g72r_20260409203148.jpg?f=webp' },
  { name: '仲間ゆい',   hash: '6j6ay',  src: 'https://img.estama.jp/shop_data/00000043129/cast/main/357x556/6j6ay_20250521181341.jpg?f=webp' },
  { name: '中曽根かりな', hash: 'cy61v', src: 'https://img.estama.jp/shop_data/00000043129/cast/main/357x556/cy61v_20260606122048.jpg?f=webp' },
  { name: '幸喜みゆ',   hash: '28bja',  src: 'https://img.estama.jp/shop_data/00000043129/cast/main/357x556/28bja_20260531101257.jpg?f=webp' },
];

// LOHAS (25名) — direct photo URLs
const LOHAS = [
  { lid: '30', name: 'りん',   src: 'https://lohas-official.com/photos/30/20251003133615-img1_20250920202426.jpg' },
  { lid: '15', name: 'ゆり',   src: 'https://lohas-official.com/photos/15/20251003130208-img1_20250805182427.jpg' },
  { lid: '27', name: 'せいら', src: 'https://lohas-official.com/photos/27/20251003131626-img1_20250710222414.jpg' },
  { lid: '39', name: 'あすか', src: 'https://lohas-official.com/photos/39/20260302194606-1298559_1.jpg' },
  { lid: '38', name: 'ゆづき', src: 'https://lohas-official.com/photos/38/20260228171258-IMG_0038.jpeg' },
  { lid: '28', name: 'えま',   src: 'https://lohas-official.com/photos/28/20251003131728-img1_20250920112417.jpg' },
  { lid: '1',  name: 'りら',   src: 'https://lohas-official.com/photos/1/20251002195131-img1_20250920212421.jpg' },
  { lid: '25', name: 'かな',   src: 'https://lohas-official.com/photos/25/20251003131403-img1_20250910192420.jpg' },
  { lid: '29', name: 'まい',   src: 'https://lohas-official.com/photos/29/20251003133507-img1_20250819142417.jpg' },
  { lid: '24', name: 'れな',   src: 'https://lohas-official.com/photos/24/20251003131250-img1_20250726142424.jpg' },
  { lid: '22', name: 'あん',   src: 'https://lohas-official.com/photos/22/20251003131029-img1_20250811182419.jpg' },
  { lid: '33', name: 'さな',   src: 'https://lohas-official.com/photos/33/20251204223406-1294870_2.jpg' },
  { lid: '17', name: 'うた',   src: 'https://lohas-official.com/photos/17/20251003130427-img1_20250806232423.jpg' },
  { lid: '37', name: 'かすみ', src: 'https://lohas-official.com/photos/37/20260202172051-S__28196888_0.jpg' },
  { lid: '23', name: 'ひまり', src: 'https://lohas-official.com/photos/23/20251003131138-img1_20250801112422.jpg' },
  { lid: '35', name: 'ゆう',   src: 'https://lohas-official.com/photos/35/20251227112909-img1s_20251225042417.jpg' },
  { lid: '4',  name: 'まな',   src: 'https://lohas-official.com/photos/4/20251003120258-img1_20250701122417.jpg' },
  { lid: '20', name: 'あいり', src: 'https://lohas-official.com/photos/20/20251003130719-img1_20250912002413.jpg' },
  { lid: '21', name: 'りの',   src: 'https://lohas-official.com/photos/21/20251003130903-img1_20250824172427.jpg' },
  { lid: '11', name: 'くれは', src: 'https://lohas-official.com/photos/11/20251003121527-img1_20250723232446.jpg' },
  { lid: '32', name: 'みらい', src: 'https://lohas-official.com/photos/32/20251102091230-1293004_3.jpg' },
  { lid: '36', name: 'あやめ', src: 'https://lohas-official.com/photos/36/20260104154712-img1s_20260102222408.jpg' },
  { lid: '19', name: 'きり',   src: 'https://lohas-official.com/photos/19/20251003130621-img1_20250811212422.jpg' },
  { lid: '16', name: 'つばさ', src: 'https://lohas-official.com/photos/16/20251003130318-img1_20250821122422.jpg' },
  { lid: '18', name: 'あやか', src: 'https://lohas-official.com/photos/18/20251003130522-img1_20250710182503.jpg' },
];

// more more (29名) — name-only
const MORE_MORE_NAMES = [
  'まりあ', 'ちなつ', 'うか', 'りな', '星奈うに', 'ヒナの',
  '原らいか', '吉岡さり', 'いろは', 'あいり', '葵かな', '石原えみ',
  'みお', 'あみ', '比嘉るな', 'いずみ', 'ななみ', '楓',
  '遠藤ゆきみ', '立花ひな', 'セシル', '一ノ瀬のん', '藤咲なつみ',
  '澪', 'ちな', '長谷川らん', '斉藤みさき', '高橋なな', '白石リサ',
];

// C-CLOVE (71名) — photos/{lid}/raw_{lid}.jpg
// ゆき appears at lid 114 and 102 → distinguish as ゆき / ゆき2
const CCLOVE = [
  { lid: '133', name: 'りさ' },
  { lid: '43',  name: 'Rちゃん' },
  { lid: '54',  name: 'にいな' },
  { lid: '19',  name: 'ここ' },
  { lid: '29',  name: 'まりあ' },
  { lid: '28',  name: 'りな' },
  { lid: '25',  name: 'あや' },
  { lid: '27',  name: 'さら' },
  { lid: '33',  name: 'ぷりん' },
  { lid: '7',   name: 'ひとみん' },
  { lid: '120', name: 'みあ' },
  { lid: '134', name: 'ふたば' },
  { lid: '57',  name: 'りり' },
  { lid: '116', name: 'うみ' },
  { lid: '115', name: 'あこ' },
  { lid: '135', name: 'まき' },
  { lid: '131', name: 'ゆな' },
  { lid: '61',  name: 'あいり' },
  { lid: '88',  name: 'しほ' },
  { lid: '52',  name: 'りおな' },
  { lid: '82',  name: 'みづき' },
  { lid: '59',  name: 'かえで' },
  { lid: '126', name: 'みらい' },
  { lid: '69',  name: 'ゆのん' },
  { lid: '40',  name: 'しゅり' },
  { lid: '124', name: 'ことは' },
  { lid: '121', name: 'うるみ' },
  { lid: '122', name: 'ふわり' },
  { lid: '132', name: 'にき' },
  { lid: '130', name: 'ひすい' },
  { lid: '125', name: 'こはく' },
  { lid: '112', name: 'ななせ' },
  { lid: '94',  name: 'れお' },
  { lid: '123', name: 'えりな' },
  { lid: '128', name: 'なのか' },
  { lid: '93',  name: 'すず' },
  { lid: '111', name: 'ちゅら' },
  { lid: '104', name: 'りず' },
  { lid: '114', name: 'ゆき' },
  { lid: '105', name: 'そら' },
  { lid: '90',  name: 'れい' },
  { lid: '113', name: 'みるく' },
  { lid: '117', name: 'じゅり' },
  { lid: '62',  name: 'える' },
  { lid: '109', name: 'しおり' },
  { lid: '106', name: 'まいか' },
  { lid: '101', name: 'なな' },
  { lid: '102', name: 'ゆき2' },
  { lid: '65',  name: 'ちふみ' },
  { lid: '67',  name: 'ひめな' },
  { lid: '95',  name: 'せら' },
  { lid: '66',  name: 'はな' },
  { lid: '86',  name: 'かなの' },
  { lid: '91',  name: 'ゆうか' },
  { lid: '72',  name: 'ももか' },
  { lid: '56',  name: 'みなみ' },
  { lid: '84',  name: 'むぎ' },
  { lid: '75',  name: 'ゆりか' },
  { lid: '73',  name: 'しずか' },
  { lid: '70',  name: 'みか' },
  { lid: '76',  name: 'りせ' },
  { lid: '53',  name: 'かれん' },
  { lid: '55',  name: 'ひまり' },
  { lid: '58',  name: 'なぎ' },
  { lid: '71',  name: 'らん' },
  { lid: '68',  name: 'くれは' },
  { lid: '48',  name: 'ひより' },
  { lid: '45',  name: 'べに' },
  { lid: '47',  name: 'みこ' },
  { lid: '44',  name: 'せな' },
  { lid: '22',  name: 'さき' },
];

// Daysnavi therapists: { server, shopSub, therapists: [{mid, name}] }
const DAYSNAVI = {
  // www3
  mandom: {
    server: 'www3', shopSub: 'mandom', shopId: 'okinawa_okinawa_mandom',
    therapists: [
      { mid: '1304450', name: 'マリン' },
      { mid: '1291631', name: 'ひより' },
      { mid: '1174615', name: 'なつき' },
      { mid: '1216258', name: '愛' },
      { mid: '1220351', name: 'レイナ' },
      { mid: '1220019', name: 'えいみ' },
      { mid: '1301143', name: 'リア' },
      { mid: '1305868', name: 'しずか' },
      { mid: '1287533', name: 'あみ' },
      { mid: '1299479', name: 'かのん' },
      { mid: '1213651', name: 'あーにゃ' },
      { mid: '1287534', name: '海' },
      { mid: '1185276', name: 'るか' },
      { mid: '1292270', name: 'ここ' },
      { mid: '1280571', name: 'まお' },
    ],
  },
  michelin: {
    server: 'www3', shopSub: 'michelin', shopId: 'okinawa_okinawa_michelin',
    therapists: [
      { mid: '1175363', name: 'サクラ' },
      { mid: '1255850', name: 'みき' },
      { mid: '1146458', name: 'リンカ' },
      { mid: '1203775', name: 'アン' },
      { mid: '1284372', name: 'るか' },
      { mid: '1278504', name: 'みお' },
      { mid: '1280176', name: 'みずき' },
      { mid: '1138895', name: 'ゆめ' },
      { mid: '1187021', name: 'ミナ' },
      { mid: '1171223', name: 'カレン' },
      { mid: '1176722', name: 'まこ' },
      { mid: '1171112', name: 'こはる' },
      { mid: '1169659', name: 'セナ' },
      { mid: '1198676', name: 'りり' },
      { mid: '1292498', name: 'あおい' },
    ],
  },
  harmony: {
    server: 'www3', shopSub: 'harmony', shopId: 'okinawa_okinawa_harmony',
    therapists: [
      { mid: '1219147', name: 'さり' },
      { mid: '1288798', name: 'みるく' },
      { mid: '1222182', name: 'やよい' },
      { mid: '1299509', name: 'りあ' },
      { mid: '1281026', name: 'るい' },
      { mid: '1288797', name: 'ゆず' },
      { mid: '1292227', name: 'まい' },
      { mid: '1293682', name: 'ニコ' },
      { mid: '1148904', name: 'なつき' },
      { mid: '1208618', name: 'ゆきの' },
      { mid: '1302405', name: 'むぎ' },
      { mid: '1288799', name: 'かおるこ' },
      { mid: '1299307', name: 'ちはる' },
      { mid: '1231053', name: 'りお' },
      { mid: '1289527', name: 'きせ' },
      { mid: '1299775', name: 'えみ' },
      { mid: '1257120', name: 'きらら' },
      { mid: '1157122', name: 'もも' },
      { mid: '1286591', name: 'ゆりにゃん' },
      { mid: '1300051', name: 'れな' },
      { mid: '1298305', name: 'そら' },
      { mid: '1272857', name: 'めぐみ' },
      { mid: '1207694', name: 'れん' },
      { mid: '1281702', name: 'なぎさ' },
      { mid: '1218275', name: 'らん' },
      { mid: '1288548', name: 'ゆき' },
      { mid: '1295140', name: 'しずく' },
      { mid: '1288808', name: 'みなみ' },
      { mid: '1288537', name: 'あやは' },
      { mid: '1201219', name: 'りり' },
      { mid: '1292291', name: 'くれあ' },
      { mid: '1288809', name: 'ひなさん' },
      { mid: '1261220', name: 'すみれ' },
      { mid: '1288840', name: 'みゆ' },
      { mid: '1303018', name: 'しおり' },
      { mid: '1298178', name: 'ひみつ' },
      { mid: '1305885', name: 'ひなた' },
    ],
  },
  // www2
  wiz: {
    server: 'www2', shopSub: 'withokinawa', shopId: 'okinawa_uruma_wiz',
    therapists: [
      { mid: '1254991', name: 'なつの' },
      { mid: '1270119', name: 'さや' },
      { mid: '1251467', name: 'みか' },
      { mid: '1263182', name: 'ちさ' },
      { mid: '1298806', name: 'なの' },
      { mid: '1298632', name: 'ふわ' },
      { mid: '1261013', name: 'るな' },
      { mid: '1299791', name: 'るみか' },
      { mid: '1288150', name: 'あいの' },
      { mid: '1262215', name: 'すみれ' },
      { mid: '1283222', name: 'せりか' },
      { mid: '1299920', name: 'らら' },
      { mid: '1294478', name: 'にこ' },
      { mid: '1269195', name: 'あい' },
      { mid: '1304810', name: 'まどか' },
      { mid: '1292621', name: 'らむ' },
      { mid: '1304899', name: 'えり' },
      { mid: '1304898', name: 'あや' },
      { mid: '1282551', name: 'さら' },
      { mid: '1283232', name: 'ゆい' },
      { mid: '1281586', name: 'ゆめの' },
      { mid: '1265972', name: 'うみ' },
      { mid: '1291647', name: 'さくら' },
      { mid: '1247690', name: 'めぐみ' },
      { mid: '1269685', name: 'みい' },
      { mid: '1282028', name: 'はづき' },
      { mid: '1286196', name: 'ありさ' },
      { mid: '1289093', name: 'みずほ' },
      { mid: '1277203', name: 'まみ' },
      { mid: '1265131', name: 'なみ' },
      { mid: '1253087', name: 'れむ' },
      { mid: '1248434', name: 'りさ' },
      { mid: '1267712', name: 'ゆう' },
    ],
  },
  reveur: {
    server: 'www3', shopSub: 'reveur-okinawa', shopId: 'okinawa_naha_reveur',
    therapists: [
      { mid: '1301178', name: 'るい' },
      { mid: '1297939', name: 'ハナビ' },
      { mid: '1298782', name: 'むぎ' },
      { mid: '1281717', name: 'くらな' },
      { mid: '1275369', name: 'るる' },
      { mid: '1055602', name: 'りょう' },
      { mid: '1289667', name: 'ゆあ' },
      { mid: '1182472', name: 'あみ' },
      { mid: '1267008', name: 'りん' },
      { mid: '1213846', name: 'なな' },
      { mid: '1136785', name: 'ゆきな' },
      { mid: '1121901', name: 'ゆりの' },
      { mid: '1212639', name: 'あや' },
      { mid: '1265350', name: 'ひな' },
      { mid: '1261849', name: 'さき' },
      { mid: '1244571', name: 'みく' },
      { mid: '1122275', name: 'みお' },
      { mid: '1286125', name: 'あおい' },
      { mid: '1280225', name: 'ゆい' },
      { mid: '1292370', name: 'まき' },
    ],
  },
  happy: {
    server: 'www2', shopSub: 'happy', shopId: 'okinawa_naha_happy',
    therapists: [
      { mid: '1240021', name: 'みいしゃ' },
      { mid: '1223532', name: 'なつき' },
      { mid: '1277243', name: 'わかな' },
      { mid: '1282822', name: 'りさ' },
      { mid: '1277242', name: 'もも' },
      { mid: '1295003', name: 'はな' },
      { mid: '1282282', name: 'さくら' },
      { mid: '1170256', name: 'りん' },
      { mid: '1278300', name: 'あんじゅ' },
      { mid: '1269363', name: 'エナ' },
      { mid: '1278790', name: 'ノア' },
      { mid: '1215866', name: 'ゆずき' },
      { mid: '1283580', name: 'ひまり' },
      { mid: '1237577', name: 'あゆ' },
      { mid: '1270960', name: 'れいな' },
    ],
  },
  parco: {
    server: 'www3', shopSub: 'parco', shopId: 'okinawa_naha_parco',
    therapists: [
      { mid: '1298570', name: 'さやか' },
      { mid: '1234382', name: 'ゆき' },
      { mid: '1042473', name: 'りょう' },
      { mid: '1035438', name: 'ほのか' },
      { mid: '1286226', name: 'あゆ' },
      { mid: '1140982', name: 'ちさ' },
      { mid: '1266693', name: 'れいな' },
      { mid: '1170593', name: 'さら' },
      { mid: '1191123', name: 'しおん' },
      { mid: '1286056', name: 'まな' },
      { mid: '1193719', name: 'みゆ' },
      { mid: '1226426', name: 'みか' },
      { mid: '1279246', name: 'みみ' },
      { mid: '1304044', name: 'えみ' },
      { mid: '1249336', name: 'ちひろ' },
      { mid: '1224512', name: 'のえる' },
      { mid: '1302960', name: 'なな' },
      { mid: '1301284', name: 'えりか' },
      { mid: '1298471', name: 'なお' },
      { mid: '1248386', name: 'あすか' },
      { mid: '1250636', name: 'こゆき' },
      { mid: '1281663', name: 'はな' },
      { mid: '1271984', name: 'なる' },
      { mid: '1278642', name: 'しほ' },
      { mid: '1275890', name: 'らん' },
      { mid: '1244623', name: 'るのん' },
    ],
  },
};

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  let totalShops = 0, totalTherapists = 0;

  // 1. Register shops
  console.log('\n── 店舗登録 ──');
  for (const shop of SHOPS) {
    const ogImage = await getOgImage(shop.website_url);
    const shopData = {
      id: shop.id,
      name: shop.name,
      website_url: shop.website_url,
      image_url: ogImage,
      schedule_url: null,
      raw_data: { prefecture: shop.prefecture, area: shop.area },
    };
    if (DRY_RUN) {
      console.log(`  [DRY] ${shop.id} | og:image=${ogImage ? '✅' : 'null'}`);
    } else {
      const { error } = await supabase.from('shops').upsert(shopData, { onConflict: 'id' });
      if (error) console.error(`  ❌ shop ${shop.id}:`, error.message);
      else { console.log(`  ✅ ${shop.name} | og:${ogImage ? '✅' : 'null'}`); totalShops++; }
    }
  }

  // 2. Blue Liz
  console.log('\n── Blue Liz (ブルーリズ) ──');
  const blueLizRows = await pAll(BLUE_LIZ.map(t => async () => {
    const filename = t.src.split('/').pop();
    const storageKey = `blueliz_${filename}`;
    const imageUrl = await uploadImage(t.src, storageKey, 'https://est-blueliz.com/');
    return { id: `okinawa_naha_blue_liz_${t.name}`, shop_id: 'okinawa_naha_blue_liz', name: t.name, image_url: imageUrl };
  }));
  await insertTherapists(blueLizRows);
  totalTherapists += blueLizRows.length;

  // 3. CLUB ULTRA
  console.log('\n── CLUB ULTRA ──');
  const cuRows = await pAll(CLUB_ULTRA.map(t => async () => {
    let imageUrl = null;
    if (t.src) {
      const ext = t.src.split('.').pop().toLowerCase().split('?')[0];
      const storageKey = `clubultra_${t.lid}.${ext}`;
      imageUrl = await uploadImage(t.src, storageKey);
    }
    return { id: `okinawa_naha_club_ultra_${t.name}`, shop_id: 'okinawa_naha_club_ultra', name: t.name, image_url: imageUrl };
  }));
  await insertTherapists(cuRows);
  totalTherapists += cuRows.length;

  // 4. 美らエス
  console.log('\n── 美らエス ──');
  const churaesuRows = await pAll(CHURAESU.map(t => async () => {
    // strip ?f=webp for upload, use hash as storage key
    const uploadUrl = t.src.replace('?f=webp', '');
    const storageKey = `churaesu_${t.hash}.jpg`;
    const imageUrl = await uploadImage(uploadUrl, storageKey);
    return { id: `okinawa_naha_churaesu_${t.name}`, shop_id: 'okinawa_naha_churaesu', name: t.name, image_url: imageUrl };
  }));
  await insertTherapists(churaesuRows);
  totalTherapists += churaesuRows.length;

  // 5. LOHAS
  console.log('\n── LOHAS ──');
  const lohasRows = await pAll(LOHAS.map(t => async () => {
    const ext = t.src.split('.').pop().toLowerCase().split('?')[0];
    const storageKey = `lohas_${t.lid}.${ext}`;
    const imageUrl = await uploadImage(t.src, storageKey);
    return { id: `okinawa_naha_lohas_${t.name}`, shop_id: 'okinawa_naha_lohas', name: t.name, image_url: imageUrl };
  }));
  await insertTherapists(lohasRows);
  totalTherapists += lohasRows.length;

  // 6. more more (name-only)
  console.log('\n── more more ──');
  const moremoreRows = MORE_MORE_NAMES.map(name => ({
    id: `okinawa_naha_moremore_${name}`,
    shop_id: 'okinawa_naha_moremore',
    name,
    image_url: null,
  }));
  await insertTherapists(moremoreRows);
  totalTherapists += moremoreRows.length;

  // 7. C-CLOVE
  console.log('\n── C-CLOVE ──');
  const ccloveRows = await pAll(CCLOVE.map(t => async () => {
    const src = `https://c-clove.com/photos/${t.lid}/raw_${t.lid}.jpg`;
    const storageKey = `cclove_${t.lid}.jpg`;
    const imageUrl = await uploadImage(src, storageKey);
    return { id: `okinawa_naha_cclove_${t.name}`, shop_id: 'okinawa_naha_cclove', name: t.name, image_url: imageUrl };
  }));
  await insertTherapists(ccloveRows);
  totalTherapists += ccloveRows.length;

  // 8. Daysnavi shops
  for (const [key, shop] of Object.entries(DAYSNAVI)) {
    console.log(`\n── ${shop.shopId} ──`);
    const rows = await pAll(shop.therapists.map(t => async () => {
      const src = `https://${shop.server}.daysnavi.info/${shop.shopSub}/${t.mid}_1.jpg`;
      const storageKey = `${key}_${t.mid}.jpg`;
      const imageUrl = await uploadImage(src, storageKey);
      return {
        id: `${shop.shopId}_${t.name}`,
        shop_id: shop.shopId,
        name: t.name,
        image_url: imageUrl,
      };
    }));
    await insertTherapists(rows);
    totalTherapists += rows.length;
  }

  console.log(`\n=== DONE: 13店舗・${totalTherapists}名 ===`);
}

async function insertTherapists(rows) {
  if (DRY_RUN) {
    const withImg = rows.filter(r => r.image_url).length;
    console.log(`  [DRY] ${rows.length}名 (画像=${withImg}/${rows.length})`);
    return;
  }
  // upsert in batches of 50
  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);
    const { error } = await supabase.from('therapists').upsert(batch, { onConflict: 'id' });
    if (error) console.error(`  ❌ batch upsert:`, error.message);
  }
  const withImg = rows.filter(r => r.image_url).length;
  console.log(`  ✅ ${rows.length}名登録 (画像=${withImg}/${rows.length})`);
}

main().catch(console.error);
