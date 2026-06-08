/**
 * Alivie（アリビエ）セラピスト登録（Chrome DOM取得データ）
 * 16名 / WordPress wp-content/uploads パターン
 * 実行: node scripts/maintenance/process_alivie_chrome.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const DRY_RUN = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = k => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
const REFERER = 'https://www.osaka-alivie.com/';

// name (スペース除去済み), imgUrl (page-order unique, deduped)
const THERAPISTS = [
  { name: '小日向るる',   imgUrl: 'https://www.osaka-alivie.com/wp-content/uploads/2026/05/%E5%B0%8F%E6%97%A5%E5%90%91%E3%82%8B%E3%82%8B3.jpg.webp' },
  { name: '桐谷ことは',   imgUrl: 'https://www.osaka-alivie.com/wp-content/uploads/2023/03/Natural-Brown-Hair-Portrait1.jpg.webp' },
  { name: '月乃みう',     imgUrl: 'https://www.osaka-alivie.com/wp-content/uploads/2026/03/1000006905.jpg.webp' },
  { name: '天音すず',     imgUrl: 'https://www.osaka-alivie.com/wp-content/uploads/2026/03/%E5%A4%A9%E9%9F%B3%E3%81%99%E3%81%9A3.jpg.webp' },
  { name: '如月ゆあ',     imgUrl: 'https://www.osaka-alivie.com/wp-content/uploads/2023/05/%E5%A6%82%E6%9C%88%E3%82%86%E3%81%828.jpg.webp' },
  { name: '永瀬らいか',   imgUrl: 'https://www.osaka-alivie.com/wp-content/uploads/2026/03/%E6%98%9F%E5%AE%AE%E3%81%B2%E3%81%AA%E3%81%9F.jpg.webp' },
  { name: '水瀬えれな',   imgUrl: 'https://www.osaka-alivie.com/wp-content/uploads/2025/09/1000006888.jpg.webp' },
  { name: '七草なずな',   imgUrl: 'https://www.osaka-alivie.com/wp-content/uploads/2025/12/%E4%B8%83%E8%8D%89%E3%81%AA%E3%81%9A%E3%81%AA2.jpg.webp' },
  { name: '佐藤ゆき',     imgUrl: 'https://www.osaka-alivie.com/wp-content/uploads/2025/08/%E4%BD%90%E8%97%A4%E3%82%86%E3%81%8D.jpg.webp' },
  { name: '星宮ひなた',   imgUrl: 'https://www.osaka-alivie.com/wp-content/uploads/2026/03/%E6%B0%B8%E7%80%AC%E3%82%89%E3%81%84%E3%81%8B.jpg.webp' },
  { name: '音羽りん',     imgUrl: 'https://www.osaka-alivie.com/wp-content/uploads/2021/06/613426773400cb145c42c9c007c1f22c.jpg.webp' },
  { name: '一条わかば',   imgUrl: 'https://www.osaka-alivie.com/wp-content/uploads/2021/06/%E4%B8%80%E6%9D%A1%E3%82%8F%E3%81%8B%E3%81%AF%E3%82%99.jpg' },
  { name: '御値条にとり', imgUrl: 'https://www.osaka-alivie.com/wp-content/uploads/2024/01/e98ae6338517b6a4794efac8aca02ec3.jpg.webp' },
  { name: '黒木かすみ',   imgUrl: 'https://www.osaka-alivie.com/wp-content/uploads/2024/10/ChatGPT-Image-2026%E5%B9%B43%E6%9C%8814%E6%97%A5-05_09_20.jpg.webp' },
  { name: '橋本ゆい',     imgUrl: 'https://www.osaka-alivie.com/wp-content/uploads/2024/10/cf2107f3db3ce0f896c41605fbecab2d.jpg.webp' },
  { name: '松田るな',     imgUrl: 'https://www.osaka-alivie.com/wp-content/uploads/2022/12/d6e302731bd50c53d36b4446f03810c6.jpg.webp' },
];

async function uploadImage(name, imgUrl, idx) {
  const ext = imgUrl.endsWith('.webp') ? 'webp' : 'jpg';
  const ct = ext === 'webp' ? 'image/webp' : 'image/jpeg';
  const storageKey = `alivie_${String(idx).padStart(2,'0')}.${ext}`;
  try {
    const res = await fetch(imgUrl, {
      headers: { 'User-Agent': UA, 'Referer': REFERER },
      signal: AbortSignal.timeout(15000)
    });
    if (!res.ok) { console.log(`  ✗ 画像取得失敗 ${name} (${res.status})`); return null; }
    const buf = Buffer.from(await res.arrayBuffer());
    const { error } = await supabase.storage.from('therapist-images').upload(storageKey, buf, {
      contentType: ct, upsert: true
    });
    if (error) { console.log(`  ✗ Storage失敗 ${name}: ${error.message}`); return null; }
    return supabase.storage.from('therapist-images').getPublicUrl(storageKey).data.publicUrl;
  } catch (e) {
    console.log(`  ✗ エラー ${name}: ${e.message}`);
    return null;
  }
}

const { data: shops } = await supabase.from('shops').select('id,name').ilike('website_url', '%osaka-alivie.com%');
if (!shops?.length) { console.error('Alivie shop not found'); process.exit(1); }
const shopId = shops[0].id;
console.log(`shop_id: ${shopId}`);
console.log(`shop_name: ${shops[0].name}`);

const { count } = await supabase.from('therapists').select('id', { count: 'exact' }).eq('shop_id', shopId);
console.log(`既存: ${count}件\n`);
if (count > 0 && !process.argv.includes('--force')) {
  console.log('既登録あり。--force で再実行'); process.exit(0);
}

let added = 0, failed = 0;
for (let i = 0; i < THERAPISTS.length; i++) {
  const t = THERAPISTS[i];
  if (DRY_RUN) { console.log(`  [dry] ${t.name} ${t.imgUrl}`); continue; }
  const imageUrl = await uploadImage(t.name, t.imgUrl, i);
  const { error } = await supabase.from('therapists').insert({
    id: `${shopId}_${t.name}`, shop_id: shopId, name: t.name, image_url: imageUrl
  });
  if (!error) { added++; process.stdout.write(imageUrl ? '.' : 'n'); }
  else { failed++; console.log(`\n  ! insert失敗 ${t.name}: ${error.message}`); }
  await new Promise(r => setTimeout(r, 300));
}
if (!DRY_RUN) {
  process.stdout.write('\n');
  console.log(`\n✅ 登録: ${added}名 / 失敗: ${failed}名`);
} else {
  console.log(`\n(dry-run) 計 ${THERAPISTS.length}名`);
}
