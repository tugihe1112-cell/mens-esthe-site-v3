/**
 * 奈良県 全店舗セラピスト登録スクリプト
 * 実行: node scripts/maintenance/process_nara_therapists.mjs [--dry-run]
 */
import fs from 'fs';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const DRY_RUN = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = k => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';

async function fetchHtml(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(10000) });
  return res.text();
}

// ──────────── sepia collection (JS SPA → ハードコード) ────────────
const BASE_S3 = 'https://sepia-collection-bucket-prod.s3-ap-northeast-1.amazonaws.com/uploads/therapist_image/';
async function getSepiaCollection() {
  return [
    {name:'れみ', image_url:`${BASE_S3}image1/4/df070c45-6704-4c2d-ad0e-36964739db00.jpg`},
    {name:'まな', image_url:`${BASE_S3}image1/53/9e6c3c3a-3df7-41c3-bb4a-fcf95541d34b.jpg`},
    {name:'みやび', image_url:`${BASE_S3}image1/30/68269c1c-ee3f-4490-9f81-2839ab4bbcd7.jpg`},
    {name:'りの', image_url:`${BASE_S3}image1/88/804c036d-e292-42b8-84ba-282e4b1137f5.jpg`},
    {name:'みるく', image_url:`${BASE_S3}image1/105/1e197279-d2b5-4ed3-b1d2-19326550d391.jpg`},
    {name:'ゆあ', image_url:`${BASE_S3}image1/111/88138c17-4503-41ac-aa65-fe4aa507e4b4.jpg`},
    {name:'じゅり', image_url:`${BASE_S3}image1/21/06ca1fc6-df32-4f07-abac-ba38dd41c0d0.jpg`},
    {name:'あまね', image_url:`${BASE_S3}image1/87/6189b48a-69b3-4b45-9508-22fa8f505f9e.jpg`},
    {name:'すずね', image_url:`${BASE_S3}image1/76/8f2dda0e-cbdb-40be-8534-7e51eca1de98.jpg`},
    {name:'にた', image_url:`${BASE_S3}image1/110/ecd6554d-ba92-48d6-ab10-464ee63cb634.jpg`},
    {name:'ねこ', image_url:`${BASE_S3}image1/113/c86ff208-5330-449c-8c3b-36ba7608a605.jpg`},
    {name:'つき', image_url:`${BASE_S3}image1/95/1d5c6064-6a94-4769-a515-dac35d1c1fc3.jpg`},
    {name:'はつね', image_url:null},
    {name:'れいな', image_url:`${BASE_S3}image1/112/15b7e1d5-2da1-43cf-8078-9ee24c8a11d9.jpg`},
    {name:'なつみ', image_url:`${BASE_S3}image1/100/4bcbd286-18b1-4637-b90b-effa090a0598.jpg`},
    {name:'くれあ', image_url:`${BASE_S3}image1/107/a1e9cc02-8b15-4115-a5f7-aaf1cab46b54.jpg`},
    {name:'らら', image_url:`${BASE_S3}image1/108/a9abd04b-fcba-49f4-935d-898a200adc5a.jpg`},
    {name:'あかね', image_url:`${BASE_S3}image1/17/ffd89e5e-7a6b-4218-9b65-14af5e28e3c9.jpg`},
    {name:'めろん', image_url:`${BASE_S3}image1/29/4ff1bf9d-3b7f-4d44-9ad4-aa7b561b1d4e.jpg`},
    {name:'あんず', image_url:`${BASE_S3}image1/7/ae74d59e-6729-4803-90dc-af863b3a2e8f.jpg`},
    {name:'じあな', image_url:`${BASE_S3}image1/6/80b79960-7a65-48fd-bd83-89fa4f339931.jpg`},
    {name:'えま', image_url:`${BASE_S3}image1/12/c7d21c9a-5ce8-49a7-9710-a63839eac576.jpg`},
    {name:'れん', image_url:`${BASE_S3}image1/10/1c878465-97c1-4fdc-8ce9-3da547cb6220.jpg`},
    {name:'らん', image_url:`${BASE_S3}image1/82/62308898-6a5a-4532-9c9a-a518f1e0f302.jpg`},
    {name:'みなみ', image_url:`${BASE_S3}image1/62/4b9abecd-c3e4-4181-b1d3-6b6c56319e1d.jpg`},
    {name:'ゆりな', image_url:`${BASE_S3}image1/101/d62676af-f7b2-41ab-b218-0ccc36ab9e5a.jpg`},
    {name:'ゆとり', image_url:`${BASE_S3}image1/103/7edefbee-9858-403b-bc84-6a67ec6fa2a8.jpg`},
    {name:'ましろ', image_url:`${BASE_S3}image1/96/e50dcf5f-4817-4cdb-b08e-558cd104fc81.jpg`},
    {name:'きらり', image_url:`${BASE_S3}image1/106/72541cb8-678b-4c34-a3b9-9bf940fe2dd9.jpg`},
    {name:'おとか', image_url:`${BASE_S3}image1/97/cd8bb1d8-97cf-4f48-a513-bd7ce79890a3.jpg`},
    {name:'ひな', image_url:`${BASE_S3}image1/93/e72b5f55-8815-496c-b467-6aea3a96c5af.jpg`},
    {name:'れい', image_url:`${BASE_S3}image1/67/8ba086ce-18f4-4680-b307-e38c6f1e0afa.jpg`},
    {name:'さくら', image_url:`${BASE_S3}image1/86/94860811-4f26-47ca-80f3-eb79a8066c6e.jpg`},
    {name:'せいら', image_url:`${BASE_S3}image1/84/0a91dc74-8e1c-48a8-9771-b8729fe1c639.jpg`},
    {name:'ちゃちゃ', image_url:`${BASE_S3}image1/60/43a5c47c-847c-4fb0-a1d9-6b5e151438a3.jpg`},
    {name:'かりな', image_url:`${BASE_S3}image1/79/d9405401-bc95-4e87-942c-4af106bf7c61.jpg`},
    {name:'ともえ', image_url:`${BASE_S3}image1/90/67f8e81a-dae4-49b5-8ca6-196497f2a900.jpg`},
    {name:'あや', image_url:`${BASE_S3}image1/80/c9742154-27f2-44ea-a943-9cf34a80d7ab.jpg`},
    {name:'かれん', image_url:`${BASE_S3}image1/63/77a75348-b0ba-44f7-b6e7-6f4622797042.jpg`},
    {name:'すみれ', image_url:`${BASE_S3}image1/54/47f208a3-13bd-42ba-baae-6608535467d6.jpg`},
    {name:'ねね', image_url:`${BASE_S3}image1/64/d6efbe75-ffda-4f37-a19a-35795cf2a298.jpg`},
    {name:'つむぎ', image_url:`${BASE_S3}image1/26/63e0c5a8-bc98-4e3d-87a4-16e159fc314a.jpg`},
    {name:'きほ', image_url:`${BASE_S3}image1/23/440bf6d2-2a5c-421f-9bc7-e29d34082c4f.jpg`},
  ];
}

