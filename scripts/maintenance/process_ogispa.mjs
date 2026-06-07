/**
 * Ogi Spa (オギスパ) 荻窪 登録スクリプト (76名)
 * 公式: https://www.ogi-spa.com/
 * 画像パターン: /img/uploadfile/imgpc{timestamp}.{ext}  (alt に名前)
 * Storage key: ogispa_{filename_without_ext}
 *
 * 実行:
 *   node scripts/maintenance/process_ogispa.mjs --dry-run
 *   node scripts/maintenance/process_ogispa.mjs
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const DRY_RUN = process.argv.includes('--dry-run');
const BASE = 'https://www.ogi-spa.com';

const SHOP = {
  id: 'tokyo_suginami_ogikubo_ogi_spa',
  name: 'Ogi Spa (オギスパ)',
  website_url: `${BASE}/`,
  schedule_url: `${BASE}/schedule.html`,
  image_url: `${BASE}/img/uploadfile/img_1751327454.jpg`,
  raw_data: { prefecture: '東京都', area: '荻窪' },
};

// 76名 [name, filename] — Chrome DOM抽出済み
const THERAPISTS_RAW = [
  ['あやか','imgpc11779452052.jpeg'],['かのん','imgpc01778774549.jpg'],
  ['ねね','imgpc11779108734.jpeg'],['かなえ','imgpc11778662709.jpeg'],
  ['すい','imgpc21777139481.jpeg'],['ななせ','imgpc21775233305.jpeg'],
  ['かれん','imgpc01741949516.jpg'],['なつの','imgpc01772004151.jpeg'],
  ['かすみ','imgpc11745060679.jpg'],['みつ','imgpc01753920271.jpg'],
  ['みみ','imgpc11762610166.jpeg'],['こはる','imgpc01756460995.jpg'],
  ['のあ','imgpc01751459993.jpg'],['はづき','imgpc21776926726.jpeg'],
  ['ゆな','imgpc11768892269.jpeg'],['おと','imgpc11776926690.jpeg'],
  ['ハナ','imgpc01747405102.jpeg'],['きらり','imgpc01771665543.jpg'],
  ['ほのか','imgpc11760744126.jpg'],['ゆい','imgpc01779294706.jpg'],
  ['さな','imgpc21775387188.jpeg'],['ちい','imgpc11706534007.jpg'],
  ['ちか','imgpc01779294016.jpg'],['ゆら','imgpc11770214101.jpeg'],
  ['ふうか','imgpc21771134906.jpeg'],['もも','imgpc01773758139.jpg'],
  ['ちほ','imgpc21762616335.jpg'],['まほ','imgpc01726046535.jpg'],
  ['あんり','imgpc01768996172.jpg'],['れいな','imgpc21771316332.jpeg'],
  ['まい','imgpc21712657659.jpg'],['もね','imgpc01765034454.jpg'],
  ['あすか','imgpc11769599835.jpeg'],['のの','imgpc01768894688.jpg'],
  ['くるみ','imgpc11761821309.jpeg'],['あんず','imgpc01755500373.jpeg'],
  ['あん','imgpc01747506261.jpg'],['あい','imgpc01752893167.jpeg'],
  ['りほ','imgpc01766905279.jpg'],['さら','imgpc01757072028.jpg'],
  ['いむ','imgpc11760975205.jpeg'],['むぎ','imgpc11742902207.jpeg'],
  ['らん','imgpc01741870987.jpg'],['しゅうか','imgpc01748835571.jpeg'],
  ['りお','imgpc01758907489.jpeg'],['つばさ','imgpc21749802752.jpeg'],
  ['もか','imgpc11749994340.jpg'],['すず','imgpc01744392080.jpg'],
  ['れい','imgpc11681656059.jpg'],['よつば','imgpc11714285785.jpeg'],
  ['あお','imgpc01652846950.jpg'],['りさ','imgpc01660719734.jpg'],
  ['かほ','imgpc11729601680.jfif'],['まゆ','imgpc01717090854.jpg'],
  ['れあ','imgpc01707828102.jpg'],['りんか','imgpc01673356654.jpg'],
  ['みずき','imgpc01697682441.jpg'],['まいか','imgpc01662371713.jpeg'],
  ['ありな','imgpc01695892056.jpeg'],['こはく','imgpc01690812197.jpg'],
  ['よしの','imgpc01699242150.jpg'],['つき','imgpc01678535328.jpeg'],
  ['ちさと','imgpc11690189029.jpg'],['るな','imgpc01690968562.jpg'],
  ['れん','imgpc01676865322.jpg'],['さやか','imgpc01654164217.jpg'],
  ['えりな','imgpc01654074131.jpg'],['椿ゆん','imgpc01667296584.jpeg'],
  ['なこ','imgpc01654863533.jpg'],['さく','imgpc01682998555.jpg'],
  ['はる','imgpc01668074287.jpg'],['まりん','imgpc01667296726.jpg'],
  ['あや','imgpc01664607650.jpeg'],['らむ','imgpc01656250816.jpg'],
  ['りりか','imgpc01657088237.jpg'],['ゆりな','imgpc01657088594.jpg'],
].map(([name, fn]) => ({
  name,
  src: `${BASE}/img/uploadfile/${fn}`,
  key: 'ogispa_' + fn.replace(/\.[^.]+$/, ''),
}));

async function uploadImage(imgUrl, key) {
  try {
    const res = await fetch(imgUrl, { headers: { Referer: BASE, 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = imgUrl.split('.').pop().toLowerCase().replace('jfif','jpg');
    const ct = ext === 'png' ? 'image/png' : 'image/jpeg';
    const { error } = await supabase.storage.from('therapist-images').upload(`${key}.jpg`, buf, { contentType: ct, upsert: true });
    if (error) return null;
    const { data } = supabase.storage.from('therapist-images').getPublicUrl(`${key}.jpg`);
    return data.publicUrl;
  } catch { return null; }
}

async function main() {
  console.log(`=== Ogi Spa 登録 (DRY_RUN=${DRY_RUN}) ===`);
  console.log(`対象: ${THERAPISTS_RAW.length}名\n`);

  if (!DRY_RUN) {
    const { error } = await supabase.from('shops').upsert(SHOP, { onConflict: 'id' });
    if (error) console.error('Shop error:', error.message);
    else console.log(`✅ ${SHOP.id}`);
  } else {
    console.log(`[DRY] Shop: ${SHOP.name}`);
  }

  let ins = 0, skp = 0, err = 0;
  for (const t of THERAPISTS_RAW) {
    const tid = `${SHOP.id}_${t.name}`;
    const { data: ex } = await supabase.from('therapists').select('id,image_url').eq('id', tid).single();
    if (ex?.image_url) { process.stdout.write('='); skp++; continue; }

    const url = DRY_RUN ? t.src : await uploadImage(t.src, t.key);
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
  console.log(`挿入: ${ins} / スキップ: ${skp} / エラー: ${err}`);
}
main().catch(console.error);
