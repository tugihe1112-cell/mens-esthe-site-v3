/**
 * process_yokohama_shops.mjs
 * 横浜エリア9店舗（TOP10 - honoka(6位)除く）のセラピスト登録
 *
 * 対象店舗:
 *   1位 Y PRIME         kanagawa_yokohama_y_prime         - 名前のみ（S3 lazy画像）
 *   2位 THE BLANC       kanagawa_yokohama_the_blanc        - shop登録のみ（caskan, Chrome要）
 *   3位 Chloe           kanagawa_yokohama_chloe            - shop登録のみ（JS描画）
 *   4位 PLAY BOY CLUB   kanagawa_yokohama_play_boy_club    - 54名、wcms画像
 *   5位 Guarigione      kanagawa_yokohama_guarigione       - ~70名、templates_c画像
 *   7位 TeTe            kanagawa_yokohama_tete             - ~70名、manage.tete画像（3ページ）
 *   8位 Loose.a.mood    kanagawa_yokohama_loose_a_mood     - 15名、名前のみ
 *   9位 横浜りらっくらぶ kanagawa_yokohama_y_riraclub      - 36名、templates_c画像
 *  10位 M dot           kanagawa_yokohama_m_dot            - shop登録のみ（JS描画）
 *
 * 実行: node scripts/maintenance/process_yokohama_shops.mjs [--dry-run]
 */

import fs from 'fs';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = k => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');

const supabase = createClient(
  getEnv('VITE_SUPABASE_URL'),
  getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('VITE_SUPABASE_ANON_KEY')
);

const DRY = process.argv.includes('--dry-run');
const sleep = ms => new Promise(r => setTimeout(r, ms));

const fetchHtml = async (url, extraHeaders = {}) => {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', ...extraHeaders },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.text();
};

const isNoise = name => {
  if (!name || name.length < 1) return true;
  if (name.startsWith('「') || name.startsWith('【') || name.startsWith('★') || name.startsWith('〈')) return true;
  if (name.length > 16) return true;
  if (/イベント|キャンペーン|割引|求人|banner|logo|icon|WEB予約/i.test(name)) return true;
  return false;
};

const upsertTherapists = async (shopId, therapists) => {
  const valid = therapists.filter(t => t.name && !isNoise(t.name));
  const withPhoto = valid.filter(t => t.image_url).length;
  console.log(`  → ${valid.length}名 (写真付き: ${withPhoto})`);
  if (DRY) {
    valid.slice(0, 5).forEach(t => console.log(`    DRY: ${t.name} ${t.image_url ? '📷' : ''}`));
    if (valid.length > 5) console.log(`    ... (${valid.length - 5}件省略)`);
    return;
  }
  for (let i = 0; i < valid.length; i += 50) {
    const batch = valid.slice(i, i + 50).map(t => ({
      id: `${shopId}_${t.name}`,
      shop_id: shopId,
      name: t.name,
      image_url: t.image_url || null,
    }));
    const { error } = await supabase.from('therapists').upsert(batch, { onConflict: 'id', ignoreDuplicates: true });
    if (error) console.error(`  ERROR: ${error.message}`);
    else process.stdout.write(`  batch ${Math.floor(i / 50) + 1} OK\n`);
  }
};

