/**
 * Mrs.Two Heart セラピスト登録（Chrome DOM取得データ）
 * 4名 / pic/girl/{uid}/{storeId}{timestamp}.jpg パターン
 * 実行: node scripts/maintenance/process_mrs_two_heart_chrome.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const DRY_RUN = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = k => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
const REFERER = 'https://mrs-two-heart.com/';

const THERAPISTS = [
  { uid: 10567, name: '夏木',  imgUrl: 'https://mrs-two-heart.com/pic/girl/10567/316120260511125856.jpg' },
  { uid: 10308, name: '桐島',  imgUrl: 'https://mrs-two-heart.com/pic/girl/10308/316120260511125910.jpg' },
  { uid: 10569, name: '海野',  imgUrl: 'https://mrs-two-heart.com/pic/girl/10569/316120260511125832.jpg' },
  { uid: 10568, name: '神崎',  imgUrl: 'https://mrs-two-heart.com/pic/girl/10568/316120260511125844.jpg' },
];

async function uploadImage(uid, imgUrl) {
  const storageKey = `mrstwo_uid${uid}.jpg`;
  try {
    const res = await fetch(imgUrl, {
      headers: { 'User-Agent': UA, 'Referer': REFERER },
      signal: AbortSignal.timeout(15000)
    });
    if (!res.ok) { console.log(`  ✗ 画像取得失敗 uid=${uid} (${res.status})`); return null; }
    const buf = Buffer.from(await res.arrayBuffer());
    const { error } = await supabase.storage.from('therapist-images').upload(storageKey, buf, {
      contentType: 'image/jpeg', upsert: true
    });
    if (error) { console.log(`  ✗ Storage失敗 uid=${uid}: ${error.message}`); return null; }
    return supabase.storage.from('therapist-images').getPublicUrl(storageKey).data.publicUrl;
  } catch (e) {
    console.log(`  ✗ エラー uid=${uid}: ${e.message}`);
    return null;
  }
}

const { data: shops } = await supabase.from('shops').select('id,name').ilike('website_url', '%mrs-two-heart.com%');
if (!shops?.length) { console.error('Mrs.Two Heart shop not found'); process.exit(1); }
const shopId = shops[0].id;
console.log(`shop_id: ${shopId}`);
console.log(`shop_name: ${shops[0].name}`);

const { count } = await supabase.from('therapists').select('id', { count: 'exact' }).eq('shop_id', shopId);
console.log(`既存: ${count}件\n`);
if (count > 0 && !process.argv.includes('--force')) { console.log('既登録あり。--force で再実行'); process.exit(0); }

let added = 0, failed = 0;
for (const t of THERAPISTS) {
  if (DRY_RUN) { console.log(`  [dry] ${t.name} (uid=${t.uid}) ${t.imgUrl}`); continue; }
  const imageUrl = await uploadImage(t.uid, t.imgUrl);
  const { error } = await supabase.from('therapists').insert({
    id: `${shopId}_${t.name}`, shop_id: shopId, name: t.name, image_url: imageUrl
  });
  if (!error) { added++; process.stdout.write(imageUrl ? '.' : 'n'); }
  else { failed++; process.stdout.write('!'); }
  await new Promise(r => setTimeout(r, 300));
}
if (!DRY_RUN) { process.stdout.write('\n'); console.log(`\n✅ 登録: ${added}名 / 失敗: ${failed}名`); }
else console.log(`\n(dry-run) 計 ${THERAPISTS.length}名`);
