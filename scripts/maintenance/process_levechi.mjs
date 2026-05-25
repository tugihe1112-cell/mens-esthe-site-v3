/**
 * 千葉 超レベチなエステ24 セラピスト登録
 * /therapist/ ページ: estama.jp CDN, alt=名前
 * 成田・東金の2店舗に同じキャストを登録
 * 実行: node scripts/maintenance/process_levechi.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const SHOP_IDS = ['chiba_narita_levechi_esthe', 'chiba_togane_levechi_esthe'];
const BUCKET = 'therapist-images';
const UA = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Referer': 'https://tokyo242424.com/',
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (DRY_RUN) console.log('[DRY RUN]\n');

const isNoise = (name) => {
  if (!name || name.length === 0) return true;
  if (name.length > 15) return true;
  if (/エステ|メンズ|成田|東金|高崎|中野|ルーム|求人|予約|ランキング/i.test(name)) return true;
  return false;
};

async function uploadImage(imageUrl, fileName) {
  try {
    const res = await fetch(imageUrl, { headers: UA, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/') || ct.includes('svg')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 512) return null;
    const ext = (imageUrl.match(/\.(jpg|jpeg|png|gif|webp)/i)?.[1] || 'jpg').toLowerCase();
    const safeExt = ext === 'jpeg' ? 'jpg' : ext;
    const { error } = await supabase.storage.from(BUCKET)
      .upload(fileName, buf, { contentType: `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}`, upsert: true });
    if (error) return null;
    return supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
  } catch { return null; }
}

// スクレイプ
console.log('/therapist/ 取得中...');
const res = await fetch('https://tokyo242424.com/therapist/', { headers: UA, signal: AbortSignal.timeout(15000) });
const html = await res.text();
const $ = cheerio.load(html);

// cast/main パスの画像から名前と画像URLを抽出（重複排除）
const therapistMap = new Map(); // name → imageUrl
$('img[src*="cast/main"]').each((_, el) => {
  const name = ($(el).attr('alt') || '').trim();
  let src = $(el).attr('src') || '';
  if (isNoise(name)) return;
  if (!therapistMap.has(name)) therapistMap.set(name, src);
});

console.log(`取得: ${therapistMap.size}名`);
if (DRY_RUN) {
  for (const [name, url] of therapistMap) console.log(`  ${name} → ${url.slice(0, 80)}`);
}

// 各店舗に登録
for (const shopId of SHOP_IDS) {
  console.log(`\n=== ${shopId} ===`);
  if (DRY_RUN) { console.log(`  ${therapistMap.size}名 挿入予定`); continue; }

  let inserted = 0, skipped = 0, failed = 0;

  for (const [name, imageUrl] of therapistMap) {
    const id = `${shopId}_${name}`;
    const { data: existing } = await supabase.from('therapists').select('id').eq('id', id).single();
    if (existing) { process.stdout.write('='); skipped++; continue; }

    // ファイル名: estama CDN のパスから一意キーを取得
    const imgKey = imageUrl.match(/cast\/main\/[^/]+\/([^/?]+)/)?.[1] || name;
    const ext = (imageUrl.match(/\.(jpg|jpeg|png|webp)/i)?.[1] || 'jpg').toLowerCase();
    const safeExt = ext === 'jpeg' ? 'jpg' : ext;
    const fileName = `levechi_${imgKey.replace(/[^\w-]/g, '_')}.${safeExt}`;

    const storageUrl = await uploadImage(imageUrl, fileName);
    await sleep(80);

    const { error } = await supabase.from('therapists').insert({
      id,
      shop_id: shopId,
      name,
      image_url: storageUrl ?? imageUrl,
    });

    if (error) { console.log(`\n❌ ${name}: ${error.message}`); failed++; }
    else { process.stdout.write(storageUrl ? '+' : '.'); inserted++; }
    await sleep(80);
  }

  if (!DRY_RUN) console.log(`\n  挿入 ${inserted}名 / スキップ ${skipped}名 / 失敗 ${failed}名`);
}

console.log('\n完了');
