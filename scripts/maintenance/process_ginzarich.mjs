/**
 * Ginza Rich (ginza-rich.work) — shop & therapist 登録スクリプト
 * 72名分のデータをハードコード済み
 *
 * 実行:
 *   node scripts/maintenance/process_ginzarich.mjs --dry-run
 *   node scripts/maintenance/process_ginzarich.mjs
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const DRY_RUN = process.argv.includes('--dry-run');
const BASE = 'https://ginza-rich.work';
const SHOP_ID = 'tokyo_chuo_ginza_rich';

// ginza-rich.work のトップページから取得した全セラピスト (72名)
// image_url: sys_img/ginza-rich/cast/{castId}/4/{timestamp}_{filename}.jpg
const THERAPISTS = [
  { castId: 184, name: '神山るり',   img: '17795921656183_神山.jpg' },
  { castId: 183, name: '葉山しずく', img: '1779970515951_修正後.jpg' },
  { castId: 182, name: '園いちか',   img: '17797586105515_HP.jpg' },
  { castId: 173, name: '篠原みう',   img: '17798698977322_HP.jpg' },
  { castId: 181, name: '河北れいな', img: '17797585390585_HP.jpg' },
  { castId: 175, name: '小泉ちひろ', img: '17792395980688_HP.jpg' },
  { castId: 180, name: '瀬戸つむぎ', img: '17793285036798_HP.jpg' },
  { castId: 179, name: '桜井ういか', img: '17797587077659_HP2.jpg' },
  { castId: 178, name: '長澤もも',   img: '17780457768767_HP.jpg' },
  { castId: 176, name: '牧瀬えりな', img: '17779527320833_重田HP.jpg' },
  { castId: 177, name: '坂口あやか', img: '17769088976638_HP.jpg' },
  { castId: 174, name: '向井こはる', img: '17766736136301_向井.jpg' },
  { castId: 172, name: '高坂おとは', img: '17774258197884_重田HP.jpg' },
  { castId: 170, name: '藤井みいな', img: '1776053888271_藤井545.jpg' },
  { castId: 171, name: '佐々木るりあ', img: '17788204573374_HP新.jpg' },
  { castId: 160, name: '稲村かのん', img: '17770072334211_重田HP.jpg' },
  { castId: 169, name: '佐伯かりな', img: '17751810691606_HP改.jpg' },
  { castId: 168, name: '今井あすか', img: '17747551878252_今井.jpg' },
  { castId: 159, name: '若槻ゆり',   img: '1777360701692_HP3.jpg' },
  { castId:  66, name: '関口かこ',   img: '17425731560639_関口かこ（目隠し）.jpg' },
  { castId: 145, name: '新木じゅり', img: '17647353954096_2025-12-03 - risin.jpg' },
  { castId: 146, name: '松村しほ',   img: '17677793552774_HP2.jpg' },
  { castId:   9, name: '安藤なつ',   img: '17549806363155_HP.jpg' },
  { castId:  60, name: '東條はすみ', img: '17689374980299_HP2.jpg' },
  { castId:   4, name: '生田みやび', img: '17387630906766_生田みやび3.jpg' },
  { castId:  25, name: '小嶋せりな', img: '17478324427546_小嶋新545900改.jpg' },
  { castId: 139, name: '紺野ありさ', img: '17743334736781_HP2.jpg' },
  { castId: 137, name: '小坂あんり', img: '17646440478621_HP.jpg' },
  { castId: 162, name: '岩本ひまり', img: '17751857382438_HP.jpg' },
  { castId: 111, name: '小松ゆあ',   img: '17545313888646_HP.jpg' },
  { castId: 124, name: '平子みお',   img: '17593706349512_HP2.jpg' },
  { castId:  87, name: '吉岡りり',   img: '17646483761322_HP.jpg' },
  { castId: 166, name: '飯島かれん', img: '17743340387671_HP.jpg' },
  { castId: 164, name: '八木いろは', img: '17780347703307_HP2.jpg' },
  { castId:  64, name: '高浪いあり', img: '17435568010232_HPモザ900545.jpg' },
  { castId: 163, name: '神谷えみり', img: '17732824996223_HP.jpg' },
  { castId: 119, name: '新川つかさ', img: '17625193984966_新川再修正.jpg' },
  { castId: 156, name: '武井ふうか', img: '1771832906658_武井2.jpg' },
  { castId: 154, name: '奥村かんな', img: '17705184815508_奥村.jpg' },
  { castId: 161, name: '大倉さえ',   img: '17714067236144_写メHP.jpg' },
  { castId:  75, name: '二宮なつき', img: '17646496598925_HP.jpg' },
  { castId: 147, name: '北川はな',   img: '17791597586705_HP3.jpg' },
  { castId: 142, name: '浦沢もな',   img: '17692298628344_HP.jpg' },
  { castId: 103, name: '福山ましろ', img: '17520225625734_HP.jpg' },
  { castId: 115, name: '宮沢はるか', img: '17743332620619_HP2.jpg' },
  { castId:  30, name: '杉本あおい', img: '17537130467524_545900.jpg' },
  { castId: 108, name: '橋本かりん', img: '17644019695343_HP.jpg' },
  { castId: 100, name: '大橋すず',   img: '17510160976721_HP.jpg' },
  { castId:  63, name: '中島るか',   img: '17410492482624_239118.jpg' },
  { castId: 110, name: '真野こころ', img: '17646505849585_HP.jpg' },
  { castId: 165, name: '近藤あいな', img: '1773723549028_HP.jpg' },
  { castId: 128, name: '桜田ひなは', img: '17602504805495_545900.1.jpg' },
  { castId: 133, name: '坂本ゆりな', img: '17618439767514_S__63299609.jpg' },
  { castId:  88, name: '榎本りおな', img: '17735730555448_改0314.jpg' },
  { castId: 148, name: '天使みな',   img: '17676507476965_HP.jpg' },
  { castId: 136, name: '仲間りほ',   img: '17640470099274_S__4661281.jpg' },
  { castId:  80, name: '上原みらい', img: '1746131341886_上原みらい.jpg' },
  { castId:  97, name: '久松みれい', img: '17549701172894_HP2.jpg' },
  { castId:  16, name: '岡本ほのか', img: '17452017058761_hpほくろ無.jpg' },
  { castId:  59, name: '藤原まり',   img: '17408859796023_藤原HP.jpg' },
  { castId:  89, name: '遠藤しおん', img: '17490214244122_重田HP.jpg' },
  { castId: 150, name: '青木ことは', img: '17688869510134_HP.jpg' },
  { castId:  94, name: '秋元まい',   img: '1750482559263_重田2HP545900.jpg' },
  { castId: 134, name: '北乃くるみ', img: '17676493551397_HP2.jpg' },
  { castId: 149, name: '平山ゆき',   img: '17688987891518_HP.jpg' },
  { castId: 152, name: '白川かなで', img: '17708690395185_HP.jpg' },
  { castId: 135, name: '里村ゆりあ', img: '17660154935603_HP新.jpg' },
  { castId: 114, name: '桐谷るい',   img: '17555963343834_HP.jpg' },
  { castId: 118, name: '有坂あかり', img: '17570553248385_HP.jpg' },
  { castId: 121, name: '姫野さら',   img: '17574900671258_本人.jpg' },
  { castId: 101, name: '高梨なぎさ', img: '17510880649337_Hp.jpg' },
  { castId:  46, name: '上野まほ',   img: '17384798483737_上野まほ1.jpg' },
];

function buildImageUrl(castId, img) {
  return `${BASE}/sys_img/ginza-rich/cast/${castId}/4/${img}`;
}

async function uploadImage(imageUrl, castId) {
  try {
    const res = await fetch(imageUrl, {
      headers: { Referer: BASE, 'User-Agent': 'Mozilla/5.0' }
    });
    if (!res.ok) { console.error(`  fetch failed: ${res.status}`); return null; }

    const buffer = Buffer.from(await res.arrayBuffer());
    const ext = imageUrl.split('.').pop().toLowerCase().split('?')[0];
    const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

    // ファイル名: castIdがユニークなのでそれをキーに使用
    const fileName = `ginzarich_${castId}.${ext === 'jpeg' ? 'jpg' : ext}`;

    const { error } = await supabase.storage
      .from('therapist-images')
      .upload(fileName, buffer, { contentType, upsert: true });

    if (error) { console.error(`  storage error:`, error.message); return null; }

    const { data } = supabase.storage.from('therapist-images').getPublicUrl(fileName);
    return data.publicUrl;
  } catch (e) {
    console.error(`  uploadImage error:`, e.message);
    return null;
  }
}

async function main() {
  console.log(`=== Ginza Rich 登録スクリプト (DRY_RUN=${DRY_RUN}) ===`);
  console.log(`対象: ${THERAPISTS.length}名\n`);

  // 1. shop 登録
  const shopData = {
    id: SHOP_ID,
    name: 'Ginza Rich (銀座リッチ)',
    website_url: `${BASE}/`,
    schedule_url: `${BASE}/`,   // トップページにスケジュールあり
    image_url: null,            // og:imageなし→後で設定可
    raw_data: { prefecture: '東京都', area: '銀座' },
  };

  if (!DRY_RUN) {
    const { error } = await supabase.from('shops').upsert(shopData, { onConflict: 'id' });
    if (error) console.error('Shop upsert error:', error.message);
    else console.log(`✅ Shop created: ${SHOP_ID}`);
  } else {
    console.log(`[DRY] Shop: ${JSON.stringify(shopData, null, 2)}`);
  }

  // 2. therapists 登録
  let inserted = 0, skipped = 0, errors = 0;

  for (const t of THERAPISTS) {
    const therapistId = `${SHOP_ID}_${t.name}`;

    // 既存チェック
    const { data: existing } = await supabase
      .from('therapists').select('id, image_url').eq('id', therapistId).single();

    if (existing?.image_url) {
      console.log(`= ${t.name} (既存・スキップ)`);
      skipped++;
      continue;
    }

    const imageUrl = buildImageUrl(t.castId, t.img);
    let storageUrl = null;

    if (!DRY_RUN) {
      process.stdout.write(`  Uploading ${t.name}... `);
      storageUrl = await uploadImage(imageUrl, t.castId);
      process.stdout.write(storageUrl ? '✓\n' : '✗\n');
    } else {
      console.log(`  [DRY] ${t.name}: ${imageUrl}`);
      storageUrl = imageUrl;
    }

    const record = {
      id: therapistId,
      shop_id: SHOP_ID,
      name: t.name,
      image_url: storageUrl,
    };

    if (!DRY_RUN) {
      const { error } = await supabase.from('therapists').upsert(record, { onConflict: 'id' });
      if (error) { console.error(`  ✗ DB error ${t.name}:`, error.message); errors++; }
      else inserted++;
    } else {
      inserted++;
    }

    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\n=== 完了 ===`);
  console.log(`挿入: ${inserted} / スキップ: ${skipped} / エラー: ${errors}`);
}

main().catch(console.error);
