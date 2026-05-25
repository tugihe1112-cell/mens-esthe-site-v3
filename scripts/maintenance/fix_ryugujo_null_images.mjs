/**
 * 竜宮城 image_url = null のセラピストを修正
 * 1. 人形町店の Storage URL マップから流用
 * 2. なければキャストページから実写真URLを取得してアップロード
 * 実行: node scripts/maintenance/fix_ryugujo_null_images.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const BUCKET = 'therapist-images';
const NINGYOCHO_ID = 'tokyo_chuo_ningyocho_ryugujo';
const TARGET_SHOPS = [
  'tokyo_chuo_ginza_ryugujo',
  'shizuoka_numazu_ryugujo',
  'tokyo_koto_monzennakacho_ryugujo',
  'tokyo_ota_kamata_ryugujo',
];
const BASE = 'https://esthe-ryugujo.com';
const UA = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Referer': 'https://esthe-ryugujo.com/',
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (DRY_RUN) console.log('[DRY RUN]\n');

// 人形町店の Storage URL マップ
const { data: ningyocho } = await supabase.from('therapists').select('name, image_url').eq('shop_id', NINGYOCHO_ID);
const storageMap = new Map();
for (const t of (ningyocho || [])) {
  if (t.image_url?.includes('supabase')) storageMap.set(t.name, t.image_url);
}
console.log(`人形町店 Storage マップ: ${storageMap.size}名\n`);

// キャストページをスクレイプ（.photo > a > img で正確に取得）
console.log('キャストページ取得中...');
const res = await fetch(`${BASE}/cast/`, { headers: UA, signal: AbortSignal.timeout(15000) });
const html = await res.text();
const $ = cheerio.load(html);

const scrapeMap = new Map(); // name → actual photo URL
$('li.therapist-box').each((_, li) => {
  const img = $(li).find('.photo > a > img');
  const name = img.attr('alt')?.trim();
  let src = img.attr('src') || '';
  if (!name || src.includes('.svg') || src.includes('twitter')) return;
  if (!src.startsWith('http')) src = `${BASE}${src}`;
  scrapeMap.set(name, src);
});
console.log(`スクレイプ取得: ${scrapeMap.size}名\n`);

async function uploadImage(imageUrl, therapistId) {
  try {
    const res = await fetch(imageUrl, { headers: UA, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/') || ct.includes('svg')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 512) return null;
    const ext = (imageUrl.match(/\.(jpg|jpeg|png|gif|webp)/i)?.[1] || 'jpg').toLowerCase();
    const safeExt = ext === 'jpeg' ? 'jpg' : ext;
    const fileName = `${therapistId.replace(/[^\w-]/g, '_')}.${safeExt}`;
    const { error } = await supabase.storage.from(BUCKET)
      .upload(fileName, buf, { contentType: `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}`, upsert: true });
    if (error) return null;
    return supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
  } catch { return null; }
}

let totalFixed = 0, totalSkipped = 0;

for (const shopId of TARGET_SHOPS) {
  const { data: nullTherapists } = await supabase
    .from('therapists').select('id, name, image_url')
    .eq('shop_id', shopId).is('image_url', null);

  if (!nullTherapists?.length) { console.log(`${shopId}: null なし`); continue; }
  console.log(`${shopId}: ${nullTherapists.length}名 null`);

  for (const t of nullTherapists) {
    // 1. 人形町店のStorage URLを流用
    const storageUrl = storageMap.get(t.name);
    if (storageUrl) {
      if (DRY_RUN) { console.log(`  [流用] ${t.name}`); totalFixed++; continue; }
      await supabase.from('therapists').update({ image_url: storageUrl }).eq('id', t.id);
      process.stdout.write('.');
      totalFixed++;
      continue;
    }

    // 2. スクレイプデータから取得してアップロード
    const srcUrl = scrapeMap.get(t.name);
    if (srcUrl) {
      if (DRY_RUN) { console.log(`  [新規アップ] ${t.name} → ${srcUrl}`); totalFixed++; continue; }
      const newUrl = await uploadImage(srcUrl, t.id);
      await supabase.from('therapists').update({ image_url: newUrl ?? null }).eq('id', t.id);
      process.stdout.write(newUrl ? '+' : '?');
      totalFixed++;
      await sleep(100);
      continue;
    }

    // 3. どこにも見つからない → スキップ
    if (DRY_RUN) console.log(`  [不明] ${t.name}`);
    totalSkipped++;
  }
  if (!DRY_RUN) console.log();
}

console.log(`\n完了: 修正 ${totalFixed}名 / 不明 ${totalSkipped}名`);
