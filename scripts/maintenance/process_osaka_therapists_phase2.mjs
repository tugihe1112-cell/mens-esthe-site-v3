/**
 * 大阪 セラピスト登録 Phase2
 * 対象: moto_photos(4) + rookie_cms(3) + C'est la 美(1) = 8店舗
 * 実行: node scripts/maintenance/process_osaka_therapists_phase2.mjs [--dry-run]
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
    const res = await fetch(url.split('?')[0], { headers, signal: AbortSignal.timeout(15000) });
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

function cleanName(raw) {
  if (!raw) return null;
  let name = raw
    .replace(/^(NEW[！!]?|新人[！!]?|体験入店|★new★|\[new\])/i, '') // NEWプレフィックス除去
    .replace(/【[^】]*】.*$/, '')   // 【読み】以降
    .replace(/\([^)]{1,8}\)$/, '')  // (あすか) など末尾括弧
    .replace(/（[^）]{1,8}）/g, '') // （よみ）
    .replace(/^\s+|\s+$/g, '');
  if (!name || name.length > 12 || !/[ぁ-んァ-ヾ一-龯]/.test(name)) return null;
  return name;
}

function isNoise(name) {
  if (!name || name.length === 0) return true;
  if (name.length > 12) return true;
  if (/イベント|キャンペーン|割引|求人|banner|logo|LINE|Twitter|予約|体験|新規/i.test(name)) return true;
  if (!/[ぁ-んァ-ヾ一-龯]/.test(name)) return true;
  return false;
}

// ===== moto_photos (トップページにキャスト一覧) =====
async function scrapeMotoPhotosTop(base) {
  const html = await fetchHtml(base + '/', base);
  if (!html) return [];
  const $ = cheerio.load(html);
  const results = [], seen = new Set();

  $('img[src*="/photos/"]').each((_, el) => {
    const src = $(el).attr('src') || '';
    if (!src.includes('/moto_') && !src.match(/\/photos\/\d+\//)) return;
    const alt = $(el).attr('alt') || '';
    const name = cleanName(alt);
    if (!name || isNoise(name) || seen.has(name)) return;
    seen.add(name);
    const imgUrl = src.startsWith('http') ? src.split('?')[0] : (base + src).split('?')[0];
    results.push({ name, rawImgUrl: imgUrl });
  });
  return results;
}

// ===== rookie_cms (upload/cast/thumb_ — 名前を親要素から取得) =====
async function scrapeRookieCast(base) {
  const html = await fetchHtml(base.replace(/\/+$/, '') + '/cast/', base);
  if (!html) return [];
  const $ = cheerio.load(html);
  const results = [], seen = new Set();

  // def/con?p=upload/cast/thumb_ パターン
  $('[data-p1*="upload/cast/thumb_"]').each((_, el) => {
    const castId = $(el).attr('data-p1')?.match(/thumb_(\d+)/)?.[1];
    if (!castId) return;

    // 名前は親要素を辿って探す
    let name = null;
    let $el = $(el);
    for (let i = 0; i < 6; i++) {
      $el = $el.parent();
      // 子要素のテキストのうち、日本語かつ短いものを名前候補とする
      const directTexts = $el.children().map((_, ch) => $(ch).text().trim()).get();
      for (const t of directTexts) {
        const cleaned = cleanName(t.replace(/\s+/g, '').slice(0, 12));
        if (cleaned && !isNoise(cleaned)) { name = cleaned; break; }
      }
      if (name) break;
      // テキストノード直接
      const allText = $el.clone().children().remove().end().text().trim();
      const cleaned = cleanName(allText.slice(0, 12));
      if (cleaned && !isNoise(cleaned)) { name = cleaned; break; }
    }
    if (!name || seen.has(name)) return;
    seen.add(name);
    const imgUrl = `${base.replace(/\/+$/, '')}/upload/cast/thumb_${castId}.jpg`;
    results.push({ name, rawImgUrl: imgUrl });
  });

  // src直接パターン (def/conなしのケース)
  if (results.length === 0) {
    $('img[src*="upload/cast/thumb_"]').each((_, el) => {
      const src = $(el).attr('src') || '';
      const castId = src.match(/thumb_(\d+)/)?.[1];
      if (!castId) return;
      const alt = $(el).attr('alt') || '';
      let name = cleanName(alt);
      if (!name) {
        // 親要素から探す
        let $el = $(el);
        for (let i = 0; i < 5; i++) {
          $el = $el.parent();
          const t = $el.text().replace(/\s+/g, '').slice(0, 12);
          const c = cleanName(t);
          if (c && !isNoise(c)) { name = c; break; }
        }
      }
      if (!name || seen.has(name)) return;
      seen.add(name);
      const imgUrl = src.startsWith('http') ? src : base.replace(/\/+$/, '') + src;
      results.push({ name, rawImgUrl: imgUrl });
    });
  }
  return results;
}

// ===== 店舗設定 =====
const SHOPS = [
  // moto_photos → トップページに一覧あり
  { url: 'https://mrs-b-witch.com',       type: 'moto', prefix: 'witchmrs' },
  { url: 'https://www.esthe-sakai.jp',    type: 'moto', prefix: 'sakaipreseine' },
  { url: 'https://salon-emmy.com',        type: 'moto', prefix: 'emmyspa' },
  { url: 'https://hamaru-spa.com',        type: 'moto', prefix: 'hamaruspa' },
  // rookie_cms → /cast/ にキャスト一覧
  { url: 'https://yukoku-esthe.com',      type: 'rookie', prefix: 'yukoku' },
  { url: 'https://menesthe-higashiosak-mona.com', type: 'rookie', prefix: 'spamona' },
  { url: 'https://www.shinkankaku.com',   type: 'rookie', prefix: 'shinkankaku' },
  // C'est la 美 → URLで店舗ID検索
  { url: 'https://cestlavieosaka.com',    type: 'rookie', prefix: 'cestlavie' },
];

console.log(`大阪 Phase2 セラピスト登録${DRY_RUN ? ' [DRY-RUN]' : ''}`);
let totalAdded = 0, totalSkipped = 0, totalFailed = 0;

for (const shop of SHOPS) {
  console.log(`\n[${shop.type}] ${shop.url}`);

  // URLからshop_idを検索
  const escaped = shop.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const { data: dbShops } = await supabase
    .from('shops')
    .select('id,name')
    .ilike('website_url', `%${shop.url.replace(/https?:\/\/(www\.)?/, '').replace(/\/+$/, '')}%`);

  if (!dbShops || dbShops.length === 0) {
    console.log(`  ⚠️ DBに店舗が見つからない: ${shop.url}`);
    totalFailed++;
    continue;
  }

  const shopId = dbShops[0].id;
  console.log(`  shop_id: ${shopId}`);

  let rawTherapists = [];
  if (shop.type === 'moto') {
    rawTherapists = await scrapeMotoPhotosTop(shop.url.replace(/\/+$/, ''));
  } else {
    rawTherapists = await scrapeRookieCast(shop.url);
  }

  if (!rawTherapists.length) {
    console.log(`  ⚠️ セラピスト取得できず`);
    totalFailed++;
    continue;
  }

  console.log(`  取得: ${rawTherapists.length}名`);
  if (DRY_RUN) {
    rawTherapists.slice(0, 5).forEach(t => console.log(`    - ${t.name}  ${t.rawImgUrl}`));
  }

  const therapists = [];
  for (const t of rawTherapists) {
    let imageUrl = null;
    if (t.rawImgUrl && !DRY_RUN) {
      const storageKey = `osaka_${shop.prefix}_${t.name.replace(/[^\w]/g, '_')}`;
      imageUrl = await uploadImage(t.rawImgUrl, storageKey, shop.url);
    } else if (t.rawImgUrl) {
      imageUrl = t.rawImgUrl;
    }
    therapists.push({ name: t.name, image_url: imageUrl });
    process.stdout.write('.');
  }
  process.stdout.write('\n');

  const { added, skipped } = await insertTherapists(shopId, therapists);
  console.log(`  ✅ 登録: ${added}名 / スキップ: ${skipped}名`);
  totalAdded += added;
  totalSkipped += skipped;
  await sleep(800);
}

console.log(`\n============================`);
console.log(`合計 登録: ${totalAdded}名 / スキップ: ${totalSkipped}名 / 失敗: ${totalFailed}`);
console.log(`dry-run: ${DRY_RUN}`);
