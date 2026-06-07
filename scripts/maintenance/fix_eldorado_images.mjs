/**
 * エルドラド 画像修正スクリプト（null画像を最新URLで更新）
 * caskan.com CDN: タイムスタンプが変わると404になるため再取得
 *
 * 実行:
 *   node scripts/maintenance/fix_eldorado_images.mjs --dry-run
 *   node scripts/maintenance/fix_eldorado_images.mjs
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const DRY_RUN = process.argv.includes('--dry-run');
const SHOP_ID = 'tokyo_setagaya_sangenjaya_eldorado';
const BASE_CDN = 'https://cdn2-caskan.com/caskan/img/cast_tmb/';

// Chrome経由で取得した最新URL（2026-06-06）
const THERAPISTS = [
  ['真白ひまり', '1750246597_5171968.jpeg'],
  ['夕季あおい', '1764843822_0356170.jpeg'],
  ['柚木かりん', '1778552697_3335807.jpg'],
  ['七瀬さら',   '1771504193_3420894.jpeg'],
  ['若槻あいり', '1774864933_6598138.jpeg'],
  ['一条あやみ', '1773441887_6438074.jpeg'],
  ['神巫りりあ', '1780570483_7612727.jpg'],
  ['橋本すず',   '1746380140_8003080.jpeg'],
  ['有村えみ',   '1759289303_3703221.jpeg'],
  ['藍川かれん', '1755908722_9781278.jpeg'],
  ['井野のぞみ', '1772343440_6517164.jpeg'],
  ['新山もあな', '1772393015_4619817.jpeg'],
  ['月野りさ',   '1772562606_4873839.jpeg'],
  ['小花うる',   '1755955157_4242489.jpeg'],
  ['白金おと',   '1728840295_1413653.jpeg'],
  ['成瀬みらい', '1780621992_3405527.jpg'],
  ['岸れいか',   '1731089555_1893275.jpg'],
  ['二階堂ゆあ', '1751712530_9496695.jpeg'],
  ['園田えま',   '1773624182_9196307.jpeg'],
  ['音嶋いおり', '1748341415_2449476.jpeg'],
  ['立山いちは', '1744117793_3135275.jpeg'],
  ['北川きょうか','1758686117_9814229.jpeg'],
  ['水瀬ここ',   '1747674404_5110776.jpeg'],
  ['中村ねる',   '1743766827_4658663.jpeg'],
  ['露里にじ',   '1775476004_1146297.jpeg'],
  ['上野ほのか', '1744476076_8336580.jpeg'],
  ['岸みなみ',   '1773624439_8447019.jpeg'],
  ['菊地ひな',   '1743736309_7995976.jpeg'],
  ['風間さやか', '1753249887_3177676.jpeg'],
  ['杉本あずさ', '1749006120_1865124.jpeg'],
  ['小寺しずく', '1748860599_0022088.jpeg'],
  ['藤宮みこ',   '1748073456_6684704.jpeg'],
  ['桜もも',     '1760800648_1948667.jpeg'],
  ['吉田りお',   '1752744849_6339666.jpeg'],
  ['南野さき',   '1750005582_9554381.jpeg'],
  ['広瀬かなえ', '1772914423_1444560.jpeg'],
  ['小川ゆき',   '1746372189_4153860.jpeg'],
  ['小島みずき', '1775922633_8320601.jpeg'],
  ['橘ことの',   '1760453277_9756833.jpeg'],
  ['三上なこ',   '1751808849_5896284.jpeg'],
  ['白石ゆりか', '1766939272_7895771.jpeg'],
  ['小泉かな',   '1743340896_3846977.jpeg'],
  ['雪村ゆめか', '1750741225_0723435.jpeg'],
  ['神宮寺りの', '1752634072_3649242.jpeg'],
  ['佐々木るみ', '1746450084_6477042.jpeg'],
  ['南ななか',   '1733468055_1922369.jpg'],
  ['菅野まゆ',   '1771504337_0049120.jpeg'],
  ['真夏ひまわり','1753885444_8557642.jpeg'],
  ['大塚ゆな',   '1754538382_1258277.jpeg'],
  ['手島ゆうな', '1773035905_3310153.jpeg'],
  ['楠木まいか', '1765972392_9567826.jpeg'],
  ['松浦ゆうは', '1772904518_3889037.jpeg'],
  ['伊藤なの',   '1754300578_1003708.jpeg'],
  ['霜月ななせ', '1756654376_6654596.jpeg'],
  ['天使なな',   '1761389418_8491448.jpeg'],
  ['立花うみか', '1757179298_1178521.jpeg'],
  ['冬月あまね', '1768552181_0934545.jpeg'],
  ['谷口みか',   '1777721335_2571507.jpeg'],
  ['月城りえ',   '1760339716_0592935.jpeg'],
  ['佐伯あん',   '1758706446_3589464.jpeg'],
  ['高梨かえで', '1759484602_9455200.jpeg'],
  ['城川みな',   '1762728275_8927461.jpeg'],
  ['白雪さな',   '1760970667_4713290.jpeg'],
  ['関谷ありさ', '1763835827_9246055.jpeg'],
  ['瀬戸かりな', '1765007860_0021721.jpeg'],
  ['広岡もえか', '1764664897_5588292.jpeg'],
  ['矢野えりか', '1764566333_5822320.jpeg'],
  ['植村のん',   '1780223619_1751435.jpg'],
  ['小崎みお',   '1769053887_7284092.jpeg'],
  ['坂口はるな', '1767799846_1158594.jpeg'],
  ['進藤ゆか',   '1772913600_5631311.jpeg'],
  ['市川みみ',   '1773443323_4944437.jpeg'],
  ['西宮みやび', '1768744103_0030639.jpeg'],
  ['涼宮りん',   '1752585122_1028516.jpeg'],
  ['藤原ちか',   '1772914120_5691928.jpeg'],
  ['神田りほ',   '1772914317_8308417.jpeg'],
  ['樋口みつは', '1772985796_4322530.jpeg'],
  ['皆川ゆずは', '1773175088_3369335.jpeg'],
  ['青山みれい', '1773442998_4153043.jpeg'],
  ['冬本ましろ', '1780621073_7980053.jpg'],
  ['皐月えみり', '1775367361_9710623.jpeg'],
  ['西川みさ',   '1779247001_6685929.jpg'],
  ['桜庭まな',   '1775367274_6937276.jpeg'],
  ['新田こはる', '1774328726_9907841.jpeg'],
  ['望月まい',   '1775718114_4129631.jpeg'],
  ['吉岡ここな', '1775718162_5906948.jpeg'],
  ['黒川みりあ', '1775719260_4737272.jpeg'],
  ['浅井とあ',   '1776355902_4557860.jpeg'],
  ['鳳かなめ',   '1776577681_2740505.jpeg'],
  ['河北えみる', '1776581104_6964616.jpeg'],
  ['今井りおん', '1776581588_0265017.jpeg'],
  ['小日向ふうか','1777025373_6747236.jpeg'],
  ['葛城ゆり',   '1777025438_2419074.jpeg'],
  ['潮見まなつ', '1777025601_1935356.jpeg'],
  ['宇佐美まりん','1777025691_7838049.jpeg'],
  ['桃井のどか', '1777796877_3266590.jpeg'],
  ['夏野うみ',   '1749528917_5230598.jpeg'],
  ['神崎かんな', '1779585882_2638977.jpg'],
  ['夏野なぎさ', '1778336758_9813752.jpg'],
  ['夢白のの',   '1779721453_7777139.jpg'],
  ['紅葉しおん', '1778886152_5304381.jpg'],
  ['桃瀬ここあ', '1779252322_4424936.jpg'],
  ['紫条つばき', '1779156141_8923167.jpg'],
  ['水色はる',   '1779190068_7332707.jpg'],
  ['貴色さーや', '1779195366_8411107.jpg'],
  ['蒼空 ことり','1779407546_4693044.jpg'],
  ['神楽　まや', '1779662877_8152461.jpg'],
  ['神野いのり', '1779659648_8445445.jpg'],
  ['黒咲るな',   '1779660496_3530116.jpg'],
  ['星野そら',   '1779661906_8300559.jpg'],
  ['猫夜みあ',   '1779849458_0024396.jpg'],
  ['苺あいす',   '1780361506_6843829.jpg'],
  ['絹瀬あみ',   '1780010302_3594995.jpg'],
  ['青空ひより', '1780234225_3100385.jpg'],
  ['美緑なのは', '1780326377_4462926.jpg'],
  ['舞風めあ',   '1780388327_8803397.jpg'],
  ['一ノ瀬らら', '1780325945_9521013.jpg'],
  ['天国 れい',  '1780622545_7295376.jpg'],
].map(([name, fn]) => ({
  name: name.replace(/\s+/g, ' ').trim(),
  src: `${BASE_CDN}${fn}`,
  key: `eldorado_${fn.replace(/\.[^.]+$/, '').slice(0, 22)}`,
}));

async function uploadImage(imgUrl, key) {
  try {
    const res = await fetch(imgUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) { process.stdout.write('!'); return null; }
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = imgUrl.split('.').pop().toLowerCase();
    const { error } = await supabase.storage.from('therapist-images').upload(`${key}.jpg`, buf, { contentType: 'image/jpeg', upsert: true });
    if (error) { process.stdout.write('!'); return null; }
    const { data } = supabase.storage.from('therapist-images').getPublicUrl(`${key}.jpg`);
    return data.publicUrl;
  } catch { process.stdout.write('!'); return null; }
}

async function main() {
  console.log(`=== エルドラド 画像修正 (DRY_RUN=${DRY_RUN}) ===`);
  console.log(`対象: ${THERAPISTS.length}名（nullのみ更新）\n`);

  if (DRY_RUN) {
    console.log('[DRY] nullのものだけ更新します');
    return;
  }

  let upd = 0, skip = 0, err = 0;
  for (const t of THERAPISTS) {
    const tid = `${SHOP_ID}_${t.name}`;
    const { data: ex } = await supabase.from('therapists').select('id,image_url').eq('id', tid).single();
    if (!ex) { process.stdout.write('?'); err++; continue; }
    if (ex.image_url) { process.stdout.write('='); skip++; continue; } // 写真ありはスキップ

    const url = await uploadImage(t.src, t.key);
    if (url) {
      const { error: updErr } = await supabase.from('therapists').update({ image_url: url }).eq('id', tid);
      if (updErr) { console.error(`\n✗ ${t.name}: ${updErr.message}`); err++; }
      else { process.stdout.write('+'); upd++; }
    } else {
      err++;
    }
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\n\n=== 完了 ===`);
  console.log(`更新: ${upd} / スキップ: ${skip} / エラー: ${err}`);
}
main().catch(console.error);
