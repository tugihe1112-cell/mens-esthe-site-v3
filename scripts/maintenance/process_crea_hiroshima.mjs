/**
 * CREA (クレア) セラピスト登録 (広島6位)
 * 60名 / DAHLIA系 /upload/cast/thumb_{castId}.jpg パターン
 * 実行: node scripts/maintenance/process_crea_hiroshima.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const DRY_RUN = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = k => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
const BASE = 'https://creahiroshima.com';
const SHOP_ID = 'hiroshima_hiroshima_crea';

// name: 表示名, castId: /upload/cast/thumb_{castId}.jpg のID
const THERAPISTS = [
  { name: '立花まき',         castId: 12  },
  { name: '夏目さら',         castId: 173 },
  { name: '小林もえ',         castId: 201 },
  { name: '岡本さえ',         castId: 18  },
  { name: '柚月のあ',         castId: 157 },
  { name: '今田かえで',       castId: 200 },
  { name: '北村まこ',         castId: 15  },
  { name: '桜餅ねる',         castId: 198 },
  { name: '藍原みう',         castId: 158 },
  { name: '川口るか',         castId: 159 },
  { name: '谷村めい',         castId: 14  },
  { name: '美波ののか',       castId: 13  },
  { name: '山本りこ',         castId: 25  },
  { name: '星野るな',         castId: 169 },
  { name: '澤田えりか',       castId: 16  },
  { name: '宮田せな',         castId: 176 },
  { name: '花咲すず',         castId: 197 },
  { name: '進藤ゆい',         castId: 203 },
  { name: '葉山せりか',       castId: 184 },
  { name: '永瀬あすか',       castId: 19  },
  { name: '鈴木りあ',         castId: 192 },
  { name: '吉川すみれ',       castId: 178 },
  { name: '中森ゆか',         castId: 163 },
  { name: '山田なつ',         castId: 179 },
  { name: '瀬戸あかり',       castId: 202 },
  { name: '浅井かんな',       castId: 190 },
  { name: '姫乃しほ',         castId: 187 },
  { name: '黒崎りら',         castId: 193 },
  { name: '桐谷あやの',       castId: 199 },
  { name: '桃瀬ふうか',       castId: 177 },
  { name: '春野ゆら',         castId: 168 },
  { name: '新木れみ',         castId: 181 },
  { name: '西野ゆめ',         castId: 175 },
  { name: '佐伯りん',         castId: 183 },
  { name: '橋本なぎさ',       castId: 160 },
  { name: '月森ことね',       castId: 20  },
  { name: '藤原さやか',       castId: 172 },
  { name: '椎名ひより',       castId: 161 },
  { name: '井上るる',         castId: 186 },
  { name: '杏野るり',         castId: 185 },
  { name: '浜辺りんか',       castId: 11  },
  { name: '名越れいら',       castId: 32  },
  { name: '池田かの',         castId: 180 },
  { name: '桜木みお',         castId: 27  },
  { name: '小春ねね',         castId: 174 },
  { name: '速水あい',         castId: 166 },
  { name: '長谷川りの',       castId: 165 },
  { name: '水野あみ',         castId: 17  },
  { name: '吉沢ももか',       castId: 21  },
  { name: '美咲ひめ',         castId: 162 },
  { name: '原田まゆ',         castId: 164 },
  { name: '紫咲りお',         castId: 22  },
  { name: '藤井あや',         castId: 44  },
  { name: '水木れい',         castId: 24  },
  { name: '大下ななこ',       castId: 38  },
  { name: '清水ゆうか',       castId: 154 },
  { name: '星川かなえ',       castId: 26  },
  { name: '成田ねね',         castId: 36  },
  { name: '音羽ゆい',         castId: 37  },
  { name: '佐々木かれん',     castId: 167 },
];

async function uploadImage(castId) {
  const storageKey = `crea_hiroshima_${castId}.jpg`;
  const imgUrl = `${BASE}/upload/cast/thumb_${castId}.jpg`;
  try {
    const res = await fetch(imgUrl, {
      headers: { 'User-Agent': UA, 'Referer': BASE + '/cast/' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) { console.log(`  ✗ 取得失敗 castId=${castId} (${res.status})`); return null; }
    const buf = Buffer.from(await res.arrayBuffer());
    const { error } = await supabase.storage.from('therapist-images').upload(storageKey, buf, {
      contentType: 'image/jpeg', upsert: true,
    });
    if (error) { console.log(`  ✗ Storage失敗 castId=${castId}: ${error.message}`); return null; }
    return supabase.storage.from('therapist-images').getPublicUrl(storageKey).data.publicUrl;
  } catch (e) { console.log(`  ✗ エラー castId=${castId}: ${e.message}`); return null; }
}

const { data: shopData } = await supabase.from('shops').select('id,name').eq('id', SHOP_ID);
if (!shopData?.length) { console.error(`${SHOP_ID} not found in DB`); process.exit(1); }
console.log(`shop: ${shopData[0].name} (${SHOP_ID})`);

const { count } = await supabase.from('therapists').select('id', { count: 'exact' }).eq('shop_id', SHOP_ID);
console.log(`既存: ${count}件\n`);
if (count > 0 && !process.argv.includes('--force')) { console.log('既登録あり。--force で再実行'); process.exit(0); }

if (DRY_RUN) {
  THERAPISTS.forEach(t => console.log(`  [dry] ${t.name} <- ${BASE}/upload/cast/thumb_${t.castId}.jpg`));
  console.log(`\n(dry-run) 計 ${THERAPISTS.length}名`);
  process.exit(0);
}

let added = 0, failed = 0;
for (const t of THERAPISTS) {
  const imageUrl = await uploadImage(t.castId);
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
