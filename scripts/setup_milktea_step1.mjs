import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

function cleanseName(rawName) {
  if (!rawName) return '';
  // 「セラピスト」、カッコ（ふりがな）、全角半角スペースを削除
  return rawName.replace(/セラピスト/g, '').replace(/（.*?）|\(.*?\)/g, '').replace(/[\s　]/g, '').trim();
}

const CONFIG = {
  searchKeyword: '%milk tea%',
  searchKeyword2: '%ミルクティー%',
  fallbackAreaId: 'osaka_osaka_umeda', // 梅田エリア
  shopName: 'milk tea (ミルクティー)',
  scheduleUrl: 'https://osakamilktea.com/schedule.php',
  // 画像から抽出した料金システム
  priceSystem: '【全身コース】\n90分 13,000円\n120分 17,000円\n150分 21,000円'
};

// HTMLから抽出したキャストデータ（全26名）
const baseUrl = 'https://osakamilktea.com';
const therapistsRaw = [
  { rawName: '琴葉(ことは)セラピスト', size: '21歳 T149cm', image: `${baseUrl}/exa_userdata/person/925/image_thumb1_resize2.jpg` },
  { rawName: '紅莉(あかり)セラピスト', size: '21歳 T155cm', image: `${baseUrl}/exa_userdata/person/923/image_thumb1_resize2.jpg` },
  { rawName: '白衣(はくい)セラピスト', size: '25歳 T158cm', image: `${baseUrl}/exa_userdata/person/920/image_thumb1_resize2.jpg` },
  { rawName: '南乃(なの)セラピスト', size: '20歳 T154cm', image: `${baseUrl}/exa_userdata/person/919/image_thumb1_resize2.jpg` },
  { rawName: '白星(しらほし)セラピスト', size: '22歳 T154cm', image: `${baseUrl}/exa_userdata/person/921/image_thumb1_resize2.jpg` },
  { rawName: '若菜セラピスト', size: '22歳 T157cm', image: `${baseUrl}/exa_userdata/person/538/image_thumb1_resize2.jpg` },
  { rawName: '絵深(えふか)セラピスト', size: '24歳 T151cm', image: `${baseUrl}/exa_userdata/person/316/image_thumb1_resize2.jpg` },
  { rawName: '神楽(かぐら)セラピスト', size: '21歳 T160cm', image: `${baseUrl}/exa_userdata/person/910/image_thumb1_resize2.jpg` },
  { rawName: '梨寿(りず)セラピスト', size: '25歳 T162cm', image: `${baseUrl}/exa_userdata/person/884/image_thumb1_resize2.jpg` },
  { rawName: '素直(すなお)セラピスト', size: '21歳 T159cm', image: `${baseUrl}/exa_userdata/person/874/image_thumb1_resize2.jpg` },
  { rawName: '水城(みずき)セラピスト', size: '29歳 T156cm', image: `${baseUrl}/exa_userdata/person/855/image_thumb1_resize2.jpg` },
  { rawName: '桜田(さくらだ)セラピスト', size: '24歳 T153cm', image: `${baseUrl}/exa_userdata/person/830/image_thumb1_resize2.jpg` },
  { rawName: '里沙(りさ)セラピスト', size: '28歳 T166cm', image: `${baseUrl}/exa_userdata/person/834/image_thumb1_resize2.jpg` },
  { rawName: '千夏(ちなつ)セラピスト', size: '25歳 T156cm', image: `${baseUrl}/exa_userdata/person/625/image_thumb1_resize2.jpg` },
  { rawName: '月代(つきよ)セラピスト', size: '20歳 T158cm', image: `${baseUrl}/exa_userdata/person/731/image_thumb1_resize2.jpg` },
  { rawName: '美衣(みい)セラピスト', size: '24歳 T161cm', image: `${baseUrl}/exa_userdata/person/776/image_thumb1_resize2.jpg` },
  { rawName: '萌音(もね)セラピスト', size: '23歳 T158cm', image: `${baseUrl}/exa_userdata/person/533/image_thumb1_resize2.jpg` },
  { rawName: '浜崎セラピスト', size: '27歳 T148cm', image: `${baseUrl}/exa_userdata/person/274/image_thumb1_resize2.jpg` },
  { rawName: '新心(にこ)セラピスト', size: '19歳 T153cm', image: `${baseUrl}/exa_userdata/person/828/image_thumb1_resize2.jpg` },
  { rawName: '澪癒(れい)セラピスト', size: '24歳 T156cm', image: `${baseUrl}/exa_userdata/person/857/image_thumb1_resize2.jpg` },
  { rawName: '結友(ゆう)セラピスト', size: '23歳 T150cm', image: `${baseUrl}/exa_userdata/person/813/image_thumb1_resize2.jpg` },
  { rawName: '藍彩(あいいろ)セラピスト', size: '24歳 T152cm', image: `${baseUrl}/exa_userdata/person/918/image_thumb1_resize2.jpg` },
  { rawName: '宮瀬セラピスト', size: '32歳 T158cm', image: `${baseUrl}/exa_userdata/person/387/image_thumb1_resize2.jpg` },
  { rawName: '紺永(かんな)セラピスト', size: '22歳 T153cm', image: `${baseUrl}/exa_userdata/person/782/image_thumb1_resize2.jpg` },
  { rawName: '晴琉（はる）セラピスト', size: '22歳 T155cm', image: `${baseUrl}/exa_userdata/person/799/image_thumb1_resize2.jpg` },
  { rawName: '清香(きよか)セラピスト', size: '28歳 T150cm', image: `${baseUrl}/exa_userdata/person/899/image_thumb1_resize2.jpg` },
  { rawName: '陽和(ひより)セラピスト', size: '24歳 T163cm', image: `${baseUrl}/exa_userdata/person/679/image_thumb1_resize2.jpg` },
  { rawName: '芽瑠(める)セラピスト', size: '19歳 T156cm', image: `${baseUrl}/exa_userdata/person/905/image_thumb1_resize2.jpg` },
  { rawName: '陽真(ひま)セラピスト', size: '23歳 T159cm', image: `${baseUrl}/exa_userdata/person/727/image_thumb1_resize2.jpg` },
  { rawName: '桃香(ももか)セラピスト', size: '22歳 T165cm', image: `${baseUrl}/exa_userdata/person/900/image_thumb1_resize2.jpg` },
  { rawName: '天寧(あめり)セラピスト', size: '21歳 T158cm', image: `${baseUrl}/exa_userdata/person/924/image_thumb1_resize2.jpg` },
  { rawName: '茅吹(かやぶき)セラピスト', size: '25歳 T155cm', image: `${baseUrl}/exa_userdata/person/560/image_thumb1_resize2.jpg` },
  { rawName: '如月(きさらぎ)セラピスト', size: '21歳 T160cm', image: `${baseUrl}/exa_userdata/person/864/image_thumb1_resize2.jpg` },
  { rawName: '萌実セラピスト', size: '21歳 T151cm', image: `${baseUrl}/exa_userdata/person/280/image_thumb1_resize2.jpg` },
  { rawName: '上條セラピスト', size: '29歳 T153cm', image: `${baseUrl}/exa_userdata/person/289/image_thumb1_resize2.jpg` },
  { rawName: '栄華(えいか)セラピスト', size: '26歳 T158cm', image: `${baseUrl}/exa_userdata/person/898/image_thumb1_resize2.jpg` },
  { rawName: '初華(ういか)セラピスト', size: '25歳 T156cm', image: `${baseUrl}/exa_userdata/person/683/image_thumb1_resize2.jpg` },
  { rawName: '永恋(エレン)セラピスト', size: '23歳 T165cm', image: `${baseUrl}/exa_userdata/person/789/image_thumb1_resize2.jpg` },
  { rawName: '光珠(みたま)セラピスト', size: '18歳 T151cm', image: `${baseUrl}/exa_userdata/person/913/image_thumb1_resize2.jpg` },
  { rawName: '高宮セラピスト', size: '21歳 T165cm', image: `${baseUrl}/exa_userdata/person/873/image_thumb1_resize2.jpg` },
  { rawName: '恋詠(こよみ)セラピスト', size: '19歳 T152cm', image: `${baseUrl}/exa_userdata/person/871/image_thumb1_resize2.jpg` },
  { rawName: '雑賀(さいが)セラピスト', size: '21歳 T160cm', image: `${baseUrl}/exa_userdata/person/629/image_thumb1_resize2.jpg` },
  { rawName: '星那(せな)セラピスト', size: '23歳 T161cm', image: `${baseUrl}/exa_userdata/person/743/image_thumb1_resize2.jpg` },
  { rawName: '萌歌(もえか)セラピスト', size: '21歳 T165cm', image: `${baseUrl}/exa_userdata/person/398/image_thumb1_resize2.jpg` },
  { rawName: '優希(ゆうき)セラピスト', size: '31歳 T149cm', image: `${baseUrl}/exa_userdata/person/652/image_thumb1_resize2.jpg` }
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
      console.log(`✅ 既存の「ミルクティー」枠を発見しました。全${therapistsRaw.length}名のデータを上書きします。`);
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
      
      return {
        id: `${targetId}_${clean}`,
        shop_id: targetId,
        name: clean,
        image_url: t.image?.trim() || null,
        is_active: true,
        last_seen_at: now,
        raw_data: { size: t.size, original_name: t.rawName }
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

    console.log('\n🎉 milk tea (ミルクティー)のデータ登録が完全に完了しました！');

  } catch (err) {
    console.error('❌ エラー:', err);
  }
}

main();
