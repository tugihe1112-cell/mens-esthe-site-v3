/**
 * Tigger（ティガー）セラピスト登録 + Jesse ショップ情報更新
 * 旧: Jesse（二子玉川）→ 新: Tigger（登戸・向ヶ丘遊園・溝の口）
 * パターン: caskan.com CDN cast_tmb + alt=名前
 * 実行: node scripts/maintenance/process_tigger.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const BUCKET = 'therapist-images';
const CDN_BASE = 'https://cdn2-caskan.com/caskan/img/cast_tmb';
const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const SHOP_ID = 'tokyo_setagaya_futakotamagawa_jesse'; // 既存IDを維持

if (DRY_RUN) console.log('[DRY RUN]\n');

// Chrome から取得した69名（体験入店2名除外済み）
const TIGGER_DATA = [
  ['あいり',   '1778037808_3842560.png'],
  ['天使りん', '1778037885_5689354.png'],
  ['せな',     '1778037974_9940431.png'],
  ['ゆな',     '1778039049_5625787.png'],
  ['らむ',     '1778038040_8841308.png'],
  ['ここ',     '1778039112_2476811.png'],
  ['ほのか',   '1778038082_4813146.png'],
  ['めぐ',     '1778038981_6736491.png'],
  ['しずく',   '1778252768_0807994.png'],
  ['ひかり',   '1778039298_8591666.png'],
  ['さや',     '1778039378_1073028.png'],
  ['りお',     '1778039577_4162720.png'],
  ['なな',     '1778039637_3000576.png'],
  ['こいと',   '1778039696_9195135.png'],
  ['ゆい',     '1778039749_6750542.png'],
  ['きょう',   '1778039804_6214125.png'],
  ['いろは',   '1778039858_9983555.png'],
  ['あい',     '1778039943_9884441.png'],
  ['ふわり',   '1778040047_1159868.png'],
  ['みずき',   '1778040889_9432621.png'],
  ['みこと',   '1778040945_7275766.png'],
  ['きらら',   '1778049011_6608242.png'],
  ['あず',     '1778041101_3254760.png'],
  ['ふみか',   '1778041143_6700091.png'],
  ['のあ',     '1778041246_9543372.png'],
  ['ふうか',   '1778041295_7146496.png'],
  ['まいか',   '1778041337_5815665.png'],
  ['くるみ',   '1778041520_8635810.png'],
  ['ゆわ',     '1778042731_9106196.png'],
  ['かれん',   '1778042783_4856403.png'],
  ['きい',     '1778044993_1676945.png'],
  ['ななお',   '1778045051_5281678.png'],
  ['まりな',   '1778481641_8482458.png'],
  ['めい',     '1778045110_2041719.png'],
  ['ひな',     '1778045188_1791914.png'],
  ['みれい',   '1778049135_6193040.png'],
  ['しお',     '1778045658_2743426.png'],
  ['すい',     '1778042660_8074050.png'],
  ['るか',     '1778041392_5019429.png'],
  ['まこ',     '1778045702_0248527.png'],
  ['りほ',     '1778045750_1717374.png'],
  ['あすな',   '1778045806_3266806.png'],
  ['らら',     '1778046561_4366808.png'],
  ['むく',     '1778046607_1733324.png'],
  ['まなみ',   '1778046649_0675792.png'],
  ['うゆ',     '1778046683_5289617.png'],
  ['えれな',   '1778047614_9127453.png'],
  ['まなか',   '1778047660_5438574.png'],
  ['じゅり',   '1778047715_0817498.png'],
  ['さな',     '1778047771_2059775.png'],
  ['しおり',   '1778047803_8395458.png'],
  ['ゆうり',   '1778047837_0403728.png'],
  ['すずか',   '1778048281_7927349.png'],
  ['ちひろ',   '1778048354_6442592.png'],
  ['もも',     '1778048398_8602210.png'],
  ['るな',     '1778048443_1826401.png'],
  ['りりか',   '1778048512_4851124.png'],
  ['姫宮あみ', '1778048571_0155449.png'],
  ['れい',     '1775883396_1500572.png'],
  ['ゆうか',   '1775625509_5666971.png'],
  ['ちか',     '1775626138_6554266.png'],
  ['つばさ',   '1776401915_3812419.png'],
  ['める',     '1775625913_7116388.png'],
  ['ひめ',     '1776607576_5075358.png'],
  ['つむぎ',   '1778235918_5538875.jpeg'],
  ['りな',     '1777999859_5892649.jpeg'],
  ['のん',     '1775731037_9901394.jpeg'],
  ['なるみ',   '1775627867_2368368.png'],
  ['いずみ',   '1775565629_9628554.jpeg'],
];

async function uploadImage(imageUrl, fileName) {
  try {
    const isPng = imageUrl.endsWith('.png');
    const contentType = isPng ? 'image/png' : 'image/jpeg';
    const res = await fetch(imageUrl, {
      headers: { ...UA, Referer: 'https://tigger-esthe.com/' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) { console.log(`\n  HTTP ${res.status}: ${imageUrl.slice(-50)}`); return null; }
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/') || ct.includes('svg')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 512) return null;
    const { error } = await supabase.storage.from(BUCKET)
      .upload(fileName, buf, { contentType, upsert: true });
    if (error) { console.log(`\n  Storage: ${error.message}`); return null; }
    return supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
  } catch (e) { console.log(`\n  fetch error: ${e.message}`); return null; }
}

if (DRY_RUN) {
  console.log(`【Tigger (ティガー)】 ${TIGGER_DATA.length}名`);
  TIGGER_DATA.slice(0, 8).forEach(([n, f]) =>
    console.log(`  ${n} → ${CDN_BASE}/${f}`)
  );
  if (TIGGER_DATA.length > 8) console.log(`  ... 他${TIGGER_DATA.length - 8}名`);
  process.exit(0);
}

// まずショップ情報を更新（Jesse → Tigger）
console.log('\n--- ショップ情報更新 ---');
const { error: shopErr } = await supabase.from('shops').update({
  name: 'Tigger (ティガー)',
  website_url: 'https://tigger-esthe.com',
  schedule_url: 'https://tigger-esthe.com/therapist',
}).eq('id', SHOP_ID);
if (shopErr) console.log(`⚠️ shops更新エラー: ${shopErr.message}`);
else console.log(`✅ shops更新完了: ${SHOP_ID} → Tigger (ティガー)`);

console.log(`\n=== ${SHOP_ID} (${TIGGER_DATA.length}名) ===`);
let inserted = 0, skipped = 0, failed = 0;

for (const [name, fileName] of TIGGER_DATA) {
  const id = `${SHOP_ID}_${name}`;
  const { data: existing } = await supabase.from('therapists').select('id').eq('id', id).single();
  if (existing) { process.stdout.write('='); skipped++; continue; }

  const imageUrl = `${CDN_BASE}/${fileName}`;
  const storageFileName = `tigger_${fileName}`;
  const storageUrl = await uploadImage(imageUrl, storageFileName);
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
