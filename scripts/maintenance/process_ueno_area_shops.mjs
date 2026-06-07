/**
 * 上野エリア 5店舗 登録スクリプト
 * - TOKYO LUXURY (1位) 84名 名前のみ
 * - Grace Tokyo (2位) 142名 /photos/{id}/ パターン
 * - 色気あるワイフ (4位) 218名 /data/girl/160x240/{hash}.jpg
 * - らんぷ 三ノ輪店 (7位) 15名 re-db.com
 * - Luxuary ラグジュアリー 上野店 (10位) 20名 wp-content
 *
 * 実行:
 *   node scripts/maintenance/process_ueno_area_shops.mjs --dry-run
 *   node scripts/maintenance/process_ueno_area_shops.mjs --shop luxury    # TOKYO LUXURY
 *   node scripts/maintenance/process_ueno_area_shops.mjs --shop grace     # Grace Tokyo
 *   node scripts/maintenance/process_ueno_area_shops.mjs --shop iroke     # 色気あるワイフ
 *   node scripts/maintenance/process_ueno_area_shops.mjs --shop ranpu     # らんぷ三ノ輪
 *   node scripts/maintenance/process_ueno_area_shops.mjs --shop luxuarygp # Luxuary上野
 *   node scripts/maintenance/process_ueno_area_shops.mjs                  # 全店舗
 */

import fs from 'fs';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const DRY_RUN = process.argv.includes('--dry-run');
const shopArg = (() => { const i = process.argv.indexOf('--shop'); return i >= 0 ? process.argv[i+1] : null; })();

async function fetchHtml(url, referer) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': referer || url } });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.text();
}

