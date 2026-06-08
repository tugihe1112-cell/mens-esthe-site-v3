/**
 * dandy lab セラピスト登録（Chrome DOM取得データ）
 * 13名 / /prof/{id}/top.jpg パターン
 * 実行: node scripts/maintenance/process_dandylab_chrome.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const DRY_RUN = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = k => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
const BASE = 'https://www.dandy-lab.com';
const REFERER = 'https://www.dandy-lab.com/';

// profId → name (from Chrome DOM, deduped)
const THERAPISTS = [
  { profId:  4, name: 'あいり' },
  { profId:  6, name: 'より'   },
  { profId: 15, name: 'みや'   },
  { profId:  3, name: 'まり'   },
  { profId: 14, name: 'ゆきな' },
  { profId: 13, name: 'ゆめ'   },
  { profId:  8, name: 'えれな' },
  { profId: 12, name: 'りな'   },
  { profId:  7, name: 'さら'   },
  { profId: 10, name: 'みさ'   },
  { profId: 11, name: 'ゆうか' },
  { profId:  2, name: 'りんか' },
  { profId:  1, name: 'れな'   },
];

async function uploadImage(profId) {
  const imgUrl = `${BASE}/prof/${profId}/top.jpg`;
  const storageKey = `dandylab_prof${profId}.jpg`;
  try {
    const res = await fetch(imgUrl, {
      headers: { 'User-Agent': UA, 'Referer': REFERER },
      signal: AbortSignal.timeout(15000)
    });
    if (!res.ok) { console.log(`  ✗ 画像取得失敗 prof=${profId} (${res.status})`); return null; }
    const buf = Buffer.from(await res.arrayBuffer());
    const { error } = await supabase.storage.from('therapist-images').upload(storageKey, buf, {
      contentType: 'image/jpeg', upsert: true
    });
    if (error) { console.log(`  ✗ Storage失敗 prof=${profId}: ${error.message}`); return null; }
    return supabase.storage.from('therapist-images').getPublicUrl(storageKey).data.publicUrl;
  } catch (e) {
    console.log(`  ✗ エラー prof=${profId}: ${e.message}`);
    return null;
  }
}

const { data: shops } = await supabase.from('shops').select('id,name').ilike('website_url', '%dandy-lab.com%');
if (!shops?.length) { console.error('dandy lab shop not found'); process.exit(1); }
const shopId = shops[0].id;
console.log(`shop_id: ${shopId}`);
console.log(`shop_name: ${shops[0].name}`);

const { count } = await supabase.from('therapists').select('id', { count: 'exact' }).eq('shop_id', shopId);
console.log(`既存: ${count}件\n`);
if (count > 0 && !process.argv.includes('--force')) {
  console.log('既登録あり。--force で再実行'); process.exit(0);
}

let added = 0, failed = 0;
for (const t of THERAPISTS) {
  if (DRY_RUN) {
    console.log(`  [dry] ${t.name} (prof=${t.profId}) ${BASE}/prof/${t.profId}/top.jpg`);
    continue;
  }
  const imageUrl = await uploadImage(t.profId);
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
