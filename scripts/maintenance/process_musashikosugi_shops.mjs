/**
 * 武蔵小杉エリア 9店舗 登録スクリプト
 *   - Agu              (1位) 53名  /images_staff/{sid}/{file}.jpg (動的取得)
 *   - Ho・O・Zu・Ki・SPA (2位) 98名  /images_staff/{sid}/{file}.jpg (動的取得)
 *   - エステ美人マダム  (3位) 23名  WordPress wp-content (ハードコード)
 *   - ROYCE            (5位) 19名  /images_staff/{sid}/{file}.jpg (動的取得)
 *   - Revere Spa       (6位) 32名  /photos/{lid}/moto_{lid}.jpg (動的取得)
 *   - ラプソディースパ  (7位) 71名  WordPress wp-content (動的取得)
 *   - Amateras         (8位) 132名 caskan.com CDN (動的取得)
 *   - SUPERNOVA        (9位) 72名  caskan.com CDN (動的取得)
 *   - Whiteスパ        (10位) 116名 /photos/{lid}/moto_{lid}.jpg (動的取得)
 *   ※ doigt de fee (4位) は名前非公開のためスキップ
 *
 * 実行:
 *   node scripts/maintenance/process_musashikosugi_shops.mjs --dry-run
 *   node scripts/maintenance/process_musashikosugi_shops.mjs
 *   node scripts/maintenance/process_musashikosugi_shops.mjs --shop agu
 *   node scripts/maintenance/process_musashikosugi_shops.mjs --shop hoozuki
 *   node scripts/maintenance/process_musashikosugi_shops.mjs --shop madamu
 *   node scripts/maintenance/process_musashikosugi_shops.mjs --shop royce
 *   node scripts/maintenance/process_musashikosugi_shops.mjs --shop revere
 *   node scripts/maintenance/process_musashikosugi_shops.mjs --shop rhapsody
 *   node scripts/maintenance/process_musashikosugi_shops.mjs --shop amateras
 *   node scripts/maintenance/process_musashikosugi_shops.mjs --shop supernova
 *   node scripts/maintenance/process_musashikosugi_shops.mjs --shop white
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const DRY_RUN = process.argv.includes('--dry-run');
const shopArg = (() => { const i = process.argv.indexOf('--shop'); return i >= 0 ? process.argv[i+1] : null; })();
const run = (n) => !shopArg || shopArg === n;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';

// ===== 共通: images_staff パターン =====
async function fetchImagesStaff(url, keyPrefix, referer) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Referer': referer || url } });
  const html = await res.text();
  const items = [], seen = new Set();
  const reg = /src="(https?:\/\/[^"]+\/images_staff\/(\d+)\/[^"]+\.(jpg|jpeg|png|webp)(?:\?[^"]+)?)"[^>]*alt="([^"]+)"/gi;
  let m;
  while ((m = reg.exec(html)) !== null) {
    const src = m[1].split('?')[0], sid = m[2], name = m[4].replace(/[\s　]+/g,'').trim();
    if (!name || seen.has(sid) || !/[ぁ-んァ-ヾ一-龯]/.test(name)) continue;
    seen.add(sid);
    items.push({name, src, key:`${keyPrefix}_${sid}`});
  }
  // alt/src逆順パターンも試みる
  if (items.length === 0) {
    const reg2 = /alt="([^"]+)"[^>]*src="(https?:\/\/[^"]+\/images_staff\/(\d+)\/[^"]+\.(jpg|jpeg|png|webp)(?:\?[^"]+)?)"/gi;
    while ((m = reg2.exec(html)) !== null) {
      const name = m[1].replace(/[\s　]+/g,'').trim(), src = m[2].split('?')[0], sid = m[3];
      if (!name || seen.has(sid) || !/[ぁ-んァ-ヾ一-龯]/.test(name)) continue;
      seen.add(sid);
      items.push({name, src, key:`${keyPrefix}_${sid}`});
    }
  }
  return items;
}

// ===== 共通: /photos/{lid}/moto_{lid}.jpg パターン =====
async function fetchPhotos(url, keyPrefix) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  const html = await res.text();
  const items = [], seen = new Set();
  const reg = /src="([^"]+\/photos\/(\d+)\/[^"]+)"[^>]*alt="([^"]+)"/gi;
  let m;
  while ((m = reg.exec(html)) !== null) {
    const lid = m[2], name = m[3].replace(/\s*\(\d+\)\s*/g,'').replace(/[\s　]+/g,'').trim();
    if (!name || seen.has(name) || !/[ぁ-んァ-ヾ一-龯]/.test(name) || /割引|★|❤|NEW|限定/.test(name)) continue;
    seen.add(name);
    items.push({name, lid, src:`${new URL(url).origin}/photos/${lid}/moto_${lid}.jpg`, key:`${keyPrefix}_${lid}`});
  }
  return items;
}

