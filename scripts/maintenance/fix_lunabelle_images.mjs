/**
 * Aroma Lunabelle 全5店舗 セラピスト写真登録
 * Chrome から取得した 71名 × /cast/img/{id}-1.jpg を Supabase Storage にアップロード
 * 実行: node scripts/maintenance/fix_lunabelle_images.mjs [--dry-run]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const BUCKET = 'therapist-images';
const BASE = 'https://aroma-lunabelle.com';
const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (DRY_RUN) console.log('[DRY RUN]\n');

const SHOP_IDS = [
  'tokyo_minato_azabujuban_lunabelle',
  'tokyo_shinagawa_gotanda_lunabelle',
  'tokyo_shinjuku_shinjuku_lunabelle',
  'tokyo_minato_shinbashi_lunabelle',
  'tokyo_chiyoda_akihabara_aroma_lunabelle_akihabara',
];

// Chrome /cast/ ページから取得した71名のデータ
const LUNA_DATA = [
  ['夏目れいな', BASE+'/cast/img/20-1.jpg'],
  ['吉井まゆ',   BASE+'/cast/img/100-1.jpg'],
  ['有村みさき', BASE+'/cast/img/87-1.jpg'],
  ['川端はな',   BASE+'/cast/img/63-1.jpg'],
  ['二階堂はる', BASE+'/cast/img/127-1.jpg'],
  ['森咲れいか', BASE+'/cast/img/103-1.jpg'],
  ['明日花ねね', BASE+'/cast/img/17-1.jpg'],
  ['花沢ちよ',   BASE+'/cast/img/95-1.jpg'],
  ['朝日奈みづき', BASE+'/cast/img/130-1.jpg'],
  ['咲本あすな', BASE+'/cast/img/83-1.jpg'],
  ['内山りお',   BASE+'/cast/img/147-1.jpg'],
  ['叶てまり',   BASE+'/cast/img/146-1.jpg'],
  ['西園寺ひめ', BASE+'/cast/img/145-1.jpg'],
  ['郡司ゆうき', BASE+'/cast/img/144-1.jpg'],
  ['三田そよか', BASE+'/cast/img/143-1.jpg'],
  ['桜庭ゆう',   BASE+'/cast/img/141-1.jpg'],
  ['今田まお',   BASE+'/cast/img/139-1.jpg'],
  ['高島みか',   BASE+'/cast/img/137-1.jpg'],
  ['国枝ましろ', BASE+'/cast/img/135-1.jpg'],
  ['田辺みなみ', BASE+'/cast/img/136-1.jpg'],
  ['瀬戸さらさ', BASE+'/cast/img/134-1.jpg'],
  ['白鳥もも',   BASE+'/cast/img/131-1.jpg'],
  ['国仲いずみ', BASE+'/cast/img/110-1.jpg'],
  ['土方こころ', BASE+'/cast/img/11-1.jpg'],
  ['芹沢みれい', BASE+'/cast/img/45-1.jpg'],
  ['福原まりん', BASE+'/cast/img/104-1.jpg'],
  ['笹本りんか', BASE+'/cast/img/39-1.jpg'],
  ['新垣ゆみ',   BASE+'/cast/img/122-1.jpg'],
  ['吉川りな',   BASE+'/cast/img/6-1.jpg'],
  ['月宮しおん', BASE+'/cast/img/128-1.jpg'],
  ['流川りょう', BASE+'/cast/img/14-1.jpg'],
  ['鈴木ゆの',   BASE+'/cast/img/126-1.jpg'],
  ['石川くる',   BASE+'/cast/img/112-1.jpg'],
  ['桜井ほのか', BASE+'/cast/img/69-1.jpg'],
  ['藤川なるみ', BASE+'/cast/img/10-1.jpg'],
  ['広末あやな', BASE+'/cast/img/36-1.jpg'],
  ['長峰すみれ', BASE+'/cast/img/101-1.jpg'],
  ['南ちなつ',   BASE+'/cast/img/125-1.jpg'],
  ['木村さとみ', BASE+'/cast/img/115-1.jpg'],
  ['水野なお',   BASE+'/cast/img/90-1.jpg'],
  ['滝川ななこ', BASE+'/cast/img/22-1.jpg'],
  ['田中あき',   BASE+'/cast/img/89-1.jpg'],
  ['羽月あい',   BASE+'/cast/img/105-1.jpg'],
  ['黒木まな',   BASE+'/cast/img/113-1.jpg'],
  ['渡辺せな',   BASE+'/cast/img/38-1.jpg'],
  ['矢澤さくら', BASE+'/cast/img/106-1.jpg'],
  ['竹田みく',   BASE+'/cast/img/8-1.jpg'],
  ['月野せいか', BASE+'/cast/img/132-1.jpg'],
  ['篠崎かすみ', BASE+'/cast/img/129-1.jpg'],
  ['本田ちひろ', BASE+'/cast/img/98-1.jpg'],
  ['泉しほ',     BASE+'/cast/img/52-1.jpg'],
  ['北川れみ',   BASE+'/cast/img/118-1.jpg'],
  ['倉科かれん', BASE+'/cast/img/74-1.jpg'],
  ['川口みな',   BASE+'/cast/img/72-1.jpg'],
  ['海老原えま', BASE+'/cast/img/79-1.jpg'],
  ['天野あやか', BASE+'/cast/img/107-1.jpg'],
  ['菊池みゆ',   BASE+'/cast/img/108-1.jpg'],
  ['大石けいこ', BASE+'/cast/img/109-1.jpg'],
  ['小倉ゆかり', BASE+'/cast/img/116-1.jpg'],
  ['椿りせ',     BASE+'/cast/img/121-1.jpg'],
  ['宮下えりさ', BASE+'/cast/img/40-1.jpg'],
  ['森さやか',   BASE+'/cast/img/66-1.jpg'],
  ['花咲しおり', BASE+'/cast/img/18-1.jpg'],
  ['内田ちさ',   BASE+'/cast/img/88-1.jpg'],
  ['一宮ひな',   BASE+'/cast/img/9-1.jpg'],
  ['渋谷りの',   BASE+'/cast/img/12-1.jpg'],
  ['神崎みさ',   BASE+'/cast/img/23-1.jpg'],
  ['稲葉えり',   BASE+'/cast/img/50-1.jpg'],
  ['月見ゆず',   BASE+'/cast/img/26-1.jpg'],
  ['中村ゆり',   BASE+'/cast/img/34-1.jpg'],
  ['白井もか',   BASE+'/cast/img/67-1.jpg'],
];

async function uploadImage(imageUrl, fileName) {
  try {
    const res = await fetch(imageUrl, {
      headers: { ...UA, Referer: BASE + '/' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) { console.log(`\n  HTTP ${res.status}: ${imageUrl}`); return null; }
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 512) return null;
    const { error } = await supabase.storage.from(BUCKET)
      .upload(fileName, buf, { contentType: 'image/jpeg', upsert: true });
    if (error) { console.log(`\n  Storage: ${error.message}`); return null; }
    return supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
  } catch (e) { console.log(`\n  fetch error: ${e.message}`); return null; }
}

console.log(`Aroma Lunabelle 写真登録 ${LUNA_DATA.length}名 × ${SHOP_IDS.length}店舗\n`);

let uploaded = 0, updated = 0, skipped = 0, notFound = 0;

for (const [name, imageUrl] of LUNA_DATA) {
  if (DRY_RUN) {
    console.log(`  ${name} → ${imageUrl.split('/').pop()}`);
    continue;
  }

  // Storageにアップロード（ファイル名はIDベース）
  const fileName = `lunabelle_${imageUrl.split('/').pop()}`;
  const storageUrl = await uploadImage(imageUrl, fileName);
  await sleep(80);

  if (!storageUrl) { process.stdout.write('!'); skipped++; continue; }
  uploaded++;

  // 全5店舗を更新（image_url が null のもののみ）
  let anyUpdated = false;
  for (const shopId of SHOP_IDS) {
    const id = `${shopId}_${name}`;
    const { data: existing } = await supabase.from('therapists')
      .select('id, image_url').eq('id', id).single();
    if (!existing) { notFound++; continue; }
    if (existing.image_url) continue; // 既に写真あり

    const { error } = await supabase.from('therapists')
      .update({ image_url: storageUrl }).eq('id', id);
    if (!error) { updated++; anyUpdated = true; }
  }
  process.stdout.write(anyUpdated ? '+' : '=');
  await sleep(60);
}

if (!DRY_RUN) {
  console.log(`\n\nStorage アップロード: ${uploaded}名`);
  console.log(`DB 更新: ${updated}件`);
  console.log(`アップロード失敗: ${skipped}名`);
  if (notFound > 0) console.log(`DB に存在しない: ${notFound}件`);
}
console.log('\n完了');