// ─── Shops ────────────────────────────────────────────────────────────────────
const SHOPS = [
  {
    id: 'kanagawa_yokohama_y_prime',
    name: 'Y PRIME (ワイプライム)',
    website_url: 'https://y-prime-yokohama.com/',
    schedule_url: 'https://y-prime-yokohama.com/schedule',
  },
  {
    id: 'kanagawa_yokohama_the_blanc',
    name: 'THE BLANC (ザ・ブラン)',
    website_url: 'https://the-blanc.site/',
    schedule_url: null,
  },
  {
    id: 'kanagawa_yokohama_chloe',
    name: 'Chloe (クロエ)',
    website_url: 'https://yokohama-mens-salon.com/',
    schedule_url: null,
  },
  {
    id: 'kanagawa_yokohama_play_boy_club',
    name: 'PLAY BOY CLUB (プレイボーイクラブ)',
    website_url: 'https://playboy-club.net/',
    schedule_url: 'https://playboy-club.net/schedule/',
  },
  {
    id: 'kanagawa_yokohama_guarigione',
    name: 'Guarigione (グアリジョーネ)',
    website_url: 'https://www.spa-g.net/',
    schedule_url: 'https://www.spa-g.net/schedule.html',
  },
  {
    id: 'kanagawa_yokohama_tete',
    name: 'TeTe (テテ)',
    website_url: 'https://tete-yokohama.com/',
    schedule_url: 'https://tete-yokohama.com/#today',
  },
  {
    id: 'kanagawa_yokohama_loose_a_mood',
    name: 'Loose.a.mood (ルーズアモード)',
    website_url: 'https://www.loose-a-mood.com/',
    schedule_url: 'https://www.loose-a-mood.com/schedule',
  },
  {
    id: 'kanagawa_yokohama_y_riraclub',
    name: '横浜りらっくらぶ',
    website_url: 'https://y-riraclub.com/',
    schedule_url: 'https://y-riraclub.com/schedule.html',
  },
  {
    id: 'kanagawa_yokohama_m_dot',
    name: 'M dot (エムドット)',
    website_url: 'http://mens-esthetic-salon-mdot-group.com/',
    schedule_url: null,
  },
];

async function upsertShops() {
  console.log('\n=== Step 1: Shops 登録 ===');
  for (const s of SHOPS) {
    const record = {
      id: s.id,
      name: s.name,
      website_url: s.website_url,
      schedule_url: s.schedule_url || null,
      raw_data: { prefecture: '神奈川県' },
    };
    if (DRY) { console.log(`  DRY: ${s.id}`); continue; }
    const { error } = await supabase.from('shops').upsert(record, { onConflict: 'id' });
    if (error) console.error(`  ERROR ${s.id}: ${error.message}`);
    else console.log(`  OK: ${s.name}`);
  }
}

// ─── Guarigione (templates_c) ──────────────────────────────────────────────────
async function processGuarigione() {
  console.log('\n=== Step 2: Guarigione ===');
  const html = await fetchHtml('https://www.spa-g.net/therapist.html');
  const $ = cheerio.load(html);
  const therapists = [];

  // Profile links contain img with templates_c URL
  // alt = "松川 ほずみ" (name only, no AGE suffix)
  $('a[href*="profile_"] img[src*="templates_c"]').each((_, el) => {
    const imageUrl = $(el).attr('src');
    const name = ($(el).attr('alt') || '').trim();
    if (name && !isNoise(name) && /[ぁ-んァ-ヾ一-龯]/.test(name)) {
      therapists.push({ name, image_url: imageUrl });
    }
  });

  await upsertTherapists('kanagawa_yokohama_guarigione', therapists);
}

// ─── 横浜りらっくらぶ (templates_c) ────────────────────────────────────────────
async function processRiraclub() {
  console.log('\n=== Step 3: 横浜りらっくらぶ ===');
  const html = await fetchHtml('https://y-riraclub.com/therapist.html');
  const $ = cheerio.load(html);
  const therapists = [];

  // alt = "由里（ゆり）" - name with reading in parens
  $('a[href*="profile_"] img[src*="templates_c"]').each((_, el) => {
    const imageUrl = $(el).attr('src');
    const name = ($(el).attr('alt') || '').trim();
    if (name && /[ぁ-んァ-ヾ一-龯]/.test(name)) {
      therapists.push({ name, image_url: imageUrl });
    }
  });

  await upsertTherapists('kanagawa_yokohama_y_riraclub', therapists);
}