// ──────────── OLive (Jimdo CMS) ────────────
async function getOLive() {
  const html = await fetchHtml('https://www.olive-narao.com/therapist/');
  const $ = cheerio.load(html);
  const result = [];
  $('img[alt*="さん("]').each((_, el) => {
    const name = $(el).attr('alt').replace(/さん\(\d+\)/, '').trim();
    const src = $(el).attr('src') || '';
    if (name.length >= 2 && /[ぁ-んァ-ヾ一-龯]/.test(name)) result.push({ name, image_url: src });
  });
  return [...new Map(result.map(t => [t.name, t])).values()];
}

// ──────────── Moonlight (WordPress) ────────────
async function getMoonlight() {
  try {
    const html = await fetchHtml('https://moonlight-nara.com/therapist-introduction/');
    const text = html.replace(/<[^>]+>/g, ' ');
    const matches = text.match(/セラピスト名[^八楠浜巴香雨姫熊東綾桜藤朝蓮春秋]*([^\t\n]+)/g) || [];
    // 直接パターンマッチ
    const nameMatches = [...text.matchAll(/セラピスト名\s*([^\n\t<]{2,20})\s/g)];
    const names = nameMatches
      .map(m => m[1].replace(/（[^）]*）/g, '').replace(/\([^)]*\)/g, '').trim())
      .filter(n => /[ぁ-んァ-ヾ一-龯]/.test(n) && n.length >= 2 && n.length <= 15);
    return [...new Set(names)].map(name => ({ name, image_url: null }));
  } catch(e) {
    // フォールバック: ハードコード
    return ['八雲ゆな','楠木かえで','浜崎かれん','巴月ふうか','香月ゆあ','雨宮あんな',
      '姫川うた','熊田ゆり','東条あすか','綾瀬まい','桜みく','藤咲れいか',
      '朝比奈あん','蓮水りん','春風さくら','秋月くれは']
      .map(name => ({ name, image_url: null }));
  }
}

