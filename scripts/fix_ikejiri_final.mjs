import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const locFile = path.resolve('src/data/locations.js');

async function main() {
  console.log('🚀 locations.jsの修正と店舗データの登録を行います...\n');

  try {
    // ==========================================
    // 1. locations.js の確実な修正
    // ==========================================
    console.log('⏳ locations.js を修正中...');
    let locData = fs.readFileSync(locFile, 'utf8');

    // 「世田谷区」の配列を探して、直接末尾に追加する
    // これなら正規表現のキャプチャグループに依存せずに確実に追加できます
    const setagayaTarget = '"世田谷区": ["三軒茶屋", "下北沢", "二子玉川"';
    if (locData.includes(setagayaTarget)) {
      locData = locData.replace(
        setagayaTarget,
        '"世田谷区": ["三軒茶屋", "下北沢", "二子玉川", "池尻大橋"'
      );
      fs.writeFileSync(locFile, locData);
      console.log('✅ locations.js の世田谷区に「池尻大橋」を追加しました。');
    } else {
      // もし上記の完全一致で見つからない場合は、汎用的な置換を試みる
      const fallbackRegex = /("世田谷区":\s*\[.*?)(])/;
      if (fallbackRegex.test(locData)) {
        locData = locData.replace(fallbackRegex, '$1, "池尻大橋"$2');
        fs.writeFileSync(locFile, locData);
        console.log('✅ locations.js の世田谷区に「池尻大橋」を追加しました(Fallback)。');
      } else {
         console.log('❌ locations.js の世田谷区が見つかりませんでした。手動で src/data/locations.js を開き、「"池尻大橋"」を追加してください。');
      }
    }


    // ==========================================
    // 2. 店舗データの修正（世田谷区として登録）
    // ==========================================
    console.log('\n⏳ データベースの店舗情報を修正中...');
    
    // 誤った目黒区の店舗データを削除
    const wrongShopId = 'tokyo_meguro_ikejiriohashi_authority';
    await supabase.from('shops').delete().eq('id', wrongShopId);

    // 正しい世田谷区のエリアID
    const AREA_ID = 'tokyo_setagaya_ikejiriohashi'; 
    const SHOP_ID = `${AREA_ID}_authority`;
    const GROUP_ID = 'g_authority'; 

    const SYSTEM_DATA = [
      {
        courseName: '基本コース',
        description: '画像から読み取った料金です',
        prices: [
          { time: '70min', price: '17,000円' },
          { time: '90min', price: '21,000円' },
          { time: '120min', price: '25,000円' },
          { time: '150min', price: '30,000円' }
        ]
      }
    ];

    const shopData = {
      id: SHOP_ID,
      name: 'AUTHORITY (オーソリティ) 池尻大橋',
      area_id: AREA_ID,
      group_id: GROUP_ID, 
      schedule_url: 'https://www.me-authority.com/schedule/',
      website_url: 'https://www.me-authority.com/',
      business_hours: '営業時間要確認',
      price_system: '70分 17,000円～',
      image_url: 'https://placehold.jp/34495e/ffffff/400x300.png?text=AUTHORITY', 
      raw_data: {
        prefecture: '東京都',
        city: '世田谷区',
        area: '池尻大橋',
        address: '東京都世田谷区池尻大橋エリア',
        system: SYSTEM_DATA
      }
    };

    const { error: upsertErr } = await supabase.from('shops').upsert(shopData, { onConflict: 'id' });
    if (upsertErr) throw upsertErr;

    console.log(`✅ データベースに「AUTHORITY 池尻大橋店（世田谷区）」を登録しました。`);
    console.log('\n🎉 すべての修正が完了しました！');
    console.log('Viteサーバーを再起動（Ctrl+C -> npm run dev）し、ブラウザをご確認ください。');

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
