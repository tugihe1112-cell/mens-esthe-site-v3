import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const BASE_URL = 'https://linda-spa.com/cast/';
const TARGET_SHOP_IDS = [
  'tokyo_meguro_linda_spa',            // 中目黒店
  '60338',                             // 恵比寿店
  '60235',                             // 目黒店
  '60203',                             // 三軒茶屋店
  'tokyo_minato_azabujuban_linda_spa'  // 麻布十番店
];

async function main() {
  console.log('🚀 LINDA SPA 公式サイトからの抽出と、Supabase全店舗同期を開始します...\n');

  let allTherapists = [];

  try {
    // --- 1. スクレイピング処理 ---
    console.log(`⏳ 公式サイトからデータを取得中...`);
    const response = await axios.get(BASE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const items = $('li.columns.action');

    console.log(`✅ ${items.length} 名のデータを抽出しました。\n`);

    items.each((_, el) => {
      const item = $(el);
      const rawName = item.find('.cast-name .name').text().trim();
      const ageMatch = item.find('.cast-name .age').text().match(/\((\d+)\)/);
      const age = ageMatch ? `${ageMatch[1]}歳` : '';

      let imageUrl = item.find('img.thumbnail').attr('data-src') || item.find('img.thumbnail').attr('src') || '';
      if (imageUrl.startsWith('data:image')) imageUrl = null;

      const tags = [];
      item.find('.cast-icon span[class^="icon-"]').each((_, tagEl) => {
        const text = $(tagEl).text().trim();
        if (text && text !== 'Twitter') tags.push(text);
      });
      item.find('.cast-icon-label').each((_, tagEl) => {
        const text = $(tagEl).text().trim();
        if (text) tags.push(text);
      });

      if (rawName) {
        allTherapists.push({
          name: rawName.replace(/[\s　]/g, ''), // スペース除去
          age: age,
          tags: [...new Set(tags)],
          image_url: imageUrl,
          original_name: rawName
        });
      }
    });

    if (allTherapists.length === 0) throw new Error("抽出されたデータが0件です。");

    // --- 2. Supabaseへの登録処理 ---
    const now = new Date().toISOString();
    console.log(`🗑️ 各店舗の古いセラピストデータを削除中...`);
    const { error: deleteError } = await supabase
      .from('therapists')
      .delete()
      .in('shop_id', TARGET_SHOP_IDS);

    if (deleteError) throw deleteError;

    console.log(`📦 新しいデータを全5店舗に同期登録中...`);
    let insertPayloads = [];

    for (const targetId of TARGET_SHOP_IDS) {
      const newTherapists = allTherapists.map(t => {
        return {
          id: `${targetId}_${t.name}`,
          shop_id: targetId,
          name: t.name,
          image_url: t.image_url,
          is_active: true,
          last_seen_at: now,
          raw_data: {
            tags: t.tags,
            bio: `年齢: ${t.age || '非公開'}`,
            original_name: t.original_name
          }
        };
      });
      insertPayloads = insertPayloads.concat(newTherapists);
    }

    const chunkSize = 100;
    for (let i = 0; i < insertPayloads.length; i += chunkSize) {
      const chunk = insertPayloads.slice(i, i + chunkSize);
      const { error: insertError } = await supabase.from('therapists').insert(chunk);
      if (insertError) throw insertError;
    }

    console.log(`\n🎉 同期完了！全5店舗に ${allTherapists.length}名 の最新データが登録されました。`);
    console.log('ブラウザに戻り「Cmd + Shift + R」でスーパーリロードして、各店舗のカードを確認してください。');

  } catch (err) {
    console.error('❌ エラーが発生しました:', err);
  }
}

main();
