/**
 * UraSanEsu（北参道）・ShiMoEsu（下北沢）・HaTaEsu（幡ヶ谷） セラピスト写真修正
 * パターン: urasanesu.com/therapist_img/{id}-1.jpg（3店舗共通CDN）
 * 実行: node scripts/maintenance/fix_urasanesu_hataesu_images.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const BUCKET = 'therapist-images';
const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (DRY_RUN) console.log('[DRY RUN]\n');

// UraSanEsu 北参道: 現在6名のみ掲載
const URA_DATA = [
  ['桜木ゆり', 'https://urasanesu.com/therapist_img/345-1.jpg'],
  ['柚木みお', 'https://urasanesu.com/therapist_img/359-1.jpg'],
  ['広瀬ゆず', 'https://urasanesu.com/therapist_img/344-1.jpg'],
  ['泉ねね', 'https://urasanesu.com/therapist_img/109-1.jpg'],
  ['海堂ふみ', 'https://urasanesu.com/therapist_img/350-1.jpg'],
  ['月野れい', 'https://urasanesu.com/therapist_img/378-1.jpg'],
];

// HaTaEsu 幡ヶ谷: 14名
const HATA_DATA = [
  ['西野みつき', 'https://urasanesu.com/therapist_img/379-1.jpg'],
  ['柏木のぞみ', 'https://urasanesu.com/therapist_img/376-1.jpg'],
  ['伊藤なこ', 'https://urasanesu.com/therapist_img/164-1.jpg'],
  ['望月りな', 'https://urasanesu.com/therapist_img/352-1.jpg'],
  ['工藤ゆうか', 'https://urasanesu.com/therapist_img/331-1.jpg'],
  ['桜木ゆり', 'https://urasanesu.com/therapist_img/345-1.jpg'],
  ['柚木みお', 'https://urasanesu.com/therapist_img/359-1.jpg'],
  ['市川あかり', 'https://urasanesu.com/therapist_img/369-1.jpg'],
  ['川村もか', 'https://urasanesu.com/therapist_img/360-1.jpg'],
  ['広瀬ゆず', 'https://urasanesu.com/therapist_img/344-1.jpg'],
  ['泉ねね', 'https://urasanesu.com/therapist_img/109-1.jpg'],
  ['海堂ふみ', 'https://urasanesu.com/therapist_img/350-1.jpg'],
  ['月野れい', 'https://urasanesu.com/therapist_img/378-1.jpg'],
  ['清水りりか', 'https://urasanesu.com/therapist_img/368-1.jpg'],
];

async function uploadImage(imageUrl, fileName, referer) {
  try {
    const res = await fetch(imageUrl, {
      headers: { ...UA, Referer: referer },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) { console.log(`\n  HTTP ${res.status}: ${imageUrl.slice(-50)}`); return null; }
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 512) return null;
    const { error } = await supabase.storage.from(BUCKET)
      .upload(fileName, buf, { contentType: 'image/jpeg', upsert: true });
    if (error) { console.log(`\n  Storage: ${error.message}`); return null; }
    return supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
  } catch (e) { console.log(`\n  fetch error: ${e.message}`); return null; }
}

async function processShop(shopDomain, data, prefix, referer) {
  const { data: shops } = await supabase.from('shops')
    .select('id, name')
    .ilike('website_url', `%${shopDomain}%`);

  if (!shops || shops.length === 0) {
    console.log(`${shopDomain} の店舗が見つかりません`);
    return;
  }
  console.log(`\n対象店舗: ${shops.map(s => s.id + ' ' + s.name).join(', ')}`);
  const shopIds = shops.map(s => s.id);

  let updated = 0, skipped = 0, notFound = 0, failed = 0;

  for (const [name, imageUrl] of data) {
    const { data: therapists } = await supabase.from('therapists')
      .select('id, shop_id, image_url')
      .in('shop_id', shopIds)
      .eq('name', name);

    if (!therapists || therapists.length === 0) {
      process.stdout.write('?'); notFound++; continue;
    }

    const nullOnes = therapists.filter(t => !t.image_url);
    if (nullOnes.length === 0) { process.stdout.write('='); skipped++; continue; }

    const imgId = imageUrl.match(/(\d+)-1\.jpg/)?.[1] || name;
    const fileName = `${prefix}_${imgId}.jpg`;
    const storageUrl = await uploadImage(imageUrl, fileName, referer);
    await sleep(100);

    for (const t of nullOnes) {
      const { error } = await supabase.from('therapists')
        .update({ image_url: storageUrl ?? null })
        .eq('id', t.id);
      if (error) { console.log(`\n❌ ${name}: ${error.message}`); failed++; }
      else { process.stdout.write(storageUrl ? '+' : 'n'); updated++; }
    }
    await sleep(80);
  }
  console.log(`\n更新 ${updated}件 / スキップ ${skipped}件 / 見つからず ${notFound}件 / 失敗 ${failed}件`);
}

// ShiMoEsu 下北沢: 9名
const SHIMO_DATA = [
  ['西野みつき', 'https://urasanesu.com/therapist_img/379-1.jpg'],
  ['柏木のぞみ', 'https://urasanesu.com/therapist_img/376-1.jpg'],
  ['望月りな', 'https://urasanesu.com/therapist_img/352-1.jpg'],
  ['市川あかり', 'https://urasanesu.com/therapist_img/369-1.jpg'],
  ['川村もか', 'https://urasanesu.com/therapist_img/360-1.jpg'],
  ['広瀬ゆず', 'https://urasanesu.com/therapist_img/344-1.jpg'],
  ['海堂ふみ', 'https://urasanesu.com/therapist_img/350-1.jpg'],
  ['月野れい', 'https://urasanesu.com/therapist_img/378-1.jpg'],
  ['斎藤ひかる', 'https://urasanesu.com/therapist_img/363-1.jpg'],
];

if (DRY_RUN) {
  console.log(`【UraSanEsu】 ${URA_DATA.length}名`);
  URA_DATA.forEach(([n, u]) => console.log(`  ${n} → ${u}`));
  console.log(`\n【ShiMoEsu】 ${SHIMO_DATA.length}名`);
  SHIMO_DATA.forEach(([n, u]) => console.log(`  ${n} → ${u}`));
  console.log(`\n【HaTaEsu】 ${HATA_DATA.length}名`);
  HATA_DATA.forEach(([n, u]) => console.log(`  ${n} → ${u}`));
  process.exit(0);
}

console.log('=== UraSanEsu 北参道 ===');
await processShop('urasanesu.com', URA_DATA, 'urasanesu', 'https://urasanesu.com/');

console.log('\n=== ShiMoEsu 下北沢 ===');
await processShop('shimoesu.com', SHIMO_DATA, 'shimoesu', 'https://shimoesu.com/');

console.log('\n=== HaTaEsu 幡ヶ谷 ===');
await processShop('hataesu.com', HATA_DATA, 'hataesu', 'https://hataesu.com/');

console.log('\n完了');