// ──────────── Karlovy colonnade (ハードコード) ────────────
async function getKarlovy() {
  return ['浦原くるみ','夢乃ひな','御影かすみ','梶ことり','桜みさ','愛瀬みれい',
    '長瀬らん','如月さな','楠木かえで','黒瀬みゆき','久保まゆり','佐藤葵']
    .map(name => ({ name, image_url: null }));
  // ※「ゆな（体験入店）」は除外
}

// ──────────── AROMA COCO (/photo/ パターン) ────────────
async function getAromaCoco() {
  const html = await fetchHtml('https://nara-aromacoco.com/therapist/');
  const $ = cheerio.load(html);
  const result = [];
  $('img[src*="/photo/"]').each((_, el) => {
    const rawName = ($(el).attr('alt') || '').replace(/新人[♪❤️♡]*\s*/g, '').replace(/（[^）]*）/g, '').replace(/\([^)]*\)/g, '').trim();
    const src = $(el).attr('src') || '';
    if (rawName.length >= 1 && /[ぁ-んァ-ヾ一-龯]/.test(rawName)) result.push({ name: rawName, image_url: src });
  });
  return [...new Map(result.map(t => [t.name, t])).values()];
}

// ──────────── THE THERAPIST CLUB (WordPress API) ────────────
async function getTherapistClub() {
  try {
    const res = await fetch('https://therapist-club.com/wp-json/wp/v2/posts?per_page=100&_fields=content');
    const data = await res.json();
    const allText = data.map(p => p.content?.rendered?.replace(/<[^>]+>/g, ' ') || '').join('\n');
    const nameMatches = [...allText.matchAll(/([^\s\n、。）]+)(?:\(\d+\)|（\d+）)/g)];
    const names = [...new Set(nameMatches.map(m => m[1].trim()))]
      .filter(n => /[ぁ-んァ-ヾ一-龯]/.test(n) && n.length >= 2 && n.length <= 8 && !/(エステ|メンズ|システム|予約|ラスト|NEW|出勤|セラピスト)/.test(n));
    return names.map(name => ({ name, image_url: null }));
  } catch { return []; }
}

// ──────────── HEAVENLY (ハードコード) ────────────
async function getHeavenly() {
  return ['きこ','もも','れん','めあ','いお','ゆう','くう']
    .map(name => ({ name, image_url: null }));
}

// ──────────── メイン処理 ────────────
const SHOPS = [
  { shopId: 'nara_nara_sepia_collection', fn: getSepiaCollection, label: 'sepia collection' },
  { shopId: 'nara_nara_olive',            fn: getOLive,           label: 'OLive' },
  { shopId: 'nara_nara_moonlight',        fn: getMoonlight,       label: 'Moonlight' },
  { shopId: 'nara_nara_karlovy',          fn: getKarlovy,         label: 'Karlovy colonnade' },
  { shopId: 'nara_nara_aroma_coco',       fn: getAromaCoco,       label: 'AROMA COCO' },
  { shopId: 'nara_ikoma_therapist_club',  fn: getTherapistClub,   label: 'THE THERAPIST CLUB' },
  { shopId: 'nara_tawaramoto_heavenly',   fn: getHeavenly,        label: 'HEAVENLY' },
];

console.log(`奈良 セラピスト登録 (dry-run: ${DRY_RUN})\n`);
let totalInserted = 0, totalSkipped = 0;

for (const { shopId, fn, label } of SHOPS) {
  console.log(`\n--- ${label} ---`);
  let therapists = [];
  try {
    therapists = await fn();
    console.log(`  取得: ${therapists.length}名`);
  } catch(e) { console.error(`  ERROR: ${e.message}`); continue; }
  if (!therapists.length) { console.log('  取得なし'); continue; }

  const { data: existing } = await supabase.from('therapists').select('name').eq('shop_id', shopId);
  const existingNames = new Set((existing||[]).map(t => t.name.replace(/[\s　]/g,'')));

  let inserted = 0, skipped = 0;
  for (const t of therapists) {
    if (existingNames.has(t.name.replace(/[\s　]/g,''))) { skipped++; continue; }
    if (!DRY_RUN) {
      const { error } = await supabase.from('therapists').upsert({
        id: `${shopId}_${t.name.replace(/\s+/g,'_')}`,
        shop_id: shopId, name: t.name, image_url: t.image_url || null
      }, { onConflict: 'id' });
      if (error) { console.error(`  ERROR: ${t.name}: ${error.message}`); continue; }
    }
    inserted++;
  }
  console.log(`  登録: ${inserted}名 / スキップ: ${skipped}名`);
  totalInserted += inserted; totalSkipped += skipped;
}

console.log(`\n============================`);
console.log(`合計 登録: ${totalInserted}名 / スキップ: ${totalSkipped}名 (dry-run: ${DRY_RUN})`);
