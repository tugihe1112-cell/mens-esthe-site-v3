import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

function cleanseName(rawName) {
  if (!rawName) return '';
  // 「🟠」や「(立)」などの余計な記号を削除
  return rawName.replace(/🟠|\(立\)/g, '').trim();
}

const CONFIG = {
  searchKeyword: '%むちむちお姉さん%',
  fallbackAreaId: 'tokyo_toshima_ikebukuro', // 新規作成時のデフォルトエリア
  shopName: 'むちむちお姉さん',
  websiteUrl: 'https://muchi2onesan.com',
  scheduleUrl: 'https://muchi2onesan.com/schedule',
  priceSystem: '100分 24,000円\n130分 30,000円\n160分 36,000円'
};

// HTMLから抽出したキャストデータ（40名）
const therapistsRaw = [
  { rawName: '成海るか', size: '30歳 163㎝ (G)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1773077380_0326721.jpg' },
  { rawName: '吉永ゆり', size: '48歳 155㎝ (E)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1765897467_3485140.jpg' },
  { rawName: '天野えま', size: '41歳 158㎝ (G)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1775129907_0039768.jpg' },
  { rawName: '園田しほり', size: '40歳 157㎝ (F)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1775532151_9666977.jpg' },
  { rawName: '深田めぐみ', size: '35歳 158㎝ (I)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1766931710_2485510.jpg' },
  { rawName: '渡辺なおみ🟠', size: '28歳 157㎝ (G)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1765264055_9642366.jpg' },
  { rawName: '成澤みか', size: '41歳 168㎝ (G)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1765264167_2629261.jpg' },
  { rawName: '新垣くう', size: '28歳 161㎝ (J)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1775995094_1841773.jpg' },
  { rawName: '森しずか', size: '36歳 162㎝ (F)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1749194763_5784829.jpg' },
  { rawName: '黒木まゆ', size: '38歳 168㎝ (I)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1772625039_4138220.jpg' },
  { rawName: '藤田ゆず', size: '36歳 158㎝ (G)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1775966296_4210991.jpg' },
  { rawName: '白鳥めい', size: '36歳 164㎝ (G)', bio: '無邪気な笑顔で♡気づけば夢中', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1774975737_3208338.jpg' },
  { rawName: '西野ゆめ', size: '37歳 150㎝ (K)', bio: '絡みつき密着♡とろける大人の癒し', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1774974897_6924411.jpg' },
  { rawName: '七瀬りり', size: '33歳 150㎝ (D)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1772543627_0944753.jpg' },
  { rawName: '葵すずか', size: '46歳 159㎝ (F)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1766751559_9400760.jpg' },
  { rawName: '天音りお', size: '151㎝ (F)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1775284475_2805503.jpg' },
  { rawName: '蓮見しおん', size: '42歳 165㎝ (G)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1768182557_3604392.jpg' },
  { rawName: '壇けい', size: '32歳 160㎝ (K)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1765264159_7114212.jpg' },
  { rawName: '菊池あんな', size: '40歳 158㎝ (H)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1776159576_5845304.jpg' },
  { rawName: '立花いおり', size: '39歳 147㎝ (F)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1766674316_1418751.jpg' },
  { rawName: '紺野ましろ', size: '29歳 158㎝ (G)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1772894809_4129491.jpg' },
  { rawName: '柊まな', size: '33歳 153㎝ (H)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1765263810_8181100.jpg' },
  { rawName: '斎藤はな', size: '38歳 162㎝ (G)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1776304675_9933711.jpg' },
  { rawName: '真白ゆな', size: '41歳 158㎝ (E)', bio: 'トロけ落ちる♡大人時間', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1773566044_5741225.jpg' },
  { rawName: '唐沢ゆりか', size: '38歳 156㎝ (L)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1773310445_1275055.jpg' },
  { rawName: '小泉れい', size: '31歳 162㎝ (G)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1775370752_5706848.jpg' },
  { rawName: '百瀬ゆい', size: '32歳 165㎝ (I)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1770457693_3352587.jpg' },
  { rawName: '吉岡りり', size: '36歳 164㎝ (G)', bio: '柔らかもち肌♡丁寧施術', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1772447674_7917531.jpg' },
  { rawName: '九条ひなた(立)', size: '37歳 152㎝ (H)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1775108615_1672277.jpg' },
  { rawName: '桜庭ゆう', size: '33歳 160㎝ (G)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1767662493_0193502.jpg' },
  { rawName: '七井ゆま', size: '46歳 153㎝ (H)', bio: '包容力たっぷり♡癒しの熟女', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1775285050_5388747.jpg' },
  { rawName: '桜井はな', size: '33歳 152㎝ (J)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1766593945_2323399.jpg' },
  { rawName: '姫野のあ', size: '40歳 153㎝ (D)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1768802009_7566740.jpg' },
  { rawName: '高梨りの', size: '32歳 149㎝ (J)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1772768383_1733560.jpg' },
  { rawName: '白井ゆる', size: '30歳 170㎝ (E)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1773756356_3687976.jpg' },
  { rawName: '長谷川かれん', size: '34歳 172㎝ (G)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1775965616_0046859.jpg' },
  { rawName: '楠木あいか', size: '37歳 153㎝ (K)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1765264022_6909746.jpg' },
  { rawName: '花菫まりな', size: '34歳 155㎝ (H)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1759811267_4585479.jpg' },
  { rawName: '蜜丘さゆり', size: '47歳 161㎝ (G)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1761194247_3144643.jpg' },
  { rawName: '相沢はるか', size: '42歳 166㎝ (F)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1769854718_2024422.jpg' },
  { rawName: '黒澤らい', size: '32歳 160㎝ (C)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1772769694_7670994.jpg' },
  { rawName: '柏木もも', size: '38歳 153㎝ (G)', bio: 'むっちむち♡包み込まれる安心感', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1773147799_2266112.jpg' },
  { rawName: '音羽かほ', size: '27歳 170㎝ (G)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1774598137_1500464.jpg' },
  { rawName: '松永りん', size: '30歳 165㎝ (F)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1774593473_8314662.jpg' },
  { rawName: '水無月ありさ', size: '30歳 156㎝ (H)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1767009340_8885599.jpg' },
  { rawName: '希咲ゆあ', size: '37歳 170㎝ (H)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1775201751_5000295.jpg' },
  { rawName: '有栖ゆりな', size: '29歳 153㎝ (F)', bio: '優しさとぬくもりと///', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1774976762_3699633.jpg' },
  { rawName: '羽月るい', size: '31歳 161㎝ (F)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1775201761_1454324.jpg' },
  { rawName: '浜崎しのぶ', size: '39歳 161㎝ (I)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1769309501_4490224.jpg' },
  { rawName: '星野らら', size: '40歳 142㎝ (H)', bio: 'やさしく翻弄♡じわじわハマる', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1775653014_2919639.jpg' },
  { rawName: '望月しおん', size: '30歳 165㎝ (I)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1775230830_6408990.jpg' },
  { rawName: '佐々木のりか', size: '44歳 156㎝ (J)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1768094099_1451341.jpg' },
  { rawName: '筧みわこ', size: '33歳 158㎝ (E)', bio: '不思議な魅力に、気づけば夢中', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1776099871_3835326.jpg' },
  { rawName: '宮川えりか', size: '42歳 163㎝ (F)', bio: 'ふんわりやわ肌♡華やかお姉さん', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1776445527_6754311.jpg' },
  { rawName: '瀬戸さおり', size: '42歳 163㎝ (G)', bio: '優しく可愛がる♡むちっと癒し', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1776099581_4172525.jpg' },
  { rawName: '町田なお', size: '36歳 164㎝ (D)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1769411958_4783861.jpg' },
  { rawName: '黒崎まりあ', size: '31歳 165㎝ (I)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1765264174_3370859.jpg' },
  { rawName: '村川こはく', size: '31歳 160㎝ (E)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1773378830_1163269.jpg' },
  { rawName: '堀かえで', size: '36歳 160㎝ (F)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1774598127_0375007.jpg' },
  { rawName: '柚木ねね', size: '38歳 160㎝ (I)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1765263888_7481152.jpg' },
  { rawName: '三原さあや', size: '29歳 164㎝ (F)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1765264275_5916692.jpg' },
  { rawName: '咲坂せな', size: '38歳 161㎝ (I)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1769748520_9401197.jpg' },
  { rawName: '多田あおい', size: '31歳 165㎝ (D)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1771408351_0378518.jpg' },
  { rawName: '黒羽みる', size: '29歳 153㎝ (H)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1772333795_2148659.jpg' },
  { rawName: '井上らん', size: '37歳 163㎝ (F)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1766157071_2467314.jpg' },
  { rawName: '平野みゆき', size: '45歳 165㎝ (G)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1769496032_2915647.jpg' },
  { rawName: '吉田さり', size: '41歳 160㎝ (H)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1765263760_0931698.jpg' },
  { rawName: '葉山りんこ', size: '35歳 164㎝ (D)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1767863508_6038336.jpg' },
  { rawName: '水樹ほたる', size: '33歳 166㎝ (F)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1768403416_1557984.jpg' },
  { rawName: '生田せり', size: '30歳 155㎝ (D)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1766555072_9249801.jpg' },
  { rawName: '宮澤みなみ', size: '38歳 158㎝ (F)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1751348857_9357482.jpg' },
  { rawName: '石原れいか', size: '40歳 155㎝ (G)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1749194424_0630996.jpg' },
  { rawName: '久保田みどり', size: '36歳 156㎝ (H)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1759559071_9522205.jpg' },
  { rawName: '五十嵐かのん', size: '32歳 150㎝ (E)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1749194259_6087742.jpg' },
  { rawName: '赤城のぞみ', size: '35歳 169㎝ (G)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1756693755_2125336.jpg' },
  { rawName: '神田りな', size: '38歳 163㎝ (F)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1765264038_5759483.jpg' },
  { rawName: '内海ひまり', size: '29歳 160㎝ (F)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1765264031_7662667.jpg' },
  { rawName: '最上もか', size: '31歳 158㎝ (H)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1766555098_6297937.jpg' },
  { rawName: '九条ありす', size: '30歳 163㎝ (G)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1749194599_0654892.jpg' },
  { rawName: '向日葵ののか', size: '37歳 162㎝ (F)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1749194375_3575111.jpg' },
  { rawName: '深澤みお', size: '29歳 166㎝ (I)', bio: '超美乳のI♡cup天使', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1765264069_3218768.jpg' },
  { rawName: '高島りさ', size: '40歳 165㎝ (E)', bio: 'ヤバイ手つき♡元幼稚園先生', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1765264047_9739067.jpg' },
  { rawName: '神楽れみ', size: '31歳 155㎝ (F)', bio: 'ﾎｽﾋﾟﾀﾘﾃｨ抜群!!元CAお姉さん', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1749194401_0934609.jpg' },
  { rawName: '渚おと', size: '40歳 160㎝ (D)', bio: '犬系姉さんの可愛がり', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1754571845_9103367.jpg' },
  { rawName: '水城るみ', size: '31歳 152㎝ (F)', bio: 'むちぽちゃbodyの密着施術', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1762943022_5742891.jpg' },
  { rawName: '堀北ゆいか', size: '29歳 160㎝ (G)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1749194726_1781315.jpg' },
  { rawName: '海野みちる', size: '37歳 162㎝ (G)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1764297138_1081646.jpg' },
  { rawName: '市川すみれ', size: '34歳 155㎝ (I)', bio: '元保育士さんセラピスト…！', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1749194811_7175455.jpg' },
  { rawName: '神鳥ひかる', size: '32歳 153㎝ (E)', bio: '笑顔弾ける菊地◯美似美女', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1749194861_3324919.jpg' },
  { rawName: '二階堂うみ', size: '28歳 160㎝ (E)', bio: '愛嬌抜群♪小悪魔系むちおね', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1749194943_0146369.jpg' },
  { rawName: '紗倉みさき', size: '38歳 164㎝ (E)', bio: '妖艶美女のゼロ距離密着', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1765263903_7935483.jpg' },
  { rawName: '安西りょう', size: '35歳 153㎝ (E)', bio: '極極極めし天使の手', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1749194995_7479879.jpg' },
  { rawName: '犬月あかね', size: '32歳 153㎝ (F)', bio: 'キレカワ系むちおね', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1765263999_3164824.jpg' },
  { rawName: '石川りか', size: '32歳 148㎝ (K)', bio: '神秘のKカップ全力施術', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1749195030_3342040.jpg' },
  { rawName: '倉田さな', size: '39歳 168㎝ (G)', bio: '健康美むちおねに攻められたい', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1749195074_5802527.jpg' },
  { rawName: '椎名そら', size: '36歳 168㎝ (F)', bio: 'メンエスに蝶が舞い降りた', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1765264140_4389608.jpg' },
  { rawName: '如月あんり', size: '30歳 162㎝ (K)', bio: 'ゴージャス&グラマラス', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1749195088_9125151.jpg' },
  { rawName: '鮎川まなみ', size: '35歳 160㎝ (G)', bio: '唯一無二グラマーボディ', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1749195118_0997082.jpg' },
  { rawName: '倉持みいな', size: '28歳 152㎝ (H)', bio: '小動物顔のツヤ肌美巨乳', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1749195136_3217647.jpg' },
  { rawName: '広瀬かすみ', size: '36歳 156㎝ (G)', bio: '身も心もリセットで', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1749195066_6277968.jpg' },
  { rawName: '佐藤ひなの', size: '34歳 160㎝ (F)', bio: '愛嬌抜群！人懐っこさ抜群♡', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1749194589_5794275.jpg' },
  { rawName: '森田かな', size: '43歳 158㎝ (G)', bio: 'ニコニコ愛嬌♡愛されむっちり', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1776426125_7737899.jpg' },
  { rawName: '古賀あやみ', size: '37歳 158㎝ (I)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1776433658_4804915.jpg' },
  { rawName: '神楽しの', size: '39歳 155㎝ (g)', image: 'https://cdn2-caskan.com/caskan/img/cast_tmb/1776415710_5285775.jpg' }
];

async function main() {
  console.log(`🚀 ${CONFIG.shopName}：全店舗データ一括登録を開始します...\n`);
  const now = new Date().toISOString();
  
  try {
    // 1. データベース内の「むちむちお姉さん」をすべて取得（多店舗対応）
    let { data: shops, error: searchError } = await supabase
      .from('shops')
      .select('id, name')
      .ilike('name', CONFIG.searchKeyword);
      
    if (searchError) throw searchError;

    // 万が一1つも存在しない場合は、新規作成用として配列にダミーデータを追加
    if (!shops || shops.length === 0) {
      console.warn('⚠️ 既存の店舗が見つからなかったため、池袋枠として新規作成します。');
      const newId = crypto.randomUUID();
      shops = [{ id: newId, name: CONFIG.shopName }];
      
      await supabase.from('shops').insert({
        id: newId,
        area_id: CONFIG.fallbackAreaId,
        name: CONFIG.shopName
      });
    }

    console.log(`✅ 合計 ${shops.length} 店舗の「むちむちお姉さん」を発見しました。順次データを流し込みます。`);

    // 2. 見つかった全店舗に対してループ処理
    for (const shop of shops) {
      console.log(`\n▶️ 処理中: ${shop.name} (ID: ${shop.id})`);

      // 店舗データの更新
      await supabase.from('shops').update({
        website_url: CONFIG.websiteUrl,
        schedule_url: CONFIG.scheduleUrl,
        price_system: CONFIG.priceSystem
      }).eq('id', shop.id);

      // キャストデータの整形
      const payload = therapistsRaw.map(t => {
        const clean = cleanseName(t.rawName);
        return {
          id: `${shop.id}_${clean}`, // 店舗IDごとのユニークID
          shop_id: shop.id,
          name: clean,
          image_url: t.image?.trim() || null,
          is_active: true,
          last_seen_at: now,
          raw_data: { size: t.size, bio: t.bio || '', original_name: t.rawName }
        };
      });

      // キャストの一括Upsert
      await supabase.from('therapists').upsert(payload);

      // 自動退店処理（その店舗内でいなくなった人を非表示）
      const { data: inactives } = await supabase.from('therapists')
        .update({ is_active: false })
        .eq('shop_id', shop.id)
        .lt('last_seen_at', now)
        .select('name');
      
      console.log(`  ✅ ${payload.length} 名のキャストを更新しました。`);
      if (inactives?.length > 0) {
        console.log(`  📉 今回取得できなかった ${inactives.length}名 を非表示にしました。`);
      }
    }

    console.log('\n🎉🎉 「むちむちお姉さん」全店舗へのデータ反映（ステップ①）が完了しました！ 🎉🎉');
    console.log('ロゴ（ステップ②）の準備ができましたら、画像URLをお待ちしております。');

  } catch (err) {
    console.error('❌ エラー:', err);
  }
}

main();