async function uploadImage(imgUrl, key, referer) {
  try {
    const res = await fetch(imgUrl, { headers: { 'Referer': referer, 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) { process.stdout.write('!'); return null; }
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = imgUrl.split('.').pop().split('?')[0].toLowerCase();
    const ct = (ext === 'png') ? 'image/png' : 'image/jpeg';
    const storageKey = `${key}.${ext === 'jpeg' ? 'jpg' : ext}`;
    const { error } = await supabase.storage.from('therapist-images').upload(storageKey, buf, { contentType: ct, upsert: true });
    if (error) { process.stdout.write('!'); return null; }
    const { data } = supabase.storage.from('therapist-images').getPublicUrl(storageKey);
    return data.publicUrl;
  } catch { process.stdout.write('!'); return null; }
}

async function registerShop(shop) {
  const { id, name, website_url, schedule_url, image_url, prefecture, area } = shop;
  const { error } = await supabase.from('shops').upsert({
    id, name, website_url, schedule_url, image_url,
    raw_data: { prefecture, area }
  }, { onConflict: 'id' });
  if (error) console.error(`✗ ${name}: ${error.message}`);
  else console.log(`✅ ${id}`);
}

async function registerTherapists(shopId, therapists, referer) {
  let ins = 0, skp = 0, err = 0;
  for (const t of therapists) {
    const normName = t.name.replace(/\s+/g, ' ').trim();
    const tid = `${shopId}_${normName}`;
    const { data: ex } = await supabase.from('therapists').select('id,image_url').eq('id', tid).single();
    if (ex?.image_url) { process.stdout.write('='); skp++; continue; }

    let url = null;
    if (t.src) {
      url = await uploadImage(t.src, t.key, referer);
    }

    const { error } = await supabase.from('therapists').upsert(
      { id: tid, shop_id: shopId, name: normName, image_url: url },
      { onConflict: 'id' }
    );
    if (error) { console.error(`\n✗ ${normName}: ${error.message}`); err++; }
    else { process.stdout.write(url ? '+' : 'n'); ins++; }
    await new Promise(r => setTimeout(r, 200));
  }
  console.log(`\n挿入: ${ins} / スキップ: ${skp} / エラー: ${err}`);
}

// ===== TOKYO LUXURY =====
async function processTOKYOLUXURY() {
  console.log('\n=== TOKYO LUXURY ===');
  const shop = {
    id: 'tokyo_taito_ueno_tokyo_luxury',
    name: 'TOKYO LUXURY (トウキョウラグジュアリー)',
    website_url: 'https://tokyo-luxury.xyz/',
    schedule_url: 'https://tokyo-luxury.xyz/schedule/',
    image_url: null,
    prefecture: '東京都', area: '上野'
  };
  if (!DRY_RUN) await registerShop(shop);
  else console.log(`[DRY] ${shop.name}`);

  // WordPressのElementorページ - cheerioで名前のみ取得
  const html = await fetchHtml('https://tokyo-luxury.xyz/therapist/', 'https://tokyo-luxury.xyz/');
  const $ = cheerio.load(html);
  const names = new Set();
  $('*').each((_, el) => {
    const text = $(el).text().trim();
    if (/^[一-龯ぁ-んァ-ヾ]{1,6}$/.test(text) && text.length <= 5) names.add(text);
  });
  // ノイズ除去
  const NOISE = new Set(['予約', '料金', '上野', '御徒町', '東京', '新規', '割引', '案内', '求人', '会員', '支払', '電話', '営業', 'NEW']);
  const therapists = [...names].filter(n => !NOISE.has(n)).map(name => ({ name, src: null, key: null }));

  console.log(`取得: ${therapists.length}名（画像なし）`);
  if (!DRY_RUN) await registerTherapists(shop.id, therapists, 'https://tokyo-luxury.xyz/');
  else therapists.forEach(t => process.stdout.write('.'));
}

// ===== Grace Tokyo =====
async function processGraceTokyo() {
  console.log('\n=== Grace Tokyo ===');
  const shop = {
    id: 'tokyo_taito_ueno_grace_tokyo',
    name: 'Grace Tokyo (グレイストウキョウ)',
    website_url: 'https://gracetokyo-esthe.com/',
    schedule_url: 'https://gracetokyo-esthe.com/schedule',
    image_url: null,
    prefecture: '東京都', area: '上野'
  };
  if (!DRY_RUN) await registerShop(shop);
  else console.log(`[DRY] ${shop.name}`);

  const html = await fetchHtml('https://gracetokyo-esthe.com/girl', 'https://gracetokyo-esthe.com/');
  const $ = cheerio.load(html);
  const therapists = [];
  const seen = new Set();
  $('img').each((_, el) => {
    const src = $(el).attr('src') || '';
    const alt = ($(el).attr('alt') || '').trim();
    if (alt && /[ぁ-んァ-ヾ一-龯]/.test(alt) && alt.length < 20 && !src.includes('logo') && src.includes('/photos/')) {
      const lid = src.match(/\/photos\/(\d+)\//)?.[1];
      if (lid && !seen.has(alt)) {
        seen.add(alt);
        therapists.push({ name: alt, src: src.split('?')[0], key: `grace_${lid}` });
      }
    }
  });

  console.log(`取得: ${therapists.length}名`);
  if (!DRY_RUN) await registerTherapists(shop.id, therapists, 'https://gracetokyo-esthe.com/');
  else therapists.slice(0,5).forEach(t => console.log(`[DRY] ${t.name}`));
}

// ===== 色気あるワイフ =====
async function processIrokeWife() {
  console.log('\n=== 色気あるワイフ ===');
  const shop = {
    id: 'tokyo_taito_ueno_iroke_wife',
    name: '色気あるワイフ',
    website_url: 'https://www.iroke-wife.com/',
    schedule_url: 'https://www.iroke-wife.com/schedule/',
    image_url: null,
    prefecture: '東京都', area: '上野'
  };
  if (!DRY_RUN) await registerShop(shop);
  else console.log(`[DRY] ${shop.name}`);

  const html = await fetchHtml('https://www.iroke-wife.com/cast/', 'https://www.iroke-wife.com/');
  const $ = cheerio.load(html);
  const therapists = [];
  const seen = new Set();
  $('img').each((_, el) => {
    const src = $(el).attr('src') || '';
    const alt = ($(el).attr('alt') || '').trim();
    if (alt && /[ぁ-んァ-ヾ一-龯]/.test(alt) && alt.length < 20 && src.includes('/data/girl/') && !seen.has(alt)) {
      seen.add(alt);
      const hash = src.match(/\/([a-f0-9]{32})\.jpg/)?.[1];
      therapists.push({ name: alt, src, key: `iroke_${hash || seen.size}` });
    }
  });

  console.log(`取得: ${therapists.length}名`);
  if (!DRY_RUN) await registerTherapists(shop.id, therapists, 'https://www.iroke-wife.com/');
  else therapists.slice(0,5).forEach(t => console.log(`[DRY] ${t.name}`));
}

// ===== らんぷ 三ノ輪店 =====
async function processRanpuMinowa() {
  console.log('\n=== らんぷ 三ノ輪店 ===');
  const shop = {
    id: 'tokyo_taito_minowa_ranpu',
    name: 'らんぷ 三ノ輪店',
    website_url: 'https://minowa.senju-lamp.com/',
    schedule_url: 'https://minowa.senju-lamp.com/schedule.html',
    image_url: null,
    prefecture: '東京都', area: '三ノ輪'
  };
  if (!DRY_RUN) await registerShop(shop);
  else console.log(`[DRY] ${shop.name}`);

  // Chrome経由で取得済みデータ
  const therapists = [
    ['黒川ひかり', 'https://files.re-db.com/file/68bd869f66893.jpg', 'ranpu_minowa_68bd869f66893'],
    ['花咲めい', 'https://files.re-db.com/file/68e78b0fba236.jpg', 'ranpu_minowa_68e78b0fba236'],
    ['浜辺せな', 'https://files.re-db.com/file/68f9d5847b8fe.jpg', 'ranpu_minowa_68f9d5847b8fe'],
    ['山本さら', 'https://files.re-db.com/file/694ba0a79caf6.jpg', 'ranpu_minowa_694ba0a79caf6'],
    ['青田れな', 'https://files.re-db.com/file/68de945717728.jpg', 'ranpu_minowa_68de945717728'],
    ['長浜りか', 'https://files.re-db.com/file/68e66d18dc4a4.jpg', 'ranpu_minowa_68e66d18dc4a4'],
    ['伊藤ありさ', 'https://files.re-db.com/file/68ef1c1a609b0.jpg', 'ranpu_minowa_68ef1c1a609b0'],
    ['水瀬ひなこ', 'https://files.re-db.com/file/68e5155f30787.jpg', 'ranpu_minowa_68e5155f30787'],
    ['山下まい', 'https://files.re-db.com/file/69aff92a38bd8.jpg', 'ranpu_minowa_69aff92a38bd8'],
    ['土井ゆな', 'https://files.re-db.com/file/68de8e85bd6da.jpg', 'ranpu_minowa_68de8e85bd6da'],
    ['新田えり', 'https://files.re-db.com/file/68de915d3de72.jpg', 'ranpu_minowa_68de915d3de72'],
    ['宮本さき', 'https://files.re-db.com/file/68de95c136d9e.jpg', 'ranpu_minowa_68de95c136d9e'],
    ['雪平ひまり', 'https://files.re-db.com/file/68de9f2cbdbf0.jpg', 'ranpu_minowa_68de9f2cbdbf0'],
    ['松本もも', 'https://files.re-db.com/file/68de9f173a502.jpg', 'ranpu_minowa_68de9f173a502'],
    ['蒼井なつみ', 'https://files.re-db.com/file/68de9f49abb4b.jpg', 'ranpu_minowa_68de9f49abb4b'],
  ].map(([name, src, key]) => ({ name, src, key }));

  console.log(`登録: ${therapists.length}名`);
  if (!DRY_RUN) await registerTherapists(shop.id, therapists, 'https://minowa.senju-lamp.com/');
  else therapists.forEach(t => process.stdout.write('+'));
}

// ===== Luxuary ラグジュアリー 上野店 =====
async function processLuxuaryGP() {
  console.log('\n=== Luxuary ラグジュアリー 上野店 ===');
  const shop = {
    id: 'tokyo_taito_ueno_luxuary',
    name: 'Luxuary ラグジュアリー (上野店)',
    website_url: 'https://luxury-gp.com/',
    schedule_url: 'https://luxury-gp.com/schedule/',
    image_url: null,
    prefecture: '東京都', area: '上野'
  };
  if (!DRY_RUN) await registerShop(shop);
  else console.log(`[DRY] ${shop.name}`);

  // Chrome経由で取得済みデータ
  const therapists = [
    ['うらら', 'https://luxury-gp.com/wp-content/uploads/2026/05/IMG_4951-scaled.jpeg'],
    ['すい', 'https://luxury-gp.com/wp-content/uploads/2026/05/IMG_4523.jpeg'],
    ['ゆきは', 'https://luxury-gp.com/wp-content/uploads/2026/02/IMG_1884.jpeg'],
    ['うさ', 'https://luxury-gp.com/wp-content/uploads/2026/04/IMG_3355.jpeg'],
    ['せりな', 'https://luxury-gp.com/wp-content/uploads/2026/03/IMG_2644-scaled.jpeg'],
    ['ゆり', 'https://luxury-gp.com/wp-content/uploads/2025/04/IMG_3165.jpeg'],
    ['えな', 'https://luxury-gp.com/wp-content/uploads/2025/04/IMG_3080.jpeg'],
    ['あいり', 'https://luxury-gp.com/wp-content/uploads/2025/09/IMG_4793.jpeg'],
    ['ちな', 'https://luxury-gp.com/wp-content/uploads/2026/01/IMG_0616.jpeg'],
    ['るま', 'https://luxury-gp.com/wp-content/uploads/2026/01/IMG_0971.jpeg'],
    ['このは', 'https://luxury-gp.com/wp-content/uploads/2025/12/IMG_7773.jpeg'],
    ['つきの', 'https://luxury-gp.com/wp-content/uploads/2025/04/IMG_3266.jpeg'],
    ['ひなの', 'https://luxury-gp.com/wp-content/uploads/2025/04/IMG_3413.jpeg'],
    ['すず', 'https://luxury-gp.com/wp-content/uploads/2025/12/IMG_9390.jpeg'],
    ['こゆき', 'https://luxury-gp.com/wp-content/uploads/2025/07/IMG_4031.jpeg'],
    ['ゆゆ', 'https://luxury-gp.com/wp-content/uploads/2024/10/IMG_1082.jpeg'],
    ['まいな', 'https://luxury-gp.com/wp-content/uploads/2025/01/IMG_2385.jpeg'],
    ['ふう', 'https://luxury-gp.com/wp-content/uploads/2025/04/IMG_3421.jpeg'],
    ['ありす', 'https://luxury-gp.com/wp-content/uploads/2025/03/IMG_2901.jpeg'],
    ['ゆあ', 'https://luxury-gp.com/wp-content/uploads/2026/02/IMG_1442.jpeg'],
  ].map(([name, src]) => {
    const basename = src.split('/').pop().replace(/\.[^.]+$/, '').replace(/-scaled$/, '').slice(0, 20);
    return { name, src, key: `luxuarygp_${basename}` };
  });

  console.log(`登録: ${therapists.length}名`);
  if (!DRY_RUN) await registerTherapists(shop.id, therapists, 'https://luxury-gp.com/');
  else therapists.forEach(t => process.stdout.write('+'));
}

// ===== メイン =====
async function main() {
  console.log(`=== 上野エリア 5店舗 登録 (DRY_RUN=${DRY_RUN}) ===`);

  const run = (name) => !shopArg || shopArg === name;

  if (run('luxury'))   await processTOKYOLUXURY();
  if (run('grace'))    await processGraceTokyo();
  if (run('iroke'))    await processIrokeWife();
  if (run('ranpu'))    await processRanpuMinowa();
  if (run('luxuarygp')) await processLuxuaryGP();

  console.log('\n=== 全完了 ===');
}
main().catch(console.error);
