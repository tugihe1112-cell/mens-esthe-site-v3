/**
 * Aroma Mia (アロマミア) セラピスト登録 (広島7位)
 * 19名 / estama.jp CDN パターン
 * 実行: node scripts/maintenance/process_aromamia_hiroshima.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const DRY_RUN = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = k => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
const CDN_BASE = 'https://img.estama.jp/shop_data/00000043092/cast/main/357x556/';
const SHOP_ID = 'hiroshima_hiroshima_aroma_mia';

const THERAPISTS = [
  { name: 'さや',    file: '48gdo_20260525080302.jpg'  },
  { name: 'はる',    file: '7apg1_20260531161953.jpg'  },
  { name: 'みらい',  file: '1nyml_20260524191951.jpg'  },
  { name: 'くるみ',  file: 'ciohd_20260524191729.jpg'  },
  { name: 'のあ',    file: '9b67h_20260524192200.jpg'  },
  { name: 'かな',    file: '43us7_20260606164451.jpg'  },
  { name: 'あや',    file: '18ud4_20260608175222.jpg'  },
  { name: 'あん',    file: '363uo_20260524200433.jpg'  },
  { name: 'さくら',  file: '5lg5w_20260603001109.jpg'  },
  { name: 'ひまり',  file: '7o2xx_20260608163413.jpg'  },
  { name: 'あき',    file: 'bpojb_20260524193731.jpg'  },
  { name: 'みお',    file: 'd3ffm_20260524191705.jpg'  },
  { name: 'もも',    file: 'egc4u_20260524193658.jpg'  },
  { name: 'ひめ',    file: '9z9y4_20260524192250.jpg'  },
  { name: 'りのん',  file: 'e6kfv_20260524194044.jpg'  },
  { name: 'じゅり',  file: '99lfv_20260524194647.jpg'  },
  { name: 'えま',    file: '8byfw_20260527024048.jpg'  },
  { name: 'さき',    file: '7ne91_20260524194938.jpg'  },
  { name: 'ありさ',  file: '8zvqv_20260524192953.jpg'  },
];

async function uploadImage(file) {
  const hash = file.split('_')[0];
  const storageKey = `aromamia_hiroshima_${hash}.jpg`;
  const imgUrl = `${CDN_BASE}${file}`;
  try {
    const res = await fetch(imgUrl, {
      headers: { 'User-Agent': UA, 'Referer': 'https://aromamia0619.com/' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) { console.log(`  ✗ 取得失敗 ${file} (${res.status})`); return null; }
    const buf = Buffer.from(await res.arrayBuffer());
    const { error } = await supabase.storage.from('therapist-images').upload(storageKey, buf, {
      contentType: 'image/jpeg', upsert: true,
    });
    if (error) { console.log(`  ✗ Storage失敗 ${file}: ${error.message}`); return null; }
    return supabase.storage.from('therapist-images').getPublicUrl(storageKey).data.publicUrl;
  } catch (e) { console.log(`  ✗ エラー ${file}: ${e.message}`); return null; }
}

const { data: shopData } = await supabase.from('shops').select('id,name').eq('id', SHOP_ID);
if (!shopData?.length) { console.error(`${SHOP_ID} not found in DB`); process.exit(1); }
console.log(`shop: ${shopData[0].name} (${SHOP_ID})`);

const { count } = await supabase.from('therapists').select('id', { count: 'exact' }).eq('shop_id', SHOP_ID);
console.log(`既存: ${count}件\n`);
if (count > 0 && !process.argv.includes('--force')) { console.log('既登録あり。--force で再実行'); process.exit(0); }

if (DRY_RUN) {
  THERAPISTS.forEach(t => console.log(`  [dry] ${t.name} <- ${CDN_BASE}${t.file}`));
  console.log(`\n(dry-run) 計 ${THERAPISTS.length}名`);
  process.exit(0);
}

let added = 0, failed = 0;
for (const t of THERAPISTS) {
  const imageUrl = await uploadImage(t.file);
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
