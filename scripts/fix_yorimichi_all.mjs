import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const SHOP_IDS = [
  'tokyo_musashino_kichijoji_yorimichi',
  'tokyo_suginami_ogikubo_yorimichi',
  'tokyo_kita_akabane_yorimichi'
];
const TARGET_URL = 'https://kichijoji-igokochi.com/itemList.html';

async function main() {
  console.log('🚀 全セラピストを荻窪・吉祥寺・赤羽の全店舗に一括登録します...\n');

  try {
    const response = await fetch(TARGET_URL, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

    const html = new TextDecoder('utf-8').decode(await response.arrayBuffer());
    const $ = cheerio.load(html);
    const items = $('.fdc_listItemLayout');

    let baseTherapists = [];
    const now = new Date().toISOString();

    items.each((_, el) => {
      const item = $(el);
      let cleanName = item.find('.fdc_itemNameInner ruby span').text().trim() || item.find('.fdc_itemNameInner a').text().replace(/\(\d+\)/, '').trim();
      if (!cleanName) return;

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

      let rawImgSrc = item.find('.imgLayer.layerNormal').attr('src') || item.find('.fdc_itemPhoto a img').attr('src') || '';
      let imageUrl = rawImgSrc ? (rawImgSrc.startsWith('http') ? rawImgSrc : new URL(rawImgSrc, 'https://kichijoji-igokochi.com').href) : '';

      baseTherapists.push({
        name: cleanName,
        image_url: imageUrl,
        is_active: true,
        last_seen_at: now,
        raw_data: { bio: fullBio.trim(), original_name: cleanName }
      });
    });

    console.log(`🔍 サイトから ${baseTherapists.length} 名のセラピストを抽出しました。`);

    // 全3店舗分に複製
    let allTherapistsToInsert = [];
    for (const shopId of SHOP_IDS) {
      const seenNames = {};
      baseTherapists.forEach(t => {
        let finalNameId = t.name.replace(/\s/g, '_');
        if (seenNames[finalNameId]) {
          seenNames[finalNameId]++;
          finalNameId = `${finalNameId}_${seenNames[finalNameId]}`;
        } else {
          seenNames[finalNameId] = 1;
        }
        allTherapistsToInsert.push({
          ...t,
          id: `${shopId}_${finalNameId}`,
          shop_id: shopId
        });
      });
    }

    console.log(`🗑️ 既存のセラピストデータをクリア中...`);
    await supabase.from('therapists').delete().in('shop_id', SHOP_IDS);

    console.log(`📦 全 ${allTherapistsToInsert.length} 件（全店舗分）を登録中...`);
    const chunkSize = 100;
    let count = 0;
    for (let i = 0; i < allTherapistsToInsert.length; i += chunkSize) {
      const chunk = allTherapistsToInsert.slice(i, i + chunkSize);
      const { error } = await supabase.from('therapists').insert(chunk);
      if (error) throw error;
      count += chunk.length;
    }

    console.log(`✅ ${count} 件の登録が完了しました！`);
    
    console.log('⏳ JSONに同期中...');
    const { data: allShops } = await supabase.from('shops').select('*');
    [path.resolve('src/data/shops.json'), path.resolve('public/data/shops.json')].forEach(p => {
      if (fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify(allShops, null, 2));
    });

    console.log('🎉 完了しました！Viteサーバーで荻窪店を確認してください。全員表示されます。');

  } catch (err) {
    console.error('❌ エラー:', err.message);
  }
}

main();
