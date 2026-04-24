import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

function cleanseName(rawName) {
  if (!rawName) return '';
  // 全角スペースや半角スペースを削除して名前を詰める
  return rawName.replace(/[\s　]/g, '').trim();
}

const CONFIG = {
  // 古い店舗名で検索して上書きする
  searchKeyword: '%ウルレア%',
  searchKeyword2: '%リベア%',
  fallbackAreaId: 'tokyo_toshima_sugamo', // 巣鴨エリア
  shopName: 'UNICON (ユニコン)', // 新しい店舗名
  websiteUrl: 'https://unicon-sugamo.com/',
  scheduleUrl: 'https://unicon-sugamo.com/schedule',
  priceSystem: '70分コース ※割引適用外 13,000円\n90分コース 18,000円\n120分コース 24,000円\n150分コース 30,000円'
};

// HTMLから抽出したキャストデータ（40名）
const therapistsRaw = [
  { rawName: '加藤あやこ', size: '25歳 165㎝ (G)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1769603687_5386863.jpg' },
  { rawName: '上原ひまり', size: '23歳 160㎝ (C)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1775381239_6335571.jpg' },
  { rawName: '望月かすみ', size: '22歳 163㎝ (F)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1772343182_9682924.jpg' },
  { rawName: '桜咲こはな', size: '20歳 164㎝ (E)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1769604031_3279032.jpg' },
  { rawName: '咲真じゅり', size: '26歳 155㎝ (D)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1769603638_9857532.jpg' },
  { rawName: '椎名ひより', size: '24歳 163㎝ (E)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1773110646_7133067.jpg' },
  { rawName: '藤咲かのん', size: '27歳 153㎝ (F)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1773638488_6100225.jpg' },
  { rawName: '高咲れんげ', size: '20歳 161㎝ (F)', bio: '🔰新人🔰新人割で3000円OFF✨', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1772263879_4661064.jpg' },
  { rawName: '如月ゆりあ', size: '21歳 155㎝ (F)', bio: '🔰新人🔰新人割で3000OFF✨', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1775832947_7750103.jpg' },
  { rawName: '上条かんな', size: '22歳 167㎝ (I)', bio: '🔰新人🔰新人割で3000円OFF✨', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1775634139_7470100.jpg' },
  { rawName: '白咲ゆりか', size: '22歳 160㎝ (G)', bio: '🔰新人🔰新人割で3000円OFF✨', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1776351870_4270063.jpg' },
  { rawName: '中条のどか', size: '22歳 166㎝ (E)', bio: '🔰新人🔰新人割で3000円OFF✨', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1774365000_2583930.jpg' },
  { rawName: '森川すずね', size: '25歳 160㎝ (F)', bio: '🔰新人🔰新人割で3000円OFF✨', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1776169851_4657114.jpg' },
  { rawName: '佐伯あいり', size: '20歳 157㎝ (B)', bio: '🔰新人🔰新人割で3000円OFF✨', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1775838069_4212929.jpg' },
  { rawName: '黒夜さち', size: '21歳 157㎝ (H)', bio: '🔰新人🔰新人割で3000OFF✨', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1775579927_9883404.jpg' },
  { rawName: '小鳥遊める', size: '20歳 152㎝ (G)', bio: '🔰新人🔰新人割で3000円OFF✨', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1776521157_9948821.jpg' },
  { rawName: '空条ゆあ', size: '22歳 173㎝ (G)', bio: '🔰新人🔰新人割で3000円OFF✨', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1775362836_9121038.jpg' },
  { rawName: '小山くるみ', size: '23歳 161㎝ (G)', bio: '🔰新人🔰新人割で3000OFF✨', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1775457449_1494916.jpg' },
  { rawName: '北条あやみ', size: '25歳 154㎝ (G)', bio: '🔰新人🔰新人割で3000OFF✨', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1775047924_1945971.jpg' },
  { rawName: '久遠あやか', size: '18歳 163㎝ (C)', bio: '🔰新人🔰新人割で3000OFF✨', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1775990902_0436195.jpg' },
  { rawName: '渡辺みずき', size: '26歳 157㎝ (D)', bio: '🔰新人🔰新人割で3000円OFF✨', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1775500695_8496987.jpg' },
  { rawName: '月山るな', size: '25歳 154㎝ (C)', bio: '🔰新人🔰新人割で3000円OFF✨', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1774837088_6666633.jpg' },
  { rawName: '小柳りりむ', size: '22歳 153㎝ (F)', bio: '🔰新人🔰新人割で3000OFF✨', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1773924111_2727191.jpg' },
  { rawName: '浜崎あお', size: '26歳 158㎝ (E)', bio: '🔰新人🔰新人割で3000円OFF✨', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1775129095_4960652.jpg' },
  { rawName: '星音らら', size: '20歳 158㎝ (D)', bio: '🔰新人🔰新人割で3000円OFF✨', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1775230078_7624357.jpg' },
  { rawName: '本条なほ', size: '24歳 158㎝ (D)', bio: '🔰新人🔰新人割で3000OFF✨', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1775533769_9599049.jpg' },
  { rawName: '西野つばさ', size: '21歳 174㎝ (E)', bio: '🔰新人🔰新人割で3000円OFF✨', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1776233153_4788345.jpg' },
  { rawName: '谷口らな', size: '20歳 152㎝ (D)', bio: '🔰新人🔰新人割で3000円OFF✨', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1775130379_9811617.jpg' },
  { rawName: '百宮うさ', size: '23歳 163㎝ (E)', bio: '🔰新人🔰新人割で3000円OFF✨', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1773728760_1645621.jpg' },
  { rawName: '松下ねね', size: '20歳 166㎝ (C)', bio: '🔰新人🔰新人割で3000OFF✨', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1773488689_2309308.jpg' },
  { rawName: '梅田らむ', size: '20歳 149㎝ (E)', bio: '🔰新人🔰新人割で3000円OFF✨', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1773719777_6431428.jpg' },
  { rawName: '愛沢りょう', size: '20歳 169㎝ (C)', bio: '🔰新人🔰新人割で3000円OFF✨', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1774245864_3713782.jpg' },
  { rawName: '夜神きらら', size: '22歳 156㎝ (E)', bio: '🔰新人🔰新人割で3000円OFF✨', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1773802030_2520220.jpg' },
  { rawName: '西川ここな', size: '20歳 160㎝ (D)', bio: '🔰新人🔰新人割で3000円OFF✨', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1772710731_8503412.jpg' },
  { rawName: '倉敷いちご', size: '22歳 154㎝ (C)', bio: '🔰新人🔰新人割で3000円OFF✨', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1775455428_1946237.jpg' },
  { rawName: '天月ましろ', size: '22歳 148㎝ (C)', bio: '🔰新人🔰新人割で3000円OFF✨', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1772855210_2736457.jpg' },
  { rawName: '氷川るり', size: '22歳 155㎝ (F)', bio: '🔰新人🔰新人割で3000円OFF✨', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1773686117_5950336.jpg' },
  { rawName: '瀬尾かりな', size: '25歳 166㎝ (E)', bio: '🔰新人🔰新人割で3000円OFF✨', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1772477436_5169645.jpg' },
  { rawName: '東条なの', size: '20歳 163㎝ (E)', bio: '🔰新人🔰新人割で3000円OFF✨', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1773487935_1578110.jpg' },
  { rawName: '神崎さら', size: '22歳 164㎝ (F)', bio: '🔰新人🔰新人割で3000円OFF✨', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1773124165_1536984.jpg' },
  { rawName: '白帆いぶ', size: '24歳 160㎝ (C)', bio: '🔰新人🔰新人割で3000円OFF✨', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1775710669_6892560.jpg' },
  { rawName: '柏木むぎ', size: '23歳 154㎝ (F)', bio: '🔰新人🔰新人割で3000円OFF✨', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1774617370_2292443.jpg' },
  { rawName: '雀みいな', size: '21歳 154㎝ (D)', bio: '🔰新人🔰新人割で3000円OFF✨', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1772636288_5939306.jpg' },
  { rawName: '七瀬すず', size: '19歳 160㎝ (E)', bio: '🔰新人🔰新人割で3000円OFF✨', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1773719530_4669450.jpg' },
  { rawName: '黒田るる', size: '23歳 152㎝ (C)', bio: '🔰新人🔰新人割で3000円OFF✨', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1774801051_2738869.jpg' },
  { rawName: '北川れいな', size: '22歳 162㎝ (E)', bio: '🔰新人🔰新人割で3000円OFF✨', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1772101090_6221062.jpg' },
  { rawName: '市川あまね', size: '27歳 158㎝ (G)', bio: '🔰新人🔰新人割で3000円OFF✨', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1772107195_1656940.jpg' },
  { rawName: '桐谷まどか', size: '24歳 154㎝ (D)', bio: '🔰新人🔰新人割で3000円OFF✨', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1772370388_8646088.jpg' },
  { rawName: '菜月れむ', size: '24歳 153㎝ (G)', bio: '🔰新人🔰新人割で3000円OFF✨', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1771529206_6643590.jpg' },
  { rawName: '陽向つむぎ', size: '25歳 163㎝ (D)', bio: '🔰新人🔰新人割で3000円OFF✨', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1771485427_7964704.jpg' },
  { rawName: '紬えま', size: '23歳 155㎝ (E)', bio: '🔰新人🔰新人割で3000円OFF✨', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1770648260_5593407.jpg' },
  { rawName: '愛瀬みゆ', size: '25歳 165㎝ (E)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1769603672_0295541.jpg' },
  { rawName: '守屋みや', size: '21歳 152㎝ (E)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1771231865_4285716.jpg' },
  { rawName: '柳ゆら', size: '23歳 160㎝ (C)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1769603679_6511923.jpg' },
  { rawName: '橘ことね', size: '21歳 160㎝ (D)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1769603693_5427833.jpg' },
  { rawName: '森まな', size: '21歳 161㎝ (C)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1771229726_5486552.jpg' },
  { rawName: '水瀬さくら', size: '19歳 158㎝ (D)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1775480553_5844940.jpg' },
  { rawName: '山下かな', size: '21歳 154㎝ (E)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1774094679_9128761.jpg' },
  { rawName: '有村ゆきな', size: '28歳 146㎝ (C)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1774341467_0451018.jpg' },
  { rawName: '雪乃しずく', size: '21歳 165㎝ (F)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1769603935_3948967.jpg' },
  { rawName: '桜井りん', size: '20歳 160㎝ (D)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1772368654_8014286.jpg' },
  { rawName: '清水せいな', size: '22歳 155㎝ (D)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1769604102_3790555.jpg' },
  { rawName: '咲良えり', size: '23歳 163㎝ (E)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1769603877_2196469.jpg' },
  { rawName: '月瀬めぐ', size: '21歳 160㎝ (D)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1772368609_1560448.jpg' },
  { rawName: '日向るみ', size: '22歳 160㎝ (F)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1772368670_9330032.jpg' },
  { rawName: '鳳こばと', size: '23歳 165㎝ (E)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1772368616_2085659.jpg' },
  { rawName: '三咲うた', size: '24歳 (C)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1775361089_2032421.jpg' },
  { rawName: '矢倉ゆり', size: '25歳 157㎝ (D)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1769603948_8994697.jpg' },
  { rawName: '斉藤りあ', size: '24歳 154㎝ (C)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1773726694_2389357.jpg' },
  { rawName: '恋空れんか', size: '25歳 155㎝ (C)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1769604054_4704495.jpg' },
  { rawName: '多田ありす', size: '24歳 158㎝ (C)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1769604062_4141997.jpg' },
  { rawName: '成瀬ひなた', size: '23歳 147㎝ (D)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1772770183_6246368.jpg' },
  { rawName: '椿のぞみ', size: '27歳 157㎝ (F)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1774253791_5630914.jpg' },
  { rawName: '九条みこと', size: '23歳 160㎝ (E)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1769604167_3204979.jpg' },
  { rawName: '東雲なぎ', size: '20歳 160㎝ (E)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1769604123_4377803.jpg' },
  { rawName: '愛乃もあ', size: '21歳 159㎝ (F)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1769604088_2189391.jpg' },
  { rawName: '成宮みみ', size: '22歳 160㎝ (D)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1769604187_6382303.jpg' },
  { rawName: '峰本あんな', size: '20歳 155㎝ (B)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1769603969_2399230.jpg' },
  { rawName: '白石りさ', size: '28歳 (H)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1769603906_9996116.jpg' },
  { rawName: '結奈みつき', size: '29歳 159㎝ (E)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1769603982_8616372.jpg' },
  { rawName: '心花いちか', size: '21歳 161㎝ (F)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1769603870_1508959.jpg' },
  { rawName: '真白りい', size: '24歳 160㎝ (C)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1769604039_4711375.jpg' },
  { rawName: '矢吹せりな', size: '20歳 161㎝ (C)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1774842840_8647250.jpg' },
  { rawName: '藍月あむ', size: '21歳 156㎝ (G)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1770033697_4392598.jpg' },
  { rawName: '朝比奈みい', size: '22歳 (A)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1769604139_1397600.jpg' },
  { rawName: '高城りおな', size: '24歳 165㎝ (E)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1769604145_1858228.jpg' },
  { rawName: '恋瀬ひめ', size: '20歳 162㎝ (B)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1769604015_5727849.jpg' },
  { rawName: '姫川ももな', size: '20歳 153㎝ (C)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1769603859_8847747.jpg' },
  { rawName: '西園寺ゆいな', size: '23歳 158㎝ (E)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1772368579_6136223.jpg' },
  { rawName: '涼峰りりか', size: '22歳 157㎝ (G)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1769604009_9625912.jpg' },
  { rawName: '小此木まりあ', size: '29歳 170㎝ (H)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1769603900_5596911.jpg' },
  { rawName: '高木ゆうな', size: '28歳 154㎝ (G)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1769603989_1937881.jpg' },
  { rawName: '天野もえ', size: '24歳 158㎝ (G)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1772368631_6044249.jpg' },
  { rawName: '吉野なな', size: '24歳 157㎝ (C)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1772368623_1963620.jpg' },
  { rawName: '桜木もも', size: '22歳 163㎝ (D)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1769603892_3292308.jpg' },
  { rawName: '明日花なみ', size: '25歳 150㎝ (C)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1769604253_4511071.jpg' },
  { rawName: '叶なつき', size: '24歳 160㎝ (C)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1769604180_0571705.jpg' },
  { rawName: '天音りんか', size: '25歳 159㎝ (J)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1769604151_9374571.jpg' },
  { rawName: '宮脇あん', size: '25歳 163㎝ (D)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1769604318_9440711.jpg' },
  { rawName: '白崎みおな', size: '23歳 150㎝ (C)', bio: '🔰新人🔰新人割で3000円OFF✨', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1774539469_0201746.jpg' },
  { rawName: '初音ういか', size: '24歳 163㎝ (D)', bio: '🔰新人🔰新人割で3000円OFF✨', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1773764413_7601238.jpg' }
];

async function main() {
  console.log(`🚀 ${CONFIG.shopName}：ステップ① データ登録を開始します...\n`);
  const now = new Date().toISOString();
  
  try {
    // 1. 店舗の特定（旧店舗名「ウルレア」等で検索）
    let { data: shops, error: searchError } = await supabase
      .from('shops')
      .select('id')
      .or(`name.ilike.${CONFIG.searchKeyword},name.ilike.${CONFIG.searchKeyword2}`)
      .limit(1);

    if (searchError) throw searchError;

    const targetId = (shops && shops.length > 0) ? shops[0].id : crypto.randomUUID();

    if (shops?.length > 0) {
      console.log(`✅ 既存の「ウルレア」枠を発見しました。店舗名を「UNICON」に変更して上書きします。`);
    } else {
      console.log(`⚠️ 既存枠がないため、巣鴨エリアで新規IDを発行して登録します。`);
    }

    // 2. 店舗情報のUpsert (ここで名前が UNICON に切り替わります)
    console.log(`⚙️ 店舗データ(shops)を更新中...`);
    await supabase.from('shops').upsert({
      id: targetId,
      area_id: CONFIG.fallbackAreaId,
      name: CONFIG.shopName,
      website_url: CONFIG.websiteUrl,
      schedule_url: CONFIG.scheduleUrl,
      price_system: CONFIG.priceSystem
    });

    // 3. キャストデータの整形
    const payload = therapistsRaw.map(t => {
      const clean = cleanseName(t.rawName);
      return {
        id: `${targetId}_${clean}`,
        shop_id: targetId,
        name: clean,
        image_url: t.image?.trim() || null,
        is_active: true,
        last_seen_at: now,
        raw_data: { size: t.size, bio: t.bio || '', original_name: t.rawName }
      };
    });

    // キャストのUpsert実行
    console.log(`⚙️ セラピストデータ(therapists)を登録中...`);
    await supabase.from('therapists').upsert(payload);

    // 4. 自動退店処理（旧ウルレア時代にいて、現在UNICONにいないキャストを非表示）
    const { data: inactives } = await supabase.from('therapists')
      .update({ is_active: false })
      .eq('shop_id', targetId)
      .lt('last_seen_at', now)
      .select('name');

    console.log(`✅ ${payload.length} 名のキャスト情報を登録・更新しました。`);
    if (inactives?.length > 0) {
      console.log(`📉 今回取得できなかった旧キャスト ${inactives.length}名 を非表示にしました。`);
    }

    console.log('\n🎉 UNICON(ユニコン)のデータ登録（ステップ①）が完了しました！');
    console.log('ロゴ（ステップ②）の準備ができましたら、画像URLをお待ちしております。');

  } catch (err) {
    console.error('❌ エラー:', err);
  }
}

main();
