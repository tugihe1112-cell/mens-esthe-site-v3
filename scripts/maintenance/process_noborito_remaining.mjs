/**
 * 登戸エリア 残り2店舗 登録スクリプト
 *   - Fantastic (ファンタスティック) 4位 30名  images_staff パターン
 *   - moi SPA (モイスパ)             5位  9名  /images/ml_11_1_{id}.jpg パターン
 *
 * 実行:
 *   node scripts/maintenance/process_noborito_remaining.mjs --dry-run
 *   node scripts/maintenance/process_noborito_remaining.mjs
 *   node scripts/maintenance/process_noborito_remaining.mjs --shop fantastic
 *   node scripts/maintenance/process_noborito_remaining.mjs --shop moispa
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
    const res = await fetch(src, { headers: { 'User-Agent': UA, 'Referer': referer } });
    if (!res.ok) { process.stdout.write('!'); return null; }
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = src.split('?')[0].toLowerCase();
    const ct = ext.endsWith('.png') ? 'image/png' : 'image/jpeg';
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
    await new Promise(r => setTimeout(r, 200));
  }
  console.log(`\n  挿入:${ins} スキップ:${skp} エラー:${err}`);
}

// ===== Fantastic 30名 =====
const FANTASTIC_THERAPISTS = [
  {name:'池田ゆき',   src:'https://fantastic-esthe.jp/images_staff/135/052020061685.jpeg',  key:'fantastic_135'},
  {name:'浅野ゆな',   src:'https://fantastic-esthe.jp/images_staff/85/052621594212.jpeg',   key:'fantastic_85'},
  {name:'井川いろは', src:'https://fantastic-esthe.jp/images_staff/102/012500552623.jpeg',  key:'fantastic_102'},
  {name:'安藤かえで', src:'https://fantastic-esthe.jp/images_staff/113/072701503492.jpeg',  key:'fantastic_113'},
  {name:'白川ほのか', src:'https://fantastic-esthe.jp/images_staff/127/121617485193.jpeg',  key:'fantastic_127'},
  {name:'鹿波らい',   src:'https://fantastic-esthe.jp/images_staff/93/082117584723.jpeg',   key:'fantastic_93'},
  {name:'佐野しおり', src:'https://fantastic-esthe.jp/images_staff/54/081918422356.jpeg',   key:'fantastic_54'},
  {name:'小林ゆう',   src:'https://fantastic-esthe.jp/images_staff/123/092611184295.jpeg',  key:'fantastic_123'},
  {name:'水澤じゅん', src:'https://fantastic-esthe.jp/images_staff/45/112717345574.jpeg',   key:'fantastic_45'},
  {name:'山本しおん', src:'https://fantastic-esthe.jp/images_staff/130/031015420421.jpeg',  key:'fantastic_130'},
  {name:'雨宮ゆり',   src:'https://fantastic-esthe.jp/images_staff/75/08211755058.jpeg',    key:'fantastic_75'},
  {name:'黒崎まゆみ', src:'https://fantastic-esthe.jp/images_staff/59/061804231483.jpeg',   key:'fantastic_59'},
  {name:'佐藤まひる', src:'https://fantastic-esthe.jp/images_staff/98/083019152853.jpeg',   key:'fantastic_98'},
  {name:'涼宮こなた', src:'https://fantastic-esthe.jp/images_staff/125/010915373934.jpeg',  key:'fantastic_125'},
  {name:'藍澤華',     src:'https://fantastic-esthe.jp/images_staff/119/090814055146.jpeg',  key:'fantastic_119'},
  {name:'松岡れい',   src:'https://fantastic-esthe.jp/images_staff/103/081414123821.jpeg',  key:'fantastic_103'},
  {name:'一条ゆあ',   src:'https://fantastic-esthe.jp/images_staff/122/09231510079.jpeg',   key:'fantastic_122'},
  {name:'南野恵',     src:'https://fantastic-esthe.jp/images_staff/63/112717531595.jpeg',   key:'fantastic_63'},
  {name:'桂木藤子',   src:'https://fantastic-esthe.jp/images_staff/109/042316143915.jpeg',  key:'fantastic_109'},
  {name:'吉沢なみ',   src:'https://fantastic-esthe.jp/images_staff/101/011612385262.jpeg',  key:'fantastic_101'},
  {name:'椎木はな',   src:'https://fantastic-esthe.jp/images_staff/90/082315503669.jpeg',   key:'fantastic_90'},
  {name:'如月ゆい',   src:'https://fantastic-esthe.jp/images_staff/92/100117075580.jpeg',   key:'fantastic_92'},
  {name:'綾瀬れい',   src:'https://fantastic-esthe.jp/images_staff/89/090121272795.jpeg',   key:'fantastic_89'},
  {name:'深田みづき', src:'https://fantastic-esthe.jp/images_staff/94/110120331172.jpeg',   key:'fantastic_94'},
  {name:'天音ゆい',   src:'https://fantastic-esthe.jp/images_staff/36/112717251730.jpeg',   key:'fantastic_36'},
  {name:'七瀬とわ',   src:'https://fantastic-esthe.jp/images_staff/37/112717273438.jpg',    key:'fantastic_37'},
  {name:'上田まみ',   src:'https://fantastic-esthe.jp/images_staff/42/112717324514.jpeg',   key:'fantastic_42'},
  {name:'遠藤さやか', src:'https://fantastic-esthe.jp/images_staff/46/112717355399.jpeg',   key:'fantastic_46'},
  {name:'浅井みお',   src:'https://fantastic-esthe.jp/images_staff/52/112717422969.jpeg',   key:'fantastic_52'},
  {name:'斎藤りり',   src:'https://fantastic-esthe.jp/images_staff/62/112717511370.jpeg',   key:'fantastic_62'},
];

// ===== moi SPA 9名 =====
const MOISPA_THERAPISTS = [
  {name:'川奈',   src:'https://www.moi-spa.com/images/ml_11_1_2769.jpg',  key:'moispa_2769'},
  {name:'宇佐美', src:'https://www.moi-spa.com/images/ml_11_1_2778.jpg',  key:'moispa_2778'},
  {name:'三ツ倉', src:'https://www.moi-spa.com/images/ml_11_1_2781.jpg',  key:'moispa_2781'},
  {name:'名尾',   src:'https://www.moi-spa.com/images/ml_11_1_3561.jpg',  key:'moispa_3561'},
  {name:'槙野',   src:'https://www.moi-spa.com/images/ml_11_1_4490.jpg',  key:'moispa_4490'},
  {name:'葉月',   src:'https://www.moi-spa.com/images/ml_11_1_4513.jpg',  key:'moispa_4513'},
  {name:'宮前',   src:'https://www.moi-spa.com/images/ml_11_1_4532.jpg',  key:'moispa_4532'},
  {name:'都倉',   src:'https://www.moi-spa.com/images/ml_11_1_4569.jpg',  key:'moispa_4569'},
  {name:'波多野', src:'https://www.moi-spa.com/images/ml_11_1_4872.JPG',  key:'moispa_4872'},
];

async function main() {
  console.log(`=== 登戸残り2店舗 (DRY_RUN=${DRY_RUN}) ===\n`);

  if (run('fantastic')) {
    console.log('--- Fantastic (ファンタスティック) 30名 ---');
    await registerShop({
      id: 'kanagawa_kawasaki_noborito_fantastic',
      name: 'Fantastic (ファンタスティック)',
      website_url: 'https://fantastic-esthe.jp/',
      schedule_url: 'https://fantastic-esthe.jp/schedule.php',
      image_url: null,
      raw_data: { prefecture: '神奈川県', area: '登戸' },
    });
    await registerTherapists('kanagawa_kawasaki_noborito_fantastic', FANTASTIC_THERAPISTS, 'https://fantastic-esthe.jp/');
  }

  if (run('moispa')) {
    console.log('--- moi SPA (モイスパ) 9名 ---');
    await registerShop({
      id: 'kanagawa_kawasaki_noborito_moispa',
      name: 'moi SPA (モイスパ)',
      website_url: 'https://www.moi-spa.com/',
      schedule_url: 'https://www.moi-spa.com/schedule/',
      image_url: null,
      raw_data: { prefecture: '神奈川県', area: '登戸' },
    });
    await registerTherapists('kanagawa_kawasaki_noborito_moispa', MOISPA_THERAPISTS, 'https://www.moi-spa.com/');
  }

  console.log('\n=== 完了 ===');
}
main().catch(console.error);
