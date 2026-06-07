/**
 * 錦糸町 残り6店舗 登録スクリプト
 *   - High Time Spa     83名  /photos/{lid}/moto_{lid}.jpg
 *   - COCONA GRAN      103名  /photos/{lid}/moto_{lid}.jpg
 *   - Neo MIYABI        42名  /images/gals/{filename}
 *   - 撫子              28名  /girl/{dir}/{file}.jpg
 *   - Aroma Fairy       78名  /vars/imgs/profiles/{pid}/prof_thumb_1_s.jpg
 *   - LUXUE             49名  /photos/{lid}/moto_{lid}.jpg
 *
 * 実行:
 *   node scripts/maintenance/process_kinshicho_remaining.mjs --dry-run
 *   node scripts/maintenance/process_kinshicho_remaining.mjs
 *   node scripts/maintenance/process_kinshicho_remaining.mjs --shop hightime
 *   node scripts/maintenance/process_kinshicho_remaining.mjs --shop cocona
 *   node scripts/maintenance/process_kinshicho_remaining.mjs --shop neomiyabi
 *   node scripts/maintenance/process_kinshicho_remaining.mjs --shop nadeshiko
 *   node scripts/maintenance/process_kinshicho_remaining.mjs --shop fairy
 *   node scripts/maintenance/process_kinshicho_remaining.mjs --shop luxue
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const DRY_RUN = process.argv.includes('--dry-run');
const shopArg = (() => { const i = process.argv.indexOf('--shop'); return i >= 0 ? process.argv[i+1] : null; })();

// ===== High Time Spa =====
const HIGHTIME_SHOP = {
  id: 'tokyo_sumida_kinshicho_hightime_spa',
  name: 'High Time Spa (ハイタイムスパ)',
  website_url: 'https://hightime-spa.com/',
  schedule_url: 'https://hightime-spa.com/',
  image_url: 'https://hightime-spa.com/theme/mblme2bkgold012/images/dIcon.png',
  raw_data: { prefecture: '東京都', area: '錦糸町' },
};
const HIGHTIME_RAW = [
  ['遠山せりな','317'],['朝倉みお','250'],['武藤はるひ','237'],['山吹すず','118'],['伊藤めり','193'],
  ['水卜つばさ','287'],['瑠璃川みゆ','290'],['梓ゆきな','190'],['高橋あんず','96'],['天野もも','297'],
  ['清水なお','192'],['五月りお','175'],['桃井ねね','183'],['一ノ瀬ちか','299'],['橘えみり','199'],
  ['茜あすか','58'],['月夜野えみり','315'],['愛花ひめ','233'],['宇多野あおい','309'],['雫れんか','168'],
  ['春野そら','35'],['綾野えり','316'],['齋藤ひかり','313'],['川越にあ','307'],['渋谷めい','312'],
  ['夏希ねる','301'],['羽月ゆりか','284'],['似鳥かほ','296'],['三ノ宮なな','303'],['桜井みき','300'],
  ['七沢さな','263'],['真白れい','196'],['蘭あお','280'],['川口ななせ','260'],['夢前さりな','308'],
  ['逢沢あん','302'],['城田マナ','294'],['源しずか','293'],['夕木ふみ','288'],['藤森ゆりあ','304'],
  ['東雲アイ','181'],['和泉きら','271'],['一宮なみ','268'],['月野ゆいか','266'],['泉らな','256'],
  ['宇佐美とうあ','274'],['叶みおん','269'],['鈴川こはく','277'],['卯之町まり','254'],['白咲らむ','289'],
  ['天馬めぐり','273'],['花狩かな','264'],['蓮見あすか','242'],['胡蝶らん','255'],['天音まゆ','112'],
  ['一色なな','257'],['綾瀬さやか','248'],['永田えり','180'],['輝咲ゆめか','203'],['中条なこ','200'],
  ['松嶋みな','232'],['更科ゆき','197'],['香椎れな','320'],['日和かりな','279'],['芹澤えりか','244'],
  ['月乃もも','126'],['天海りせ','120'],['竹内はるか','174'],['桜木いおな','188'],['松山みる','182'],
  ['長浜りあ','145'],['星月るあ','187'],['佐々木まお','137'],['宮下うみ','134'],['桃瀬レナ','49'],
  ['七海のん','66'],['白姫すみれ','259'],['佐倉るな','169'],['けい','6'],['らむ','103'],
  ['苺谷みさ','57'],['伊吹リン','8'],['七海れい','71'],
].map(([name, lid]) => ({
  name,
  src: `https://hightime-spa.com/photos/${lid}/moto_${lid}.jpg`,
  key: `hightime_${lid}`,
}));

// ===== COCONA GRAN =====
const COCONA_SHOP = {
  id: 'tokyo_sumida_kinshicho_cocona_gran',
  name: 'COCONA GRAN (ここなグラン)',
  website_url: 'https://cocona-gran.com/',
  schedule_url: 'https://cocona-gran.com/schedule',
  image_url: 'https://cocona-gran.com/theme/mblme2whblue01/images/dIcon.png',
  raw_data: { prefecture: '東京都', area: '錦糸町' },
};
const COCONA_RAW = [
  ['桃城るる','462'],['星野そら','461'],['星川のあ','460'],['葵ゆづき','458'],['臼井おもち','456'],
  ['佐々木あいか','455'],['椿あや','454'],['佐々木めい','452'],['永瀬ゆか','451'],['桔梗ふうか','448'],
  ['湊らぶ','446'],['百瀬しずく','444'],['姫宮のの','442'],['水鏡しおり','440'],['天夏あさひ','439'],
  ['白石あんな','240'],['佐倉まどか','463'],['桜木ねね','441'],['桃乃木りな','41'],['椎名なほ','427'],
  ['水川あかり','425'],['渚くれあ','376'],['月島るい','434'],['成瀬ひな','426'],['酒井はる','432'],
  ['宮野さくら','431'],['泉水まい','428'],['吉沢えま','358'],['姫野みく','185'],['胡桃あむ','374'],
  ['一条あすか','373'],['澤田のぞみ','252'],['藤代まりな','291'],['信楽うずら','435'],['黄瀬れみ','418'],
  ['稲城いろは','424'],['永倉かな','417'],['結城おとは','414'],['月宮なこ','413'],['中澤ひめ','412'],
  ['加藤みいな','190'],['桜なお','430'],['白崎みおな','396'],['梅宮ゆい','384'],['星奈ゆめ','391'],
  ['西園寺みらい','377'],['金田れい','429'],['伊藤さおり','349'],['小森ゆうき','392'],['梶原まりん','388'],
  ['水凪ゆず','345'],['不知火きょうか','300'],['葉月まお','289'],['神座いずる','386'],['早見りお','403'],
  ['冬月みう','382'],['赤井もも','361'],['桜庭ひなの','329'],['林みいる','325'],['甘井あいす','378'],
  ['舞原くるみ','310'],['高梨ここあ','317'],['三神よつは','355'],['黒沢あかね','387'],['田中じゅり','279'],
  ['葵こはる','436'],['兎こいね','346'],['川嶋さな','177'],['後藤きらり','390'],['藤巻えりな','337'],
  ['寿るい','344'],['新井みお','154'],['桃瀬れん','278'],['秋山れのん','210'],['宇佐美ここ','258'],
  ['藤井りな','166'],['葉月あすな','238'],['星宮なな','327'],['橋本らん','162'],['黒木えりか','183'],
  ['神田りさ','150'],['愛咲るあ','79'],['安田みさ','161'],['久遠そら','365'],['涼音みおん','44'],
  ['月野うさぎ','63'],['花園かりん','234'],['中山みゆう','111'],['井上ひなた','107'],['七瀬なぎ','364'],
  ['生見める','362'],['笹川なり','370'],['桐谷さやか','406'],['右京かすみ','51'],['佐々木りり','333'],
  ['鈴谷かおり','437'],['柊うらら','402'],['猫瀬れの','375'],['如月れん','371'],['滝川せいら','49'],
  ['奥乃かりん','408'],['柚木えなこ','260'],['月乃すう','215'],
].map(([name, lid]) => ({
  name,
  src: `https://cocona-gran.com/photos/${lid}/moto_${lid}.jpg`,
  key: `cocona_${lid}`,
}));

// ===== Neo MIYABI =====
const NEOMIYABI_SHOP = {
  id: 'tokyo_sumida_kinshicho_neo_miyabi',
  name: 'Neo MIYABI (ネオ雅)',
  website_url: 'https://neo-miyabi.com/',
  schedule_url: null,
  image_url: 'https://neo-miyabi.com/common001/img/logos_imgb8ae33fcee05a8f5c6855d9c19aee702.png',
  raw_data: { prefecture: '東京都', area: '錦糸町' },
};
// name → filename (under https://neo-miyabi.com/images/gals/)
const NEOMIYABI_RAW = [
  ['朝比奈なお','g248_20260522001521.jpeg'],
  ['春山よもぎ','g255_20260507001655.JPG'],
  ['加納あずさ','g038_20260524225003.JPG'],
  ['星崎えり','g051_20260525193613.jpg'],
  ['篠田まい','g05_20260504182902.jpg'],
  ['愛沢みつり','g024_20260310190906.jpg'],
  ['夏川うみ','g021_20260222014428.jpg'],
  ['一条翼','g014_20251010214431.jpeg'],
  ['白咲せりな','g013_20251010214652.jpeg'],
  ['野島有紀子','g16_20260110054149.jpeg'],
  ['白井詠','g037_20260427002440.jpg'],
  ['小野寺百合華','g117_20260320195943.jpeg'],
  ['椿せい','g029_20251218213541.jpeg'],
  ['夢羽そら','g050_20260220180504.jpeg'],
  ['宇佐美茜','g039_20250204132259.jpg'],
  ['鈴夏ゆな','g135_20260604022153.JPG'],
  ['雪乃しろ','g052_20260301113742.jpeg'],
  ['青嶋美咲','g042_20260506163212.jpeg'],
  ['蒼井莉央','g032_20260220055647.jpg'],
  ['花里まり','g016_20260421223117.jpg'],
  ['滝川莉央','g015_20260219225538.jpg'],
  ['瀬戸みお','g011_20251115031504.jpg'],
  ['櫻井まりあ','g045_20260110053957.jpeg'],
  ['渋谷なつき','g047_20260205142240.jpeg'],
  ['戸村あかり','g02_20251203005725.jpg'],
  ['逢坂しの','g031_20251020223233.jpg'],
  ['綾瀬なな','g010_20260216182341.jpeg'],
  ['南ゆい','g07_20260402223041.jpg'],
  ['福田みさと','g023_20260226025328.JPG'],
  ['片瀬愛莉','g08_20251021042848.jpg'],
  ['及川えな','g136_20260407002845.jpg'],
  ['三島あや','g026_20251208210014.jpeg'],
  ['妃川さくら','g03_20260123163624.jpeg'],
  ['佐藤かすみ','g049_20260219233922.jpg'],
  ['本田','g028_20241002003720.jpg'],
  ['小倉花','g025_20241002002847.jpg'],
  ['岩崎まな','g030_20251107215836.jpeg'],
  ['仲間りこ','g018_20241002001025.jpg'],
  ['水野まき','g09_20241001220336.jpg'],
  ['南野鈴','g019_20241002001429.jpg'],
  ['白雪京花','g027_20241002003249.jpg'],
  ['村上あやか','g040_20250515054216.jpeg'],
].map(([name, fn]) => ({
  name,
  src: `https://neo-miyabi.com/images/gals/${fn}`,
  key: `neomiyabi_${fn.replace(/\.[^.]+$/, '').toLowerCase()}`,
}));

// ===== 撫子 =====
const NADESHIKO_SHOP = {
  id: 'tokyo_sumida_kinshicho_nadeshiko',
  name: '撫子 (なでしこ)',
  website_url: 'https://k.owl-nadeshiko.com/',
  schedule_url: null,
  image_url: 'https://k.owl-nadeshiko.com/images/common/logo.png',
  raw_data: { prefecture: '東京都', area: '錦糸町' },
};
// name → [dir, file] under https://k.owl-nadeshiko.com/girl/
const NADESHIKO_RAW = [
  ['望月あまね',['zwouja','penzqn.jpg']],
  ['黒木恋',['ftmscn','lozmxc.jpg']],
  ['織田ちさと',['uyhbcs','qepahy.jpg']],
  ['星野なな',['auwydh','drgpqd.jpg']],
  ['藤野りお',['otdccw','zwhmpi.jpg']],
  ['月野すず',['issduc','mvprzz.jpg']],
  ['蒼井華純',['blstnc','mwpncu.jpg']],
  ['篠原みお',['emsspl','pyfvqa.jpg']],
  ['古川すずえ',['hdkktp','ptmiqf.jpg']],
  ['清水しおり',['tpqtwv','eqrhzk.jpg']],
  ['福田あい',['nhpizg','hziafs.jpg']],
  ['青海まゆ',['bwnpad','cmeqow.jpg']],
  ['大原あん',['cbtrqi','oukcqr.jpg']],
  ['橘ひかり',['qnvbsz','votugv.jpg']],
  ['広瀬まこ',['kjbtwm','mrusjw.jpg']],
  ['南ゆあ',['gfzsxs','qtsrvo.jpg']],
  ['滝川ゆみこ',['bxdghe','xaslee.jpg']],
  ['小松えり',['ihkwoa','msascy.jpg']],
  ['芦名みこ',['dvlyqc','rhgram.jpg']],
  ['北川あすか',['cjbfha','imarzb.jpg']],
  ['白木みさき',['yqwkbr','iauyud.jpg']],
  ['白河あみ',['vzieya','yefhrt.jpg']],
  ['永瀬みい',['wujuif','wlmxuv.jpg']],
  ['木村美香',['mramuc','nciqze.jpg']],
  ['花咲芽衣',['ktsocb','pqvzfa.jpg']],
  ['堀田えみり',['crtbth','vvtmks.jpg']],
  ['佐々木嶺花',['ergsai','mecmwf.jpg']],
  ['真間ようこ',['pdlxdh','ntqwuz.jpg']],
].map(([name, [dir, file]]) => ({
  name,
  src: `https://k.owl-nadeshiko.com/girl/${dir}/${file}`,
  key: `nadeshiko_${dir}_${file.replace(/\.[^.]+$/, '')}`,
}));

// ===== Aroma Fairy =====
const FAIRY_SHOP = {
  id: 'tokyo_sumida_kinshicho_aroma_fairy',
  name: 'Aroma Fairy (アロマフェアリー)',
  website_url: 'https://aromafairy.net/',
  schedule_url: 'https://aromafairy.net/schedules/',
  image_url: 'https://aromafairy.net/ogp.jpg',
  raw_data: { prefecture: '東京都', area: '錦糸町' },
};
const FAIRY_RAW = [
  ['橋本ゆゆ','1019'],['鷹宮すみれ','1018'],['成田こう','1017'],['速水うる','1016'],['皐月みどり','1015'],
  ['花村まお','1013'],['木下もも','1012'],['橘れいな','1011'],['白石みお','1009'],['神崎りり','1008'],
  ['姫野るい','1006'],['水野みく','1005'],['香坂みち','1003'],['君乃のあ','1002'],['柳田めぐ','1001'],
  ['小山内あき','1000'],['湊さな','996'],['真白らな','995'],['星川めいみ','994'],['永瀬ゆうな','992'],
  ['花守さき','990'],['水原すい','989'],['夢野はづき','982'],['藍田あず','981'],['村上ねね','978'],
  ['早乙女さや','977'],['安達りのん','975'],['横山もか','974'],['鳴海みれい','973'],['神無月なつの','969'],
  ['河北ななほ','967'],['松田ふたば','964'],['藤本なな','963'],['柊いのり','962'],['三上みう','961'],
  ['鷲見はな','958'],['黒川あげは','957'],['水嶋みらい','952'],['上原なぎ','948'],['一之瀬ねる','945'],
  ['吉沢ひかり','944'],['水川あすか','940'],['桜庭えみり','937'],['白崎あめ','934'],['大橋かれん','932'],
  ['星野ゆめ','929'],['月足れい','924'],['香椎うめ','920'],['清水あおい','910'],['朝倉すず','904'],
  ['高森らん','897'],['絢瀬ななみ','896'],['小笠原かほ','894'],['松岡さり','886'],['後藤あやね','885'],
  ['有栖ひな','882'],['如月あや','881'],['愛沢ゆな','862'],['九井ゆきの','854'],['富田りか','834'],
  ['柏木ひかる','818'],['田中あい','798'],['赤沢りこ','787'],['森永せいか','772'],['三浦みま','770'],
  ['若月うた','758'],['篠本なつめ','730'],['篠原みくる','718'],['明日美りお','675'],['桜はる','639'],
  ['瀬那めあ','622'],['小森いづみ','609'],['神谷みほ','574'],['伊藤あよ','502'],['豊田まり','480'],
  ['椎名そら','444'],['加藤あんり','402'],['大沢ひなた','317'],
].map(([name, pid]) => ({
  name,
  src: `https://aromafairy.net/vars/imgs/profiles/${pid}/prof_thumb_1_s.jpg`,
  key: `fairy_${pid}`,
}));

// ===== LUXUE =====
const LUXUE_SHOP = {
  id: 'tokyo_sumida_kinshicho_luxue',
  name: 'LUXUE (ラグジュエ)',
  website_url: 'https://k-luxue.net/',
  schedule_url: 'https://k-luxue.net/schedule',
  image_url: 'https://k-luxue.net/theme/mblme2whgold01/images/dIcon.png',
  raw_data: { prefecture: '東京都', area: '錦糸町' },
};
const LUXUE_RAW = [
  ['紺野りあ','200'],['勅使河原ななみ','197'],['天音きょうか','195'],['佐々木あやの','194'],['中村もか','196'],
  ['花園きらら','182'],['西島まり','183'],['姫川あん','130'],['柊あこ','189'],['湊さな','192'],
  ['黒咲まいか','186'],['鈴木みれい','184'],['立花りこ','190'],['音無ういは','191'],['長谷川ねいろ','187'],
  ['山崎えな','171'],['藤井ほのか','128'],['里見みさ','185'],['愛川なごみ','179'],['坂口ひなの','176'],
  ['結城そら','129'],['白河あすか','177'],['有村りり','166'],['葵みお','133'],['瀬戸はるか','136'],
  ['藤堂かりん','174'],['早乙女すい','164'],['泉にこ','132'],['白石わかな','153'],['宇佐美りの','127'],
  ['中条あい','131'],['小松ゆゆ','173'],['夢咲あいな','135'],['青山えま','172'],['上村ふみの','155'],
  ['小桜いおり','159'],['白雪こはる','160'],['百瀬あすか','161'],['桜井りな','162'],['木村ゆあ','165'],
  ['愛瀬もも','167'],['七瀬いろは','170'],['如月さくら','150'],['椿ゆうな','146'],['藤咲みなみ','145'],
  ['一ノ瀬ひな','144'],['水瀬すず','143'],['一色ななこ','188'],['英せいか','199'],
].map(([name, lid]) => ({
  name,
  src: `https://k-luxue.net/photos/${lid}/moto_${lid}.jpg`,
  key: `luxue_${lid}`,
}));

// ===== 共通ユーティリティ =====
async function uploadImage(imgUrl, key) {
  try {
    const res = await fetch(imgUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) { process.stdout.write('!'); return null; }
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = imgUrl.split('?')[0].split('.').pop().toLowerCase();
    const ct = ext === 'png' ? 'image/png' : 'image/jpeg';
    const { error } = await supabase.storage.from('therapist-images').upload(`${key}.jpg`, buf, { contentType: ct, upsert: true });
    if (error) { process.stdout.write('!'); return null; }
    const { data } = supabase.storage.from('therapist-images').getPublicUrl(`${key}.jpg`);
    return data.publicUrl;
  } catch { process.stdout.write('!'); return null; }
}

async function registerShop(s) {
  if (DRY_RUN) { console.log(`[DRY] Shop: ${s.id}`); return; }
  const { error } = await supabase.from('shops').upsert(s, { onConflict: 'id' });
  if (error) console.error('Shop error:', error.message);
  else console.log(`✅ shop: ${s.id}`);
}

async function registerTherapists(shopId, therapists) {
  let ins = 0, skp = 0, err = 0;
  for (const t of therapists) {
    const tid = `${shopId}_${t.name}`;
    const { data: ex } = await supabase.from('therapists').select('id,image_url').eq('id', tid).single();
    if (ex?.image_url) { process.stdout.write('='); skp++; continue; }
    const url = (!DRY_RUN && t.src && t.key) ? await uploadImage(t.src, t.key) : (DRY_RUN && t.src ? t.src : null);
    if (DRY_RUN) { process.stdout.write(url ? '+' : 'n'); ins++; continue; }
    const { error } = await supabase.from('therapists').upsert(
      { id: tid, shop_id: shopId, name: t.name, image_url: url },
      { onConflict: 'id' }
    );
    if (error) { console.error(`\n✗ ${t.name}`, error.message); err++; }
    else { process.stdout.write(url ? '+' : 'n'); ins++; }
    await new Promise(r => setTimeout(r, 200));
  }
  console.log(`\n挿入:${ins} スキップ:${skp} エラー:${err}`);
}

async function main() {
  console.log(`=== 錦糸町6店舗 登録 (DRY_RUN=${DRY_RUN}) ===\n`);
  const run = (n) => !shopArg || shopArg === n;

  if (run('hightime')) {
    console.log(`--- High Time Spa ${HIGHTIME_RAW.length}名 ---`);
    await registerShop(HIGHTIME_SHOP);
    await registerTherapists(HIGHTIME_SHOP.id, HIGHTIME_RAW);
  }
  if (run('cocona')) {
    console.log(`--- COCONA GRAN ${COCONA_RAW.length}名 ---`);
    await registerShop(COCONA_SHOP);
    await registerTherapists(COCONA_SHOP.id, COCONA_RAW);
  }
  if (run('neomiyabi')) {
    console.log(`--- Neo MIYABI ${NEOMIYABI_RAW.length}名 ---`);
    await registerShop(NEOMIYABI_SHOP);
    await registerTherapists(NEOMIYABI_SHOP.id, NEOMIYABI_RAW);
  }
  if (run('nadeshiko')) {
    console.log(`--- 撫子 ${NADESHIKO_RAW.length}名 ---`);
    await registerShop(NADESHIKO_SHOP);
    await registerTherapists(NADESHIKO_SHOP.id, NADESHIKO_RAW);
  }
  if (run('fairy')) {
    console.log(`--- Aroma Fairy ${FAIRY_RAW.length}名 ---`);
    await registerShop(FAIRY_SHOP);
    await registerTherapists(FAIRY_SHOP.id, FAIRY_RAW);
  }
  if (run('luxue')) {
    console.log(`--- LUXUE ${LUXUE_RAW.length}名 ---`);
    await registerShop(LUXUE_SHOP);
    await registerTherapists(LUXUE_SHOP.id, LUXUE_RAW);
  }

  console.log('\n=== 完了 ===');
}
main().catch(console.error);
