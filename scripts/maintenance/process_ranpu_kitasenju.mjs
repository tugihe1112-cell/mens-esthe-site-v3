/**
 * らんぷ 北千住 セラピスト登録
 * パターン: img[src*="re-db.com"] + 親要素テキストから名前抽出
 * 画像: files.re-db.com CDN → Supabase Storage にアップ
 * 実行: node scripts/maintenance/process_ranpu_kitasenju.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const BUCKET = 'therapist-images';
const REFERER = 'https://www.senju-lamp.com/';
const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const SHOP_ID = 'tokyo_adachi_ushida_ranpu_kitasenju';

if (DRY_RUN) console.log('[DRY RUN]\n');

// Chrome から取得した86名データ（重複除去済み、「セラピスト面接」除外）
const RANPU_DATA = [
  ['斉藤いちか',    'https://files.re-db.com/file/69e34b99c71d2.jpg'],
  ['宮本けい',      'https://files.re-db.com/file/69f4208533959.jpg'],
  ['神野ひめか',    'https://files.re-db.com/file/692f9a4d6e140.jpg'],
  ['秋川ゆき',      'https://files.re-db.com/file/6926c32421319.jpg'],
  ['高瀬りん',      'https://files.re-db.com/file/673fdbec12a93.jpg'],
  ['宮野原わか',    'https://files.re-db.com/file/693046ece1661.jpg'],
  ['仁科ゆうひ',    'https://files.re-db.com/file/68cd38e363980.jpg'],
  ['暁りこ',        'https://files.re-db.com/file/6901c6652acec.jpg'],
  ['中山みく',      'https://files.re-db.com/file/690c7d8777b61.jpg'],
  ['松山えりな',    'https://files.re-db.com/file/6960aee5ce30e.jpg'],
  ['久保こはる',    'https://files.re-db.com/file/690d890b3b623.jpg'],
  ['桜木いと',      'https://files.re-db.com/file/68e861e466175.jpg'],
  ['春川つむぎ',    'https://files.re-db.com/file/69b8cb72c2580.jpg'],
  ['黒田れみ',      'https://files.re-db.com/file/69d9d9f65e6c0.jpg'],
  ['沖田あきほ',    'https://files.re-db.com/file/699807669e3c5.jpg'],
  ['雪村まふゆ',    'https://files.re-db.com/file/69bfa952c8c80.jpg'],
  ['高槻あずさ',    'https://files.re-db.com/file/68f3867622fc7.jpg'],
  ['北村ゆうり',    'https://files.re-db.com/file/69ae748f6d1cc.jpg'],
  ['西野たまき',    'https://files.re-db.com/file/6994539f38fe2.jpg'],
  ['藤井まや',      'https://files.re-db.com/file/694a7e9db64fa.jpg'],
  ['一宮ひびき',    'https://files.re-db.com/file/69f6b162ec2d3.jpg'],
  ['山中みい',      'https://files.re-db.com/file/69a5332e928f8.jpg'],
  ['栞木みつ',      'https://files.re-db.com/file/69b11f6d190d9.jpg'],
  ['片岡さゆり',    'https://files.re-db.com/file/69f74d4112d5d.jpg'],
  ['相模めぐみ',    'https://files.re-db.com/file/690801c743160.jpg'],
  ['井上ゆう',      'https://files.re-db.com/file/69a2c84eaf951.jpg'],
  ['東雲こはる',    'https://files.re-db.com/file/677677f59597f.jpg'],
  ['白鳥ゆり',      'https://files.re-db.com/file/698448df04303.jpg'],
  ['七瀬あい',      'https://files.re-db.com/file/6989c3462f60a.jpg'],
  ['長谷川らん',    'https://files.re-db.com/file/67767ab4d3a08.jpg'],
  ['香坂すみれ',    'https://files.re-db.com/file/696c4828459c4.jpg'],
  ['笹川あみ',      'https://files.re-db.com/file/69f713d1259eb.jpg'],
  ['山口あおい',    'https://files.re-db.com/file/69f9c4e9b9978.jpg'],
  ['上原さき',      'https://files.re-db.com/file/6943b2f35099d.jpg'],
  ['池田まい',      'https://files.re-db.com/file/68f3878aba10b.jpg'],
  ['神谷るい',      'https://files.re-db.com/file/6979a8be9a71a.jpg'],
  ['中西みかん',    'https://files.re-db.com/file/69035d71d3b3e.jpg'],
  ['松井おと',      'https://files.re-db.com/file/69207103ad081.jpg'],
  ['松原あゆみ',    'https://files.re-db.com/file/68f20993d54f2.jpg'],
  ['結城まなみ',    'https://files.re-db.com/file/68fc66a0bbc58.jpg'],
  ['白井ゆめ',      'https://files.re-db.com/file/69d0ce9999d36.jpg'],
  ['紫かおり',      'https://files.re-db.com/file/69fc550d4566d.jpg'],
  ['東江いずみ',    'https://files.re-db.com/file/69fc63565ed8f.jpg'],
  ['加須部なるみ',  'https://files.re-db.com/file/693046d7b41b9.jpg'],
  ['西川まゆみ',    'https://files.re-db.com/file/69fc4fba0ec37.jpg'],
  ['渡辺ゆあ',      'https://files.re-db.com/file/69f568e7cd9e3.jpg'],
  ['安東みき',      'https://files.re-db.com/file/68fc9776181e0.jpg'],
  ['白石のん',      'https://files.re-db.com/file/69f71434e95b3.jpg'],
  ['西園寺みつき',  'https://files.re-db.com/file/69423eb4f2128.jpg'],
  ['如月まゆ',      'https://files.re-db.com/file/69edbbdf10f51.jpg'],
  ['岩田くるみ',    'https://files.re-db.com/file/68dff4d82b054.jpg'],
  ['美波かこ',      'https://files.re-db.com/file/69157cffe9e41.jpg'],
  ['崎山えりさ',    'https://files.re-db.com/file/69edbd21f2d3c.jpg'],
  ['桃瀬すい',      'https://files.re-db.com/file/69a7ea2620d64.jpg'],
  ['小熊ねね',      'https://files.re-db.com/file/69d8b2334c500.jpg'],
  ['川上らむ',      'https://files.re-db.com/file/69d4bf7079501.jpg'],
  ['真島かなえ',    'https://files.re-db.com/file/6951f8af57a6a.jpg'],
  ['柏葉れん',      'https://files.re-db.com/file/68f095025b8d3.jpg'],
  ['工藤こころ',    'https://files.re-db.com/file/69c38c303e2d7.jpg'],
  ['小田あつこ',    'https://files.re-db.com/file/696596567df46.jpg'],
  ['滝あかり',      'https://files.re-db.com/file/6330e3cdb0708.jpg'],
  ['愛咲なな',      'https://files.re-db.com/file/694e6f8a22c0a.jpg'],
  ['中谷みゆき',    'https://files.re-db.com/file/695fbbf14c25a.jpg'],
  ['神田みみ',      'https://files.re-db.com/file/697c115b74941.jpg'],
  ['吉野あかね',    'https://files.re-db.com/file/69626dd0a441d.jpg'],
  ['岡野ひまり',    'https://files.re-db.com/file/696a4b9bda90f.jpg'],
  ['桐島つばき',    'https://files.re-db.com/file/6987020043da4.jpg'],
  ['谷あんな',      'https://files.re-db.com/file/6996cc186df5b.jpg'],
  ['栗山かすみ',    'https://files.re-db.com/file/69ad792090243.jpg'],
  ['桜井しの',      'https://files.re-db.com/file/679cda1132b7a.jpg'],
  ['雨宮まみ',      'https://files.re-db.com/file/6995374438709.jpg'],
  ['小川じゅり',    'https://files.re-db.com/file/68eeff9b41f79.jpg'],
  ['飯島みさと',    'https://files.re-db.com/file/6948eac920b07.jpg'],
  ['北川れいこ',    'https://files.re-db.com/file/69628aa5ead52.jpg'],
  ['花井このか',    'https://files.re-db.com/file/691ad4235c4b8.jpg'],
  ['村瀬ももか',    'https://files.re-db.com/file/696dd7eec957b.jpg'],
  ['望月みな',      'https://files.re-db.com/file/6916e8e74d77d.jpg'],
  ['本田まり',      'https://files.re-db.com/file/68f5d50462529.png'],
  ['月永すみれ',    'https://files.re-db.com/file/68fee65025fdf.jpg'],
  ['緑あやの',      'https://files.re-db.com/file/677a2a15dd2dd.jpg'],
  ['相田りさこ',    'https://files.re-db.com/file/69004feb7a59e.jpg'],
  ['月乃なな',      'https://files.re-db.com/file/6913ea80a2374.jpg'],
  ['三浦みどりこ',  'https://files.re-db.com/file/6780ed6d603b4.jpg'],
  ['吉野あおい',    'https://files.re-db.com/file/6746ed8f9249e.jpg'],
  ['森みかこ',      'https://files.re-db.com/file/673756c424210.jpg'],
  ['向井さえ',      'https://files.re-db.com/file/68a86a928fba1.png'],
];

async function uploadImage(imageUrl, fileName) {
  try {
    const isPng = imageUrl.endsWith('.png');
    const contentType = isPng ? 'image/png' : 'image/jpeg';
    const res = await fetch(imageUrl, {
      headers: { ...UA, Referer: REFERER },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) { console.log(`\n  HTTP ${res.status}: ${imageUrl.slice(-40)}`); return null; }
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
  console.log(`【らんぷ 北千住】 ${RANPU_DATA.length}名`);
  RANPU_DATA.slice(0, 8).forEach(([n, u]) => console.log(`  ${n} → ${u.slice(-40)}`));
  if (RANPU_DATA.length > 8) console.log(`  ... 他${RANPU_DATA.length - 8}名`);
  process.exit(0);
}

console.log(`\n=== ${SHOP_ID} (${RANPU_DATA.length}名) ===`);
let inserted = 0, skipped = 0, failed = 0;

for (const [name, imageUrl] of RANPU_DATA) {
  const id = `${SHOP_ID}_${name}`;
  const { data: existing } = await supabase.from('therapists').select('id').eq('id', id).single();
  if (existing) { process.stdout.write('='); skipped++; continue; }

  // ファイルIDをStorage名に使用（例: 69e34b99c71d2.jpg → ranpu_69e34b99c71d2.jpg）
  const fileId = imageUrl.split('/').pop();
  const fileName = `ranpu_${fileId}`;
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
