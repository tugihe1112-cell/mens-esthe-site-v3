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
  searchKeyword: '%熟れた果実%',
  searchKeyword2: '%ウレカジ%',
  fallbackAreaId: 'osaka_osaka_nippombashi', // 日本橋エリア
  shopName: '熟れた果実',
  scheduleUrl: 'https://spa-urekaji.com/schedule/',
  // 画像から抽出した料金システム
  priceSystem: '90分 19,000円\n120分 23,000円\n150分 27,000円'
};

// HTMLから抽出したキャストデータ（全24名）
const therapistsRaw = [
  { rawName: '白咲碧', size: '38歳 T173 B85(F) W59 H90', image: 'https://spa-urekaji.com/wp-content/uploads/2026/01/852F9FF1-7962-45F5-9E92-7B7DD4CA20F3-7436-0000032E62C87329.jpeg' },
  { rawName: '村上璃奈', size: '35歳 T165 B92(F) W59 H89', image: 'https://spa-urekaji.com/wp-content/uploads/2025/09/IMG_7477.jpeg' },
  { rawName: '椿みれ', size: '43歳 T162 B90(E) W61 H92', image: 'https://spa-urekaji.com/wp-content/uploads/2025/11/640eeec8b6177bc64edc9f35aef2c1cd.jpg' },
  { rawName: '伊吹芽衣', size: '36歳 T155 B82(C) W58 H85', image: 'https://spa-urekaji.com/wp-content/uploads/2026/03/IMG_2161.jpeg' },
  { rawName: '北川りおな', size: '35歳 T160 B86(D) W59 H87', image: 'https://spa-urekaji.com/wp-content/uploads/2026/04/BDD55056-61A5-40E0-84D1-DFB8FD723791-38128-000009610087C699.jpeg' },
  { rawName: '妃あいり', size: '40歳 T159 B88(E) W58 H85', image: 'https://spa-urekaji.com/wp-content/uploads/2024/06/7FF98858-9EE6-49F2-83A0-C3F576DA7392-47999-000024631DA70CD4.jpeg' },
  { rawName: '大場えみ', size: '38歳 T175 B85(C) W60 H93', image: 'https://spa-urekaji.com/wp-content/uploads/2025/05/IMG_4448.jpeg' },
  { rawName: '愛木りんか', size: '43歳 T158 B88(E) W60 H88', image: 'https://spa-urekaji.com/wp-content/uploads/2026/03/IMG_1747.jpeg' },
  { rawName: '立河綾香', size: '37歳 T153 B88(D) W61 H89', image: 'https://spa-urekaji.com/wp-content/uploads/2026/02/1A1E7BFC-CBC2-4546-9AC1-19AA785D3948-11030-000002A9B09CE2E9.jpeg' },
  { rawName: '鈴原ふじ乃', size: '43歳 T155 B83(C) W58 H85', image: 'https://spa-urekaji.com/wp-content/uploads/2025/01/IMG_2489-1.jpeg' },
  { rawName: '青山さりな', size: '38歳 T157 B88(E) W58 H83', image: 'https://spa-urekaji.com/wp-content/uploads/2022/07/08F8BF8F-051D-4BD9-88FD-D356F4188311.jpeg' },
  { rawName: '柚葉かおる', size: '39歳 T154 B84(D) W61 H86', image: 'https://spa-urekaji.com/wp-content/uploads/2026/01/1937BE64-B20E-499C-86CD-C04E80071507-520-0000001642D00731.jpeg' },
  { rawName: '如月みいな', size: '42歳 T163 B83(D) W58 H87', image: 'https://spa-urekaji.com/wp-content/uploads/2026/03/IMG_1778.jpeg' },
  { rawName: '紗倉あや', size: '38歳 T160 B85(D) W60 H81', image: 'https://spa-urekaji.com/wp-content/uploads/2026/02/IMG_1386.jpeg' },
  { rawName: '結城えり', size: '32歳 T157 B85(D) W59 H90', image: 'https://spa-urekaji.com/wp-content/uploads/2025/08/B15DE570-57F9-4C4B-AC62-F8F9E589C91F-2298-0000006456E35F88.jpeg' },
  { rawName: '明日菜りり', size: '38歳 T165 B95(G) W63 H98', image: 'https://spa-urekaji.com/wp-content/uploads/2024/12/AEE91199-FDE9-4CCA-B171-6366AA67708D-4410-000001F2C2B2DB5E.jpeg' },
  { rawName: '喜瀬光', size: '39歳 T158 B89(E) W60 H92', image: 'https://spa-urekaji.com/wp-content/uploads/2026/03/7913BECB-E480-414B-B8A8-2F27BBBD71E8-33303-0000084D12D3F83B.jpeg' },
  { rawName: '水沢ゆうな', size: '38歳 T158 B87(D) W61 H93', image: 'https://spa-urekaji.com/wp-content/uploads/2024/08/A1998EB0-545A-43D8-9CCD-1CACA54CCC69-8468-0000077FFF8B3CCD.jpeg' },
  { rawName: '黒木みすず', size: '38歳 T170 B93(E) W60 H90', image: 'https://spa-urekaji.com/wp-content/uploads/2026/03/D6F0F3D8-887F-4F4D-B3E6-67C61E8A587A-13671-000003CC9D116509.jpeg' },
  { rawName: '北乃みお', size: '36歳 T164 B86(D) W62 H90', image: 'https://spa-urekaji.com/wp-content/uploads/2023/09/F795D4D1-692D-41FD-953E-FCC787A59926-492-000000FCD7538F6B.jpeg' },
  { rawName: '響まりあ', size: '38歳 T158 B89(D) W63 H98', image: 'https://spa-urekaji.com/wp-content/uploads/2025/07/8A45C520-2377-4844-A60F-DC12B4B23AEE-34194-00000918ABDB0BF9.jpeg' },
  { rawName: '江藤なこ', size: '39歳 T152 B96(G) W62 H94', image: 'https://spa-urekaji.com/wp-content/uploads/2026/04/IMG_2458.jpeg' },
  { rawName: '安西まりな', size: '38歳 T150 B88(D) W64 H95', image: 'https://spa-urekaji.com/wp-content/uploads/2026/03/IMG_1949.jpeg' },
  { rawName: '浅田みく', size: '43歳 T162 B88(E) W62 H86', image: 'https://spa-urekaji.com/wp-content/uploads/2026/03/80CD6A23-23B1-4A04-8EA7-2885864F53E0-21193-0000054FDEADBE29.jpeg' },
  { rawName: '月嶋あゆな', size: '38歳 T168 B95(G) W63 H92', image: 'https://spa-urekaji.com/wp-content/uploads/2024/07/73B55918-4E53-4CCA-B372-00533E2FBE3E-31684-0000123775C805E0.jpeg' },
  { rawName: '米倉咲子', size: '41歳 T164 B90(F) W63 H92', image: 'https://spa-urekaji.com/wp-content/uploads/2023/10/AAD9A1B1-C359-4367-AFB9-3C222F325D27-3116-0000052F43D6B69F.jpeg' },
  { rawName: '影山あいら', size: '40歳 T156 B91(H) W63 H90', image: 'https://spa-urekaji.com/wp-content/uploads/2025/09/IMG_8064.jpeg' },
  { rawName: '凛咲まゆり', size: '38歳 T175 B91(F) W63 H92', image: 'https://spa-urekaji.com/wp-content/uploads/2025/06/93126F51-2C57-461F-965D-61615806764F-1904-000001A8A24CDE83.jpeg' },
  { rawName: '高嶋れおな', size: '40歳 T156 B88(E) W62 H94', image: 'https://spa-urekaji.com/wp-content/uploads/2024/07/A2B797B4-8996-4ABD-835E-F1938A816B8E-41164-000016FC2523A360.jpeg' },
  { rawName: '桜崎まみ', size: '41歳 T153 B82(C) W58 H83', image: 'https://spa-urekaji.com/wp-content/uploads/2025/01/22945338-7B13-45E3-8FAB-C06FE754942F-52788-000015D9D49FFA86.jpeg' },
  { rawName: '桜井ゆりこ', size: '42歳 T165 B95(E) W62 H89', image: 'https://spa-urekaji.com/wp-content/uploads/2026/03/DB98BA3E-6142-4B1A-AC36-F5617D4D7B89-12509-000003839560D7CC.jpeg' },
  { rawName: '沢口りお', size: '43歳 T160 B85(C) W61 H87', image: 'https://spa-urekaji.com/wp-content/uploads/2025/03/IMG_3832.jpeg' },
  { rawName: '折原ふうか', size: '38歳 T160 B82(C) W59 H84', image: 'https://spa-urekaji.com/wp-content/uploads/2023/03/EFDF5568-64B2-4F4F-BF08-7B853A8E7DC3.jpeg' },
  { rawName: '片瀬りの', size: '40歳 T166 B88(E) W61 H85', image: 'https://spa-urekaji.com/wp-content/uploads/2023/12/56EE8365-039C-4ACF-9478-8C6888F2B5B3-12934-00000DCD95DA987B.jpeg' },
  { rawName: '森崎みわ', size: '42歳 T161 B98(G) W64 H88', image: 'https://spa-urekaji.com/wp-content/uploads/2024/12/2286A47B-2A79-442B-8CEE-5D3C99CEEA1F-6575-000002EBD531E62E.jpeg' },
  { rawName: '若松ちか', size: '39歳 T156 B90(H) W63 H98', image: 'https://spa-urekaji.com/wp-content/uploads/2025/06/3FDA507A-0780-4B93-BBDF-77B512E718D1-54877-00000E3AF6183338.jpeg' },
  { rawName: '一条あやみ', size: '44歳 T162 B86(D) W60 H88', image: 'https://spa-urekaji.com/wp-content/uploads/2025/05/IMG_4489.jpeg' },
  { rawName: '高岡あん', size: '32歳 T161 B90(E) W63 H89', image: 'https://spa-urekaji.com/wp-content/uploads/2025/09/F381083D-EB8A-4BBD-A776-1B89CCBB0313-56328-00000F028D2A426A.jpeg' },
  { rawName: '宝生めぐみ', size: '41歳 T158 B83(C) W61 H82', image: 'https://spa-urekaji.com/wp-content/uploads/2023/02/69FC5477-F1F6-4CD0-9580-B7EA0734AF65.jpeg' },
  { rawName: '本村しの', size: '38歳 T163 B88(F) W60 H85', image: 'https://spa-urekaji.com/wp-content/uploads/2025/04/D9BD2E23-EBDF-4347-AB7E-6A115649301D-46922-00001284018949E2.jpeg' },
  { rawName: '名取ゆう', size: '39歳 T168 B83(C) W58 H84', image: 'https://spa-urekaji.com/wp-content/uploads/2024/07/IMG_5975.jpeg' },
  { rawName: '七瀬るい', size: '40歳 T160 B82(C) W56 H80', image: 'https://spa-urekaji.com/wp-content/uploads/2023/11/B03C7DC1-C129-4A8B-98AC-81A77F465FAD-8015-0000086272E01F45.jpeg' },
  { rawName: '愛沢りりあ', size: '36歳 T161 B83(C) W58 H86', image: 'https://spa-urekaji.com/wp-content/uploads/2026/04/IMG_2789.jpeg' },
  { rawName: '北原凛', size: '34歳 T162 B95(H) W63 H93', image: 'noimg' }, // 後で除外
  { rawName: '七瀬もも', size: '37歳 T158 B83(C) W60 H85', image: 'noimg' }, // 後で除外
  { rawName: '黒崎あず', size: '40歳 T154 B83(C) W58 H84', image: 'noimg' }, // 後で除外
  { rawName: '白石れい', size: '39歳 T165 B88(E) W61 H90', image: 'https://spa-urekaji.com/wp-content/uploads/2026/04/193DB37E-6673-4F4A-9F39-9FB43C5334BB-51126-00000C6BC7F2B49C.jpeg' }
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
      console.log(`✅ 既存の「熟れた果実」枠を発見しました。データを上書きします。`);
    } else {
      console.log(`⚠️ 既存枠がないため、日本橋エリアで新規IDを発行して登録します。`);
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
      const isNoImg = t.image.includes('noimg');
      
      return {
        id: `${targetId}_${clean}`,
        shop_id: targetId,
        name: clean,
        image_url: isNoImg ? null : t.image.trim(),
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

    console.log('\n🎉 熟れた果実のデータ登録が完全に完了しました！');

  } catch (err) {
    console.error('❌ エラー:', err);
  }
}

main();
