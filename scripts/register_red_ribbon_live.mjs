import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const locFile = path.resolve('src/data/locations.js');
const AREA_ID = 'tokyo_nakano_nakano'; // 中野区・中野
const SHOP_ID = `${AREA_ID}_red_ribbon`; 
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
  console.log('🚀 「RED RIBBON (レッドリボン)」のライブ抽出＆一括登録を開始します...\n');

  try {
    // 1. locations.js に中野区・中野を追加
    console.log('⏳ locations.js を確認・修正中...');
    let locData = fs.readFileSync(locFile, 'utf8');

    const tokyoRegex = /"東京都":\s*\[(.*?)\]/;
    const tokyoMatch = locData.match(tokyoRegex);
    if (tokyoMatch && !tokyoMatch[1].includes('"中野区"')) {
      locData = locData.replace(tokyoRegex, `"東京都": [$1, "中野区"]`);
    }

    if (!locData.includes('"中野区":')) {
      const areasEndRegex = /\};\s*export/m;
      locData = locData.replace(areasEndRegex, `  "中野区": ["中野"],\n};\nexport`);
      fs.writeFileSync(locFile, locData);
      console.log('✅ locations.js に「中野区（中野）」を追加しました。');
    }

    // 2. 店舗データの登録
    console.log('\n🏪 店舗データを登録中...');
    const SHOP_DATA = {
      id: SHOP_ID,
      name: 'RED RIBBON (レッドリボン)',
      area_id: AREA_ID,
      group_id: GROUP_ID, 
      schedule_url: TARGET_URL,
      website_url: 'https://namexspa.com/',
      business_hours: '10:00〜5:00', 
      price_system: '60分 14,000円～',
      image_url: 'https://placehold.jp/e74c3c/ffffff/400x300.png?text=RED+RIBBON',
      raw_data: {
        prefecture: '東京都',
        city: '中野区',
        area: '中野',
        address: '東京都中野区中野エリア',
        system: SYSTEM_DATA 
      }
    };

    const { error: upsertErr } = await supabase.from('shops').upsert(SHOP_DATA, { onConflict: 'id' });
    if (upsertErr) throw upsertErr;
    console.log(`✅ 店舗情報（ID: ${SHOP_ID}）を登録しました。\n`);

    // 3. セラピストのライブ抽出
    console.log(`⏳ ${TARGET_URL} からセラピストをリアルタイム抽出中...`);
    const response = await fetch(TARGET_URL);
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    const html = await response.text();
    const $ = cheerio.load(html);
    const items = $('.therapist-datas-each');

    let newTherapists = [];
    const now = new Date().toISOString();
    const seenNames = {}; 

    items.each((_, el) => {
      const item = $(el);
      const rawNameText = item.find('.therapist-datas-name').text().trim();
      if (!rawNameText) return;

      const nameMatch = rawNameText.match(/^(.*?)\(/);
      const cleanName = nameMatch ? nameMatch[1].trim() : rawNameText;
      const rankMatch = rawNameText.match(/\((.*?)\)/);
      const tags = rankMatch ? [rankMatch[1]] : [];

      const specsText = item.find('.therapist-datas-spec').text().replace(/\s+/g, ' ').trim();
      const ageMatch = specsText.match(/(\d+)歳/);
      const heightMatch = specsText.match(/(\d+)㎝/);
      const cupMatch = specsText.match(/\(([A-Z])\)/);

      const age = ageMatch ? `${ageMatch[1]}歳` : '';
      const height = heightMatch ? `${heightMatch[1]}cm` : '';
      const cup = cupMatch ? `${cupMatch[1]}カップ` : '';

      let fullBio = '';
      if (age) fullBio += `年齢: ${age} `;
      if (height) fullBio += `身長: ${height}\n`;
      if (cup) fullBio += `サイズ: ${cup}`;

      const bioText = item.find('.therapist-datas-bio').text().trim();

      // 同名回避
      let finalNameId = cleanName.replace(/\s/g, '_').replace(/💎/g, '');
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
        raw_data: {
          tags: tags,
          bio: (fullBio + '\n\n' + bioText).trim(),
          original_name: rawNameText
        }
      });
    });

    console.log(`✅ ${newTherapists.length} 名のセラピストデータを抽出しました。`);

    console.log(`🗑️ 古いセラピストデータをクリアしています...`);
    await supabase.from('therapists').delete().eq('shop_id', SHOP_ID);

    console.log(`📦 ${newTherapists.length} 名のデータをデータベースに登録中...`);
    const chunkSize = 100;
    for (let i = 0; i < newTherapists.length; i += chunkSize) {
      const chunk = newTherapists.slice(i, i + chunkSize);
      const { error: insertError } = await supabase.from('therapists').insert(chunk);
      if (insertError) throw insertError;
    }

    // 4. ローカルJSONへの同期
    console.log('\n⏳ 最新のデータをローカルファイルに同期中...');
    const { data: allShops, error: allErr } = await supabase.from('shops').select('*');
    if (allErr) throw allErr;

    const paths = [
      path.resolve('src/data/shops.json'),
      path.resolve('public/data/shops.json')
    ];
    
    paths.forEach(p => {
      if (fs.existsSync(p)) {
        fs.writeFileSync(p, JSON.stringify(allShops, null, 2));
      }
    });

    console.log(`\n🎉 登録と同期が完全に完了しました！`);
    console.log('Viteサーバーを再起動（Ctrl+C -> npm run dev）し、ブラウザで「中野」エリアをご確認ください。');

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
