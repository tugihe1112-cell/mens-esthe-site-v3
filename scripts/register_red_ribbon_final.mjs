import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const locFile = path.resolve('src/data/locations.js');
const CORRECT_AREA_ID = 'tokyo_nakano_nakano'; // 中野区・中野
const SHOP_ID = `${CORRECT_AREA_ID}_red_ribbon`; 
const GROUP_ID = 'g_red_ribbon';
const TARGET_URL = 'https://namexspa.com/schedule';

// --------------------------------------------------
// 料金システム (画像から一字一句正確に抽出)
// --------------------------------------------------
const SYSTEM_DATA = [
  {
    courseName: 'SILVER COURSE (シルバーコース)',
    description: '',
    prices: [
      { time: '60分', price: '14,000円' },
      { time: '90分', price: '18,000円' },
      { time: '120分', price: '24,000円' },
      { time: '150分', price: '30,000円' }
    ]
  },
  {
    courseName: 'GOLD COURSE (ゴールドコース)',
    description: '',
    prices: [
      { time: '60分', price: '16,000円' },
      { time: '90分', price: '20,000円' },
      { time: '120分', price: '26,000円' },
      { time: '150分', price: '32,000円' }
    ]
  },
  {
    courseName: 'PLATINUM COURSE (プラチナコース)',
    description: '',
    prices: [
      { time: '60分', price: '19,000円' },
      { time: '90分', price: '23,000円' },
      { time: '120分', price: '29,000円' },
      { time: '150分', price: '35,000円' }
    ]
  }
];

async function main() {
  console.log('🚀 「RED RIBBON (レッドリボン)」のクリーン登録を開始します...\n');

  try {
    // 1. 間違った店舗データの削除
    await supabase.from('shops').delete().eq('id', 'tokyo_nakano_red_ribbon');
    console.log('🧹 旧店舗データを削除しました。');

    // 2. locations.js の確認と修正
    let locData = fs.readFileSync(locFile, 'utf8');
    if (!locData.includes('"中野区":')) {
      const areasEndRegex = /\};\s*export/m;
      locData = locData.replace(areasEndRegex, `  "中野区": ["中野"],\n};\nexport`);
      fs.writeFileSync(locFile, locData);
      console.log('✅ locations.js に中野区を追加しました。');
    }

    // 3. 店舗データの登録
    const SHOP_DATA = {
      id: SHOP_ID,
      name: 'RED RIBBON (レッドリボン)',
      area_id: CORRECT_AREA_ID,
      group_id: GROUP_ID, 
      schedule_url: TARGET_URL,
      website_url: 'https://namexspa.com/',
      business_hours: '10:00〜5:00', 
      price_system: '60分 14,000円～',
      image_url: 'https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/RED_RIBBON.png', // 推測されるパス。後で差し替え可能。
      raw_data: {
        prefecture: '東京都',
        city: '中野区',
        area: '中野',
        address: '東京都中野区中野エリア',
        system: SYSTEM_DATA 
      }
    };
    await supabase.from('shops').upsert(SHOP_DATA);
    console.log(`✅ 店舗情報を登録しました (Area: ${CORRECT_AREA_ID})`);

    // 4. セラピストのライブ抽出
    console.log(`⏳ 公式サイトからセラピストを抽出中...`);
    const response = await fetch(TARGET_URL);
    const html = await response.text();
    const $ = cheerio.load(html);
    const items = $('.therapist-datas-each');

    let newTherapists = [];
    const now = new Date().toISOString();
    const seenNames = {}; 

    items.each((_, el) => {
      const item = $(el);
      const rawNameText = item.find('.therapist-datas-name').text().trim();
      if (!rawNameText || rawNameText.includes('NAMEKO')) return;

      const nameMatch = rawNameText.match(/^(.*?)\(/);
      const cleanName = nameMatch ? nameMatch[1].trim() : rawNameText;
      const rankMatch = rawNameText.match(/\((.*?)\)/);
      const tags = rankMatch ? [rankMatch[1]] : [];

      const specsText = item.find('.therapist-datas-spec').text().replace(/\s+/g, ' ').trim();
      const ageMatch = specsText.match(/(\d+)歳/);
      const heightMatch = specsText.match(/(\d+)㎝/);
      const cupMatch = specsText.match(/\(([A-Z])\)/);

      let fullBio = '';
      if (ageMatch) fullBio += `年齢: ${ageMatch[1]}歳 `;
      if (heightMatch) fullBio += `身長: ${heightMatch[1]}cm\n`;
      if (cupMatch) fullBio += `サイズ: ${cupMatch[1]}カップ`;

      const bioText = item.find('.therapist-datas-bio').text().trim();

      let finalNameId = cleanName.replace(/\s/g, '_').replace(/[💎]/g, '');
      if (seenNames[finalNameId]) {
        seenNames[finalNameId]++;
        finalNameId = `${finalNameId}_${seenNames[finalNameId]}`; 
      } else {
        seenNames[finalNameId] = 1;
      }
      
      const imageUrl = item.find('.therapist-data-each-tmb').attr('src') || '';

      newTherapists.push({
        id: `${SHOP_ID}_${finalNameId}`,
        shop_id: SHOP_ID,
        name: cleanName, 
        image_url: imageUrl,
        is_active: true,
        last_seen_at: now,
        raw_data: { tags, bio: (fullBio + '\n\n' + bioText).trim(), original_name: rawNameText }
      });
    });

    console.log(`✅ ${newTherapists.length} 名のセラピストを抽出。登録を開始します...`);
    await supabase.from('therapists').delete().eq('shop_id', SHOP_ID);
    
    const chunkSize = 50;
    for (let i = 0; i < newTherapists.length; i += chunkSize) {
      const chunk = newTherapists.slice(i, i + chunkSize);
      await supabase.from('therapists').insert(chunk);
    }

    // 5. ローカル同期
    const { data: allShops } = await supabase.from('shops').select('*');
    const paths = [path.resolve('src/data/shops.json'), path.resolve('public/data/shops.json')];
    paths.forEach(p => { if (fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify(allShops, null, 2)); });

    console.log(`\n🎉 すべて完了！ ${newTherapists.length}名のセラピストが「中野」エリアに登録されました。`);

  } catch (err) {
    console.error('❌ エラー:', err.message);
  }
}

main();
