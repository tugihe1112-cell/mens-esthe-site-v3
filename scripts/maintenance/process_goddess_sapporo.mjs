/**
 * GODDESS BLESS (ゴッデスブレス) 札幌 - セラピスト35名登録
 * プロフィールページから画像ハッシュを動的取得
 *
 * 実行: node scripts/maintenance/process_goddess_sapporo.mjs [--dry-run]
 */
import fs from 'fs';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const DRY_RUN = process.argv.includes('--dry-run');
const SHOP_ID = 'hokkaido_sapporo_sapporo_goddess';
const PROFILE_BASE = 'https://goddess-bless.com/profile.php?sid=';

// [名前, sid] — ノイズエントリ(13928, 13891)を除いた35名
const THERAPISTS = [
  ['妃那（ひな）',   23437],
  ['安奈（あんな）', 23416],
  ['蓮（れん）',     23315],
  ['祈（いのり）',   23241],
  ['香音（かのん）', 23215],
  ['舞花（まいか）', 23102],
  ['乃蒼（のあ）',   23101],
  ['恋雪（こゆき）', 23060],
  ['紗里奈（さりな）', 22984],
  ['優愛（ゆあ）',   22828],
  ['澪桜（みお）',   22672],
  ['翼（つばさ）',   22621],
  ['舞莉弥（まりや）', 22565],
  ['渚紗（なぎさ）', 22534],
  ['芹花（せりか）', 22508],
  ['奏空（そあ）',   22089],
  ['陽咲（ひなた）', 21933],
  ['彩葉（いろは）', 21906],
  ['果南（かな）',   21902],
  ['桃音（もね）',   21690],
  ['花梨（かりん）', 21692],
  ['明泉（めい）',   21466],
  ['玲良（れいら）', 20650],
  ['凛（りん）',     20446],
  ['茉湖（まこ）',   19760],
  ['春陽（はる）',   18567],
  ['麻衣（まい）',   17851],
  ['梨沙（りさ）',   17394],
  ['瑠唯（るい）',   15957],
  ['裕奈（ゆうな）', 15571],
  ['杏（あん）',     14885],
  ['叶恋（かれん）', 14660],
  ['野の花（ののか）', 14369],
  ['瑠那（るな）',   13470],
  ['美結（みゆ）',   13471],
];

async function fetchProfileImage(sid) {
  try {
    const res = await fetch(`${PROFILE_BASE}${sid}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' }
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    // 最初の images_staff URL を取得
    let imgUrl = null;
    $(`img[src*="images_staff/313/${sid}/"]`).each((_, el) => {
      if (!imgUrl) imgUrl = $(el).attr('src');
    });
    return imgUrl || null;
  } catch (e) {
    console.warn(`  FETCH ERROR sid=${sid}:`, e.message);
    return null;
  }
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log(`👸 GODDESS BLESS セラピスト登録${DRY_RUN ? ' [DRY RUN]' : ''}`);

  // 既存レコード確認
  const { data: existing } = await supabase
    .from('therapists')
    .select('id')
    .eq('shop_id', SHOP_ID);
  const existingIds = new Set((existing || []).map(r => r.id));

  let inserted = 0, skipped = 0, errors = 0;

  for (const [name, sid] of THERAPISTS) {
    const id = `${SHOP_ID}_${name}`;
    if (existingIds.has(id)) {
      skipped++;
      continue;
    }

    // プロフィールページから画像URL取得
    process.stdout.write(`  ${name} (sid=${sid})...`);
    const image_url = await fetchProfileImage(sid);
    console.log(image_url ? ` ✓` : ` (名前のみ)`);

    if (DRY_RUN) {
      inserted++;
      await sleep(200);
      continue;
    }

    const { error } = await supabase.from('therapists').insert({
      id,
      shop_id: SHOP_ID,
      name,
      image_url
    });
    if (error) {
      if (error.code === '23505') skipped++;
      else { console.error(`  ❌ ${name}:`, error.message); errors++; }
    } else {
      inserted++;
    }

    await sleep(300); // サーバー負荷軽減
  }

  console.log(`\n✅ GODDESS BLESS: +${inserted} skip=${skipped} err=${errors}`);
}

main().catch(console.error);
