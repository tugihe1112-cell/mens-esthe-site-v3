import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

function cleanseName(rawName) {
  if (!rawName) return '';
  // 全角スペースや半角スペースを削除して名前を詰める。また年齢表記なども消す。
  return rawName.replace(/\(.*?\)|（.*?）/g, '').replace(/[\s　]/g, '').trim();
}

const CONFIG = {
  searchKeyword: '%Hiran Next%',
  searchKeyword2: '%平安NEXT%',
  fallbackAreaId: 'tokyo_chiyoda_akihabara', // 秋葉原エリア
  shopName: 'Hiran Next (平安NEXT)',
  scheduleUrl: 'https://akihabara-hiran.com/schedule/',
  // ご提示いただいた割引適用後のシステム料金
  priceSystem: '60分 13,000円\n70分 14,000円\n90分 17,000円\n120分 22,000円\n150分 29,000円'
};

// HTMLから抽出した詳細なキャストデータ（8名分）
const therapistsRaw = [
  { 
    rawName: '綾野かれん', 
    size: '23歳 T161 B88(E) W56 H85', 
    tags: ['お姉さん系', 'サービス◎', '清楚系', '濃厚施術', '神スタイル', '美脚'],
    bio: '積極施術で満足度高♡',
    image: 'https://akihabara-hiran.com/wp-content/uploads/2026/04/11533_20260416213059_600_800_0.jpg'
  },
  { 
    rawName: '星野みづき', 
    size: '23歳 T158 B88(E) W61 H92', 
    tags: ['おっとり', 'マッサージ◎', '性格◎', '愛嬌抜群', '清楚系', '濃厚施術'],
    bio: '激カワ！！秋葉原No.1ルックス☆彡',
    image: 'https://akihabara-hiran.com/wp-content/uploads/2026/04/11512_20260414224958_600_800_0.jpg'
  },
  { 
    rawName: '佐藤もか', 
    size: '20歳 T154 B83(C) W56 H84', 
    tags: ['おすすめ', 'スタイル抜群', '好奇心旺盛', '小柄', '性格◎', '愛嬌抜群', '激カワ', '高リピート'],
    bio: '驚異のモデル級スタイル！！',
    image: 'https://akihabara-hiran.com/wp-content/uploads/2025/05/6323_20260115152206_600_800_3.jpg'
  },
  { 
    rawName: '中田えみ', 
    size: '21歳 T150 B88(F) W57 H86', 
    tags: ['おすすめ', 'サービス◎', 'マッサージ◎', '小柄', '愛嬌抜群', '濃厚施術', '積極的', '高リピート'],
    bio: '秋葉原ヒランの看板セラピスト♪',
    image: 'https://akihabara-hiran.com/wp-content/uploads/2025/05/6381_20260115152325_600_800_3.jpg'
  },
  { 
    rawName: '上原なつき', 
    size: '21歳 T162 B84(D) W56 H83', 
    tags: ['おすすめ', 'おっとり', 'スタイル抜群', '業界未経験', '激カワ', '癒し系', '高リピート'],
    bio: '殿堂入り！リピートクイーン☆彡',
    image: 'https://akihabara-hiran.com/wp-content/uploads/2025/05/6379_20260115152308_600_800_0.jpg'
  },
  { 
    rawName: '新井さな', 
    size: '24歳 T164 B88(G) W56 H85', 
    tags: ['おすすめ', 'おっとり', 'サービス◎', 'モデル系', '清楚系', '濃厚施術', '神スタイル', '美人', '高リピート'],
    bio: 'グラビアモデル級の神スタイル☆彡',
    image: 'https://akihabara-hiran.com/wp-content/uploads/2025/05/6382_20260329161339_600_800_0.jpg'
  },
  { 
    rawName: '月野りあ', 
    size: '24歳 T169 B85(D) W57 H84', 
    tags: ['スタイル抜群', 'モデル系', '美人', '美脚', '長身'],
    bio: 'めちゃ×2性格良しなモデル系セラピ♪',
    image: 'https://akihabara-hiran.com/wp-content/uploads/2025/05/6390_20260115152456_600_800_0.jpg'
  },
  { 
    rawName: '瀬川きほ', 
    size: '22歳 T165 B95(G) W57 H86', 
    tags: ['おすすめ', 'おっとり', '上品', '清楚系', '濃厚施術', '神スタイル', '美人', '高リピート'],
    bio: 'スタイル抜群！！レア出勤のS級美女☆彡',
    image: 'https://akihabara-hiran.com/wp-content/uploads/2025/05/6383_20260213124742_600_800_0.jpg'
  },
  { 
    rawName: '松田えりか', 
    size: '21歳 T159 B88(F) W57 H86', 
    tags: ['サービス◎', 'スタイル抜群', '好奇心旺盛', '性格◎', '愛嬌抜群', '業界未経験', '高リピート'],
    bio: '愛嬌抜群でスタイル良し！！レア出勤♪',
    image: 'https://akihabara-hiran.com/wp-content/uploads/2025/05/6396_20260215115850_600_800_0.jpg'
  },
  { 
    rawName: '柳まいか', 
    size: '19歳 T168 B92(F) W58 H87', 
    tags: ['スタイル抜群', '業界未経験', '清楚系', '激カワ', '癒し系', '長身'],
    bio: '激カワ！！緊張気味の未経験セラピ♪',
    image: 'https://akihabara-hiran.com/wp-content/uploads/2025/05/6400_20260115152548_600_800_0.jpg'
  },
  { 
    rawName: '渚るな', 
    size: '26歳 T158 B85(D) W57 H84', 
    tags: ['おっとり', 'お姉さん系', 'スタイル抜群', 'マッサージ◎', '上品', '清楚系', '美人'],
    bio: '正統派の王道施術に悶絶必至！！',
    image: 'https://akihabara-hiran.com/wp-content/uploads/2025/05/6393_20260115152519_600_800_0.jpg'
  },
  { 
    rawName: '川村のぞみ', 
    size: '23歳 T159 B85(E) W57 H88', 
    tags: ['おすすめ', 'サービス◎', 'スタイル抜群', '好奇心旺盛', '愛嬌抜群', '濃厚施術', '高リピート'],
    bio: '人懐っこい性格で人気セラピスト☆彡',
    image: 'https://akihabara-hiran.com/wp-content/uploads/2025/05/6395_20260115152632_600_800_0.jpg'
  },
  { 
    rawName: '小川ちとせ', 
    size: '24歳 T165 B90(F) W59 H87', 
    tags: ['お姉さん系', 'マッサージ◎', '清楚系', '癒し系', '長身'],
    bio: 'メンズエステ向きのグラマラススタイル！！',
    image: 'https://akihabara-hiran.com/wp-content/uploads/2025/05/6399_20260115152824_600_800_0.jpg'
  },
  { 
    rawName: '神谷あおい', 
    size: '23歳 T156 B85(D) W56 H84', 
    tags: ['おっとり', 'お姉さん系', 'スタイル抜群', '癒し系', '美人', '美脚'],
    bio: 'キレカワ♪スタイル抜群のお姉さん系☆彡',
    image: 'https://akihabara-hiran.com/wp-content/uploads/2025/11/9321_20260115152720_600_800_0.jpg'
  },
  { 
    rawName: '秋山あいか', 
    size: '18歳 T160 B83(C) W56 H85', 
    tags: ['おっとり', 'ギャル系', 'スタイル抜群', '可愛い', '業界未経験'],
    bio: '見た目によらず超緊張中のギャルセラピ♪',
    image: 'https://akihabara-hiran.com/wp-content/uploads/2025/11/9523_20260115152942_600_800_0.jpg'
  },
  { 
    rawName: '藤原まゆ', 
    size: '23歳 T160 B84(D) W57 H86', 
    tags: ['おっとり', 'マッサージ◎', '上品', '可愛い', '女子アナ系'],
    bio: '次世代エース候補のオススメセラピスト♪',
    image: 'https://akihabara-hiran.com/wp-content/uploads/2025/07/7701_20260115152537_600_800_0.jpg'
  },
  { 
    rawName: '柿谷すず', 
    size: '20歳 T153 B82(C) W58 H86', 
    tags: ['可愛い', '小柄', '性格◎', '愛嬌抜群', '業界未経験', '清楚系', '真面目', '素人系'],
    bio: '小柄で愛嬌たっぷりの未経験セラピ♪',
    image: 'https://akihabara-hiran.com/wp-content/uploads/2026/04/11395_20260401170119_600_800_0.jpg'
  },
  { 
    rawName: '白石さき', 
    size: '25歳 T158 B89(E) W59 H90', 
    tags: ['おっとり', 'お姉さん系', '上品', '女子アナ系', '性格◎', '癒し系'],
    bio: 'セクシー担当のお姉さん系セラピ♪',
    image: 'https://akihabara-hiran.com/wp-content/uploads/2026/03/11237_20260319162651_600_800_0.jpg'
  },
  { 
    rawName: '山下ことね', 
    size: '22歳 T147 B78(B) W55 H82', 
    tags: ['スレンダー', '小柄', '清楚系', '激カワ', '真面目', '素人系', '美形'],
    bio: 'ルックス重視のお客様に激しくオススメ！！',
    image: 'https://akihabara-hiran.com/wp-content/uploads/2026/02/10782_20260210130110_600_800_0.jpg'
  },
  { 
    rawName: '和泉りん', 
    size: '20歳 T170 B87(D) W59 H90', 
    tags: ['性格◎', '愛嬌抜群', '業界未経験', '素人系', '長身'],
    bio: '長身未経験の現役学生☆彡',
    image: 'https://akihabara-hiran.com/wp-content/uploads/2026/03/11134_20260320230204_600_800_0.jpg'
  },
  { 
    rawName: '里崎ゆのん', 
    size: '20歳 T158 B86(D) W58 H88', 
    tags: ['性格◎', '業界未経験', '積極的', '素人系'],
    bio: 'THE素人系、未経験セラピ☆彡',
    image: 'https://akihabara-hiran.com/wp-content/uploads/2026/02/10944_20260320034848_600_800_0.jpg'
  },
  { 
    rawName: '橋本ゆうな', 
    size: '21歳 T159 B85(C) W57 H86', 
    tags: ['スレンダー', '上品', '可愛い', '愛嬌抜群', '業界未経験', '清楚系', '癒し系'],
    bio: '未経験なのに積極的...♪',
    image: 'https://akihabara-hiran.com/wp-content/uploads/2026/03/11176_20260315031335_600_800_0.jpg'
  },
  { 
    rawName: '佐々木みゆ', 
    size: '20歳 T151 B92(G) W58 H85', 
    tags: ['可愛い', '好奇心旺盛', '小柄', '愛嬌抜群', '濃厚施術', '高リピート'],
    bio: '激カワ！元気で愛嬌抜群♪',
    image: 'https://akihabara-hiran.com/wp-content/uploads/2025/05/6391_20260115152753_600_800_0.jpg'
  },
  { 
    rawName: '大谷ゆき', 
    size: '20歳 T160 B85(D) W56 H84', 
    tags: ['スタイル抜群', '愛嬌抜群', '清楚系', '激カワ', '癒し系', '美形', '高リピート'],
    bio: 'ルックス＆スタイル抜群の癒し系☆彡',
    image: 'https://akihabara-hiran.com/wp-content/uploads/2025/05/6392_20260115152806_600_800_0.jpg'
  },
  { 
    rawName: '宮田かぐら', 
    size: '24歳 T150 B86(E) W57 H85', 
    tags: ['サービス◎', '小柄', '愛嬌抜群', '業界未経験', '濃厚施術', '高リピート'],
    bio: '超近距離施術の人気セラピスト♪',
    image: 'https://akihabara-hiran.com/wp-content/uploads/2025/05/6402_20260223151903_600_800_0.jpg'
  },
  { 
    rawName: '高橋ことり', 
    size: '23歳 T147 B83(D) W56 H84', 
    tags: ['サービス◎', 'スレンダー', '可愛い', '好奇心旺盛', '小柄', '愛嬌抜群', '濃厚施術'],
    bio: '小柄な体に似合わないプロ級マッサージ技術！！',
    image: 'https://akihabara-hiran.com/wp-content/uploads/2025/05/6401_20260202221435_600_800_0.jpg'
  }
];

