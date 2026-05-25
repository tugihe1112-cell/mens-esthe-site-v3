/**
 * ミセスの子守唄・ミセスムーンR セラピスト写真修正
 * パターン: /wcms/gals/images/{id}/photo_thumb5_000_{date}.jpg
 * 実行: node scripts/maintenance/fix_komoriuta_moonr_images.mjs [--dry-run]
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

// ミセスの子守唄 31名
const KOMORIUTA_DATA = [
  ['眞奈', 'https://mrs-komoriuta.com/wcms/gals/images/260/photo_thumb5_000_260504.jpg'],
  ['凛華', 'https://mrs-komoriuta.com/wcms/gals/images/255/photo_thumb5_000_260429.jpg'],
  ['真緒', 'https://mrs-komoriuta.com/wcms/gals/images/258/photo_thumb5_000_260424.jpg'],
  ['芹那', 'https://mrs-komoriuta.com/wcms/gals/images/247/photo_thumb5_000_260422.jpg'],
  ['桃々', 'https://mrs-komoriuta.com/wcms/gals/images/257/photo_thumb5_000_260419.jpg'],
  ['月美', 'https://mrs-komoriuta.com/wcms/gals/images/256/photo_thumb5_000_260415.jpg'],
  ['奈美', 'https://mrs-komoriuta.com/wcms/gals/images/48/photo_thumb5_001_221108.jpg'],
  ['志保', 'https://mrs-komoriuta.com/wcms/gals/images/135/photo_thumb5_007_241213.jpg'],
  ['真琴', 'https://mrs-komoriuta.com/wcms/gals/images/24/photo_thumb5_006_240816.jpg'],
  ['響', 'https://mrs-komoriuta.com/wcms/gals/images/160/photo_thumb5_006_251121.jpg'],
  ['南', 'https://mrs-komoriuta.com/wcms/gals/images/234/photo_thumb5_001_251112.jpg'],
  ['渉子', 'https://mrs-komoriuta.com/wcms/gals/images/228/photo_thumb5_000_251016.jpg'],
  ['乙葉', 'https://mrs-komoriuta.com/wcms/gals/images/168/photo_thumb5_002_250226.jpg'],
  ['七海', 'https://mrs-komoriuta.com/wcms/gals/images/113/photo_thumb5_010_250319.jpg'],
  ['茉白', 'https://mrs-komoriuta.com/wcms/gals/images/205/photo_thumb5_000_250606.jpg'],
  ['清美', 'https://mrs-komoriuta.com/wcms/gals/images/136/photo_thumb5_001_241213.jpg'],
  ['汐栞', 'https://mrs-komoriuta.com/wcms/gals/images/220/photo_thumb5_000_250822.jpg'],
  ['雫果', 'https://mrs-komoriuta.com/wcms/gals/images/244/photo_thumb5_000_260109.jpg'],
  ['花奈', 'https://mrs-komoriuta.com/wcms/gals/images/232/photo_thumb5_000_251108.jpg'],
  ['良子', 'https://mrs-komoriuta.com/wcms/gals/images/72/photo_thumb5_003_241213.jpg'],
  ['千明', 'https://mrs-komoriuta.com/wcms/gals/images/36/photo_thumb5_004_241213.jpg'],
  ['麗未', 'https://mrs-komoriuta.com/wcms/gals/images/253/photo_thumb5_000_260320.jpg'],
  ['光希', 'https://mrs-komoriuta.com/wcms/gals/images/196/photo_thumb5_000_250505.jpg'],
  ['由美子', 'https://mrs-komoriuta.com/wcms/gals/images/213/photo_thumb5_000_250703.jpg'],
  ['百恵', 'https://mrs-komoriuta.com/wcms/gals/images/57/photo_thumb5_003_241213.jpg'],
  ['果歩', 'https://mrs-komoriuta.com/wcms/gals/images/64/photo_thumb5_007_250825.jpg'],
  ['希望', 'https://mrs-komoriuta.com/wcms/gals/images/254/photo_thumb5_000_260330.jpg'],
  ['柚希', 'https://mrs-komoriuta.com/wcms/gals/images/252/photo_thumb5_000_260311.jpg'],
  ['彩芽', 'https://mrs-komoriuta.com/wcms/gals/images/250/photo_thumb5_000_260227.jpg'],
  ['美加', 'https://mrs-komoriuta.com/wcms/gals/images/123/photo_thumb5_014_241214.jpg'],
  ['美晴', 'https://mrs-komoriuta.com/wcms/gals/images/251/photo_thumb5_000_260313.jpg'],
];

// ミセスムーンR 11名
const MOONR_DATA = [
  ['きらら', 'https://www.moonr.jp/wcms/gals/images/1708/photo_003_260510.jpg'],
  ['はるか', 'https://www.moonr.jp/wcms/gals/images/1731/photo_002_260506.jpg'],
  ['れいな', 'https://www.moonr.jp/wcms/gals/images/1740/photo_004_260501.jpg'],
  ['さな', 'https://www.moonr.jp/wcms/gals/images/1713/photo_000_260426.jpg'],
  ['るい', 'https://www.moonr.jp/wcms/gals/images/1690/photo_000_260422.jpg'],
  ['はるき', 'https://www.moonr.jp/wcms/gals/images/1736/photo_001_260407.jpg'],
  ['のあ', 'https://www.moonr.jp/wcms/gals/images/1734/photo_006_260428.jpg'],
  ['ゆゆ', 'https://www.moonr.jp/wcms/gals/images/1735/photo_000_260406.jpg'],
  ['はじめ', 'https://www.moonr.jp/wcms/gals/images/1721/photo_006_260227.jpg'],
  ['ことの', 'https://www.moonr.jp/wcms/gals/images/897/photo_020_230422.jpg'],
  ['あけみ', 'https://www.moonr.jp/wcms/gals/images/656/photo_027_260309.jpg'],
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

async function processShop(domainPart, data, prefix, referer) {
  const { data: shops } = await supabase.from('shops').select('id, name').ilike('website_url', `%${domainPart}%`);
  if (!shops || shops.length === 0) { console.log(`${domainPart} の店舗が見つかりません`); return; }
  console.log(`\n対象店舗: ${shops.map(s => s.id + ' ' + s.name).join(', ')}`);
  const shopIds = shops.map(s => s.id);
  let updated = 0, skipped = 0, notFound = 0, failed = 0;

  for (const [name, imageUrl] of data) {
    const { data: therapists } = await supabase.from('therapists').select('id, shop_id, image_url').in('shop_id', shopIds).eq('name', name);
    if (!therapists || therapists.length === 0) { process.stdout.write('?'); notFound++; continue; }
    const nullOnes = therapists.filter(t => !t.image_url);
    if (nullOnes.length === 0) { process.stdout.write('='); skipped++; continue; }
    const galsId = imageUrl.match(/\/images\/(\d+)\//)?.[1] || name;
    const fileName = `${prefix}_${galsId}.jpg`;
    const storageUrl = await uploadImage(imageUrl, fileName, referer);
    await sleep(100);
    for (const t of nullOnes) {
      const { error } = await supabase.from('therapists').update({ image_url: storageUrl ?? null }).eq('id', t.id);
      if (error) { console.log(`\n❌ ${name}: ${error.message}`); failed++; }
      else { process.stdout.write(storageUrl ? '+' : 'n'); updated++; }
    }
    await sleep(80);
  }
  console.log(`\n更新 ${updated}件 / スキップ ${skipped}件 / 見つからず ${notFound}件 / 失敗 ${failed}件`);
}

if (DRY_RUN) {
  console.log(`【ミセスの子守唄】 ${KOMORIUTA_DATA.length}名`);
  KOMORIUTA_DATA.slice(0, 3).forEach(([n, u]) => console.log(`  ${n} → ${u.split('/').slice(-2).join('/')}`));
  console.log(`\n【ミセスムーンR】 ${MOONR_DATA.length}名`);
  MOONR_DATA.slice(0, 3).forEach(([n, u]) => console.log(`  ${n} → ${u.split('/').slice(-2).join('/')}`));
  process.exit(0);
}

console.log('=== ミセスの子守唄 ===');
await processShop('komoriuta', KOMORIUTA_DATA, 'komoriuta', 'https://mrs-komoriuta.com/');

console.log('\n=== ミセスムーンR ===');
await processShop('moonr', MOONR_DATA, 'moonr', 'https://www.moonr.jp/');

console.log('\n完了');
