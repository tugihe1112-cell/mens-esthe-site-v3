/**
 * 竜宮城 残り4店舗の画像修正
 * - Twitter SVG アイコン → null
 * - wp-content 画像 → 人形町店の Storage URL を流用 or 新規アップ
 * 実行: node scripts/maintenance/fix_ryugujo_all_shops.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

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
const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (DRY_RUN) console.log('[DRY RUN]\n');

// 人形町店の名前→Storage URL マップを作成
const { data: ningyochoTherapists } = await supabase
  .from('therapists').select('name, image_url').eq('shop_id', NINGYOCHO_ID);
const storageMap = new Map();
for (const t of (ningyochoTherapists || [])) {
  if (t.image_url?.includes('supabase')) storageMap.set(t.name, t.image_url);
}
console.log(`人形町店 Storage マップ: ${storageMap.size}名`);

async function uploadImage(imageUrl, therapistId) {
  try {
    const res = await fetch(imageUrl, {
      headers: { ...UA, 'Referer': 'https://esthe-ryugujo.com/' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/') || ct.includes('svg')) return null; // SVGは除外
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

let totalUpdated = 0, totalFailed = 0;

for (const shopId of TARGET_SHOPS) {
  console.log(`\n=== ${shopId} ===`);

  const { data: therapists } = await supabase
    .from('therapists').select('id, name, image_url').eq('shop_id', shopId);

  let updated = 0, failed = 0, skipped = 0;

  for (const t of (therapists || [])) {
    const isTwitter = t.image_url?.includes('ico_twitter') || t.image_url?.includes('.svg');
    const isWpContent = t.image_url?.includes('wp-content/uploads');

    if (isTwitter) {
      // Twitter アイコン → null
      if (DRY_RUN) { console.log(`  [Twitter→null] ${t.name}`); skipped++; continue; }
      const { error } = await supabase.from('therapists').update({ image_url: null }).eq('id', t.id);
      if (error) { process.stdout.write('x'); failed++; }
      else { process.stdout.write('0'); updated++; }
    } else if (isWpContent) {
      // wp-content → 人形町店の Storage URL を流用、なければ新規アップ
      const existingUrl = storageMap.get(t.name);
      if (existingUrl) {
        if (DRY_RUN) { console.log(`  [流用] ${t.name}`); skipped++; continue; }
        const { error } = await supabase.from('therapists').update({ image_url: existingUrl }).eq('id', t.id);
        if (error) { process.stdout.write('x'); failed++; }
        else { process.stdout.write('.'); updated++; }
      } else {
        if (DRY_RUN) { console.log(`  [新規アップ] ${t.name} → ${t.image_url}`); skipped++; continue; }
        const newUrl = await uploadImage(t.image_url, t.id);
        const { error } = await supabase.from('therapists').update({ image_url: newUrl ?? null }).eq('id', t.id);
        if (error) { process.stdout.write('x'); failed++; }
        else { process.stdout.write(newUrl ? '+' : '0'); updated++; }
        await sleep(100);
      }
    } else {
      skipped++;
    }
  }

  if (!DRY_RUN) console.log(`\n  更新: ${updated}名 / 失敗: ${failed}名`);
  else console.log(`  対象: ${skipped}名`);
  totalUpdated += updated;
  totalFailed += failed;
}

if (!DRY_RUN) console.log(`\n=== 全体完了: 更新 ${totalUpdated}名 / 失敗 ${totalFailed}名 ===`);
