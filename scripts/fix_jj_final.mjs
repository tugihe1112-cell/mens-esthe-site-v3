import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const TARGET_SHOP_ID = 'tokyo_suginami_ogikubo_mens_esthe_jj';
const TARGET_URL = 'http://www.spa-jj.tokyo/schedule.html';

const SYSTEM_DATA = [
  { time: '80分コース', price: '15,000 円' },
  { time: '100分コース', price: '17,000 円' },
  { time: '120分コース', price: '19,000 円' }
];

async function main() {
  console.log('🚀 メンズエステJJの完全修正を開始します...\n');

  try {
    // 1. 店舗データ（料金システム・タグ・画像）の完全アップデート
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

    // 2. JJのHTML構造に合わせた正確なスクレイピング
    console.log(`⏳ ${TARGET_URL} からデータを再取得中...`);
    const response = await fetch(TARGET_URL, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

    const buffer = await response.arrayBuffer();
    // JJはEUC-JPが使われている可能性が高いため、EUC-JPでデコード
    const html = new TextDecoder('euc-jp').decode(buffer);
    const $ = cheerio.load(html);
    
    const items = $('.thumb');
    console.log(`🔍 サイトから ${items.length} 件の要素を検出しました。`);

    let therapistsToInsert = [];
    const now = new Date().toISOString();

    items.each((_, el) => {
      const item = $(el);
      
      // 名前の抽出: <ruby>タグのテキストだけを取得（ふりがな<rt>は除外）
      const nameNode = item.find('.name a ruby');
      let cleanName = '';
      if (nameNode.length > 0) {
          // ふりがなを除いた名前部分を取得
          const textNodes = nameNode.contents().filter(function() { return this.nodeType === 3; });
          cleanName = textNodes.text().replace(/\s+/g, '').trim();
      } else {
          // rubyがない場合のフォールバック
          const fullText = item.find('.name a').text();
          cleanName = fullText.split('歳')[0].replace(/\d+/g, '').replace(/\s+/g, '').trim();
      }

      if (!cleanName) return;

      // 年齢の抽出
      const ageMatch = item.find('.name a').text().match(/(\d+)歳/);
      const age = ageMatch ? `${ageMatch[1]}歳` : '';

      // サイズの抽出: T156cm B85 W58 H86
      const sizeText = item.find('.sizes').text().trim();
      
      let fullBio = '';
      if (age) fullBio += `年齢: ${age}\n`;
      if (sizeText) fullBio += `サイズ: ${sizeText}`;

      // 独自のパースで身長とカップを抽出（任意ですが念のため）
      let height = '';
      let cup = '';
      const hMatch = sizeText.match(/T(\d+)cm/);
      if(hMatch) height = hMatch[1];
      
      // 画像URL: 相対パスを絶対パスに変換
      let imgPath = item.find('img.castthm').attr('src');
      let imageUrl = imgPath ? (imgPath.startsWith('http') ? imgPath : `http://www.spa-jj.tokyo${imgPath}`) : '';

      therapistsToInsert.push({
        id: `${TARGET_SHOP_ID}_${cleanName}`,
        shop_id: TARGET_SHOP_ID,
        name: cleanName,
        image_url: imageUrl,
        tall: height ? parseInt(height) : null,
        cup: cup, // JJはカップ表記がないのでnull
        age: age ? parseInt(age) : null,
        is_active: true,
        last_seen_at: now,
        raw_data: { 
          bio: fullBio.trim(), 
          original_name: cleanName,
          size_raw: sizeText
        }
      });
    });

    console.log(`📝 整形データ: ${therapistsToInsert.length} 件`);

    // 3. データ入れ替え
    if (therapistsToInsert.length > 0) {
      console.log(`🗑️ 既存のバグデータをクリア中...`);
      await supabase.from('therapists').delete().eq('shop_id', TARGET_SHOP_ID);

      console.log(`📦 正しいキャスト情報を登録中...`);
      const { error: insErr } = await supabase.from('therapists').insert(therapistsToInsert);
      if (insErr) throw insErr;
      console.log(`✅ 登録完了。`);
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
