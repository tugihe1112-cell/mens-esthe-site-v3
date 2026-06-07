/**
 * fix_lynx_yokohama.mjs
 * Lynx 横浜関内店 93名登録（Chrome取得データ）
 * 実行: node scripts/maintenance/fix_lynx_yokohama.mjs [--dry-run]
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = k => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(
  getEnv('VITE_SUPABASE_URL'),
  getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('VITE_SUPABASE_ANON_KEY')
);
const DRY = process.argv.includes('--dry-run');

const BASE = 'https://admin.esthe-lynx-yokohama.com/photos/';

// 93名 (2026-06-07 Chrome取得)
const THERAPISTS = [
  { name: '七瀬りお',    img: `${BASE}349-20260606045955.jpg` },
  { name: '早瀬はる',    img: `${BASE}347-20260602035427.jpg` },
  { name: '黒瀬あい',    img: `${BASE}346-20260524022440.jpg` },
  { name: '星野みく',    img: `${BASE}345-20260523104551.jpg` },
  { name: '大依茶々',    img: `${BASE}343-20260512034250.jpg` },
  { name: '桜井ゆあ',    img: `${BASE}342-20260507010407.jpg` },
  { name: '柊なな',      img: `${BASE}341-20260521073338.jpg` },
  { name: '柏木いちか',  img: `${BASE}340-20260427113431.jpg` },
  { name: '桜町みお',    img: `${BASE}339-20260603122125.jpg` },
  { name: '七瀬るな',    img: `${BASE}337-20260413024545.jpg` },
  { name: '前田まゆ',    img: `${BASE}334-20260402091356.jpg` },
  { name: '有栖えみり',  img: `${BASE}333-20260604035654.jpg` },
  { name: '工藤えま',    img: `${BASE}332-20260603121116.jpg` },
  { name: '東条いず',    img: `${BASE}331-20260316052810.jpg` },
  { name: '大谷あいり',  img: `${BASE}330-20260307111856.jpg` },
  { name: '鈴音さな',    img: `${BASE}329-20260304092535.jpg` },
  { name: '糸師るり',    img: `${BASE}325-20260221074502.jpg` },
  { name: '皐　めい',    img: `${BASE}322-20260216051118.jpg` },
  { name: '鈴乃みいな',  img: `${BASE}320-20260427062631.jpg` },
  { name: '七星レイ',    img: `${BASE}317-20260606103528.jpg` },
  { name: '藤堂りか',    img: `${BASE}314-20260118015009.jpg` },
  { name: '成宮ゆき',    img: `${BASE}312-20260112045948.jpg` },
  { name: '小雪',        img: `${BASE}311-20260206104536.jpg` },
  { name: '木ノ葉もち',  img: `${BASE}310-20260316061421.jpg` },
  { name: '矢戸ひなた',  img: `${BASE}308-20260204010141.jpg` },
  { name: '野極めがみ',  img: `${BASE}306-20251220025132.jpg` },
  { name: '天乃あまね',  img: `${BASE}304-20260312032227.jpg` },
  { name: '花村ふみか',  img: `${BASE}302-20251219035142.jpg` },
  { name: '朔夜そら',    img: `${BASE}300-20251215112003.jpg` },
  { name: '夢野つむぎ',  img: `${BASE}297-20260503044706.jpg` },
  { name: '綾波まりん',  img: `${BASE}296-20260404125141.jpg` },
  { name: '秋月なな',    img: `${BASE}294-20251109061948.jpg` },
  { name: '川崎さき',    img: `${BASE}289-20260225123152.jpg` },
  { name: '桜木ちえり',  img: `${BASE}287-20251005045318.jpg` },
  { name: '中里ゆら',    img: `${BASE}284-20250923072836.jpg` },
  { name: '天音まや',    img: `${BASE}283-20250924061835.jpg` },
  { name: '甘露寺すぃ',  img: `${BASE}273-20251205113430.jpg` },
  { name: '白咲さあや',  img: `${BASE}272-20260329091004.jpg` },
  { name: '野崎りみ',    img: `${BASE}264-20260416064730.jpg` },
  { name: '長谷部ゆかり',img: `${BASE}241-20251001024956.jpg` },
  { name: '伊達ありす',  img: `${BASE}248-20260603102716.jpg` },
  { name: '瑞原かな',    img: `${BASE}234-20260513020120.jpg` },
  { name: '二葉ありさ',  img: `${BASE}10-20260410125142.jpg` },
  { name: '真白さら',    img: `${BASE}153-20260113020455.jpg` },
  { name: '月野もか',    img: `${BASE}250-20250806100614.jpg` },
  { name: '花かれん',    img: `${BASE}133-20250920062645.jpg` },
  { name: '野々原ちか',  img: `${BASE}252-20260406031506.jpg` },
  { name: '葵ゆな',      img: `${BASE}95-20250531034427.jpg` },
  { name: '安西くりす',  img: `${BASE}173-20250908094915.jpg` },
  { name: '上原れな',    img: `${BASE}257-20250426014550.jpg` },
  { name: '柏木まな',    img: `${BASE}256-20250420051152.jpg` },
  { name: '三上きほ',    img: `${BASE}255-20250414084008.jpg` },
  { name: '黒咲りり',    img: `${BASE}261-20250530034834.jpg` },
  { name: '吉川ひまり',  img: `${BASE}259-20250519055220.jpg` },
  { name: '矢口るり',    img: `${BASE}232-20250630120102.jpg` },
  { name: '一華のあ',    img: `${BASE}225-20250516043724.jpg` },
  { name: '春花ひなの',  img: `${BASE}199-20250627010201.jpg` },
  { name: '青木なつ',    img: `${BASE}192-20240921112833.jpg` },
  { name: '月雲こはく',  img: `${BASE}188-20250611123753.jpg` },
  { name: '松井りんね',  img: `${BASE}187-20240806045234.jpg` },
  { name: '小鳥遊すず',  img: `${BASE}166-20240921023257.jpg` },
  { name: 'ゆめのみく',  img: `${BASE}164-20240428063959.jpg` },
  { name: '瀬名なの',    img: `${BASE}156-20251117105402.jpg` },
  { name: '田中なみ',    img: `${BASE}155-20240305073910.jpg` },
  { name: '星野みこと',  img: `${BASE}144-20250627125909.jpg` },
  { name: '田中なこ',    img: `${BASE}138-20231227033445.jpg` },
  { name: '柊あんず',    img: `${BASE}137-20250611122803.jpg` },
  { name: '桃尻みれい',  img: `${BASE}136-20231211042516.jpg` },
  { name: '佐藤あやか',  img: `${BASE}132-20231123104404.jpg` },
  { name: '茅原いおり',  img: `${BASE}253-20250318024309.jpg` },
  { name: '瞳から',      img: `${BASE}74-20230506015157.jpg` },
  { name: '苺みるく',    img: `${BASE}72-20230430125556.jpg` },
  { name: '五十嵐れお',  img: `${BASE}67-20230421082548.jpg` },
  { name: '黒瀬もも',    img: `${BASE}66-20230418054156.jpg` },
  { name: '神田なぎ',    img: `${BASE}57-20230320042019.jpg` },
  { name: '黒石みほ',    img: `${BASE}54-20230223125652.jpg` },
  { name: '天海えいみ',  img: `${BASE}43-20230106091348.jpg` },
  { name: '春樹るる',    img: `${BASE}41-20221227052743.jpg` },
  { name: '結城えりな',  img: `${BASE}36-20250611123333.jpg` },
  { name: '三上りな',    img: `${BASE}34-20221126012454.jpg` },
  { name: '音羽かのん',  img: `${BASE}24-20260217121852.jpg` },
  { name: '綾瀬ちさと',  img: `${BASE}23-20221024111217.jpg` },
  { name: '東条あやめ',  img: `${BASE}21-20221024111002.jpg` },
  { name: '雨宮ひかる',  img: `${BASE}20-20221024111056.jpg` },
  { name: '雪野かなえ',  img: `${BASE}14-20221005043905.jpg` },
  { name: '藤原ほのか',  img: `${BASE}13-20221012083636.jpg` },
  { name: '成宮ゆか',    img: `${BASE}12-20221023031053.jpg` },
  { name: '胡桃もえ',    img: `${BASE}11-20221015043948.jpg` },
  { name: '星名ゆあ',    img: `${BASE}9-20221027081407.jpg` },
  { name: '田中れいな',  img: `${BASE}5-20220923081336.jpg` },
  { name: '河合あい',    img: `${BASE}4-20220923083238.jpg` },
  { name: '二見えな',    img: `${BASE}3-20250201122510.jpg` },
  { name: '鈴音ももか',  img: `${BASE}2-20221102023458.jpg` },
];

async function main() {
  const shopId = 'kanagawa_kannai_lynx';
  console.log(DRY ? '=== DRY RUN ===' : '=== LIVE RUN ===');
  console.log(`\n=== Lynx 横浜関内店 (${THERAPISTS.length}名) ===`);

  if (DRY) {
    THERAPISTS.slice(0, 3).forEach(t => console.log(`  DRY: ${t.name} 📷`));
    console.log(`  ... (残り${THERAPISTS.length - 3}件)`);
    return;
  }

  for (let i = 0; i < THERAPISTS.length; i += 50) {
    const batch = THERAPISTS.slice(i, i + 50).map(t => ({
      id: `${shopId}_${t.name}`,
      shop_id: shopId,
      name: t.name,
      image_url: t.img,
    }));
    const { error } = await supabase.from('therapists').upsert(batch, { onConflict: 'id', ignoreDuplicates: true });
    if (error) console.error(`  ERROR: ${error.message}`);
    else console.log(`  batch ${Math.floor(i / 50) + 1} OK: ${batch.length}件`);
  }
  console.log('\n=== 完了 ===');
}

main().catch(console.error);
