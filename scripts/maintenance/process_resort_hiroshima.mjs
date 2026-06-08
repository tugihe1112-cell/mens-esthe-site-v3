/**
 * RESORT (リゾート) セラピスト登録 (広島4位)
 * 8名 / HTTP /data/{roman}/1.jpg パターン（SSLなし）
 * 実行: node scripts/maintenance/process_resort_hiroshima.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const DRY_RUN = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = k => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
const BASE = 'http://www.resort-h.net';
const SHOP_ID = 'hiroshima_hiroshima_resort';

// roman はURL内のパス（スペースあり = %20 エンコード済み）
const THERAPISTS = [
  { name: '橘のどか',       roman: 'tachibana nodoka' },
  { name: '四宮蘭',         roman: 'sinomiyarann' },
  { name: '九条めぐみ',     roman: 'KUZYOUMEGUMI' },
  { name: '夢川めい',       roman: 'yumekawamei' },
  { name: '小川えり',       roman: 'ogawa' },
  { name: '佐藤胡桃',       roman: 'satou' },
  { name: '岬さくら',       roman: 'misakisakura' },
  { name: '一ノ瀬紗菜',     roman: 'ichinose sana' },
];

async function uploadImage(roman, name) {
  const slug = roman.replace(/\s/g, '_');
  const storageKey = `resort_hiroshima_${slug}.jpg`;
  const imgUrl = `${BASE}/data/${encodeURIComponent(roman)}/1.jpg`;
  try {
    const res = await fetch(imgUrl, {
      headers: { 'User-Agent': UA, 'Referer': BASE + '/' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) { console.log(`  ✗ 取得失敗 ${name} (${res.status}): ${imgUrl}`); return null; }
    const buf = Buffer.from(await res.arrayBuffer());
    const { error } = await supabase.storage.from('therapist-images').upload(storageKey, buf, {
      contentType: 'image/jpeg', upsert: true,
    });
    if (error) { console.log(`  ✗ Storage失敗 ${name}: ${error.message}`); return null; }
    return supabase.storage.from('therapist-images').getPublicUrl(storageKey).data.publicUrl;
  } catch (e) { console.log(`  ✗ エラー ${name}: ${e.message}`); return null; }
}

const { data: shopData } = await supabase.from('shops').select('id,name').eq('id', SHOP_ID);
if (!shopData?.length) { console.error(`${SHOP_ID} not found in DB`); process.exit(1); }
console.log(`shop: ${shopData[0].name} (${SHOP_ID})`);

const { count } = await supabase.from('therapists').select('id', { count: 'exact' }).eq('shop_id', SHOP_ID);
console.log(`既存: ${count}件\n`);
if (count > 0 && !process.argv.includes('--force')) { console.log('既登録あり。--force で再実行'); process.exit(0); }

if (DRY_RUN) {
  THERAPISTS.forEach(t => console.log(`  [dry] ${t.name} <- ${BASE}/data/${t.roman}/1.jpg`));
  console.log(`\n(dry-run) 計 ${THERAPISTS.length}名`);
  process.exit(0);
}

let added = 0, failed = 0;
for (const t of THERAPISTS) {
  const imageUrl = await uploadImage(t.roman, t.name);
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
