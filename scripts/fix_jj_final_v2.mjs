import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const TARGET_SHOP_ID = 'tokyo_suginami_ogikubo_mens_esthe_jj';
// 全員を取得するため「スケジュール(本日出勤)」ではなく「キャスト一覧(在籍)」のページに変更
const TARGET_URL = 'http://www.spa-jj.tokyo/cast.html';

const SYSTEM_DATA = [
  { time: '80分コース', price: '15,000 円' },
  { time: '100分コース', price: '17,000 円' },
  { time: '120分コース', price: '19,000 円' }
];

async function main() {
  console.log('🚀 メンズエステJJの完全修正（リトライ）を開始します...\n');

  try {
    // 1. 店舗データ（料金システム・タグ・画像）のアップデート
    console.log(`🏪 店舗データ (${TARGET_SHOP_ID}) を修正中...`);
    const { data: shop, error: fetchErr } = await supabase
      .from('shops')
      .select('*')
      .eq('id', TARGET_SHOP_ID)
      .single();

    if (fetchErr) throw new Error('既存店舗の取得に失敗しました。');

    const updatedRawData = { ... (shop.raw_data || {}) };
    const existingTags = updatedRawData.tags || [];
    updatedRawData.tags = Array.from(new Set([...existingTags, '中野', '荻窪']));
    updatedRawData.system = SYSTEM_DATA;

    const priceSystemText = SYSTEM_DATA.map(s => `${s.time}: ${s.price}`).join('\n');

    const { error: updateErr } = await supabase
      .from('shops')
      .update({ 
        group_id: 'g_jj',
        image_url: 'http://www.spa-jj.tokyo/img5/logo_1c.png',
        price_system: priceSystemText,
        raw_data: updatedRawData 
      })
      .eq('id', TARGET_SHOP_ID);

    if (updateErr) throw updateErr;

    // 2. JJのHTML構造に合わせた正確なスクレイピング (cast.html)
    console.log(`⏳ ${TARGET_URL} から全在籍キャストを取得中...`);
    const response = await fetch(TARGET_URL, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

    const buffer = await response.arrayBuffer();
    // JJのサイトの文字化け対策 (Shift_JIS / EUC-JP)
    let html = new TextDecoder('shift_jis').decode(buffer);
    if (html.includes('')) {
        html = new TextDecoder('euc-jp').decode(buffer);
    }
    if (html.includes('')) {
        html = new TextDecoder('utf-8').decode(buffer);
    }

    const $ = cheerio.load(html);
    const items = $('.thumb');
    console.log(`🔍 サイトから ${items.length} 件の要素を検出しました。`);

    let therapistsToInsert = [];
    const now = new Date().toISOString();

    items.each((_, el) => {
      const item = $(el);
      
      const nameNode = item.find('.name a ruby');
      let cleanName = '';
      if (nameNode.length > 0) {
          const textNodes = nameNode.contents().filter(function() { return this.nodeType === 3; });
          cleanName = textNodes.text().replace(/\s+/g, '').trim();
      } else {
          const fullText = item.find('.name a').text();
          cleanName = fullText.split('歳')[0].replace(/\d+/g, '').replace(/\s+/g, '').trim();
      }

      if (!cleanName) return;

      const ageMatch = item.find('.name a').text().match(/(\d+)歳/);
      const age = ageMatch ? `${ageMatch[1]}歳` : '';

      const sizeText = item.find('.sizes').text().trim();
      
      let fullBio = '';
      if (age) fullBio += `年齢: ${age}\n`;
      if (sizeText) fullBio += `サイズ: ${sizeText}`;

      let imgPath = item.find('img.castthm').attr('src');
      let imageUrl = imgPath ? (imgPath.startsWith('http') ? imgPath : `http://www.spa-jj.tokyo${imgPath}`) : '';

      // ⚠️ エラーの原因だった tall, cup, age を除外。正しいスキーマ(構造)に合わせました
      therapistsToInsert.push({
        id: `${TARGET_SHOP_ID}_${cleanName}`,
        shop_id: TARGET_SHOP_ID,
        name: cleanName,
        image_url: imageUrl,
        is_active: true,
        last_seen_at: now,
        raw_data: { 
          bio: fullBio.trim(), 
          original_name: cleanName,
          size_raw: sizeText,
          age_raw: age
        }
      });
    });

    console.log(`📝 整形データ: ${therapistsToInsert.length} 件`);

    // 3. データ入れ替え
    if (therapistsToInsert.length > 0) {
      console.log(`🗑️ 既存のデータをクリア中...`);
      await supabase.from('therapists').delete().eq('shop_id', TARGET_SHOP_ID);

      console.log(`📦 正しいキャスト情報を登録中...`);
      const { error: insErr } = await supabase.from('therapists').insert(therapistsToInsert);
      if (insErr) throw insErr;
      console.log(`✅ 登録完了。`);
    } else {
      console.log('⚠️ キャストが抽出できませんでした。');
    }

    // 4. JSON同期
    console.log('\n⏳ JSONに同期中...');
    const { data: allShops } = await supabase.from('shops').select('*');
    [path.resolve('src/data/shops.json'), path.resolve('public/data/shops.json')].forEach(p => {
      if (fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify(allShops, null, 2));
    });

    console.log(`\n🎉 JJの修正が完了しました！リロードして確認してください。`);

  } catch (err) {
    console.error('❌ エラー:', err.message);
  }
}

main();
