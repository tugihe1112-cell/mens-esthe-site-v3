import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

function cleanseName(rawName) {
  if (!rawName) return '';
  return rawName.replace(/[\s　]/g, '').trim();
}

const CONFIG = {
  searchKeyword: '%Ginza Rich%',
  searchKeyword2: '%銀座リッチ%',
  fallbackAreaId: 'tokyo_chuo_ginza', // 銀座エリア
  shopName: 'Ginza Rich (銀座リッチ)',
  scheduleUrl: 'https://ginza-rich.work/',
  // 画像から抽出したプレミアムリッチコースのシステム料金
  priceSystem: '【プレミアムリッチコース】\n60分 18,000円\n90分 20,000円\n120分 26,000円\n150分 32,000円\n180分 37,000円'
};

// HTMLから抽出したキャストデータ（全23名）
const baseUrl = 'https://ginza-rich.work';
const therapistsRaw = [
  { rawName: '宮沢はるか', room: '銀座Room', image: `${baseUrl}/sys_img/ginza-rich/cast/115/4/17743332620619_HP2.jpg` },
  { rawName: '佐伯かりな', room: '東銀座Room', image: `${baseUrl}/sys_img/ginza-rich/cast/169/4/17751810691606_HP改.jpg` },
  { rawName: '向井こはる', room: '東銀座Room', image: `${baseUrl}/sys_img/ginza-rich/cast/174/4/17766736136301_向井.jpg` },
  { rawName: '坂口あやか', room: '東銀座Room', image: `${baseUrl}/sys_img/ginza-rich/cast/177/4/17763050191298_写メHP.jpg` },
  { rawName: '関口かこ', room: '八重洲Room', image: `${baseUrl}/sys_img/ginza-rich/cast/66/4/17425731560639_関口かこ（目隠し）.jpg` },
  { rawName: '安藤なつ', room: '八重洲Room', image: `${baseUrl}/sys_img/ginza-rich/cast/9/4/17549806363155_HP.jpg` },
  { rawName: '小松ゆあ', room: '東銀座Room', image: `${baseUrl}/sys_img/ginza-rich/cast/111/4/17545313888646_HP.jpg` },
  { rawName: '小坂あんり', room: '東銀座Room', image: `${baseUrl}/sys_img/ginza-rich/cast/137/4/17646440478621_HP.jpg` },
  { rawName: '新木じゅり', room: '銀座Room', image: `${baseUrl}/sys_img/ginza-rich/cast/145/4/17647353954096_2025-12-03 - risin.jpg` },
  { rawName: '藤井みいな', room: '東銀座Room', image: `${baseUrl}/sys_img/ginza-rich/cast/170/4/1776053888271_藤井545.jpg` },
  { rawName: '牧瀬えりな', size: '26歳 T:158cm 85(D)-57-87', image: `${baseUrl}/sys_img/ginza-rich/cast/176/4/17766735544016_牧瀬.jpg` },
  { rawName: '高坂おとは', size: '26歳 T:165cm 87(E)-55-88', image: `${baseUrl}/sys_img/ginza-rich/cast/172/4/17763049686962_写メHP.jpg` },
  { rawName: '小泉ちひろ', size: '28歳 T:150cm 86(D)-57-84', image: `${baseUrl}/sys_img/ginza-rich/cast/175/4/17763048798082_写メHP.jpg` },
  { rawName: '篠原みう', size: '25歳 T:157cm 87(E)-56-88', image: `${baseUrl}/sys_img/ginza-rich/cast/173/4/17756977535926_写メHP.jpg` },
  { rawName: '佐々木るりあ', size: '25歳 T:155cm 88(F)-58-88', image: `${baseUrl}/sys_img/ginza-rich/cast/171/4/17761256657769_HP.jpg` },
  { rawName: '稲村かのん', size: '26歳 T:164cm 85(D)-56-84', image: `${baseUrl}/sys_img/ginza-rich/cast/160/4/17764942521339_HP.jpg` },
  { rawName: '今井あすか', size: '27歳 T:157cm 85(D)-56-84', image: `${baseUrl}/sys_img/ginza-rich/cast/168/4/17747551878252_今井.jpg` },
  { rawName: '優木らら', size: '26歳 T:160cm 85(C)-85-56', image: `${baseUrl}/sys_img/ginza-rich/cast/167/4/17743331533448_HP.jpg` },
  { rawName: '岩本ひまり', size: '25歳 T:158cm 84(C)-56-84', image: `${baseUrl}/sys_img/ginza-rich/cast/162/4/17751857382438_HP.jpg` },
  { rawName: '近藤あいな', size: '28歳 T:155cm 83(C)-56-85', image: `${baseUrl}/sys_img/ginza-rich/cast/165/4/1773723549028_HP.jpg` },
  { rawName: '飯島かれん', size: '26歳 T:163cm 84(C)-55-84', image: `${baseUrl}/sys_img/ginza-rich/cast/166/4/17743340387671_HP.jpg` },
  { rawName: '八木いろは', size: '27歳 T:150cm 85(D)-55-84', image: `${baseUrl}/sys_img/ginza-rich/cast/164/4/17732819141332_HP.jpg` },
  { rawName: '神谷えみり', size: '25歳 T:160cm 85(D)-57-88', image: `${baseUrl}/sys_img/ginza-rich/cast/163/4/17732824996223_HP.jpg` },
  { rawName: '小嶋せりな', size: '26歳 T:155cm 85(D)-55-84', image: `${baseUrl}/sys_img/ginza-rich/cast/25/4/17478324427546_小嶋新545900改.jpg` },
  { rawName: '生田みやび', size: '27歳 T:155cm 85(D)-57-86', image: `${baseUrl}/sys_img/ginza-rich/cast/4/4/1738763090675_生田みやび2.jpg` },
  { rawName: '吉岡りり', size: '28歳 T:166cm 86(E)-57-84', image: `${baseUrl}/sys_img/ginza-rich/cast/87/4/17646483761322_HP.jpg` },
  { rawName: '柴咲そら', size: '28歳 T:153cm 90(G)-57-89', image: `${baseUrl}/sys_img/ginza-rich/cast/104/4/17563490424119_HP3.jpg` },
  { rawName: '若槻ゆり', size: '26歳 T:156cm 85(D)-56-86', image: `${baseUrl}/sys_img/ginza-rich/cast/159/4/17724061083878_HP.jpg` },
  { rawName: '大倉さえ', size: '25歳 T:159cm 85(D)-56-85', image: `${baseUrl}/sys_img/ginza-rich/cast/161/4/17714067236144_写メHP.jpg` },
  { rawName: '天使みな', size: '26歳 T:164cm 84(C)-57-85', image: `${baseUrl}/sys_img/ginza-rich/cast/148/4/17676507476965_HP.jpg` },
  { rawName: '武井ふうか', size: '28歳 T:168cm 88(F)-58-87', image: `${baseUrl}/sys_img/ginza-rich/cast/156/4/1771832906658_武井2.jpg` },
  { rawName: '東條はすみ', size: '26歳 T:163cm 86(D)-58-87', image: `${baseUrl}/sys_img/ginza-rich/cast/60/4/17689374980299_HP2.jpg` },
  { rawName: '高浪いあり', size: '31歳 T:157cm 84(C)-56-83', image: `${baseUrl}/sys_img/ginza-rich/cast/64/4/17435568010232_HPモザ900545.jpg` },
  { rawName: '仲間りほ', size: '26歳 T:157cm 86(D)-57-87', image: `${baseUrl}/sys_img/ginza-rich/cast/136/4/17640470099274_S__4661281.jpg` },
  { rawName: '松村しほ', size: '28歳 T:157cm 84(C)-56-84', image: `${baseUrl}/sys_img/ginza-rich/cast/146/4/17677793552774_HP2.jpg` },
  { rawName: '紺野ありさ', size: '27歳 T:152cm 89(F)-58-88', image: `${baseUrl}/sys_img/ginza-rich/cast/139/4/17743334736781_HP2.jpg` },
  { rawName: '北川はな', size: '26歳 T:165cm 86(D)-57-85', image: `${baseUrl}/sys_img/ginza-rich/cast/147/4/17697481831772_HP2.jpg` },
  { rawName: '奥村かんな', size: '26歳 T:155cm 88(F)-56-84', image: `${baseUrl}/sys_img/ginza-rich/cast/154/4/17705184815508_奥村.jpg` },
  { rawName: '新川つかさ', size: '28歳 T:162cm 88(E)-57-85', image: `${baseUrl}/sys_img/ginza-rich/cast/119/4/17625193984966_新川再修正.jpg` },
  { rawName: '浦沢もな', size: '26歳 T:155cm 88(E)-57-89', image: `${baseUrl}/sys_img/ginza-rich/cast/142/4/17692298628344_HP.jpg` },
  { rawName: '北乃くるみ', size: '25歳 T:164cm 88(E)-58-88', image: `${baseUrl}/sys_img/ginza-rich/cast/134/4/17676493551397_HP新.jpg` },
  { rawName: '坂本ゆりな', size: '28歳 T:163cm 88(E)-58-87', image: `${baseUrl}/sys_img/ginza-rich/cast/133/4/17618439767514_S__63299609.jpg` },
  { rawName: '橋本かりん', size: '27歳 T:158cm 87(E)-57-85', image: `${baseUrl}/sys_img/ginza-rich/cast/108/4/17644019695343_HP.jpg` },
  { rawName: '桜田ひなは', size: '26歳 T:169cm 90(G)-58-90', image: `${baseUrl}/sys_img/ginza-rich/cast/128/4/17602504805495_545900.1.jpg` },
  { rawName: '高畑りか', size: '25歳 T:168cm 84(C)-57-85', image: `${baseUrl}/sys_img/ginza-rich/cast/127/4/17601542196174_HP.jpg` },
  { rawName: '二宮なつき', size: '26歳 T:160cm 85(D)-57-84', image: `${baseUrl}/sys_img/ginza-rich/cast/75/4/17646496598925_HP.jpg` },
  { rawName: '平子みお', size: '27歳 T:165cm 85(D)-56-84', image: `${baseUrl}/sys_img/ginza-rich/cast/124/4/17593706349512_HP2.jpg` },
  { rawName: '真野こころ', size: '26歳 T:160cm 85(D)-57-84', image: `${baseUrl}/sys_img/ginza-rich/cast/110/4/17646505849585_HP.jpg` },
  { rawName: '福山ましろ', size: '26歳 T:160cm 86(D)-57-84', image: `${baseUrl}/sys_img/ginza-rich/cast/103/4/17520225625734_HP.jpg` },
  { rawName: '青木ことは', size: '25歳 T:160cm 88(E)-57-85', image: `${baseUrl}/sys_img/ginza-rich/cast/150/4/17688869510134_HP.jpg` },
  { rawName: '杉本あおい', size: '28歳 T:163cm 91(E)-58-89', image: `${baseUrl}/sys_img/ginza-rich/cast/30/4/17537130467524_545900.jpg` },
  { rawName: '大橋すず', size: '25歳 T:152cm 85(D)-57-84', image: `${baseUrl}/sys_img/ginza-rich/cast/100/4/17510160976721_HP.jpg` },
  { rawName: '久松みれい', size: '29歳 T:157cm 89(E)-57-87', image: `${baseUrl}/sys_img/ginza-rich/cast/97/4/17549701172894_HP2.jpg` },
  { rawName: '上原みらい', size: '26歳 T:164cm 88(F)-58-90', image: `${baseUrl}/sys_img/ginza-rich/cast/80/4/1746131341886_上原みらい.jpg` },
  { rawName: '岡本ほのか', size: '29歳 T:162cm 85(D)-58-88', image: `${baseUrl}/sys_img/ginza-rich/cast/16/4/17452017058761_hpほくろ無.jpg` },
  { rawName: '中島るか', size: '26歳 T:155cm 84(C)-56-85', image: `${baseUrl}/sys_img/ginza-rich/cast/63/4/17410492482624_239118.jpg` },
  { rawName: '藤原まり', size: '25歳 T:158cm 86(D)-59-88', image: `${baseUrl}/sys_img/ginza-rich/cast/59/4/17408859796023_藤原HP.jpg` },
  { rawName: '榎本りおな', size: '28歳 T:159cm 88(E)-58-85', image: `${baseUrl}/sys_img/ginza-rich/cast/88/4/17735730555448_改0314.jpg` },
  { rawName: '遠藤しおん', size: '28歳 T:160cm 87(D)-57-86', image: `${baseUrl}/sys_img/ginza-rich/cast/89/4/17490214244122_重田HP.jpg` },
  { rawName: '秋元まい', size: '28歳 T:157cm 84(C)-57-84', image: `${baseUrl}/sys_img/ginza-rich/cast/94/4/1750482559263_重田2HP545900.jpg` },
  { rawName: '平山ゆき', size: '28歳 T:159cm 90(F)-58-88', image: `${baseUrl}/sys_img/ginza-rich/cast/149/4/17688987891518_HP.jpg` },
  { rawName: '白川かなで', size: '28歳 T:163cm 92(G)-58-88', image: `${baseUrl}/sys_img/ginza-rich/cast/152/4/17708690395185_HP.jpg` },
  { rawName: '里村ゆりあ', size: '29歳 T:162cm 85(D)-57-86', image: `${baseUrl}/sys_img/ginza-rich/cast/135/4/17660154935603_HP新.jpg` },
  { rawName: '桐谷るい', size: '27歳 T:165cm 85(D)-56-88', image: `${baseUrl}/sys_img/ginza-rich/cast/114/4/17555963343834_HP.jpg` },
  { rawName: '雨宮くみ', size: '25歳 T:159cm 85(D)-55-85', image: `${baseUrl}/sys_img/ginza-rich/cast/132/4/17659320650678_雨宮.jpg` },
  { rawName: '有坂あかり', size: '26歳 T:159cm 85(C)-57-86', image: `${baseUrl}/sys_img/ginza-rich/cast/118/4/17570553248385_HP.jpg` },
  { rawName: '姫野さら', size: '26歳 T:157cm 88(E)-57-88', image: `${baseUrl}/sys_img/ginza-rich/cast/121/4/17574900671258_本人.jpg` },
  { rawName: '上野まほ', size: '28歳 T:160cm 85(D)-57-88', image: `${baseUrl}/sys_img/ginza-rich/cast/46/4/17384798483737_上野まほ1.jpg` }
];

