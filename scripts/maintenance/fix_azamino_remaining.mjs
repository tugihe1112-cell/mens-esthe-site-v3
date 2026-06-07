/**
 * あざみ野 honoka・iDOL 追加登録スクリプト
 * (process_azamino_shops.mjs で取得失敗した2店舗)
 *
 * 実行:
 *   node scripts/maintenance/fix_azamino_remaining.mjs --dry-run
 *   node scripts/maintenance/fix_azamino_remaining.mjs
 *   node scripts/maintenance/fix_azamino_remaining.mjs --shop honoka
 *   node scripts/maintenance/fix_azamino_remaining.mjs --shop idol
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const DRY_RUN = process.argv.includes('--dry-run');
const shopArg = (() => { const i = process.argv.indexOf('--shop'); return i >= 0 ? process.argv[i+1] : null; })();
const run = (n) => !shopArg || shopArg === n;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';

async function uploadImage(src, key, referer) {
  if (!src) return null;
  try {
    const res = await fetch(src, { headers: { 'User-Agent': UA, ...(referer ? { 'Referer': referer } : {}) } });
    if (!res.ok) { process.stdout.write('!'); return null; }
    const buf = Buffer.from(await res.arrayBuffer());
    const ct = src.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
    const { error } = await supabase.storage.from('therapist-images').upload(`${key}.jpg`, buf, { contentType: ct, upsert: true });
    if (error) { process.stdout.write('E'); return null; }
    const { data } = supabase.storage.from('therapist-images').getPublicUrl(`${key}.jpg`);
    return data.publicUrl;
  } catch { process.stdout.write('!'); return null; }
}

async function registerShop(shop) {
  if (DRY_RUN) { console.log(`  [DRY] ${shop.id}`); return; }
  const { error } = await supabase.from('shops').upsert(shop, { onConflict: 'id' });
  if (error) console.error('  Shop error:', error.message);
  else console.log(`  ✅ ${shop.id}`);
}

async function registerTherapists(shopId, therapists, referer) {
  let ins = 0, skp = 0, err = 0;
  for (const t of therapists) {
    const tid = `${shopId}_${t.name}`;
    const { data: ex } = await supabase.from('therapists').select('id,image_url').eq('id', tid).single();
    if (ex?.image_url) { process.stdout.write('='); skp++; continue; }
    if (DRY_RUN) { process.stdout.write('+'); ins++; continue; }
    const url = await uploadImage(t.src, t.key, referer);
    const { error } = await supabase.from('therapists').upsert(
      { id: tid, shop_id: shopId, name: t.name, image_url: url },
      { onConflict: 'id' }
    );
    if (error) { err++; process.stdout.write('x'); }
    else { process.stdout.write(url ? '+' : 'n'); ins++; }
    await new Promise(r => setTimeout(r, 150));
  }
  console.log(`\n  挿入:${ins} スキップ:${skp} エラー:${err}`);
}

const HONOKA_THERAPISTS = [
  {name:'長良しのぶ', src:'https://honoka-yokohama.com/optImg/1005317/item/10039672/11143143_320_0.jpg', key:'honoka_11143143'},
  {name:'小島みかん', src:'https://honoka-yokohama.com/optImg/1005317/item/10039579/11142788_320_0.jpg', key:'honoka_11142788'},
  {name:'珠井りな',   src:'https://honoka-yokohama.com/optImg/1005317/item/10039178/11127282_320_0.jpg', key:'honoka_11127282'},
  {name:'市原みゆ',   src:'https://honoka-yokohama.com/optImg/1005317/item/10037476/11119218_320_0.jpg', key:'honoka_11119218'},
  {name:'河北みさと', src:'https://honoka-yokohama.com/optImg/1005317/item/10038857/11144323_320_0.jpg', key:'honoka_11144323'},
  {name:'戸川まいこ', src:'https://honoka-yokohama.com/optImg/1005317/item/10036049/11122114_320_0.jpg', key:'honoka_11122114'},
  {name:'相葉ゆう',   src:'https://honoka-yokohama.com/optImg/1005317/item/10038119/11122001_320_0.jpg', key:'honoka_11122001'},
  {name:'長峰ゆり',   src:'https://honoka-yokohama.com/optImg/1005317/item/10028688/11122570_320_0.jpg', key:'honoka_11122570'},
  {name:'月野みなみ', src:'https://honoka-yokohama.com/optImg/1005317/item/10028907/11100399_320_0.jpg', key:'honoka_11100399'},
  {name:'吉野まい',   src:'https://honoka-yokohama.com/optImg/1005317/item/10028779/11117612_320_0.jpg', key:'honoka_11117612'},
  {name:'松川ななみ', src:'https://honoka-yokohama.com/optImg/1005317/item/10028783/11122034_320_0.jpg', key:'honoka_11122034'},
  {name:'伊藤みつき', src:'https://honoka-yokohama.com/optImg/1005317/item/10028780/11100208_320_0.jpg', key:'honoka_11100208'},
  {name:'美羽かすみ', src:'https://honoka-yokohama.com/optImg/1005317/item/10030175/11100341_320_0.jpg', key:'honoka_11100341'},
  {name:'四宮そら',   src:'https://honoka-yokohama.com/optImg/1005317/item/10028783/11122035_320_0.jpg', key:'honoka_11122035'},
  {name:'井川たお',   src:'https://honoka-yokohama.com/optImg/1005317/item/10028786/11122198_320_0.jpg', key:'honoka_11122198'},
  {name:'広瀬ほなみ', src:'https://honoka-yokohama.com/optImg/1005317/item/10028785/11117839_320_0.jpg', key:'honoka_11117839'},
  {name:'片山むつみ', src:'https://honoka-yokohama.com/optImg/1005317/item/10028787/11100139_320_0.jpg', key:'honoka_11100139'},
  {name:'浜北しほ',   src:'https://honoka-yokohama.com/optImg/1005317/item/10028788/11117906_320_0.jpg', key:'honoka_11117906'},
  {name:'平松りおな', src:'https://honoka-yokohama.com/optImg/1005317/item/10028789/11100169_320_0.jpg', key:'honoka_11100169'},
  {name:'小倉ゆめ',   src:'https://honoka-yokohama.com/optImg/1005317/item/10028790/11121971_320_0.jpg', key:'honoka_11121971'},
  {name:'真下さとみ', src:'https://honoka-yokohama.com/optImg/1005317/item/10028784/11100091_320_0.jpg', key:'honoka_11100091'},
  {name:'藍川ちはる', src:'https://honoka-yokohama.com/optImg/1005317/item/10028693/11121227_320_0.jpg', key:'honoka_11121227'},
  {name:'波来しほり', src:'https://honoka-yokohama.com/optImg/1005317/item/10028695/11121836_320_0.jpg', key:'honoka_11121836'},
  {name:'夏木りょう', src:'https://honoka-yokohama.com/optImg/1005317/item/10028781/11121324_320_0.jpg', key:'honoka_11121324'},
  {name:'白河ゆい',   src:'https://honoka-yokohama.com/optImg/1005317/item/10028782/11126906_320_0.jpg', key:'honoka_11126906'},
  {name:'有村かな',   src:'https://honoka-yokohama.com/optImg/1005317/item/10028952/11122847_320_0.jpg', key:'honoka_11122847'},
  {name:'加藤さゆり', src:'https://honoka-yokohama.com/optImg/1005317/item/10028696/11121118_320_0.jpg', key:'honoka_11121118'},
  {name:'岸ゆうこ',   src:'https://honoka-yokohama.com/optImg/1005317/item/10028871/11123864_320_0.jpg', key:'honoka_11123864'},
  {name:'森田ひとみ', src:'https://honoka-yokohama.com/optImg/1005317/item/10028792/11122703_320_0.jpg', key:'honoka_11122703'},
  {name:'泉水いおり', src:'https://honoka-yokohama.com/optImg/1005317/item/10028793/11117984_320_0.jpg', key:'honoka_11117984'},
  {name:'今井あやの', src:'https://honoka-yokohama.com/optImg/1005317/item/10028794/11121429_320_0.jpg', key:'honoka_11121429'},
  {name:'綾瀬りか',   src:'https://honoka-yokohama.com/optImg/1005317/item/10028795/11122416_320_0.jpg', key:'honoka_11122416'},
  {name:'水野ゆりあ', src:'https://honoka-yokohama.com/optImg/1005317/item/10028796/11118104_320_0.jpg', key:'honoka_11118104'},
  {name:'桃田あさひ', src:'https://honoka-yokohama.com/optImg/1005317/item/10028797/11121548_320_0.jpg', key:'honoka_11121548'},
  {name:'滝澤めぐみ', src:'https://honoka-yokohama.com/optImg/1005317/item/10028798/11118216_320_0.jpg', key:'honoka_11118216'},
  {name:'星名のぞみ', src:'https://honoka-yokohama.com/optImg/1005317/item/10028799/11121673_320_0.jpg', key:'honoka_11121673'},
  {name:'藤崎ひかる', src:'https://honoka-yokohama.com/optImg/1005317/item/10028800/11122606_320_0.jpg', key:'honoka_11122606'},
  {name:'中丸まいこ', src:'https://honoka-yokohama.com/optImg/1005317/item/10028801/11121794_320_0.jpg', key:'honoka_11121794'},
  {name:'柏森のん',   src:'https://honoka-yokohama.com/optImg/1005317/item/10028802/11121867_320_0.jpg', key:'honoka_11121867'},
  {name:'能代もえ',   src:'https://honoka-yokohama.com/optImg/1005317/item/10028803/11118328_320_0.jpg', key:'honoka_11118328'},
];

const IDOL_THERAPISTS = [
  {name:'れい',        src:'https://idol-official.com/photos/25/moto_25.jpg', key:'idol_25'},
  {name:'白石あやの',  src:'https://idol-official.com/photos/2/moto_2.jpg',  key:'idol_2'},
  {name:'長谷川ゆん',  src:'https://idol-official.com/photos/3/moto_3.jpg',  key:'idol_3'},
  {name:'相馬るな',    src:'https://idol-official.com/photos/21/moto_21.jpg', key:'idol_21'},
  {name:'まどか',      src:'https://idol-official.com/photos/6/moto_6.jpg',  key:'idol_6'},
  {name:'ひな',        src:'https://idol-official.com/photos/17/moto_17.jpg', key:'idol_17'},
  {name:'ゆかり',      src:'https://idol-official.com/photos/20/moto_20.jpg', key:'idol_20'},
  {name:'さとう',      src:'https://idol-official.com/photos/11/moto_11.jpg', key:'idol_11'},
  {name:'あいかわあい',src:'https://idol-official.com/photos/18/moto_18.jpg', key:'idol_18'},
  {name:'さな',        src:'https://idol-official.com/photos/19/moto_19.jpg', key:'idol_19'},
  {name:'阿部あいり',  src:'https://idol-official.com/photos/4/moto_4.jpg',  key:'idol_4'},
  {name:'えり',        src:'https://idol-official.com/photos/8/moto_8.jpg',  key:'idol_8'},
  {name:'綾波しゅり',  src:'https://idol-official.com/photos/9/moto_9.jpg',  key:'idol_9'},
  {name:'のあ',        src:'https://idol-official.com/photos/10/moto_10.jpg', key:'idol_10'},
  {name:'黒瀬しおん',  src:'https://idol-official.com/photos/1/moto_1.jpg',  key:'idol_1'},
  {name:'浜乃みどり',  src:'https://idol-official.com/photos/15/moto_15.jpg', key:'idol_15'},
  {name:'りり',        src:'https://idol-official.com/photos/5/moto_5.jpg',  key:'idol_5'},
  {name:'りりか',      src:'https://idol-official.com/photos/12/moto_12.jpg', key:'idol_12'},
  {name:'桃乃木もえ',  src:'https://idol-official.com/photos/14/moto_14.jpg', key:'idol_14'},
];

async function main() {
  console.log(`=== あざみ野 honoka・iDOL 追加登録 (DRY_RUN=${DRY_RUN}) ===\n`);

  if (run('honoka')) {
    console.log('--- honoka (ほのか) センター南 40名 ---');
    await registerShop({
      id: 'kanagawa_yokohama_center_minami_honoka',
      name: 'honoka (ほのか) センター南',
      website_url: 'https://honoka-yokohama.com/',
      schedule_url: 'https://honoka-yokohama.com/scheduleAll.html',
      image_url: null,
      raw_data: { prefecture: '神奈川県', area: 'センター南' },
    });
    await registerTherapists('kanagawa_yokohama_center_minami_honoka', HONOKA_THERAPISTS, 'https://honoka-yokohama.com/');
  }

  if (run('idol')) {
    console.log('--- iDOL (アイドル) センター南 19名 ---');
    await registerShop({
      id: 'kanagawa_yokohama_center_minami_idol',
      name: 'iDOL (アイドル) センター南',
      website_url: 'https://idol-official.com/',
      schedule_url: 'https://idol-official.com/schedule',
      image_url: null,
      raw_data: { prefecture: '神奈川県', area: 'センター南' },
    });
    await registerTherapists('kanagawa_yokohama_center_minami_idol', IDOL_THERAPISTS, 'https://idol-official.com/');
  }

  console.log('\n=== 完了 ===');
}
main().catch(console.error);
