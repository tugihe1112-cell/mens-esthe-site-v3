/**
 * 大阪 セラピスト登録 Phase1
 * 対象: wcms(11) + moto_photos(5) + images_staff(2) + rookie_cms(8) = 26店舗
 * 実行: node scripts/maintenance/process_osaka_therapists_phase1.mjs [--dry-run]
 */
import fs from 'fs';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const DRY_RUN = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = k => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchHtml(url, referer = null) {
  const headers = { 'User-Agent': UA };
  if (referer) headers['Referer'] = referer;
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(12000) });
    return res.ok ? res.text() : null;
  } catch { return null; }
}

async function uploadImage(url, storageKey, referer = null) {
  try {
    const headers = { 'User-Agent': UA };
    if (referer) headers['Referer'] = referer;
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = url.split('?')[0].split('.').pop().toLowerCase().replace(/[^a-z]/g, '') || 'jpg';
    const key = `${storageKey}.${ext}`;
    const { error } = await supabase.storage.from('therapist-images').upload(key, buf, {
      contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`, upsert: true
    });
    if (error) return null;
    const { data } = supabase.storage.from('therapist-images').getPublicUrl(key);
    return data.publicUrl;
  } catch { return null; }
}

async function insertTherapists(shopId, therapists) {
  let added = 0, skipped = 0;
  for (const t of therapists) {
    const id = `${shopId}_${t.name}`;
    const { data } = await supabase.from('therapists').select('id').eq('id', id).single();
    if (data) { skipped++; continue; }
    if (!DRY_RUN) {
      await supabase.from('therapists').insert({ id, shop_id: shopId, name: t.name, image_url: t.image_url });
    }
    added++;
  }
  return { added, skipped };
}

// 名前クリーニング（wcms共通）
function cleanName(raw) {
  if (!raw) return null;
  let name = raw
    .replace(/【[^】]*】.*$/, '')  // 【読み】以降
    .replace(/　.*$/, '')           // 全角スペース以降
    .replace(/\s*\(.*?\)/g, '')     // (年齢) など
    .replace(/（[^）]*）/g, '')     // （年齢）
    .replace(/^\s+|\s+$/g, '');
  if (!name || name.length > 12 || !/[ぁ-んァ-ヾ一-龯]/.test(name)) return null;
  return name;
}

// ノイズチェック
function isNoise(name) {
  if (!name || name.length === 0) return true;
  if (name.length > 12) return true;
  if (/イベント|キャンペーン|割引|求人|banner|logo|icon|LINE|Twitter|Instagram|予約|体験|新規|送迎/i.test(name)) return true;
  if (!/[ぁ-んァ-ヾ一-龯]/.test(name)) return true;
  return false;
}

// ===== wcms パターン =====
async function scrapeWcms(baseUrl, shopId) {
  const galsUrl = baseUrl.replace(/\/+$/, '') + '/gals/';
  const html = await fetchHtml(galsUrl, baseUrl);
  if (!html) return [];
  const $ = cheerio.load(html);
  const results = [];
  const seen = new Set();

  $('img[data-original*="/wcms/gals/images/"], img[src*="/wcms/gals/images/"]').each((_, el) => {
    const imgUrl = $(el).attr('data-original') || $(el).attr('src') || '';
    const alt = $(el).attr('alt') || '';
    const name = cleanName(alt);
    if (!name || isNoise(name) || seen.has(name)) return;
    seen.add(name);
    results.push({ name, rawImgUrl: imgUrl.startsWith('http') ? imgUrl : baseUrl.replace(/\/+$/, '') + imgUrl });
  });
  return results;
}

// ===== moto_photos パターン =====
async function scrapeMotoPhotos(baseUrl, shopId, staffPath = '/therapist/') {
  const url = baseUrl.replace(/\/+$/, '') + staffPath;
  const html = await fetchHtml(url, baseUrl);
  if (!html) return [];
  const $ = cheerio.load(html);
  const results = [];
  const seen = new Set();

  $('img[src*="/photos/"]').each((_, el) => {
    const src = $(el).attr('src') || '';
    const alt = $(el).attr('alt') || '';
    if (!src.includes('/moto_') && !src.match(/\/photos\/\d+\//)) return;
    const name = cleanName(alt);
    if (!name || isNoise(name) || seen.has(name)) return;
    seen.add(name);
    const imgUrl = src.startsWith('http') ? src : baseUrl.replace(/\/+$/, '') + src;
    results.push({ name, rawImgUrl: imgUrl });
  });
  return results;
}

// ===== images_staff パターン =====
async function scrapeImagesStaff(baseUrl, shopId, staffPath = '/therapist/') {
  const url = baseUrl.replace(/\/+$/, '') + staffPath;
  const html = await fetchHtml(url, baseUrl);
  if (!html) return [];
  const $ = cheerio.load(html);
  const results = [];
  const seen = new Set();

  $('img[src*="images_staff"], img[data-src*="images_staff"]').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || '';
    const alt = $(el).attr('alt') || '';
    const name = cleanName(alt);
    if (!name || isNoise(name) || seen.has(name)) return;
    seen.add(name);
    const imgUrl = src.startsWith('http') ? src : baseUrl.replace(/\/+$/, '') + src;
    results.push({ name, rawImgUrl: imgUrl });
  });
  return results;
}

// ===== rookie_cms パターン (upload/cast/thumb_) =====
async function scrapeRookieCms(baseUrl, shopId, staffPath = '/cast/') {
  // まず /cast/ を試し、ダメなら /therapist/ を試す
  const paths = [staffPath, '/therapist/', '/staff/', '/ladies/'];
  for (const path of paths) {
    const url = baseUrl.replace(/\/+$/, '') + path;
    const html = await fetchHtml(url, baseUrl);
    if (!html || !html.includes('upload/cast/thumb_')) continue;

    const $ = cheerio.load(html);
    const results = [];
    const seen = new Set();

    // def/con?p=upload/cast/thumb_ パターン
    $('[data-p1*="upload/cast/thumb_"], img[src*="upload/cast/thumb_"]').each((_, el) => {
      const datap1 = $(el).attr('data-p1') || '';
      const src = $(el).attr('src') || '';
      const castPath = datap1.replace('def/con?p=', '') || src;
      const castId = castPath.match(/thumb_(\d+)/)?.[1];
      if (!castId) return;

      // 名前を取得（親要素のテキストから）
      let name = null;
      let el2 = $(el);
      for (let i = 0; i < 5; i++) {
        el2 = el2.parent();
        const text = el2.text().replace(/\s+/g, '').replace(/\d+cm.*/, '').replace(/[０-９]/g, '').trim();
        const cleaned = cleanName(text.slice(0, 20));
        if (cleaned && !isNoise(cleaned)) { name = cleaned; break; }
      }
      // altも試す
      if (!name) {
        const alt = $(el).attr('alt') || '';
        name = cleanName(alt);
      }
      if (!name || isNoise(name) || seen.has(name)) return;
      seen.add(name);

      const imgUrl = `${baseUrl.replace(/\/+$/, '')}/upload/cast/thumb_${castId}.jpg`;
      results.push({ name, rawImgUrl: imgUrl });
    });

    if (results.length > 0) return results;
  }
  return [];
}

// ===== 店舗設定 =====
const SHOPS = [
  // ----- wcms (11店舗) -----
  { shopId: 'osaka_kyobashi_motejoモテジョ',         base: 'https://motejo.net',             type: 'wcms' },
  { shopId: 'osaka_kyobashi_天雅tenga',              base: 'https://tenga-osaka.com',         type: 'wcms' },
  { shopId: 'osaka_nippombashi_alyoアルヨ日本橋ルーム', base: 'https://alyo.net',              type: 'wcms' },
  { shopId: 'osaka_nippombashi_煌めきspa',           base: 'https://kiramekispa.com',         type: 'wcms' },
  { shopId: 'osaka_sakaihigashi_amorespaアモーレスパ', base: 'https://amore-spa.com',         type: 'wcms' },
  { shopId: 'osaka_sakaihigashi_oilmadridオイルマドリ', base: 'https://oilmadrid.com',        type: 'wcms' },
  { shopId: 'osaka_shinsaibashi_sarisariサリサリ',   base: 'https://sarisari.jp',             type: 'wcms' },
  { shopId: 'osaka_tanimachi_femmefataleファムフ',   base: 'https://femmefatale-osaka.com',   type: 'wcms' },
  { shopId: 'osaka_umeda_belchicベルシック',         base: 'https://belchic.net',             type: 'wcms' },
  { shopId: 'osaka_umeda_lancomランコム',            base: 'https://lancom.jp',               type: 'wcms' },
  { shopId: 'osaka_umeda_pershiaペルシア',           base: 'https://pershia.jp',              type: 'wcms' },

  // ----- moto_photos (5店舗) -----
  { shopId: 'osaka_sakaihigashi_mrs.美witch',        base: 'https://mrs-b-witch.com',         type: 'moto_photos' },
  { shopId: 'osaka_sakaihigashi_preseineプリセーヌ', base: 'https://www.esthe-sakai.jp',      type: 'moto_photos' },
  { shopId: 'osaka_sakaihigashi_restレスト',        base: 'https://salon-rest.com',           type: 'moto_photos' },
  { shopId: 'osaka_shinsosaka_mrs.emmy',            base: 'https://salon-emmy.com',           type: 'moto_photos' },
  { shopId: 'osaka_umeda_ハマるspa',                base: 'https://hamaru-spa.com',           type: 'moto_photos' },

  // ----- images_staff (2店舗) -----
  { shopId: 'osaka_shinsosaka_4hフォーエイチ',      base: 'https://four-h.net',              type: 'images_staff' },
  { shopId: 'osaka_shinsosaka_ヒルガオ',            base: 'https://hirugaosaka.com',         type: 'images_staff' },

  // ----- rookie_cms (8店舗) -----
  { shopId: 'osaka_kyobashi_天雅tenga',              base: 'https://tenga-osaka.com',         type: 'rookie_cms', staffPath: '/cast/' },  // wcmsで取れなかった場合の予備
  { shopId: 'osaka_nippombashi_艶華えんか',          base: 'https://enka-es.com',             type: 'rookie_cms' },
  { shopId: 'osaka_sakaihigashi_relaxationhugリラ',  base: 'https://riraku-hug.com',          type: 'rookie_cms' },
  { shopId: 'osaka_sakaihigashi_癒刻ゆこく',        base: 'https://yukoku-esthe.com',        type: 'rookie_cms' },
  { shopId: 'osaka_tanimachi_aromaroseアロマローズ', base: 'https://aroma-rose-mens.net',     type: 'rookie_cms' },
  { shopId: "osaka_tanimachi_c'estla美osakaセラ",   base: 'https://cestlavieosaka.com',      type: 'rookie_cms' },
  { shopId: 'osaka_tanimachi_spamonaスパモナ',      base: 'https://menesthe-higashiosak-mona.com', type: 'rookie_cms' },
  { shopId: 'osaka_umeda_打上花火梅田ルーム',        base: 'https://uchiagemenseste.jp',      type: 'rookie_cms' },
  { shopId: 'osaka_tanimachi_新感覚mエステ',        base: 'https://www.shinkankaku.com',     type: 'rookie_cms' },
];

// 重複shop_id除外（天雅はwcmsで処理）
const UNIQUE_SHOPS = SHOPS.filter((s, i) => SHOPS.findIndex(x => x.shopId === s.shopId) === i);

// ===== メイン処理 =====
console.log(`大阪 Phase1 セラピスト登録${DRY_RUN ? ' [DRY-RUN]' : ''}`);
console.log(`対象: ${UNIQUE_SHOPS.length}店舗\n`);

let totalAdded = 0, totalSkipped = 0, totalFailed = 0;

for (const shop of UNIQUE_SHOPS) {
  console.log(`\n[${shop.type}] ${shop.shopId}`);

  // DB存在確認
  const { data: dbShop } = await supabase.from('shops').select('id').eq('id', shop.shopId).single();
  if (!dbShop) {
    console.log(`  ⚠️ DBに店舗が存在しない。スキップ`);
    totalFailed++;
    continue;
  }

  let rawTherapists = [];
  if (shop.type === 'wcms') {
    rawTherapists = await scrapeWcms(shop.base, shop.shopId);
  } else if (shop.type === 'moto_photos') {
    rawTherapists = await scrapeMotoPhotos(shop.base, shop.shopId, shop.staffPath || '/therapist/');
    if (!rawTherapists.length) rawTherapists = await scrapeMotoPhotos(shop.base, shop.shopId, '/cast/');
  } else if (shop.type === 'images_staff') {
    rawTherapists = await scrapeImagesStaff(shop.base, shop.shopId, shop.staffPath || '/therapist/');
    if (!rawTherapists.length) rawTherapists = await scrapeImagesStaff(shop.base, shop.shopId, '/');
  } else if (shop.type === 'rookie_cms') {
    rawTherapists = await scrapeRookieCms(shop.base, shop.shopId, shop.staffPath || '/cast/');
    if (!rawTherapists.length) rawTherapists = await scrapeRookieCms(shop.base, shop.shopId, '/therapist/');
  }

  if (!rawTherapists.length) {
    console.log(`  ⚠️ セラピスト取得できず`);
    totalFailed++;
    continue;
  }

  console.log(`  取得: ${rawTherapists.length}名`);

  // 画像アップロード + DB登録
  const therapists = [];
  for (const t of rawTherapists) {
    let imageUrl = null;
    if (t.rawImgUrl && !DRY_RUN) {
      const storageKey = `osaka_${shop.shopId.replace(/[^\w]/g, '_')}_${t.name.replace(/[^\w]/g, '_')}`;
      imageUrl = await uploadImage(t.rawImgUrl, storageKey, shop.base);
    } else if (t.rawImgUrl) {
      imageUrl = t.rawImgUrl; // dry-run時は元URLをそのまま
    }
    therapists.push({ name: t.name, image_url: imageUrl });
    process.stdout.write('.');
  }
  process.stdout.write('\n');

  const { added, skipped } = await insertTherapists(shop.shopId, therapists);
  console.log(`  ✅ 登録: ${added}名 / スキップ: ${skipped}名`);
  totalAdded += added;
  totalSkipped += skipped;

  await sleep(1000);
}

console.log(`\n============================`);
console.log(`合計 登録: ${totalAdded}名 / スキップ: ${totalSkipped}名 / 店舗取得失敗: ${totalFailed}店舗`);
console.log(`dry-run: ${DRY_RUN}`);