async function main() {
  console.log(`🚀 ${CONFIG.shopName}：ステップ① データ登録を開始します...\n`);
  const now = new Date().toISOString();

  try {
    let { data: shops, error: searchError } = await supabase
      .from('shops')
      .select('id')
      .or(`name.ilike.${CONFIG.searchKeyword},name.ilike.${CONFIG.searchKeyword2}`)
      .limit(1);

    if (searchError) throw searchError;

    const targetId = (shops && shops.length > 0) ? shops[0].id : crypto.randomUUID();

    if (shops?.length > 0) {
      console.log(`✅ 既存の「銀座リッチ」枠を発見しました。データを上書き・補充します。`);
    } else {
      console.log(`⚠️ 既存枠がないため、銀座エリアで新規IDを発行して登録します。`);
    }

    console.log(`⚙️ 店舗データ(shops)を更新中...`);
    await supabase.from('shops').upsert({
      id: targetId,
      area_id: CONFIG.fallbackAreaId,
      name: CONFIG.shopName,
      schedule_url: CONFIG.scheduleUrl,
      price_system: CONFIG.priceSystem
    });

    // 重複を削除（念のため）
    const uniqueTherapists = [];
    const seenNames = new Set();
    for (const t of therapistsRaw) {
      if (!seenNames.has(t.rawName)) {
        seenNames.add(t.rawName);
        uniqueTherapists.push(t);
      }
    }

    const payload = uniqueTherapists.map(t => {
      const clean = cleanseName(t.rawName);
      
      return {
        id: `${targetId}_${clean}`,
        shop_id: targetId,
        name: clean,
        image_url: t.image?.trim() || null,
        is_active: true,
        last_seen_at: now,
        raw_data: { 
          size: t.size || '', 
          room: t.room || '',
          original_name: t.rawName 
        }
      };
    });

    console.log(`⚙️ セラピストデータ(therapists)を登録中...`);
    await supabase.from('therapists').upsert(payload);

    const { data: inactives } = await supabase.from('therapists')
      .update({ is_active: false })
      .eq('shop_id', targetId)
      .lt('last_seen_at', now)
      .select('name');

    console.log(`✅ 全 ${payload.length} 名のキャスト情報を登録・更新しました！`);
    if (inactives?.length > 0) {
      console.log(`📉 今回取得できなかった ${inactives.length}名 を非表示にしました。`);
    }

    console.log('\n🎉 Ginza Rich(銀座リッチ)のデータ登録が完全に完了しました！');

  } catch (err) {
    console.error('❌ エラー:', err);
  }
}

main();