// ===== 共通: caskan.com CDN =====
async function fetchCaskan(url, keyPrefix) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  const html = await res.text();
  const items = [], seen = new Set();
  const reg = /alt="([^"]+)"[^>]*src="(https:\/\/cdn2-caskan\.com\/caskan\/img\/cast_tmb\/\d+_(\d+)\.[^"]+)"/gi;
  let m;
  while ((m = reg.exec(html)) !== null) {
    const name = m[1].trim(), castId = m[3];
    if (!name || seen.has(name) || name.length < 2) continue;
    seen.add(name);
    items.push({name, castId, src: m[2], key:`${keyPrefix}_${castId}`});
  }
  return items;
}

// ===== ラプソディースパ: WordPress =====
async function fetchRhapsody() {
  const res = await fetch('https://rhapsody-spa.com/cast-list/', { headers: { 'User-Agent': UA } });
  const html = await res.text();
  // 名前リスト（テキストから）
  const names = [];
  const nameReg = /([ぁ-んァ-ヾ一-龯々]{2,8})\s*\(\d{2}歳\)/g;
  let m;
  while ((m = nameReg.exec(html)) !== null) {
    const n = m[1].trim();
    if (n && !names.includes(n)) names.push(n);
  }
  // 画像URLリスト
  const imgUrls = [];
  const imgReg = /src="(https:\/\/i0\.wp\.com\/rhapsody-spa\.com\/wp-content\/uploads\/[^"]+\.(jpg|jpeg|png|webp))(?:\?[^"]*)?"[^>]*(?:ssl=1)?/gi;
  while ((m = imgReg.exec(html)) !== null) {
    const fn = m[1].split('/').pop();
    if (!fn || fn.includes('monitor') || fn.includes('logo')) continue;
    imgUrls.push(m[1]);
  }
  // 名前と画像URLを順番通りに対応付け
  const items = [];
  const minLen = Math.min(names.length, imgUrls.length);
  for (let i = 0; i < minLen; i++) {
    const fn = imgUrls[i].split('/').pop().replace(/\.[^.]+$/,'').slice(0,20);
    items.push({name: names[i], src: imgUrls[i], key:`rhapsody_${fn}`});
  }
  return items;
}

// ===== エステ美人マダム武蔵小杉 ハードコードデータ =====
const MADAMU_THERAPISTS = [
  { name: 'けい',     src: 'https://musashikosugi.esthe-madamu.com/wp/wp-content/uploads/2026/05/S__15925268.jpg',    key: 'madamu_S__15925268' },
  { name: 'のあ',     src: 'https://musashikosugi.esthe-madamu.com/wp/wp-content/uploads/2026/04/S__15138865.jpg',    key: 'madamu_S__15138865' },
  { name: 'はな',     src: 'https://musashikosugi.esthe-madamu.com/wp/wp-content/uploads/2026/02/IMG_3592.jpeg',      key: 'madamu_IMG_3592' },
  { name: 'ともよ',   src: 'https://musashikosugi.esthe-madamu.com/wp/wp-content/uploads/2025/12/IMG_2763.jpeg',      key: 'madamu_IMG_2763' },
  { name: 'ももな',   src: 'https://musashikosugi.esthe-madamu.com/wp/wp-content/uploads/2025/11/IMG_2614.jpeg',      key: 'madamu_IMG_2614' },
  { name: 'あんな',   src: 'https://musashikosugi.esthe-madamu.com/wp/wp-content/uploads/2025/10/S__14499866.jpg',    key: 'madamu_S__14499866' },
  { name: 'みつき',   src: 'https://musashikosugi.esthe-madamu.com/wp/wp-content/uploads/2025/10/S__14540832.jpg',    key: 'madamu_S__14540832' },
  { name: 'しほ',     src: 'https://musashikosugi.esthe-madamu.com/wp/wp-content/uploads/2025/03/IMG_1814.jpeg',      key: 'madamu_IMG_1814' },
  { name: 'すずか',   src: 'https://musashikosugi.esthe-madamu.com/wp/wp-content/uploads/2025/03/IMG_06681.jpg',      key: 'madamu_IMG_06681' },
  { name: 'ゆうり',   src: 'https://musashikosugi.esthe-madamu.com/wp/wp-content/uploads/2024/04/IMG_7779.jpeg',      key: 'madamu_IMG_7779' },
  { name: 'ありさ',   src: 'https://musashikosugi.esthe-madamu.com/wp/wp-content/uploads/2024/03/IMG_2545.jpeg',      key: 'madamu_IMG_2545' },
  { name: 'ゆな',     src: 'https://musashikosugi.esthe-madamu.com/wp/wp-content/uploads/2024/01/IMG_19301.jpg',      key: 'madamu_IMG_19301' },
  { name: 'まい',     src: 'https://musashikosugi.esthe-madamu.com/wp/wp-content/uploads/2023/11/IMG_2126.jpeg',      key: 'madamu_IMG_2126' },
  { name: 'ゆうな',   src: 'https://musashikosugi.esthe-madamu.com/wp/wp-content/uploads/2023/11/S__14213214.jpg',    key: 'madamu_S__14213214' },
  { name: 'ふじこ',   src: 'https://musashikosugi.esthe-madamu.com/wp/wp-content/uploads/2023/09/IMG_0908.jpeg',      key: 'madamu_IMG_0908' },
  { name: '美咲りな', src: 'https://musashikosugi.esthe-madamu.com/wp/wp-content/uploads/2023/04/IMG_16411.jpg',      key: 'madamu_IMG_16411' },
  { name: '栗山ゆき', src: 'https://musashikosugi.esthe-madamu.com/wp/wp-content/uploads/2025/10/cropped-IMG_1849.jpeg', key: 'madamu_cropped_IMG_1849' },
  { name: 'まほ',     src: 'https://musashikosugi.esthe-madamu.com/wp/wp-content/uploads/2023/04/IMG_4227.jpeg',      key: 'madamu_IMG_4227' },
  { name: 'れい子',   src: 'https://musashikosugi.esthe-madamu.com/wp/wp-content/uploads/2023/04/IMG_09151.jpg',      key: 'madamu_IMG_09151' },
  { name: 'さな',     src: 'https://musashikosugi.esthe-madamu.com/wp/wp-content/uploads/2023/04/IMG_3247.jpeg',      key: 'madamu_IMG_3247' },
  { name: 'めい',     src: 'https://musashikosugi.esthe-madamu.com/wp/wp-content/uploads/2023/04/AAE59252-A6CB-41AC-8502-EE7F8AC4D160.jpeg', key: 'madamu_AAE59252' },
  { name: '楓',       src: 'https://musashikosugi.esthe-madamu.com/wp/wp-content/uploads/2023/04/kaede.jpg',          key: 'madamu_kaede' },
  { name: '綾乃',     src: 'https://musashikosugi.esthe-madamu.com/wp/wp-content/uploads/2023/04/IMG_19221.jpg',      key: 'madamu_IMG_19221' },
];

// ===== 店舗定義 =====
const SHOPS = [
  {
    arg: 'agu',
    shop: {
      id: 'kanagawa_kawasaki_musashikosugi_agu',
      name: 'Agu (アグ)',
      website_url: 'https://kosugi-agu.com/',
      schedule_url: null,
      image_url: null,
      raw_data: { prefecture: '神奈川県', area: '武蔵小杉' },
    },
    fetch: () => fetchImagesStaff('https://kosugi-agu.com/therapist/', 'agu', 'https://kosugi-agu.com'),
    referer: 'https://kosugi-agu.com',
  },
  {
    arg: 'hoozuki',
    shop: {
      id: 'kanagawa_kawasaki_musashikosugi_hoozuki',
      name: 'Ho・O・Zu・Ki・SPA (ホオズキスパ) 武蔵小杉ルーム',
      website_url: 'https://hoozuki-spa.net/',
      schedule_url: null,
      image_url: null,
      raw_data: { prefecture: '神奈川県', area: '武蔵小杉' },
    },
    fetch: () => fetchImagesStaff('https://hoozuki-spa.net/therapist.php', 'hoozuki', 'https://hoozuki-spa.net'),
    referer: 'https://hoozuki-spa.net',
  },
  {
    arg: 'madamu',
    shop: {
      id: 'kanagawa_kawasaki_musashikosugi_madamu',
      name: 'エステ美人マダム 武蔵小杉',
      website_url: 'https://musashikosugi.esthe-madamu.com/',
      schedule_url: 'https://musashikosugi.esthe-madamu.com/schedule/',
      image_url: null,
      raw_data: { prefecture: '神奈川県', area: '武蔵小杉' },
    },
    fetch: async () => MADAMU_THERAPISTS,
    referer: 'https://musashikosugi.esthe-madamu.com',
  },
  {
    arg: 'royce',
    shop: {
      id: 'kanagawa_kawasaki_musashikosugi_royce',
      name: 'ROYCE (ロイス)',
      website_url: 'https://aromaroyce.com/',
      schedule_url: null,
      image_url: null,
      raw_data: { prefecture: '神奈川県', area: '武蔵小杉' },
    },
    fetch: () => fetchImagesStaff('https://aromaroyce.com/staff.php', 'royce', 'https://aromaroyce.com'),
    referer: 'https://aromaroyce.com',
  },
  {
    arg: 'revere',
    shop: {
      id: 'kanagawa_kawasaki_musashikosugi_revere_spa',
      name: 'Revere Spa (リヴェールスパ)',
      website_url: 'https://revere-spa.com/',
      schedule_url: 'https://revere-spa.com/schedule',
      image_url: null,
      raw_data: { prefecture: '神奈川県', area: '武蔵小杉' },
    },
    fetch: () => fetchPhotos('https://revere-spa.com/girl', 'revere'),
    referer: 'https://revere-spa.com',
  },
  {
    arg: 'rhapsody',
    shop: {
      id: 'kanagawa_kawasaki_musashikosugi_rhapsody',
      name: 'ラプソディースパ',
      website_url: 'https://rhapsody-spa.com/',
      schedule_url: null,
      image_url: null,
      raw_data: { prefecture: '神奈川県', area: '武蔵小杉' },
    },
    fetch: fetchRhapsody,
    referer: 'https://rhapsody-spa.com',
  },
  {
    arg: 'amateras',
    shop: {
      id: 'kanagawa_kawasaki_musashikosugi_amateras',
      name: 'Amateras (アマテラス) 武蔵小杉ルーム',
      website_url: 'https://amaterasu-yokohama.com/',
      schedule_url: null,
      image_url: null,
      raw_data: { prefecture: '神奈川県', area: '武蔵小杉' },
    },
    fetch: () => fetchCaskan('https://amaterasu-yokohama.com/therapist', 'amateras'),
    referer: 'https://amaterasu-yokohama.com',
  },
  {
    arg: 'supernova',
    shop: {
      id: 'kanagawa_kawasaki_musashikosugi_supernova',
      name: 'SUPERNOVA (スーパーノバ)',
      website_url: 'https://supernova-esthe.com/',
      schedule_url: null,
      image_url: null,
      raw_data: { prefecture: '神奈川県', area: '武蔵小杉' },
    },
    fetch: () => fetchCaskan('https://supernova-esthe.com/therapist', 'supernova'),
    referer: 'https://supernova-esthe.com',
  },
  {
    arg: 'white',
    shop: {
      id: 'kanagawa_kawasaki_musashikosugi_white_spa',
      name: 'Whiteスパ',
      website_url: 'https://white-spa.net/',
      schedule_url: 'https://white-spa.net/schedule',
      image_url: null,
      raw_data: { prefecture: '神奈川県', area: '武蔵小杉' },
    },
    fetch: () => fetchPhotos('https://white-spa.net/girl', 'white'),
    referer: 'https://white-spa.net',
  },
];

// ===== 共通ユーティリティ =====
async function uploadImage(imgUrl, key, referer) {
  if (!imgUrl) return null;
  try {
    const headers = { 'User-Agent': UA };
    if (referer) headers['Referer'] = referer;
    const res = await fetch(imgUrl, { headers });
    if (!res.ok) { process.stdout.write('!'); return null; }
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = imgUrl.split('?')[0].split('.').pop().toLowerCase();
    const ct = ext === 'png' ? 'image/png' : (ext === 'webp' ? 'image/webp' : 'image/jpeg');
    const { error } = await supabase.storage.from('therapist-images').upload(`${key}.jpg`, buf, { contentType: ct, upsert: true });
    if (error) { process.stdout.write('!'); return null; }
    const { data } = supabase.storage.from('therapist-images').getPublicUrl(`${key}.jpg`);
    return data.publicUrl;
  } catch { process.stdout.write('!'); return null; }
}

async function registerShop(s) {
  if (DRY_RUN) { console.log(`  [DRY] ${s.id}`); return; }
  const { error } = await supabase.from('shops').upsert(s, { onConflict: 'id' });
  if (error) console.error('  Shop error:', error.message);
  else console.log(`  ✅ ${s.id}`);
}

async function registerTherapists(shopId, therapists, referer) {
  let ins = 0, skp = 0, err = 0;
  for (const t of therapists) {
    const tid = `${shopId}_${t.name}`;
    const { data: ex } = await supabase.from('therapists').select('id,image_url').eq('id', tid).single();
    if (ex?.image_url) { process.stdout.write('='); skp++; continue; }
    const url = (!DRY_RUN && t.src && t.key)
      ? await uploadImage(t.src, t.key, referer)
      : (DRY_RUN && t.src ? '(ok)' : null);
    if (DRY_RUN) { process.stdout.write(url ? '+' : 'n'); ins++; continue; }
    const { error } = await supabase.from('therapists').upsert(
      { id: tid, shop_id: shopId, name: t.name, image_url: url },
      { onConflict: 'id' }
    );
    if (error) { err++; process.stdout.write('x'); }
    else { process.stdout.write(url ? '+' : 'n'); ins++; }
    await new Promise(r => setTimeout(r, 200));
  }
  console.log(`\n  挿入:${ins} スキップ:${skp} エラー:${err}`);
}

async function main() {
  console.log(`=== 武蔵小杉9店舗 登録 (DRY_RUN=${DRY_RUN}) ===\n`);

  for (const { arg, shop, fetch: fetchFn, referer } of SHOPS) {
    if (!run(arg)) continue;
    console.log(`--- ${shop.name} ---`);
    await registerShop(shop);
    const therapists = await fetchFn();
    console.log(`  ${therapists.length}名取得`);
    if (therapists.length === 0) { console.log('  ⚠️ 取得失敗'); continue; }
    await registerTherapists(shop.id, therapists, referer);
  }

  console.log('\n=== 完了 ===');
}
main().catch(console.error);
