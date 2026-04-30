import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const GROUP_ID = 'g_yorimichi';
const TARGET_URL = 'https://kichijoji-igokochi.com/scheduleAll.html';

// 振り分け用マップ
const AREA_MAP = {
  '吉祥寺': 'tokyo_musashino_kichijoji_yorimichi',
  '荻窪': 'tokyo_suginami_ogikubo_yorimichi',
  '赤羽': 'tokyo_kita_akabane_yorimichi'
};

const SHOP_IDS = Object.values(AREA_MAP);

async function main() {
  console.log('🚀 「よりみち」のセラピストを正しいエリア店舗に振り分け登録します...\n');

  try {
    // 1. サイトから最新情報を取得
    console.log(`⏳ ${TARGET_URL} からデータを取得中...`);
    const response = await fetch(TARGET_URL);
    const arrayBuffer = await response.arrayBuffer();
    const decoder = new TextDecoder('utf-8');
    const html = decoder.decode(arrayBuffer);
    const $ = cheerio.load(html);
    const items = $('.fdc_listItemLayout');

    let newTherapists = [];
    const now = new Date().toISOString();
    const seenNames = {};

    items.each((_, el) => {
      const item = $(el);
      const nameEl = item.find('.fdc_itemNameInner ruby span').last();
      let cleanName = nameEl.text().trim();
      if (!cleanName) {
          cleanName = item.find('.fdc_itemNameInner a').text().replace(/\(\d+\)/, '').trim();
      }
      if (!cleanName) return;

      // エリアアイコンの判定
      const areaBadgeText = item.find('.scheduleIcon span.text').text().trim();
      // マップに存在すればそのID、なければデフォルトで吉祥寺(SHOPS[0])
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

    console.log(`✅ ${newTherapists.length} 名のセラピストを抽出しました。`);

    // 2. 既存のセラピストデータを削除（3店舗分）
    console.log(`🗑️ 既存のセラピストデータをクリアしています...`);
    await supabase.from('therapists').delete().in('shop_id', SHOP_IDS);

    // 3. 振り分け後のデータを登録
    console.log(`📦 各店舗へ振り分け登録中...`);
    const chunkSize = 100;
    for (let i = 0; i < newTherapists.length; i += chunkSize) {
      const chunk = newTherapists.slice(i, i + chunkSize);
      const { error: insertError } = await supabase.from('therapists').insert(chunk);
      if (insertError) throw insertError;
    }

    console.log('\n🎉 振り分け登録が完了しました！');
    console.log('   - 吉祥寺、荻窪、赤羽の各エリアにセラピストが表示されます。');

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
