/**
 * Aroma Mrs (アロマミセス) 高田馬場 登録スクリプト (125名)
 * 公式: https://aroma-mrs.com/
 * 画像パターン: /therapist/up_img/{id}_1.jpg
 * Storage key: aromamrs_{id}
 *
 * 実行:
 *   node scripts/maintenance/process_aroma_mrs.mjs --dry-run
 *   node scripts/maintenance/process_aroma_mrs.mjs
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const DRY_RUN = process.argv.includes('--dry-run');
const BASE = 'https://aroma-mrs.com';

const SHOP = {
  id: 'tokyo_shinjuku_takadanobaba_aroma_mrs',
  name: 'Aroma Mrs (アロマミセス)',
  website_url: `${BASE}/`,
  schedule_url: `${BASE}/schedule.php`,
  image_url: `${BASE}/common/head_logo.png`,
  raw_data: { prefecture: '東京都', area: '高田馬場' },
};

// 125名 [name, id] — Chrome DOM抽出・innerText順とID順が対応
const THERAPISTS_RAW = [
  ['桃井加菜子','270'],['武田奈津美','271'],['癒し乃ほの','272'],['有馬 紫音','273'],
  ['浜辺りょう','274'],['白石麗奈','275'],['山田あすか','276'],['涼香あみ','277'],
  ['深澤れいか','278'],['高橋こはく','266'],['櫻井りりか','267'],['藤原れん','268'],
  ['近藤玲子','214'],['白雪すみれ','265'],['秋山さり','236'],['兎田 伊織','237'],
  ['水菜礼子','239'],['吉川ひまり','240'],['臼井亜美','241'],['伊藤ラン','244'],
  ['皐月ゆり','176'],['伊東あやの','245'],['美咲エリナ','248'],['初音かのん','249'],
  ['鳴海美帆','250'],['水野しおり','252'],['工藤えりか','253'],['森 日向','255'],
  ['牧瀬モモ','256'],['藍原 うみ','257'],['一条かおり','259'],['愛沢ましろ','260'],
  ['神田みのり','261'],['青田ヒカル','262'],['美波 渚','263'],['永野由依','264'],
  ['小泉 美咲','235'],['杉浦沙里','215'],['岡本茉莉奈','218'],['石田美鈴','220'],
  ['森田めぐる','221'],['坂本瑞希','223'],['日向みく','224'],['風間友香里','225'],
  ['成宮涼香','226'],['葵 奈々','227'],['茂木 茜','230'],['根本遥希','231'],
  ['草薙サラ','232'],['山下ゆう','233'],['内山紗理奈','234'],['大原蛍','212'],
  ['月野あかり','209'],['高坂夢乃','211'],['涼風 亜美','208'],['柏木瀬里奈','195'],
  ['西山遊里','196'],['桐谷 杏','202'],['夏目はな','203'],['星 聖良','206'],
  ['前田恵美','188'],['中居悠里','184'],['池野 朋子','189'],['菊池ゆり子','191'],
  ['瀬戸茉莉奈','193'],['鈴森かすみ','182'],['穂積 舞','175'],['島田玲','177'],
  ['原 莉乃','178'],['今平愛莉','180'],['田辺真琴','181'],['綾波レイコ','163'],
  ['結月はるか','167'],['有川未来','169'],['川崎ゆあ','170'],['桜田美香','171'],
  ['星月 奈美','161'],['中村沙希','173'],['浅見花蓮','155'],['松島 のん','156'],
  ['花咲もえ','92'],['松浦あおい','164'],['大崎日奈子','158'],['長浜あさひ','83'],
  ['春菜桜子','114'],['木下ゆずな','152'],['杉山彩','151'],['天音りん','147'],
  ['芹沢アンナ','145'],['長瀬樹里','137'],['三好りこ','27'],['櫻井ほなみ','141'],
  ['高石ゆさ','138'],['弓浜らん','140'],['東堂まき','87'],['上原美月','136'],
  ['希崎くらら','134'],['葉月もな','131'],['水瀬アリサ','119'],['宮本紀香','122'],
  ['神野ひな','112'],['雪乃るり','115'],['池田かすみ','111'],['佐々木 令子','98'],
  ['増田涼','107'],['神崎 愛','100'],['赤城ゆう','67'],['堂本さやか','57'],
  ['藤原凛華','95'],['京乃　あずさ','2'],['一条　ひとみ','3'],['小鳥遊るり','93'],
  ['愛原 那奈','81'],['中川水樹','78'],['白石まりな','15'],['斎藤不二子','43'],
  ['城咲さら','13'],['南野果歩','9'],['小林志乃','39'],['千堂なぎさ','75'],
  ['桃ノ木まどか','28'],['本条友梨','71'],['河合まい','5'],
].map(([name, id]) => ({
  name: name.replace(/\s+/g, ' ').trim(),
  id,
  src: `${BASE}/therapist/up_img/${id}_1.jpg`,
  key: `aromamrs_${id}`,
}));

async function uploadImage(imgUrl, key) {
  try {
    const res = await fetch(imgUrl, { headers: { Referer: BASE, 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = imgUrl.split('.').pop().toLowerCase();
    const ct = ext === 'png' ? 'image/png' : 'image/jpeg';
    const { error } = await supabase.storage.from('therapist-images').upload(`${key}.jpg`, buf, { contentType: ct, upsert: true });
    if (error) return null;
    const { data } = supabase.storage.from('therapist-images').getPublicUrl(`${key}.jpg`);
    return data.publicUrl;
  } catch { return null; }
}

async function main() {
  console.log(`=== Aroma Mrs 登録 (DRY_RUN=${DRY_RUN}) ===`);
  console.log(`対象: ${THERAPISTS_RAW.length}名\n`);

  if (!DRY_RUN) {
    const { error } = await supabase.from('shops').upsert(SHOP, { onConflict: 'id' });
    if (error) console.error('Shop error:', error.message);
    else console.log(`✅ ${SHOP.id}`);
  } else {
    console.log(`[DRY] Shop: ${SHOP.name}`);
  }

  let ins = 0, skp = 0, err = 0, noImg = 0;
  for (const t of THERAPISTS_RAW) {
    const tid = `${SHOP.id}_${t.name}`;
    const { data: ex } = await supabase.from('therapists').select('id,image_url').eq('id', tid).single();
    if (ex?.image_url) { process.stdout.write('='); skp++; continue; }

    const url = DRY_RUN ? t.src : await uploadImage(t.src, t.key);
    if (!url && !DRY_RUN) noImg++;

    const record = { id: tid, shop_id: SHOP.id, name: t.name, image_url: url };
    if (!DRY_RUN) {
      const { error } = await supabase.from('therapists').upsert(record, { onConflict: 'id' });
      if (error) { console.error(`\n✗ ${t.name}`); err++; }
      else { process.stdout.write(url ? '+' : 'n'); ins++; }
    } else {
      process.stdout.write('+'); ins++;
    }
    await new Promise(r => setTimeout(r, 200));
  }
  console.log(`\n\n=== 完了 ===`);
  console.log(`挿入: ${ins} / スキップ: ${skp} / 画像なし: ${noImg} / エラー: ${err}`);
}
main().catch(console.error);
