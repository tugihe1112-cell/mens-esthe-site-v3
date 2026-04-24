import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

function cleanseName(rawName) {
  if (!rawName) return '';
  return rawName.replace(/\(.*?\)|（.*?）/g, '').trim();
}

const CONFIG = {
  searchKeyword: '%ルレーヴ%',
  searchKeyword2: '%Le Reve%',
  fallbackAreaId: 'tokyo_toshima_ikebukuro', // 新規作成時のデフォルトエリア
  shopName: 'ルレーヴ (Le Reve CK)',
  scheduleUrl: 'https://lereve-esthe.com/schedule/',
  priceSystem: '【Le Reve CKコース】\n60分 15,000円 (仰向けのみ)\n*70分 12,000円\n90分 16,000円\n120分 20,000円\n150分 25,000円\n180分 30,000円\n\n【Le Reve KINGコース】\n120分 24,000円\n150分 29,000円\n180分 34,000円'
};

// HTMLから抽出したキャストデータ（29名＋ノイズ）
const therapistsRaw = [
  { rawName: '橋本すみれ', size: '42歳 T167 (G)', tags: ['未経験育成割引'], image: 'https://lereve-esthe.com/wp-content/uploads/2026/04/hashimoto.jpg' },
  { rawName: '水嶋かな', size: '40歳 T161 (F)', tags: ['癒し系'], image: 'https://lereve-esthe.com/wp-content/uploads/2026/04/nuzushima1.jpg' },
  { rawName: '椿えりか', size: '35歳 T165 (E)', tags: ['ビジュアル抜群'], image: 'https://lereve-esthe.com/wp-content/uploads/2026/03/asano5.jpg' },
  { rawName: '飛鳥もえ', size: '34歳 T152 (Ｆ)', tags: ['近距離施術'], image: 'https://lereve-esthe.com/wp-content/uploads/2026/03/asuka.jpg' },
  { rawName: '森下ゆり子', size: '44歳 T156 (F)', tags: ['割引き不可'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/01/6ef5ff0f-8018-47b6-881a-30c2eb3537b7.jpg' },
  { rawName: '辻あかね', size: '40歳 T158 (D)', tags: ['割引き不可'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/01/a55d82fa-8741-4d95-a805-23f947f2c86d.jpg' },
  { rawName: '小町さや', size: '42歳 T165 (E)', tags: ['割引き不可'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/07/komathi①.jpg' },
  { rawName: '不破さえ', size: '36歳 T168 (F)', tags: ['グラマー'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/01/32493bae-b861-47eb-8e86-49f9cd361aaf.jpg' },
  { rawName: '後藤みづき', size: '43歳 T163 (C)', tags: ['割引き不可'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/04/gotou1.jpg' },
  { rawName: '和中ななせ', size: '37歳 T160 (C)', tags: ['割引き不可'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/01/4aa02083-2b19-4eff-ae04-00dba100df3a.jpg' },
  { rawName: '財前えれな', size: '40歳 T165 (G)', tags: ['グラマー'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/01/42851905-6ef8-4a7d-baf3-1f326c62dbcc.jpg' },
  { rawName: '山崎まゆ', size: '43歳 T156 (E)', tags: ['リピーター多数'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/01/4a8c9952-602a-4a8c-86c5-291028441675.jpg' },
  { rawName: '石川まい', size: '35歳 T162 (D)', tags: ['可愛い'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/01/0c90057b-2888-4266-a931-c0c2b8820c1c.jpg' },
  { rawName: '二条まな', size: '37歳 T165 (Ⅾ)', tags: ['美人'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/10/nijyou1-1.jpg' },
  { rawName: '絢丸もえこ', size: '44歳 T155 (C)', tags: ['リピーター多数'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/01/no_image-1c3154e5017da984c1aadcc8da57071262c7af2b235179de296d3163feaa7314.jpg' },
  { rawName: '吉村ゆの', size: '42歳 T162 (F)', tags: ['スタイル抜群'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/01/04f600e9-a003-42fa-936a-37441e2581f8.jpg' },
  { rawName: '鈴木いつか', size: '41歳 T162 (Ⅾ)', tags: ['おすすめ'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/10/suzuki.jpg' },
  { rawName: '小川なつみ', size: '34歳 T153 (E)', tags: ['清楚系'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/01/394fb12f-a218-4a89-8934-577707cf517f.jpg' },
  { rawName: '桜木りお', size: '31歳 T158 (C)', tags: ['癒し系'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/06/sakg3.jpg' },
  { rawName: '吉原ゆあ', size: '34歳 T160 (C)', tags: ['可愛い'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/04/7bfce037-59c2-4861-ae5b-eee1d40705a5.jpg' },
  { rawName: '桃川さゆり', size: '46歳 T156 (Ⅾ)', tags: ['妖艶'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/04/mom2.jpg' },
  { rawName: '目黒りさ', size: '34歳 T160 (F)', tags: ['可愛い'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/01/0b5d1ebd-6112-4d18-8499-1a969ea03e78.jpg' },
  { rawName: '中条すずか', size: '45歳 T166 (E)', tags: ['スタイル抜群'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/06/nakaj3.jpg' },
  { rawName: '赤坂りか', size: '38歳 T156 (Ｆ)', tags: ['癒し系'], image: 'https://lereve-esthe.com/wp-content/uploads/2026/02/akasaka.jpg' },
  { rawName: '山村さくら', size: '39歳 T153 (D)', tags: ['スタイル抜群'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/01/3899b19b-a94b-4e38-b080-a0e6ef2d0348.jpg' },
  { rawName: '石原えま', size: '40歳 T156 (F)', tags: ['ホスピタリティー'], image: 'https://lereve-esthe.com/wp-content/uploads/2026/01/ishihara11.jpg' },
  { rawName: '花森みい', size: '43歳 T155 (D)', tags: ['美人'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/12/hanamori1.jpg' },
  { rawName: '谷あかり', size: '31歳 T154 (D)', tags: ['キレイ系'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/11/tani1.jpg' },
  { rawName: '長谷川ひびき', size: '43歳 T158 (C)', tags: ['おすすめ'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/05/hase1.jpg' },
  { rawName: '如月れいか', size: '41歳 T161 (Ⅾ)', tags: ['スタイル抜群'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/05/kisaragi4.jpg' },
  { rawName: '森川りの', size: '35歳 T165 (G)', tags: ['グラマー'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/01/5a14a26e-f077-4068-8cc6-4d88fcbe6ea4.jpg' },
  { rawName: '白井りり', size: '41歳 T155 (F)', tags: ['妖艶'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/12/cirai1.jpg' },
  { rawName: '夕日みや', size: '38歳 T164 (E)', tags: ['清楚系'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/01/6c440139-e268-48a3-a261-dd1db29cc831.jpg' },
  { rawName: '田宮さら', size: '38歳 T158 (E)', tags: ['店長おすすめ'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/06/tami3.jpg' },
  { rawName: '水原ななえ', size: '38歳 T157 (C)', tags: ['愛嬌抜群'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/12/mizuhara1.jpg' },
  { rawName: '日向みらい', size: '30歳 T157 (E)', tags: ['愛嬌抜群'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/01/8595ac8d-6460-49a1-9c6b-e5d90c231ffe.jpg' },
  { rawName: '赤松はな', size: '43歳 T158 (E)', tags: ['母性'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/01/c756bd47-4134-493a-8728-691493a9fd64.jpg' },
  { rawName: '羽鳥りんか', size: '34歳 T158 (E)', tags: ['可愛い'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/01/a81b8155-4cc0-47b0-90bb-bb353a4401da.jpg' },
  { rawName: '速見ありさ', size: '37歳 T157 (C)', tags: ['スタイル抜群'], image: 'https://lereve-esthe.com/wp-content/uploads/2026/01/hayami2.jpg' },
  { rawName: '永井ゆり', size: '36歳 T172 (F)', tags: ['高身長'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/01/fef342be-b322-4aae-abb6-a254581e944c.jpg' },
  { rawName: '愛田りょう', size: '32歳 T160 (E)', tags: ['綺麗'], image: 'https://lereve-esthe.com/wp-content/uploads/2026/01/aida-450x675.jpg' },
  { rawName: '本郷ゆめか', size: '41歳 T163 (F)', tags: ['笑顔'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/04/596b5cc0-cd5a-48ce-82ce-0c1ed92f526b.jpg' },
  { rawName: '西川なな', size: '33歳 T160 (E)', tags: ['グラマー'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/01/3f43c31f-46b9-4bfa-a266-752cb0997586.jpg' },
  { rawName: '小西りほ', size: '43歳 T158 (C)', tags: ['割引き不可'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/05/konishi.jpg' },
  { rawName: '水野かすみ', size: '35歳 T164 (E)', tags: ['清楚系'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/01/d5880dac-667c-4e29-8c18-09d9c4e272e6.jpg' },
  { rawName: '松嶋れい', size: '35歳 T153 (E)', tags: ['グラマー'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/04/mats2.jpg' },
  { rawName: '青木りず', size: '37歳 T154 (E)', tags: ['割引き不可'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/01/f25736fd-4705-46e0-9293-52c91c119eb3.jpg' },
  { rawName: '木村あおい', size: '35歳 T156 (F)', tags: ['割引き不可'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/01/a1e50524-3fe8-4afb-aa0b-30877f59fa81.jpg' },
  { rawName: '椎名あやみ', size: '39歳 T160 (Ｆ)', tags: ['リピーター多数'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/01/7ddd069e-8a8d-4229-ae23-5f3a894cf4b1.jpg' },
  { rawName: '栗原のぞみ', size: '38歳 T160 (C)', tags: ['清楚系'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/01/1b2da4be-6ccf-4419-b4f0-f6e1d3910f75.jpg' },
  { rawName: '西野あやか', size: '40歳 T150 (C)', tags: ['イチオシ'], image: 'https://lereve-esthe.com/wp-content/uploads/2026/01/fujisaki1.jpg' },
  { rawName: '七瀬みなみ', size: '37歳 T158 (E)', tags: ['店長おすすめ'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/12/aokawa1.jpg' },
  { rawName: '星せいな', size: '34歳 T150 (C)', tags: ['美人'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/08/unnamed.jpg' },
  { rawName: '本城あずさ', size: '42歳 T156 (C)', tags: ['美脚'], image: 'https://lereve-esthe.com/wp-content/uploads/2026/02/09ee848f-cc11-4fef-9819-a4c5a0984538.jpg' },
  { rawName: '森すずか', size: '33歳 T166 (F)', tags: ['愛嬌抜群'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/06/mori1.jpg' },
  { rawName: '桃瀬あやな', size: '43歳 T160 (H)', tags: ['巨乳'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/05/momose.jpg' },
  { rawName: '堀川かえで', size: '43歳 T153 (C)', tags: ['ナチュラル'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/06/IMG_6446.jpeg' },
  { rawName: '安藤なつみ', size: '38歳 T162 (F)', tags: ['美肌'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/01/e5e1e619-324f-4c97-8371-be5a4d9da4b3.jpg' },
  { rawName: '音葉(おとは)ゆきの', size: '34歳 T160 (D)', tags: ['清楚系'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/01/9a25c5a3-f47e-40b7-89ea-2af09328ee54.jpg' },
  { rawName: '国松れん', size: '44歳 T160 (E)', tags: ['キレイ系'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/01/14df951d-bea9-472b-b619-a9b5d304377e.jpg' },
  { rawName: '柏木みお', size: '37歳 T164 (E)', tags: ['可愛い'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/04/140aabc5-e00b-48b1-b788-b42afc2b4743.jpg' },
  { rawName: '仲野りょうこ', size: '39歳 T160 (E)', tags: ['キレイ系'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/01/14c08ce9-5ba3-45c1-88d8-80c81e6b6465.jpg' },
  { rawName: '今井さな', size: '32歳 T152 (D)', tags: ['愛嬌抜群'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/01/1592d135-765a-4f9e-bcbe-42e62061a958.jpg' },
  { rawName: '泉あんじゅ', size: '35歳 T160 (E)', tags: ['美脚'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/01/800219ac-c4ee-4010-a909-27bd6cfe0b30.jpg' },
  { rawName: '瀬戸あつこ', size: '37歳 T155 (H)', tags: ['妖艶'], image: 'https://lereve-esthe.com/wp-content/uploads/2026/01/asano1.jpg' },
  { rawName: '夏木ひとみ', size: '41歳 T163 (E)', tags: ['ホスピタリティー'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/01/ccdedb96-dc99-4425-a76c-c576e37f8623.jpg' },
  { rawName: '佐久間かほ', size: '39歳 T157 (G)', tags: ['笑顔'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/01/5e6505b8-4081-4c19-ad55-66d97b219344.jpg' },
  { rawName: '結城りな', size: '40歳 T163 (E)', tags: ['可愛い'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/01/90033bf7-4222-4f4c-9df8-13642982404e.jpg' },
  { rawName: '永山あき', size: '32歳 T163 (C)', tags: ['清楚系'], image: 'https://lereve-esthe.com/wp-content/uploads/2025/01/dd406b15-e874-4ab9-b258-8224d4d314d4.jpg' },
  { rawName: '大塚北口ROOM', size: '', tags: [], image: 'https://lereve-esthe.com/wp-content/uploads/2025/01/S__41713694-450x675.jpg' }, // ※除外対象
  { rawName: '大塚南口ROOM', size: '', tags: [], image: 'https://lereve-esthe.com/wp-content/uploads/2025/01/S__41713692-450x675.jpg' }, // ※除外対象
  { rawName: '日暮里ROOM', size: '', tags: [], image: 'https://lereve-esthe.com/wp-content/uploads/2025/01/S__41713691-450x675.jpg' }, // ※除外対象
  { rawName: '駒込ROOM', size: '', tags: [], image: 'https://lereve-esthe.com/wp-content/uploads/2025/01/S__41713695-450x675.jpg' }, // ※除外対象
  { rawName: '池袋西口 FC ROOM', size: '', tags: [], image: 'https://lereve-esthe.com/wp-content/uploads/2025/05/IMG_5434-450x600.jpeg' }, // ※除外対象
  { rawName: '十条 FC ROOM', size: '', tags: [], image: 'https://lereve-esthe.com/wp-content/uploads/2025/11/IMG_6507-450x600.jpeg' }, // ※除外対象
  { rawName: '未経験育成割り', size: '', tags: [], image: 'https://lereve-esthe.com/wp-content/uploads/2025/01/4d036d16-2109-40f4-922a-22e28d2cacd6.jpg' } // ※除外対象
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
      console.log(`✅ 既存の「ルレーヴ」枠を発見しました。データを上書きします。`);
    } else {
      console.log(`⚠️ 既存枠がないため、新規IDを発行して登録します。`);
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

    // 3. キャストデータの整形とノイズ除外
    const payload = therapistsRaw
      // "ROOM" や "育成割り" を含むノイズデータを除外
      .filter(t => !t.rawName.includes('ROOM') && !t.rawName.includes('育成割り'))
      .map(t => {
        const clean = cleanseName(t.rawName);
        return {
          id: `${targetId}_${clean}`,
          shop_id: targetId,
          name: clean,
          image_url: t.image?.trim() || null,
          is_active: true,
          last_seen_at: now,
          raw_data: { tags: t.tags, size: t.size, original_name: t.rawName }
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

    console.log(`✅ ${payload.length} 名のキャスト情報を登録・更新しました（ダミー枠は除外済み）。`);
    if (inactives?.length > 0) {
      console.log(`📉 今回取得できなかった ${inactives.length}名 を非表示にしました。`);
    }

    console.log('\n🎉 ルレーヴのデータ登録（ステップ①）が完了しました！');
    console.log('ロゴ（ステップ②）の準備ができましたら、画像URLをお待ちしております。');

  } catch (err) {
    console.error('❌ エラー:', err);
  }
}

main();
