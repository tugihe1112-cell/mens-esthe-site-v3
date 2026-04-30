import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

// 既存のJJ店舗ID（黒いカード）
const TARGET_SHOP_ID = 'tokyo_suginami_ogikubo_mens_esthe_jj';
const TARGET_URL = 'http://www.spa-jj.tokyo/schedule.html';

async function main() {
  console.log('🚀 メンズエステJJの統合（中野・荻窪）と全キャスト登録を開始します...\n');

  try {
    // 1. 既存店舗の情報を更新（中野エリアでもヒットするようにタグを追加）
    console.log(`🏪 店舗データ (${TARGET_SHOP_ID}) を更新中...`);
    const { data: shop, error: fetchErr } = await supabase
      .from('shops')
      .select('*')
      .eq('id', TARGET_SHOP_ID)
      .single();

    if (fetchErr) throw new Error('既存店舗の取得に失敗しました。');

    const updatedRawData = { ... (shop.raw_data || {}) };
    const existingTags = updatedRawData.tags || [];
    // 「中野」と「荻窪」をタグに追加して検索に引っかかるようにする
    updatedRawData.tags = Array.from(new Set([...existingTags, '中野', '荻窪']));
    
    // group_id を設定（クチコミ吸収用）
    const { error: updateErr } = await supabase
      .from('shops')
      .update({ 
        group_id: 'g_jj',
        raw_data: updatedRawData 
      })
      .eq('id', TARGET_SHOP_ID);

    if (updateErr) throw updateErr;
    console.log('✅ 店舗のエリア共有設定（中野・荻窪）が完了しました。');

    // 2. セラピスト・ROOM情報の抽出
    console.log(`⏳ ${TARGET_URL} からデータを取得中...`);
    const response = await fetch(TARGET_URL, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

    const buffer = await response.arrayBuffer();
    const html = new TextDecoder('utf-8').decode(buffer); // JJはUTF-8で取得可能
    const $ = cheerio.load(html);
    
    const items = $('.thumb');
    console.log(`🔍 サイトから ${items.length} 件の要素を検出しました。`);

    let therapistsToInsert = [];
    const now = new Date().toISOString();

    items.each((_, el) => {
      const item = $(el);
      
      // 名前と年齢の抽出
      const nameArea = item.find('.name').clone();
      nameArea.find('rt, br, .sizes').remove(); // 不要なタグを削除
      const rawNameText = nameArea.text().trim();
      const cleanName = rawNameText.replace(/\s+/g, '');
      
      if (!cleanName) return;

      // 年齢の抽出
      const ageMatch = item.find('.name').text().match(/(\d+)歳/);
      const age = ageMatch ? `${ageMatch[1]}歳` : '';

      // サイズの抽出
      const sizeText = item.find('.sizes').text().trim();
      
      let fullBio = '';
      if (age) fullBio += `年齢: ${age}\n`;
      if (sizeText) fullBio += `サイズ: ${sizeText}`;

      // 画像URL
      let imgPath = item.find('img.castthm').attr('src');
      let imageUrl = imgPath ? (imgPath.startsWith('http') ? imgPath : `http://www.spa-jj.tokyo${imgPath}`) : '';

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
          size_raw: sizeText
        }
      });
    });

    // 3. データベースへの登録（入れ替え）
    if (therapistsToInsert.length > 0) {
      console.log(`🗑️ 既存のキャストデータをクリア中...`);
      await supabase.from('therapists').delete().eq('shop_id', TARGET_SHOP_ID);

      console.log(`📦 新しいキャスト情報（全${therapistsToInsert.length}件）を登録中...`);
      const { error: insErr } = await supabase.from('therapists').insert(therapistsToInsert);
      if (insErr) throw insErr;
      console.log(`✅ 登録が完了しました。`);
    }

    // 4. ローカルJSON同期
    console.log('\n⏳ JSONに同期中...');
    const { data: allShops } = await supabase.from('shops').select('*');
    [path.resolve('src/data/shops.json'), path.resolve('public/data/shops.json')].forEach(p => {
      if (fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify(allShops, null, 2));
    });

    console.log(`\n🎉 メンズエステJJの更新が完了しました！`);
    console.log(`・「中野」「荻窪」の両エリアで1つのカードが表示されます。`);
    console.log(`・セラピストとROOM（計${therapistsToInsert.length}件）が登録されました。`);

  } catch (err) {
    console.error('❌ エラーが発生しました:', err.message);
  }
}

main();
