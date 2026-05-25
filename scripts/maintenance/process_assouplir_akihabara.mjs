/**
 * Assouplir 秋葉原 セラピスト登録
 * パターン: Cloudflare Images CDN (imagedelivery.net)
 * 画像URL: https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q/{uuid}/member
 * 実行: node scripts/maintenance/process_assouplir_akihabara.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const BUCKET = 'therapist-images';
const CDN_BASE = 'https://imagedelivery.net/cfeyeF6Rug0uLEf-H0N-2Q';
const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const SHOP_ID = 'tokyo_chiyoda_akihabara_assouplir';

if (DRY_RUN) console.log('[DRY RUN]\n');

// Chrome から取得した46名（Cloudflare Images UUIDリスト）
const ASSOUPLIR_DATA = [
  ['大嶋ゆう',    '5db62e65-ee9f-4052-5c33-3d0df7697c00'],
  ['咲真あみ',    '72e46bb9-4994-4248-99b3-128124e3e700'],
  ['上原るみ',    'bd3f7187-af9e-4882-ae07-d1102c857f00'],
  ['岬ようこ',    '16cd6dc0-5ebf-4611-cd85-1023d01e8d00'],
  ['松井まりこ',  '58747d52-8374-4152-5f76-40ea805ed600'],
  ['森崎とうこ',  '23f86e32-44f6-47b0-5480-c1be19cd4300'],
  ['瀬名あいこ',  'b204b9d2-9051-4701-009e-79791188cb00'],
  ['小林ななこ',  '94716dc6-2a95-42c8-0d3f-3c5573911200'],
  ['松村ことみ',  '9d3aa38d-e683-4227-91f1-45fb431e9500'],
  ['星野みつき',  '12551060-4301-4d0c-a3be-b7c3408c2e00'],
  ['三浦あき',    '01e192d8-2aaa-4990-dd1b-ffe4e64cff00'],
  ['永浜みゆ',    '23c56725-1bc6-4de0-3a1d-2748f8c86800'],
  ['田中さとみ',  'be66f9df-71db-4dd4-82ff-2d8e3b96ca00'],
  ['棚橋みどり',  'c4424c76-5db7-4d9f-b876-2902a5219a00'],
  ['要ふゆみ',    '647648b6-1551-4c77-67c4-6e8488be3200'],
  ['葵まゆ',      'd7626c49-b85f-4947-2e18-64679cfe3900'],
  ['浅井めぐみ',  '3be6d99a-87e8-43f1-c748-c669fe365b00'],
  ['百瀬きょうこ','76313509-8242-4e33-de35-1315800db200'],
  ['一ノ瀬なな',  'cb74edd1-c791-4a4f-1831-59f948db5e00'],
  ['柳瀬いおり',  '9896d2ef-745a-4eda-5dc1-b91373062400'],
  ['神楽あや',    'bbd2da24-c53b-4bcd-4ff0-0bfca7798b00'],
  ['白石りな',    'b421ada3-5d43-4a8d-3ee5-6d49f357ad00'],
  ['新堂もも',    '73b9bc23-5bd9-43c1-95a3-dfb2398c2300'],
  ['宇野じゅりな','bb362738-2d85-41c5-c7fc-e44b403da100'],
  ['木田ゆり',    '3674b5f3-2d76-439f-1e73-621639d31200'],
  ['仲田りん',    'cf9826d3-1677-43a1-fb89-2618cbd83b00'],
  ['鈴木すみれ',  'b6de986c-2fd7-4ed0-af53-e130f9680b00'],
  ['水嶋かすみ',  'c40f4eda-fb26-4164-f162-c037d2a7cd00'],
  ['東條つばさ',  '977210f0-9f5e-4e40-94f0-ce81692fe400'],
  ['綾瀬みな',    '0027b73a-d7f6-43a0-c7b1-829d85afc700'],
  ['篠原るい',    '5a87b8af-6fb7-4f52-2ee6-ec5db4e66400'],
  ['豊田ゆい',    'ea7d6d1b-0a15-4abe-1c85-3cc67e696900'],
  ['日比さくら',  'f0f33561-6b0b-4ad7-333d-e06d8cbe5100'],
  ['橘まい',      'ec68ed05-298c-4e86-77db-291cbded6d00'],
  ['桐島とわこ',  '65d79142-fad4-42c9-a80d-cdc5ac31d000'],
  ['小野みお',    'b83c17ec-afca-495d-208c-1d3a5a4afb00'],
  ['片桐みほこ',  'ee70d623-deee-4370-f7a4-0b15901b2800'],
  ['水城はるか',  'a2f2128d-8905-4fee-d6be-b0b6e37aac00'],
  ['吉川ゆかり',  '136b5c99-a5a6-4608-a33d-2ecc37cdaa00'],
  ['青山ゆう',    'cd23c34d-d27c-4359-a5e9-53453893a200'],
  ['田宮あゆ',    '969311f0-90c9-424c-fa14-25490a8e8e00'],
  ['早坂ちか',    '11fb6563-fdc3-4a8b-70cf-5c8fa5548700'],
  ['白鳥みほ',    '5eef6516-993b-43d1-70e3-793935af0700'],
  ['岩永えみ',    'c7ed7ad5-ff3f-4b88-8cf7-4234cd6cc800'],
  ['櫻井はる',    '0da075bd-6d6b-4cb2-1627-6ce09ad3f000'],
  ['市川すず',    'ebff479c-2080-405b-525e-fdb7fb483800'],
];

async function uploadImage(imageUrl, fileName) {
  try {
    const res = await fetch(imageUrl, {
      headers: { ...UA, Accept: 'image/jpeg,image/*' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) { console.log(`\n  HTTP ${res.status}: ${imageUrl.slice(-50)}`); return null; }
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/') || ct.includes('svg')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 512) return null;
    const contentType = ct.includes('png') ? 'image/png' : 'image/jpeg';
    const { error } = await supabase.storage.from(BUCKET)
      .upload(fileName, buf, { contentType, upsert: true });
    if (error) { console.log(`\n  Storage: ${error.message}`); return null; }
    return supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
  } catch (e) { console.log(`\n  fetch error: ${e.message}`); return null; }
}

if (DRY_RUN) {
  console.log(`【Assouplir 秋葉原】 ${ASSOUPLIR_DATA.length}名`);
  ASSOUPLIR_DATA.slice(0, 8).forEach(([n, uuid]) =>
    console.log(`  ${n} → ${CDN_BASE}/${uuid}/member`)
  );
  if (ASSOUPLIR_DATA.length > 8) console.log(`  ... 他${ASSOUPLIR_DATA.length - 8}名`);
  process.exit(0);
}

console.log(`\n=== ${SHOP_ID} (${ASSOUPLIR_DATA.length}名) ===`);
let inserted = 0, skipped = 0, failed = 0;

for (const [name, uuid] of ASSOUPLIR_DATA) {
  const id = `${SHOP_ID}_${name}`;
  const { data: existing } = await supabase.from('therapists').select('id').eq('id', id).single();
  if (existing) { process.stdout.write('='); skipped++; continue; }

  const imageUrl = `${CDN_BASE}/${uuid}/member`;
  const fileName = `assouplir_${uuid}.jpg`;
  const storageUrl = await uploadImage(imageUrl, fileName);
  await sleep(100);

  const { error } = await supabase.from('therapists').insert({
    id, shop_id: SHOP_ID, name, image_url: storageUrl ?? null,
  });
  if (error) { console.log(`\n❌ ${name}: ${error.message}`); failed++; }
  else { process.stdout.write(storageUrl ? '+' : 'n'); inserted++; }
  await sleep(80);
}

console.log(`\n\n挿入 ${inserted}名 / スキップ ${skipped}名 / 失敗 ${failed}名`);
console.log('\n完了');
