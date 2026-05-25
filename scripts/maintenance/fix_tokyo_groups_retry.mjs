/**
 * fix_tokyo_groups_images.mjs 失敗分の再試行
 * 失敗5名: 白百合 響(QUEENS), 長瀬 みずな(CREST), 伊波 ひな/風間 じゅん/小栗 あやな(GRACE)
 * 実行: node scripts/maintenance/fix_tokyo_groups_retry.mjs [--dry-run]
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

async function uploadImage(imageUrl, fileName, referer) {
  try {
    const res = await fetch(imageUrl, {
      headers: { ...UA, Referer: referer },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) { console.log(`  HTTP ${res.status}: ${imageUrl}`); return null; }
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/') || ct.includes('svg')) { console.log(`  Bad content-type: ${ct}`); return null; }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 512) { console.log(`  Too small: ${buf.length} bytes`); return null; }
    const ext = (imageUrl.match(/\.(jpg|jpeg|png|gif|webp)/i)?.[1] || 'jpg').toLowerCase();
    const safeExt = ext === 'jpeg' ? 'jpg' : ext;
    const { error } = await supabase.storage.from(BUCKET)
      .upload(fileName, buf, { contentType: `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}`, upsert: true });
    if (error) { console.log(`  Storage error: ${error.message}`); return null; }
    return supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
  } catch (e) { console.log(`  fetch error: ${e.message}`); return null; }
}

const TARGETS = [
  {
    name: '白百合 響',
    imageUrl: 'https://queens-collection-esthe.com/images/fc1a93e2-bec1-4d26-ba89-94e7ac446463-169x300.jpg',
    shopIds: [
      'tokyo_chiyoda_jimbocho_queens_collection',
      'tokyo_shinjuku_shinjuku_queens_collection',
      'tokyo_shinjuku_shinjuku_sanchome_queens_collection',
      'tokyo_setagaya_meidaimae_queens_collection',
    ],
    prefix: 'queens',
    referer: 'https://queens-collection-esthe.com/',
  },
  {
    name: '長瀬 みずな',
    imageUrl: 'https://crestspa-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/279/7abafd9d-6a13-49d9-bfb1-53235e24bc5a.jpg',
    shopIds: [
      'tokyo_kita_crest_spa_tokyo',
      'tokyo_tachikawa_crest_spa_tokyo',
      'tokyo_kita_akabane_crest',
      'tokyo_musashino_kichijoji_crest',
    ],
    prefix: 'crestspa',
    referer: 'https://crestspa-tokyo.com/',
  },
  {
    name: '伊波 ひな',
    imageUrl: 'https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/112/f269b76c-1176-4d3d-a957-e107c24b05a4.jpg',
    shopIds: ['tokyo_meguro_nakameguro_grace', 'tokyo_meguro_meguro_grace'],
    prefix: 'grace',
    referer: 'http://grace-meguro.com/',
  },
  {
    name: '風間 じゅん',
    imageUrl: 'https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/85/22e57519-95ed-4128-9b56-8e02b050177b.jpg',
    shopIds: ['tokyo_meguro_nakameguro_grace', 'tokyo_meguro_meguro_grace'],
    prefix: 'grace',
    referer: 'http://grace-meguro.com/',
  },
  {
    name: '小栗 あやな',
    imageUrl: 'https://grace-meguro-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/image1/83/3fe49f1f-cd62-4a2d-abf9-f58cb5ad9cbe.jpg',
    shopIds: ['tokyo_meguro_nakameguro_grace', 'tokyo_meguro_meguro_grace'],
    prefix: 'grace',
    referer: 'http://grace-meguro.com/',
  },
];

for (const { name, imageUrl, shopIds, prefix, referer } of TARGETS) {
  console.log(`\n${name}`);
  console.log(`  URL: ${imageUrl.slice(-60)}`);

  if (DRY_RUN) continue;

  const urlBase = imageUrl.split('/').pop().split('?')[0];
  const stem = urlBase.replace(/\.[^.]+$/, '').replace(/[^\w-]/g, '_').slice(0, 50);
  const ext = (urlBase.match(/\.(jpg|jpeg|png|gif|webp)/i)?.[1] || 'jpg').toLowerCase();
  const safeExt = ext === 'jpeg' ? 'jpg' : ext;
  const fileName = `${prefix}_${stem}.${safeExt}`;

  const storageUrl = await uploadImage(imageUrl, fileName, referer);
  if (!storageUrl) { console.log(`  ❌ アップロード失敗`); await sleep(500); continue; }

  for (const shopId of shopIds) {
    const id = `${shopId}_${name}`;
    const { error } = await supabase.from('therapists')
      .update({ image_url: storageUrl })
      .eq('id', id);
    if (error) console.log(`  ❌ DB更新失敗 ${id}: ${error.message}`);
    else console.log(`  ✅ 更新: ${id}`);
  }
  await sleep(200);
}

console.log('\n完了');
