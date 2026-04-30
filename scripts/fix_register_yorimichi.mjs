import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const locFile = path.resolve('src/data/locations.js');
const GROUP_ID = 'g_yorimichi';
const TARGET_URL = 'https://kichijoji-igokochi.com/scheduleAll.html';

const SYSTEM_DATA = [
  {
    courseName: '基本コース',
    description: '',
    prices: [
      { time: '60min', price: '15,000円' },
      { time: '80min', price: '20,000円' },
      { time: '100min', price: '25,000円' }
    ]
  }
];

const SHOPS = [
  {
    id: 'tokyo_musashino_kichijoji_yorimichi',
    name: 'よりみち (Yorimichi) 吉祥寺',
    area_id: 'tokyo_musashino_kichijoji',
    raw_data: { prefecture: '東京都', city: '武蔵野市', area: '吉祥寺', address: '東京都武蔵野市吉祥寺エリア', system: SYSTEM_DATA }
  },
  {
    id: 'tokyo_suginami_ogikubo_yorimichi',
    name: 'よりみち (Yorimichi) 荻窪',
    area_id: 'tokyo_suginami_ogikubo',
    raw_data: { prefecture: '東京都', city: '杉並区', area: '荻窪', address: '東京都杉並区荻窪エリア', system: SYSTEM_DATA }
  },
  {
    id: 'tokyo_kita_akabane_yorimichi',
    name: 'よりみち (Yorimichi) 赤羽',
    area_id: 'tokyo_kita_akabane',
    raw_data: { prefecture: '東京都', city: '北区', area: '赤羽', address: '東京都北区赤羽エリア', system: SYSTEM_DATA }
  }
];

