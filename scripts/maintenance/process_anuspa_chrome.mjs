/**
 * アヌSPA セラピスト登録（Chrome DOM取得データ）
 * 18名 / THE PREMIUM SPA CMS (data/staff/{sid}/stf_{hash}.jpg)
 * 実行: node scripts/maintenance/process_anuspa_chrome.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const DRY_RUN = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = k => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
const BASE = 'https://anuspa.club';
const REFERER = 'https://anuspa.club/';

// sid → name (page order), imageFile
const THERAPISTS = [
  { sid:  43, name: '相澤',  hash: 'stf_69cc38cfeb98a', ext: 'jpg' },
  { sid:   8, name: '美月',  hash: 'stf_6a212726b8d29', ext: 'jpg' },
  { sid:  39, name: '雪平',  hash: 'stf_68b25748b35f1', ext: 'jpg' },
  { sid:  18, name: '優希',  hash: 'stf_68fb2d389e905', ext: 'jpg' },
  { sid:   1, name: '葉月',  hash: 'stf_6a214b734358f', ext: 'jpg' },
  { sid:   7, name: '真白',  hash: 'stf_68b2511295917', ext: 'jpg' },
  { sid:  61, name: '黒木',  hash: 'stf_68b95043e0913', ext: 'jpg' },
  { sid:  68, name: '雪乃',  hash: 'stf_68b25174ec87e', ext: 'jpg' },
  { sid:  97, name: '杏里',  hash: 'stf_6a0d3b652d248', ext: 'jpg' },
  { sid:  60, name: '桃瀬',  hash: 'stf_68b25254c7dcc', ext: 'jpg' },
  { sid:  90, name: '薫',    hash: 'stf_68b2528335c0b', ext: 'jpg' },
  { sid: 100, name: '七瀬',  hash: 'stf_69b8d33758f19', ext: 'jpg' },
  { sid: 104, name: '胡桃',  hash: 'stf_69f8482c807af', ext: 'jpg' },
  { sid: 105, name: '一条',  hash: 'stf_6a20eed45003c', ext: 'jpg' },
  { sid:  91, name: '日野',  hash: 'stf_68b252a98b1c5', ext: 'jpg' },
  { sid:  98, name: '一花',  hash: 'stf_699000353135f', ext: 'jpg' },
  { sid:  95, name: '凪',    hash: 'stf_68b25691942ee', ext: 'jpg' },
  { sid:   4, name: '白石',  hash: 'stf_68b2533a982b6', ext: 'jpg' },
];

async function uploadImage(sid, hash, ext) {
  const imgUrl = `${BASE}/data/staff/${sid}/${hash}.${ext}`;
  const storageKey = `anuspa_sid${sid}.${ext}`;
  try {
    const res = await fetch(imgUrl, {
      headers: { 'User-Agent': UA, 'Referer': REFERER },
      signal: AbortSignal.timeout(15000)
    });
    if (!res.ok) { console.log(`  ✗ 画像取得失敗 sid=${sid} (${res.status})`); return null; }
    const buf = Buffer.from(await res.arrayBuffer());
    const { error } = await supabase.storage.from('therapist-images').upload(storageKey, buf, {
      contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`, upsert: true
    });
    if (error) { console.log(`  ✗ Storage失敗 sid=${sid}: ${error.message}`); return null; }
    return supabase.storage.from('therapist-images').getPublicUrl(storageKey).data.publicUrl;
  } catch (e) {
    console.log(`  ✗ エラー sid=${sid}: ${e.message}`);
    return null;
  }
}

// shop_id を DB から取得
const { data: shops } = await supabase.from('shops').select('id,name').ilike('website_url', '%anuspa.club%');
if (!shops?.length) {
  console.error('アヌSPA shop not found in DB');
  process.exit(1);
}
const shopId = shops[0].id;
console.log(`shop_id: ${shopId}`);
console.log(`shop_name: ${shops[0].name}`);

const { count } = await supabase.from('therapists').select('id', { count: 'exact' }).eq('shop_id', shopId);
console.log(`既存: ${count}件\n`);

if (count > 0 && !process.argv.includes('--force')) {
  console.log('既登録あり。--force で強制再実行');
  process.exit(0);
}

let added = 0, failed = 0;
for (const t of THERAPISTS) {
  if (DRY_RUN) {
    console.log(`  [dry] ${t.name} (sid=${t.sid}) ${BASE}/data/staff/${t.sid}/${t.hash}.${t.ext}`);
    continue;
  }

  const imageUrl = await uploadImage(t.sid, t.hash, t.ext);
  const { error } = await supabase.from('therapists').insert({
    id: `${shopId}_${t.name}`,
    shop_id: shopId,
    name: t.name,
    image_url: imageUrl
  });
  if (!error) { added++; process.stdout.write(imageUrl ? '.' : 'n'); }
  else { failed++; process.stdout.write('!'); }
  await new Promise(r => setTimeout(r, 300));
}

if (!DRY_RUN) {
  process.stdout.write('\n');
  console.log(`\n✅ 登録: ${added}名 / 失敗: ${failed}名`);
} else {
  console.log(`\n(dry-run) 計 ${THERAPISTS.length}名`);
}