// ─── TeTe (manage.tete CDN, 3 pages) ──────────────────────────────────────────
async function processTete() {
  console.log('\n=== Step 4: TeTe (3ページ) ===');
  const castMap = new Map(); // cid → { name, imageUrl }

  for (let page = 1; page <= 3; page++) {
    const url = page === 1
      ? 'https://tete-yokohama.com/casts'
      : `https://tete-yokohama.com/casts?cp=${page}`;

    let html;
    try {
      html = await fetchHtml(url);
    } catch (e) {
      console.log(`  page ${page}: skip (${e.message})`);
      break;
    }
    const $ = cheerio.load(html);

    // Each cast has two <a href="...?cid=XX"> links:
    //   1. img link  (has <img src="manage.tete...">)
    //   2. name link (text: "蒼井 ( 25 )")
    $('a[href*="/casts/detail/?cid="]').each((_, el) => {
      const cid = $(el).attr('href')?.match(/cid=(\d+)/)?.[1];
      if (!cid) return;

      const img = $(el).find('img[src*="manage.tete"]');
      if (img.length) {
        if (!castMap.has(cid)) castMap.set(cid, {});
        castMap.get(cid).imageUrl = img.attr('src');
      } else {
        const rawName = $(el).text().trim();
        // "蒼井 ( 25 )" → "蒼井"
        const name = rawName.replace(/\s*\(\s*\d+\s*\).*$/, '').trim();
        if (name && !castMap.get(cid)?.name) {
          if (!castMap.has(cid)) castMap.set(cid, {});
          castMap.get(cid).name = name;
        }
      }
    });

    console.log(`  page ${page}: ${castMap.size}件累計`);
    await sleep(600);
  }

  const therapists = [...castMap.values()]
    .filter(c => c.name)
    .map(c => ({ name: c.name, image_url: c.imageUrl || null }));

  await upsertTherapists('kanagawa_yokohama_tete', therapists);
}

// ─── PLAY BOY CLUB (wcms画像, プロフィールページfetch) ─────────────────────────
// 名前・UIDは事前確認済みハードコード
const PBC_CASTS = [
  { uid: '918', name: 'Nao（ナオ）' },
  { uid: '967', name: 'Mochi（モチ）' },
  { uid: '936', name: 'Nano（ナノ）' },
  { uid: '969', name: 'Riri（リリ）' },
  { uid: '951', name: 'Kaho（カホ）' },
  { uid: '955', name: 'Mimi（ミミ）' },
  { uid: '966', name: 'Shiho（シホ）' },
  { uid: '968', name: 'Hina（ヒナ）' },
  { uid: '938', name: 'Lui（ルイ）' },
  { uid: '927', name: 'Nozomi（ノゾミ）' },
  { uid: '928', name: 'Sena（セナ）' },
  { uid: '956', name: 'Rin（リン）' },
  { uid: '926', name: 'Shuri（シュリ）' },
  { uid: '962', name: 'Hana（ハナ）' },
  { uid: '953', name: 'Rika（リカ）' },
  { uid: '954', name: 'Ririka（リリカ）' },
  { uid: '811', name: 'Yuzuki（ユヅキ）' },
  { uid: '935', name: 'Lei（レイ）' },
  { uid: '794', name: 'Aoi（アオイ）' },
  { uid: '958', name: 'Rena（レナ）' },
  { uid: '963', name: 'Rimi（リミ）' },
  { uid: '854', name: 'Ran（ラン）' },
  { uid: '959', name: 'Niko（ニコ）' },
  { uid: '960', name: 'Yua（ユア）' },
  { uid: '957', name: 'Umi（ウミ）' },
  { uid: '950', name: 'Mia（ミア）' },
  { uid: '947', name: 'Misa（ミサ）' },
  { uid: '934', name: 'Miku（ミク）' },
  { uid: '728', name: 'Lulu（ルル）' },
  { uid: '940', name: 'Saki（サキ）' },
  { uid: '810', name: 'Ayame（アヤメ）' },
  { uid: '937', name: 'Moka（モカ）' },
  { uid: '920', name: 'Momo（モモ）' },
  { uid: '894', name: 'Mina（ミナ）' },
  { uid: '907', name: 'Kana（カナ）' },
  { uid: '878', name: 'Erina（エリナ）' },
  { uid: '880', name: 'Ria（リア）' },
  { uid: '865', name: 'Mika（ミカ）' },
  { uid: '813', name: 'Akane（アカネ）' },
  { uid: '759', name: 'Yura（ユラ）' },
  { uid: '829', name: 'Ayu（アユ）' },
  { uid: '896', name: 'Karen（カレン）' },
  { uid: '774', name: 'Nagisa（ナギサ）' },
  { uid: '842', name: 'Ramu（ラム）' },
  { uid: '881', name: 'Mea（メア）' },
  { uid: '904', name: 'Erika（エリカ）' },
  { uid: '859', name: 'Hinata（ヒナタ）' },
  { uid: '884', name: 'Yuri（ユリ）' },
  { uid: '826', name: 'Seina（セイナ）' },
  { uid: '873', name: 'Momoka（モモカ）' },
  { uid: '809', name: 'Sara（サラ）' },
  { uid: '783', name: 'Rinka（リンカ）' },
  { uid: '838', name: 'Marine（マリン）' },
  { uid: '820', name: 'Airi（アイリ）' },
];