async function main() {
  console.log(`🚀 ${CONFIG.shopName}：ステップ① データ登録を開始します...\n`);
  const now = new Date().toISOString();
  
  try {
    // 1. 店舗の特定（新規または上書き）
    let { data: shops, error: searchError } = await supabase
      .from('shops')
      .select('id')
      .or(`name.ilike.${CONFIG.searchKeyword},name.ilike.${CONFIG.searchKeyword2}`)
      .limit(1);

    if (searchError) throw searchError;

    const targetId = (shops && shops.length > 0) ? shops[0].id : crypto.randomUUID();

    if (shops?.length > 0) {
      console.log(`✅ 既存の「平安NEXT」枠を発見しました。データを上書きします。`);
    } else {
      console.log(`⚠️ 既存枠がないため、秋葉原エリアで新規IDを発行して登録します。`);
    }

    // 2. 店舗情報のUpsert
    console.log(`⚙️ 店舗データ(shops)を更新中...`);
    await supabase.from('shops').upsert({
      id: targetId,
      area_id: CONFIG.fallbackAreaId,
      name: CONFIG.shopName,
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
        raw_data: { size: t.size, tags: t.tags, bio: t.bio, original_name: t.rawName }
      };
    });

    // キャストのUpsert実行
    console.log(`⚙️ セラピストデータ(therapists)を登録中...`);
    await supabase.from('therapists').upsert(payload);

    // 4. 自動退店処理（いなくなったキャストを非表示）
    const { data: inactives } = await supabase.from('therapists')
      .update({ is_active: false })
      .eq('shop_id', targetId)
      .lt('last_seen_at', now)
      .select('name');

    console.log(`✅ ${payload.length} 名のキャスト情報を登録・更新しました。`);
    if (inactives?.length > 0) {
      console.log(`📉 今回取得できなかった ${inactives.length}名 を非表示にしました。`);
    }

    console.log('\n🎉 平安NEXTのデータ登録（ステップ①）が完了しました！');
    console.log('ロゴ（ステップ②）の準備ができましたら、画像URLをお待ちしております。');

  } catch (err) {
    console.error('❌ エラー:', err);
  }
}

main();
