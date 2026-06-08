/**
 * 広島人妻さん セラピスト登録 (広島2位)
 * 11名 / LEON SPA パターン /photos/{id}/raw_{id}.jpeg
 * 実行: node scripts/maintenance/process_hitozumasan_hiroshima.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const DRY_RUN = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = k => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
const BASE = 'https://hiroshima-hitozumasan.com';
const SHOP_ID = 'hiroshima_hiroshima_hitozuma_san';

const THERAPISTS = [
  { name: '今田夫人',       id: 35 },
  { name: '玉木夫人',       id: 46 },
  { name: '林 夫人',        id: 47 },
  { name: '青山夫人',       id: 20 },
  { name: '和田夫人',       id: 40 },
  { name: '大谷夫人',       id: 42 },
  { name: 'しらゆり夫人',   id: 25 },
  { name: '白井夫人',       id: 39 },
  { name: '菊池夫人',       id: 43 },
  { name: '愛川夫人',       id: 15 },
  { name: '星野夫人',       id: 14 },
];

async function uploadImage(photoId) {
  const storageKey = `hitozumasan_hiroshima_photo_${photoId}.jpeg`;
  const imgUrl = `${BASE}/photos/${photoId}/raw_${photoId}.jpeg`;
  try {
    const res = await fetch(imgUrl, {
      headers: { 'User-Agent': UA, 'Referer': BASE + '/' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) { console.log(`  ✗ 画像取得失敗 id=${photoId} (${res.status})`); return null; }
    const buf = Buffer.from(await res.arrayBuffer());
    const { error } = await supabase.storage.from('therapist-images').upload(storageKey, buf, {
      contentType: 'image/jpeg', upsert: true,
    });
    if (error) { console.log(`  ✗ Storage失敗 id=${photoId}: ${error.message}`); return null; }
    return supabase.storage.from('therapist-images').getPublicUrl(storageKey).data.publicUrl;
  } catch (e) { console.log(`  ✗ エラー id=${photoId}: ${e.message}`); return null; }
}

const { data: shopData } = await supabase.from('shops').select('id,name').eq('id', SHOP_ID);
if (!shopData?.length) { console.error(`${SHOP_ID} not found in DB`); process.exit(1); }
console.log(`shop: ${shopData[0].name} (${SHOP_ID})`);

const { count } = await supabase.from('therapists').select('id', { count: 'exact' }).eq('shop_id', SHOP_ID);
console.log(`既存: ${count}件\n`);
if (count > 0 && !process.argv.includes('--force')) { console.log('既登録あり。--force で再実行'); process.exit(0); }

if (DRY_RUN) {
  THERAPISTS.forEach(t => console.log(`  [dry] ${t.name} <- ${BASE}/photos/${t.id}/raw_${t.id}.jpeg`));
  console.log(`\n(dry-run) 計 ${THERAPISTS.length}名`);
  process.exit(0);
}

let added = 0, failed = 0;
for (const t of THERAPISTS) {
  const imageUrl = await uploadImage(t.id);
  const { error } = await supabase.from('therapists').insert({
    id: `${SHOP_ID}_${t.name}`,
    shop_id: SHOP_ID,
    name: t.name,
    image_url: imageUrl,
  });
  if (!error) { added++; process.stdout.write(imageUrl ? '.' : 'n'); }
  else { failed++; console.log(`\n  ! insert失敗 ${t.name}: ${error.message}`); }
  await new Promise(r => setTimeout(r, 300));
}
process.stdout.write('\n');
console.log(`\n✅ 登録: ${added}名 / 失敗: ${failed}名`);