async function processPlayBoyClub() {
  console.log(`\n=== Step 5: PLAY BOY CLUB (${PBC_CASTS.length}名) ===`);
  const therapists = [];
  let photoCount = 0;

  for (let i = 0; i < PBC_CASTS.length; i++) {
    const cast = PBC_CASTS[i];
    try {
      const html = await fetchHtml(`https://playboy-club.net/gals/profile?uid=${cast.uid}`);
      const $ = cheerio.load(html);
      // wcms画像: src または data-original
      const imgUrl = $('img[src*="wcms/gals/images"]').first().attr('src')
        || $('img[data-original*="wcms/gals/images"]').first().attr('data-original');
      therapists.push({ name: cast.name, image_url: imgUrl || null });
      if (imgUrl) { photoCount++; process.stdout.write('.'); }
      else process.stdout.write('_');
    } catch (e) {
      therapists.push({ name: cast.name, image_url: null });
      process.stdout.write('x');
    }
    await sleep(350);
  }
  console.log(`\n  写真取得: ${photoCount}/${PBC_CASTS.length}`);

  await upsertTherapists('kanagawa_yokohama_play_boy_club', therapists);
}

// ─── Loose.a.mood (名前のみ、S3 lazy) ─────────────────────────────────────────
async function processLooseaMood() {
  console.log('\n=== Step 6: Loose.a.mood ===');
  const html = await fetchHtml('https://www.loose-a-mood.com/therapist');
  const $ = cheerio.load(html);
  const seen = new Set();
  const therapists = [];

  $('a[href*="/therapist/"]').each((_, el) => {
    const id = $(el).attr('href')?.match(/\/therapist\/(\d+)$/)?.[1];
    if (!id || seen.has(id)) return;
    seen.add(id);

    const raw = $(el).text().trim();
    const name = raw
      .replace(/^新人New\s*/i, '')
      .replace(/\s*New\s*$/i, '')
      .replace(/^PREMIUM\s+/i, '')
      .replace(/^トレーナー兼セラピスト\s+/, '')
      .trim();

    if (name && !isNoise(name)) {
      therapists.push({ name, image_url: null });
    }
  });

  await upsertTherapists('kanagawa_yokohama_loose_a_mood', therapists);
}

// ─── Y PRIME (名前のみ、S3 lazy) ──────────────────────────────────────────────
async function processYPrime() {
  console.log('\n=== Step 7: Y PRIME ===');
  const html = await fetchHtml('https://y-prime-yokohama.com/therapist');
  const $ = cheerio.load(html);
  const seenIds = new Set();
  const seenNames = new Set();
  const therapists = [];

  $('a[href*="/therapist/"]').each((_, el) => {
    const id = $(el).attr('href')?.match(/\/therapist\/(\d+)$/)?.[1];
    if (!id || seenIds.has(id)) return;
    seenIds.add(id);

    const raw = $(el).text().trim();
    const name = raw
      .replace(/\s*\(\d+歳?\).*$/, '')
      .replace(/^🔰新人🔰\s*/, '')
      .trim();

    // ノイズフィルター (スタート割/大募集/特別特典など)
    if (!name) return;
    if (/割$|募集|特別|特典|スター|^\/therapist\//.test(name)) return;
    if (name.length < 2 || seenNames.has(name)) return;

    seenNames.add(name);
    therapists.push({ name, image_url: null });
  });

  await upsertTherapists('kanagawa_yokohama_y_prime', therapists);
}

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(DRY ? '\n=== DRY RUN ===' : '\n=== LIVE RUN ===');

  await upsertShops();
  await processGuarigione();
  await processRiraclub();
  await processTete();
  await processPlayBoyClub();
  await processLooseaMood();
  await processYPrime();

  console.log('\n=== 完了 ===');
  console.log('⚠️  THE BLANC: caskan CMS → Chrome で別途セラピスト登録要');
  console.log('⚠️  Chloe: JS描画 → Chrome で別途登録要');
  console.log('⚠️  M dot: JS描画 → Chrome で別途登録要');
  console.log('⚠️  Y PRIME / Loose.a.mood: 画像はS3 lazy → Chrome で fix スクリプト要');
}

main().catch(console.error);
