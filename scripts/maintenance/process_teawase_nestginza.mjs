/**
 * テアワセ（浜松町）＋ NEST GINZA（銀座）登録スクリプト
 * 実行: node scripts/maintenance/process_teawase_nestginza.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const isDryRun = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));
const BUCKET = 'therapist-images';

// ─── 店舗データ ──────────────────────────────────────────────────────────────

const SHOPS = [
  {
    id: 'tokyo_minato_hamamatsucho_teawase',
    name: '紳士の癒し処 テアワセ',
    website_url: 'https://teawase.tokyo',
    schedule_url: 'https://eslove.jp/shop/35801/schedule',
    image_url: 'https://teawase.tokyo/wp-content/uploads/2026/04/20260418logo.png',
    phone_number: '070-5466-5347',
    business_hours: '12:00〜24:00',
    price_system: null,
    raw_data: { prefecture: '東京都', city: '港区', area: '浜松町' },
  },
  {
    id: 'tokyo_chuo_ginza_nest_ginza',
    name: 'NEST GINZA (ネスト銀座)',
    website_url: 'https://nest-ginza.tokyo',
    schedule_url: 'https://eslove.jp/shop/37587',
    image_url: 'https://nest-ginza.tokyo/ogp.jpg',
    phone_number: '080-7144-5786',
    business_hours: '11:00〜翌0:00',
    price_system: '90分 ¥19,000 / 120分 ¥23,000 / 150分 ¥29,000 ※指名料1,000円',
    raw_data: { prefecture: '東京都', city: '中央区', area: '銀座', address: '東京都中央区銀座3丁目11-16' },
  },
];

// ─── テアワセ セラピスト（個別ページURLから画像取得） ─────────────────────

const TEAWASE_THERAPISTS = [
  { name: '水瀬りこ',   slug: '水瀬りこ' },
  { name: '柚木いろは', slug: '柚木いろは' },
  { name: '白坂すみれ', slug: '白坂すみれ' },
  { name: '斉藤まゆか', slug: '斉藤まゆか' },
  { name: '桐生 玲',   slug: '桐生-玲' },
  { name: 'ナターシャ', slug: 'ナターシャ' },
  { name: '桃田つばさ', slug: '桃田つばさ' },
  { name: '海堂ふみ',  slug: '海堂ふみ' },
  { name: '山崎えま',  slug: '山崎えま' },
  { name: 'ひまり',    slug: 'ひまり' },
  { name: '美咲',      slug: '01' },
  { name: 'ゆかり',    slug: '03' },
];

// ─── NEST GINZA セラピスト（画像URL確定済み） ─────────────────────────────

const NEST_THERAPISTS = [
  { name: '高田さら',    age: 39, img: 'https://nest-ginza.tokyo/img/sara.jpg' },
  { name: '白石まゆ',    age: 39, img: 'https://nest-ginza.tokyo/img/mayu.jpg' },
  { name: '本田りん',    age: 37, img: 'https://nest-ginza.tokyo/img/rin.jpg' },
  { name: '小坂ゆかり',  age: 29, img: 'https://nest-ginza.tokyo/img/yukari.jpg' },
  { name: '青葉はるな',  age: 37, img: 'https://nest-ginza.tokyo/img/haruna.jpg' },
  { name: '泉 さくら',   age: 36, img: 'https://nest-ginza.tokyo/img/sakura.jpg' },
  { name: '柊ゆら',     age: 32, img: 'https://nest-ginza.tokyo/img/yura.jpg' },
  { name: '田中 ひかり', age: 40, img: 'https://nest-ginza.tokyo/img/hikari.jpg' },
  { name: '白川 みはる', age: 38, img: 'https://nest-ginza.tokyo/img/shirakawa.jpg' },
  { name: '葉山 さやか', age: 36, img: 'https://nest-ginza.tokyo/img/sayaka.jpg' },
  { name: '小春 ことね', age: 35, img: 'https://nest-ginza.tokyo/img/koharu.jpg' },
  { name: '水無月 あおい', age: 45, img: 'https://nest-ginza.tokyo/img/minazuki.jpg' },
  { name: '花村 しずか', age: 42, img: 'https://nest-ginza.tokyo/img/hanamura.jpg' },
];

// ─── ユーティリティ ──────────────────────────────────────────────────────────

async function uploadImage(storagePath, imageUrl, referer) {
  const { data: existing } = await supabase.storage.from(BUCKET).list('', { search: storagePath });
  if (existing?.some(f => f.name === storagePath)) {
    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    return publicUrl;
  }
  const res = await fetch(imageUrl, { headers: { Referer: referer } });
  if (!res.ok) return null;
  const buf = await res.arrayBuffer();
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, buf, {
    contentType: res.headers.get('content-type') || 'image/jpeg',
    upsert: true,
  });
  if (error) { console.error(`  upload error: ${error.message}`); return null; }
  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return publicUrl;
}

async function getTeawaseTherapistImage(slug) {
  const url = `https://teawase.tokyo/therapist/${encodeURIComponent(slug)}/`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const html = await res.text();
  const $ = cheerio.load(html);
  // wp-content/uploads の画像を探す
  const imgSrc = $('img[src*="wp-content/uploads"]').not('[src*="logo"]').not('[src*="favicon"]').first().attr('src');
  return imgSrc || null;
}

async function insertTherapist(shopId, name, imageUrl, rawData = {}) {
  const therapistId = `${shopId}_${name}`;
  const { data: existing } = await supabase.from('therapists').select('id').eq('id', therapistId).single();
  if (existing) {
    process.stdout.write(`  = ${name} (既存)\n`);
    return;
  }
  const { error } = await supabase.from('therapists').insert({
    id: therapistId,
    shop_id: shopId,
    name,
    image_url: imageUrl,
    raw_data: rawData,
  });
  if (error) console.error(`  ! ${name}: ${error.message}`);
  else process.stdout.write(`  + ${name} → ${imageUrl ? '画像あり' : '画像なし'}\n`);
}

// ─── メイン ──────────────────────────────────────────────────────────────────

async function main() {
  console.log(`${isDryRun ? '[DRY-RUN] ' : ''}テアワセ＋NEST GINZA 登録開始\n`);

  // ── 1. 店舗 upsert ──
  for (const shop of SHOPS) {
    console.log(`[SHOP] ${shop.name}`);
    if (!isDryRun) {
      const { error } = await supabase.from('shops').upsert(shop);
      if (error) { console.error('  shop error:', error.message); continue; }
      console.log('  → OK');
    } else {
      console.log('  → (dry-run skip)');
    }
  }

  if (isDryRun) {
    console.log('\n[TEAWASE] 12名:');
    TEAWASE_THERAPISTS.forEach(t => console.log(`  ${t.name}`));
    console.log('\n[NEST GINZA] 13名:');
    NEST_THERAPISTS.forEach(t => console.log(`  ${t.name}(${t.age})`));
    return;
  }

  // ── 2. テアワセ セラピスト ──
  console.log('\n[テアワセ] セラピスト登録');
  for (const t of TEAWASE_THERAPISTS) {
    process.stdout.write(`  ${t.name} 画像取得中...`);
    const imgSrcUrl = await getTeawaseTherapistImage(t.slug);
    let storedUrl = null;
    if (imgSrcUrl) {
      const filename = imgSrcUrl.split('/').pop();
      const storagePath = `teawase_${filename}`;
      storedUrl = await uploadImage(storagePath, imgSrcUrl, 'https://teawase.tokyo/');
      process.stdout.write(storedUrl ? ' OK\n' : ' upload失敗\n');
    } else {
      process.stdout.write(' 画像URL取得失敗\n');
    }
    await insertTherapist('tokyo_minato_hamamatsucho_teawase', t.name, storedUrl, {});
    await new Promise(r => setTimeout(r, 500));
  }

  // ── 3. NEST GINZA セラピスト ──
  console.log('\n[NEST GINZA] セラピスト登録');
  for (const t of NEST_THERAPISTS) {
    process.stdout.write(`  ${t.name}(${t.age}) 画像アップロード中...`);
    const filename = t.img.split('/').pop();
    const storagePath = `nestginza_${filename}`;
    const storedUrl = await uploadImage(storagePath, t.img, 'https://nest-ginza.tokyo/');
    process.stdout.write(storedUrl ? ' OK\n' : ' 失敗\n');
    await insertTherapist('tokyo_chuo_ginza_nest_ginza', t.name, storedUrl, { age: t.age });
    await new Promise(r => setTimeout(r, 300));
  }

  console.log('\n完了');
}

main().catch(console.error);