async function main() {
  console.log('🚀 「よりみち (Yorimichi)」の修正と登録を開始します...\n');

  try {
    // 1. ゴミデータの削除
    console.log('🧹 過去の不要な店舗データを削除中...');
    const wrongIds = ['tokyo_kita_yorimichi'];
    for (const id of wrongIds) {
      await supabase.from('shops').delete().eq('id', id);
    }
    console.log('✅ 削除完了\n');

    // 2. locations.js の修正
    console.log('⏳ locations.js に武蔵野市(吉祥寺)と北区(赤羽)を追加中...');
    let locData = fs.readFileSync(locFile, 'utf8');
    let isLocUpdated = false;

    const tokyoRegex = /"東京都":\s*\[(.*?)\]/;
    const tokyoMatch = locData.match(tokyoRegex);
    if (tokyoMatch) {
      let tokyoAreas = tokyoMatch[1];
      if (!tokyoAreas.includes('"北区"')) { tokyoAreas += `, "北区"`; isLocUpdated = true; }
      if (!tokyoAreas.includes('"武蔵野市"')) { tokyoAreas += `, "武蔵野市"`; isLocUpdated = true; }
      if (isLocUpdated) {
        locData = locData.replace(tokyoRegex, `"東京都": [${tokyoAreas}]`);
      }
    }

    const areasEndRegex = /\};\s*export/m;
    let newMappings = '';
    if (!locData.includes('"北区":')) newMappings += `  "北区": ["赤羽"],\n`;
    if (!locData.includes('"武蔵野市":')) newMappings += `  "武蔵野市": ["吉祥寺"],\n`;

    if (newMappings) {
      locData = locData.replace(areasEndRegex, `${newMappings}};\nexport`);
      isLocUpdated = true;
    }

    if (isLocUpdated) {
      fs.writeFileSync(locFile, locData);
      console.log('✅ locations.js を更新しました。\n');
    } else {
      console.log('⚠️ locations.js は既に最新です。\n');
    }

    // 3. 店舗データの登録
    console.log('🏪 3店舗（吉祥寺、荻窪、赤羽）の店舗データを登録中...');
    for (const shop of SHOPS) {
      const shopData = {
        id: shop.id,
        name: shop.name,
        area_id: shop.area_id,
        group_id: GROUP_ID,
        schedule_url: TARGET_URL,
        website_url: 'https://kichijoji-igokochi.com/',
        business_hours: '営業時間要確認',
        price_system: '60分 15,000円～',
        image_url: 'https://placehold.jp/2ecc71/ffffff/400x300.png?text=Yorimichi', 
        raw_data: shop.raw_data
      };
      const { error: upsertErr } = await supabase.from('shops').upsert(shopData, { onConflict: 'id' });
      if (upsertErr) throw upsertErr;
    }
    console.log('✅ 店舗の登録が完了しました。\n');

    // 4. セラピストのリアルタイム抽出と登録
    console.log(`⏳ ${TARGET_URL} からセラピストを抽出中（吉祥寺店に紐付けます）...`);
    const response = await fetch(TARGET_URL);
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    
    // 文字化け対策としてArrayBuffer経由でTextDecoderを使用（必要に応じて）
    const arrayBuffer = await response.arrayBuffer();
    const decoder = new TextDecoder('utf-8'); // サイトがUTF-8と仮定
    const html = decoder.decode(arrayBuffer);
    
    const $ = cheerio.load(html);
    const items = $('.fdc_listItemLayout');

    let newTherapists = [];
    const now = new Date().toISOString();
    const seenNames = {}; 
    const REP_SHOP_ID = SHOPS[0].id; // 吉祥寺店を代表に

    items.each((_, el) => {
      const item = $(el);
      
      const nameEl = item.find('.fdc_itemNameInner ruby span').last();
      let rawNameText = nameEl.text().trim();
      
      // ルビのspanが取れない場合のフォールバック
      if (!rawNameText) {
          rawNameText = item.find('.fdc_itemNameInner a').text().replace(/\(\d+\)/, '').trim();
      }
      if (!rawNameText) return;

      const ageMatch = item.find('.age').text().match(/\((\d+)\)/);
      const age = ageMatch ? `${ageMatch[1]}歳` : '';

      const dataLines = item.find('.fdc_itemData').html()?.split('<br>');
      let height = '';
      let cup = '';
      if (dataLines && dataLines.length >= 2) {
          height = dataLines[0].replace('T:', '').trim() + 'cm';
          cup = dataLines[1].trim();
      }

      const tags = [];
      item.find('.scheduleIcon span.text').each((_, badge) => {
         tags.push($(badge).text().trim());
      });

      let fullBio = '';
      if (age) fullBio += `年齢: ${age}\n`;
      if (height || cup) fullBio += `サイズ: ${height} ${cup}`;

      let finalNameId = rawNameText.replace(/\s/g, '_');
      if (seenNames[finalNameId]) {
        seenNames[finalNameId]++;
        finalNameId = `${finalNameId}_${seenNames[finalNameId]}`; 
      } else {
        seenNames[finalNameId] = 1;
      }
      
      let rawImgSrc = item.find('.imgLayer.layerNormal').attr('src') || item.find('.fdc_itemPhoto a img').attr('src') || '';
      let imageUrl = '';
      if (rawImgSrc) {
          imageUrl = rawImgSrc.startsWith('http') ? rawImgSrc : new URL(rawImgSrc, 'https://kichijoji-igokochi.com').href;
      }

      newTherapists.push({
        id: `${REP_SHOP_ID}_${finalNameId}`,
        shop_id: REP_SHOP_ID,
        name: rawNameText, 
        image_url: imageUrl,
        is_active: true,
        last_seen_at: now,
        raw_data: {
          tags: tags,
          bio: fullBio.trim(),
          original_name: rawNameText
        }
      });
    });

    console.log(`✅ ${newTherapists.length} 名のセラピストデータを抽出しました。`);

    if (newTherapists.length > 0) {
        console.log(`🗑️ 古いセラピストデータをクリアしています...`);
        for (const shop of SHOPS) {
           await supabase.from('therapists').delete().eq('shop_id', shop.id);
        }

        console.log(`📦 新しいデータを登録中...`);
        const chunkSize = 100;
        for (let i = 0; i < newTherapists.length; i += chunkSize) {
          const chunk = newTherapists.slice(i, i + chunkSize);
          const { error: insertError } = await supabase.from('therapists').insert(chunk);
          if (insertError) throw insertError;
        }
    } else {
        console.log('⚠️ セラピストが見つかりませんでした。サイトの構造が変わっているか、読み込みに失敗した可能性があります。');
    }

    // 5. ローカルJSONへの同期
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

    console.log(`\n🎉 全ての修正と登録が完了しました！`);
    console.log('Viteサーバーを再起動（Ctrl+C -> npm run dev）してご確認ください。');

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
