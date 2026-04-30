import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  const SHOP_ID = 'tokyo_suginami_ogikubo_crest';
  console.log('🚀 CREST SPA TOKYO のキャスト情報を抽出し、データベースへ登録します...\n');

  try {
    // 1. 実際のスケジュールページからHTMLを取得
    console.log('⏳ サイトにアクセスして情報を読み取っています...');
    const response = await fetch('https://crestspa-tokyo.com/schedule');
    if (!response.ok) throw new Error('サイトへのアクセスに失敗しました');
    const html = await response.text();
    const $ = cheerio.load(html);

    const therapists = [];

    // 2. HTML内からキャストの要素（.item）を一つずつ解析
    $('.staffsView .item').each((i, el) => {
      // 名前と年齢の抽出（例: "水野 はれ(24歳)" -> 名前と年齢に分割）
      const rawNameText = $(el).find('.itemName').contents().filter(function() {
        return this.nodeType === 3; // テキストノードのみ取得
      }).text().trim();
      
      let name = rawNameText;
      let age = null;
      const ageMatch = rawNameText.match(/(.+?)\s*\((\d+)歳\)/);
      if (ageMatch) {
        name = ageMatch[1].trim();
        age = parseInt(ageMatch[2], 10);
      }

      // 画像URLの抽出（遅延読み込み用の data-src を優先して取得）
      let imageUrl = $(el).find('.itemImg img').attr('data-src') || $(el).find('.itemImg img').attr('src');
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = 'https://crestspa-tokyo.com' + imageUrl;
      }

      if (name && imageUrl) {
        // 過去のスキーマエラーを教訓に、確実に存在する安全なカラムのみで構成
        therapists.push({
          shop_id: SHOP_ID,
          name: name,
          age: age,
          image_url: imageUrl
        });
      }
    });

    console.log(`🔍 サイトから ${therapists.length} 名のキャストを検出しました。`);

    if (therapists.length === 0) {
      console.log('⚠️ キャストが見つかりませんでした。HTMLの構造が変わっている可能性があります。');
      return;
    }

    // 3. データベースへの登録処理
    console.log('\n🔄 既存の古いデータを整理中...');
    await supabase.from('therapists').delete().eq('shop_id', SHOP_ID);

    console.log('📥 新しいキャストデータを一括登録中...');
    const { error: insertErr } = await supabase.from('therapists').insert(therapists);
    if (insertErr) throw insertErr;

    // 4. (任意) ローカルのJSONも同期しておく
    const { data: allTherapists } = await supabase.from('therapists').select('*');
    [path.resolve('src/data/therapists.json'), path.resolve('public/data/therapists.json')].forEach(p => {
      if (fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify(allTherapists, null, 2));
    });

    console.log('\n🎉 全キャストの抽出と登録が完了しました！');
    console.log('ブラウザをリロードして、CREST SPAのカードにキャストがズラッと並ぶか確認してください。');

  } catch (e) {
    console.error('❌ エラー:', e.message);
  }
}
main();
