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
  searchKeyword: '%Aroma one%',
  searchKeyword2: '%アロマワン%',
  fallbackAreaId: 'osaka_osaka_umeda', // 梅田エリア
  shopName: 'Aroma one (アロマワン)',
  scheduleUrl: 'https://aromaoneosaka.com/schedule/',
  // 画像から抽出したシステム料金
  priceSystem: '60分 10,000円\n90分 13,000円\n120分 16,000円'
};

// HTMLから抽出したキャストデータ（全50名、ダミー枠除外済み）
const therapistsRaw = [
  { rawName: 'なぎさ', age: '21', rank: '★3', tags: ['愛嬌♡', '生粋のSっ子', 'リピート率◎', 'どないやねん'], image: 'https://aromaoneosaka.com/def/con?x=270&p=upload/cast/361_17739147701.jpg&1773914770' },
  { rawName: 'ここ', rank: '★2', tags: ['愛嬌抜群◎', '店長オススメ', 'リピート率◎', '激押し◎'], image: 'https://aromaoneosaka.com/def/con?x=270&p=upload/cast/382_17758224991.jpg&1775822499' },
  { rawName: 'えま', age: '23', rank: '★2', tags: ['リピート率◎', '明るい系', '清楚系', 'マッサージ技術◎'], image: 'https://aromaoneosaka.com/def/con?x=270&p=upload/cast/202_17758100381.jpg&1775810038' },
  { rawName: 'りこ', age: '19', rank: '★2', tags: ['圧倒的リピート率', 'スタイル抜群', '巨乳', '細身巨乳◎'], image: 'https://aromaoneosaka.com/def/con?x=270&p=upload/cast/321_17758216431.jpg&1775821643' },
  { rawName: 'みお', age: '23', rank: '★1', tags: ['玉姫', '人懐っこい', '聞き上手', '明るい'], image: 'https://aromaoneosaka.com/def/con?x=270&p=upload/cast/299_17747769161.jpg&1774776916' },
  { rawName: 'あいす', age: '23', rank: '★1', tags: ['リピート率◎', '店長オススメ', '韓国系', 'スレンダー'], image: 'https://aromaoneosaka.com/def/con?x=270&p=upload/cast/56_17758215491.jpg&1775821549' },
  { rawName: 'らな', age: '20', rank: '★1', tags: ['巨乳', '愛嬌抜群◎', '清楚系美女', 'スタイル抜群◎'], image: 'https://aromaoneosaka.com/def/con?x=270&p=upload/cast/14_17762463801.jpg&1776246380' },
  { rawName: 'あやか', age: '23', rank: '★1', tags: ['スレンダー', '施術好評◎', '美人系', 'リピート率◎'], image: 'https://aromaoneosaka.com/def/con?x=270&p=upload/cast/160_17739130541.jpg&1773913054' },
  { rawName: 'すい', age: '19', rank: '★1', tags: ['愛嬌抜群◎', '爆乳のH', 'かわいい系', '妹系'], image: 'https://aromaoneosaka.com/def/con?x=270&p=upload/cast/273_17766874211.jpg&1776687421' },
  { rawName: 'らむ', age: '20', rank: '★1', tags: ['かわいい系', '明るい系', '人懐っこい', '真面目'], image: 'https://aromaoneosaka.com/def/con?x=270&p=upload/cast/148_17740178061.jpg&1774017807' },
  { rawName: 'りり', age: '22', tags: ['韓国系', '圧倒的ビジュアル', 'スレンダー', 'モデル級美女'], image: 'https://aromaoneosaka.com/def/con?x=270&p=upload/cast/108_17729006101.jpg&1772900791' },
  { rawName: 'きり', age: '22', tags: ['愛嬌抜群◎', 'キレカワ系', '店長オススメ', '高リピート率◎'], image: 'https://aromaoneosaka.com/def/con?x=270&p=upload/cast/276_17731498041.jpg&1773149804' },
  { rawName: 'うるる', age: '20', tags: ['期待の新人', '新人割適応可', 'ルックス◎', '愛嬌抜群'], image: 'https://aromaoneosaka.com/def/con?x=270&p=upload/cast/419_17731498351.jpg&1773149981' },
  { rawName: 'よる', age: '19', tags: ['愛嬌抜群◎', '巨乳', 'かわいい系', '癒し系'], image: 'https://aromaoneosaka.com/def/con?x=270&p=upload/cast/345_17729007401.jpg&1772900769' },
  { rawName: 'うあ', age: '18', tags: ['可愛い系', '愛嬌抜群', 'スレンダー', '癒し系'], image: 'https://aromaoneosaka.com/def/con?x=270&p=upload/cast/420_17731499021.jpg&1773150095' },
  { rawName: 'ひより', age: '20', tags: ['韓国系', 'えぐい可愛い！', '人懐っこい', '清楚系'], image: 'https://aromaoneosaka.com/def/con?x=270&p=upload/cast/398_17731374401.jpg&1773137506' },
  { rawName: 'るか', age: '21', tags: ['巨乳', '可愛い系', 'スレンダー', '癒し系'], image: 'https://aromaoneosaka.com/def/con?x=270&p=upload/cast/105_17740045081.jpg&1774006333' },
  { rawName: 'りあ', age: '19', tags: ['インスタグラマー系', 'かわいい系', '人懐っこい', '細身巨乳◎'], image: 'https://aromaoneosaka.com/def/con?x=270&p=upload/cast/178_17755430271.jpg&1775543027' },
  { rawName: 'せいせい', age: '19', tags: ['大谷翔平並みの逸材！', 'ルックス抜群！', '愛嬌◎', 'スレンダー系'], image: 'https://aromaoneosaka.com/def/con?x=270&p=upload/cast/418_17729425871.jpg&1772942645' },
  { rawName: 'かすみ', age: '19', tags: ['かわいい系', 'スタイル抜群', 'リピ率◎', '高ランク美女'], image: 'https://aromaoneosaka.com/def/con?x=270&p=upload/cast/305_17752225431.jpg&1775222544' },
  { rawName: 'うなぴ', age: '20', tags: ['ルックス抜群！', 'アイドル系', '愛嬌◎', 'スレンダー系'], image: 'https://aromaoneosaka.com/def/con?x=270&p=upload/cast/395_17737198041.jpg&1773719804' },
  { rawName: 'まりあ', age: '19', tags: ['綺麗かわいい系', 'アイドル系', '令和の逸材', '谷まりあ似'], image: 'https://aromaoneosaka.com/def/con?x=270&p=upload/cast/309_17738248131.jpg&1773824813' },
  { rawName: 'るあ', age: '19', tags: ['爆乳系', 'ノリ◎', '人懐っこい', '愛嬌抜群'], image: 'https://aromaoneosaka.com/def/con?x=270&p=upload/cast/304_17752180341.jpg&1775218035' },
  { rawName: 'かなか', age: '21', tags: ['リピート率抜群！', 'キレカワ系', '人懐っこい', '巨乳'], image: 'https://aromaoneosaka.com/def/con?x=270&p=upload/cast/386_17738929651.jpg&1773892965' },
  { rawName: 'きこ', age: '21', tags: ['えぐい可愛い！', 'スレンダー巨乳', '愛嬌◎', '明るい'], image: 'https://aromaoneosaka.com/def/con?x=270&p=upload/cast/438_17747818711.jpg&1774781871' },
  { rawName: 'ゆい', age: '21', tags: ['愛嬌◎', '可愛い系', '人懐っこい', '某有名店ランカー'], image: 'https://aromaoneosaka.com/def/con?x=270&p=upload/cast/442_17753657141.jpg&1775365714' },
  { rawName: 'ひなり', age: '19', tags: ['可愛い系', '愛嬌◎', '愛おしさ抜群', '明るい'], image: 'https://aromaoneosaka.com/def/con?x=270&p=upload/cast/441_17751121071.jpg&1775112108' },
  { rawName: 'みかん', age: '19', tags: ['峰不二子', '可愛い系', '愛嬌◎', '巨乳'], image: 'https://aromaoneosaka.com/def/con?x=270&p=upload/cast/408_17737446831.jpg&1773744683' },
  { rawName: 'りいな', age: '19', tags: ['かわいい系', '明るい系', '愛嬌◎', '妹系'], image: 'https://aromaoneosaka.com/def/con?x=270&p=upload/cast/417_17730393371.jpg&1773039368' },
  { rawName: 'ひめ', age: '20', tags: ['可愛い系', '愛嬌◎', '人懐っこい', '癒し系'], image: 'https://aromaoneosaka.com/def/con?x=270&p=upload/cast/403_17727443261.jpg&1773149960' },
  { rawName: 'さな', age: '22', tags: ['小動物系', '愛嬌◎', 'スレンダー', '癒し系'], image: 'https://aromaoneosaka.com/def/con?x=270&p=upload/cast/149_17740055811.jpg&1774006364' },
  { rawName: 'みく', age: '20', tags: ['高身長', 'スタイル◎', '可愛い系', '照屋さん'], image: 'https://aromaoneosaka.com/def/con?x=270&p=upload/cast/400_17731417891.jpg&1773141834' },
  { rawName: 'ひなの', age: '22', tags: ['スタイル抜群', '愛嬌◎', 'かわいい系', 'スレンダー'], image: 'https://aromaoneosaka.com/def/con?x=270&p=upload/cast/425_17766223571.jpg&1776622357' },
  { rawName: 'ゆら', age: '23', tags: ['小動物系', '愛嬌抜群', 'かわいい系', 'スレンダー'], image: 'https://aromaoneosaka.com/def/con?x=270&p=upload/cast/204_17747556871.jpg&1774755687' },
  { rawName: 'こさいん', age: '20', tags: ['かわいい系', 'アイドル系', '愛嬌◎', 'スレンダー系'], image: 'https://aromaoneosaka.com/def/con?x=270&p=upload/cast/432_17744113771.jpg&1774411377' },
  { rawName: 'そら', age: '25', tags: ['綺麗系', '明るい系', '聞き上手', '爆乳◎'], image: 'https://aromaoneosaka.com/def/con?x=270&p=upload/cast/431_17742764781.jpg&1774276478' },
  { rawName: 'れい', age: '21', tags: ['愛嬌抜群◎', 'かわいい系', '巨乳', '癒し系'], image: 'https://aromaoneosaka.com/def/con?x=270&p=upload/cast/394_17759158451.jpg&1775915845' },
  { rawName: 'とうま', age: '21', tags: ['超スレンダー系', '可愛い系', '癒し系', '清楚系'], image: 'https://aromaoneosaka.com/def/con?x=270&p=upload/cast/323_17747765541.jpg&1774776554' },
  { rawName: 'りみ', age: '18', tags: ['かわいい系', 'アイドル系', '愛嬌◎', '照屋さん'], image: 'https://aromaoneosaka.com/def/con?x=270&p=upload/cast/430_17740074851.jpg&1774007485' },
  { rawName: 'ゆの', age: '24', tags: ['愛嬌抜群◎', '顔出ししたい位可愛い', '人懐っこい', '店長オススメ'], image: 'https://aromaoneosaka.com/def/con?x=270&p=upload/cast/222_17757245271.jpg&1775724527' },
  { rawName: 'ゆきな', age: '21', tags: ['新人割適応🉑', '高身長', 'スレンダー', 'モデル体型◎'], image: 'https://aromaoneosaka.com/def/con?x=270&p=upload/cast/444_17754941611.jpg&1775494186' },
  { rawName: 'むぎ', age: '22', tags: ['愛嬌抜群◎', '巨乳', 'かわいい系', '癒し系'], image: 'https://aromaoneosaka.com/def/con?x=270&p=upload/cast/443_17754906621.jpg&1775490662' },
  { rawName: 'のあ', age: '21', tags: ['新人割適応🉑', '巨乳◎', '愛嬌抜群◎', 'みんなの妹'], image: 'https://aromaoneosaka.com/def/con?x=270&p=upload/cast/446_17758323221.jpg&1775832344' },
  { rawName: 'しゅがー', age: '18', tags: ['愛嬌抜群◎', '巨乳◎', 'かわいい系', '癒し系'], image: 'https://aromaoneosaka.com/upload/back_image/40.jpg' },
  { rawName: 'すずか', age: '20', tags: ['愛嬌抜群◎', '可愛い', '妹系', 'スレンダー'], image: 'https://aromaoneosaka.com/upload/back_image/40.jpg' },
  { rawName: 'しほ', age: '21', tags: ['巨乳', 'セクシー系', '愛嬌◎', '好奇心旺盛'], image: 'https://aromaoneosaka.com/def/con?x=270&p=upload/cast/280_17609724221.jpg&1760972478' },
  { rawName: 'すず', age: '20', tags: ['オール仰向け施術', 'マッサージ技術◎', 'オプションコスプレ多', '密着泡洗体'], image: 'https://aromaoneosaka.com/def/con?x=270&p=upload/cast/223_17478382831.jpg&1747838311' },
  { rawName: 'とうか', age: '20', tags: ['アイドル系', '愛嬌抜群', '現役', '癒し系'], image: 'https://aromaoneosaka.com/def/con?x=270&p=upload/cast/347_17655532641.jpg&1765553272' },
  { rawName: 'きらら', age: '19', tags: ['かわいい系', '人懐っこい', '愛嬌', '明るい'], image: 'https://aromaoneosaka.com/def/con?x=270&p=upload/cast/228_17514553801.jpg&1751455381' },
  { rawName: 'みつき', age: '20', tags: ['綺麗系', '明るい系', '愛嬌◎', '色気◎'], image: 'https://aromaoneosaka.com/def/con?x=270&p=upload/cast/244_17610455361.jpg&1761045579' }
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
      console.log(`✅ 既存の「アロマワン」枠を発見しました。全${therapistsRaw.length}名のデータを上書きします。`);
    } else {
      console.log(`⚠️ 既存枠がないため、梅田エリアで新規IDを発行して登録します。`);
    }

    console.log(`⚙️ 店舗データ(shops)を更新中...`);
    await supabase.from('shops').upsert({
      id: targetId,
      area_id: CONFIG.fallbackAreaId,
      name: CONFIG.shopName,
      schedule_url: CONFIG.scheduleUrl,
      price_system: CONFIG.priceSystem
    });

    const payload = therapistsRaw.map(t => {
      const clean = cleanseName(t.rawName);
      
      let bioStr = `年齢: ${t.age || '非公開'}`;
      if (t.rank) bioStr += ` / ランク: ${t.rank}`;

      return {
        id: `${targetId}_${clean}`,
        shop_id: targetId,
        name: clean,
        image_url: t.image?.trim() || null,
        is_active: true,
        last_seen_at: now,
        raw_data: { 
          tags: t.tags, 
          bio: bioStr,
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

    console.log('\n🎉 Aroma one(アロマワン)のデータ登録が完全に完了しました！');

  } catch (err) {
    console.error('❌ エラー:', err);
  }
}

main();
