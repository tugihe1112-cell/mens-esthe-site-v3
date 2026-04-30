import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

// 抽出先のURLを「スケジュール」から「セラピスト一覧」に変更
const TARGET_URL = 'https://kichijoji-igokochi.com/itemList.html';

// 振り分け用マップ
const AREA_MAP = {
  '吉祥寺': 'tokyo_musashino_kichijoji_yorimichi',
  '荻窪': 'tokyo_suginami_ogikubo_yorimichi',
  '赤羽': 'tokyo_kita_akabane_yorimichi'
};
const SHOP_IDS = Object.values(AREA_MAP);

async function main() {
  console.log(`🚀 「よりみち」のセラピストを ${TARGET_URL} から再抽出・振り分けします...\n`);

  try {
    console.log(`⏳ サイトからデータを取得中...`);
    const response = await fetch(TARGET_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

    const arrayBuffer = await response.arrayBuffer();
    const decoder = new TextDecoder('utf-8');
    const html = decoder.decode(arrayBuffer);
    const $ = cheerio.load(html);
    
    const items = $('.fdc_listItemLayout');
    console.log(`🔍 HTML内から ${items.length} 名のセラピストを検出しました。`);

    if (items.length === 0) {
      console.log('❌ セラピスト要素が見つかりませんでした。');
      return;
    }

    let newTherapists = [];
    const now = new Date().toISOString();
    const seenNames = {};

    items.each((_, el) => {
      const item = $(el);
      
      let cleanName = item.find('.fdc_itemNameInner ruby span').text().trim();
      if (!cleanName) {
          cleanName = item.find('.fdc_itemNameInner a').text().replace(/\(\d+\)/, '').trim();
      }
      if (!cleanName) return;

      const areaBadgeText = item.find('.scheduleIcon span.text').text().trim();
      const targetShopId = AREA_MAP[areaBadgeText] || AREA_MAP['吉祥寺'];

      const ageMatch = item.find('.age').text().match(/\((\d+)\)/);
      const age = ageMatch ? `${ageMatch[1]}歳` : '';

      const dataLines = item.find('.fdc_itemData').html()?.split('<br>');
      let height = '';
      let cup = '';
      if (dataLines && dataLines.length >= 2) {
          height = dataLines[0].replace('T:', '').trim() + 'cm';
          cup = dataLines[1].trim();
      }

      let fullBio = '';
      if (age) fullBio += `年齢: ${age}\n`;
      if (height || cup) fullBio += `サイズ: ${height} ${cup}`;

      let finalNameId = cleanName.replace(/\s/g, '_');
      if (seenNames[finalNameId]) {
        seenNames[finalNameId]++;
        finalNameId = `${finalNameId}_${seenNames[finalNameId]}`;
      } else {
        seenNames[finalNameId] = 1;
      }

      let rawImgSrc = item.find('.imgLayer.layerNormal').attr('src') || item.find('.fdc_itemPhoto a img').attr('src') || '';
      let imageUrl = rawImgSrc ? (rawImgSrc.startsWith('http') ? rawImgSrc : new URL(rawImgSrc, 'https://kichijoji-igokochi.com').href) : '';

      newTherapists.push({
        id: `${targetShopId}_${finalNameId}`,
        shop_id: targetShopId,
        name: cleanName,
        image_url: imageUrl,
        is_active: true,
        last_seen_at: now,
        raw_data: {
          tags: areaBadgeText ? [areaBadgeText] : [],
          bio: fullBio.trim(),
          original_name: cleanName
        }
      });
    });

    console.log(`✅ セラピストデータの抽出完了。`);

    console.log(`🗑️ 既存のセラピストデータをクリアしています...`);
    await supabase.from('therapists').delete().in('shop_id', SHOP_IDS);

    console.log(`📦 各店舗（吉祥寺・荻窪・赤羽）へ振り分け登録中...`);
    const chunkSize = 100;
    let insertCount = 0;
    for (let i = 0; i < newTherapists.length; i += chunkSize) {
      const chunk = newTherapists.slice(i, i + chunkSize);
      const { error: insertError } = await supabase.from('therapists').insert(chunk);
      if (insertError) throw insertError;
      insertCount += chunk.length;
    }
    console.log(`✅ ${insertCount} 名のDB登録が完了しました。`);

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

    console.log(`\n🎉 振り分け登録と同期が完了しました！`);

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
