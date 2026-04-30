import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  const SHOP_ID = 'tokyo_suginami_ogikubo_crest';
  console.log('🚀 ローカルの crest.html からキャスト情報を抽出します...\n');

  try {
    const htmlPath = path.resolve('crest.html');
    if (!fs.existsSync(htmlPath)) {
      throw new Error('❌ crest.html が見つかりません。プロジェクト直下に作成して保存してください。');
    }

    console.log('⏳ HTMLファイルを読み込んでいます...');
    const html = fs.readFileSync(htmlPath, 'utf-8');
    const $ = cheerio.load(html);
    const therapists = [];

    $('.staffsView .item').each((i, el) => {
      // 1. 名前の抽出
      const rawNameText = $(el).find('.itemName').contents().filter(function() {
        return this.nodeType === 3; 
      }).text().trim();
      
      let name = rawNameText;
      const ageMatch = rawNameText.match(/(.+?)\s*\((\d+)歳\)/);
      if (ageMatch) {
        name = ageMatch[1].trim(); // 年齢部分は取り除いて純粋な名前だけにする
      }

      // 2. 画像URLの抽出
      let imageUrl = $(el).find('.itemImg img').attr('data-src') || $(el).find('.itemImg img').attr('src');
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = 'https://crestspa-tokyo.com' + imageUrl;
      }

      if (name && imageUrl) {
        // 調査結果のフォーマットに完全準拠させる
        therapists.push({
          id: `${SHOP_ID}_${name}`, // 店舗IDと名前を結合した一意のID
          shop_id: SHOP_ID,
          name: name,
          image_url: imageUrl,
          is_active: true, // 必須フラグ
          review_count: 0  // 必須フラグ
          // ageやcupなどはnullで許容されるため、エラー防止のためあえて入れない
        });
      }
    });

    console.log(`🔍 ローカルHTMLから ${therapists.length} 名のキャストを検出しました！`);

    if (therapists.length === 0) {
      console.log('⚠️ 抽出できませんでした。HTMLの中身が正しいか確認してください。');
      return;
    }

    console.log('\n🔄 既存のキャストデータをリセット中...');
    await supabase.from('therapists').delete().eq('shop_id', SHOP_ID);

    console.log('📥 新しいキャストデータを一括登録中...');
    // データが多すぎるとエラーになる可能性があるため、バルクインサートで一気に登録
    const { error: insertErr } = await supabase.from('therapists').insert(therapists);
    if (insertErr) {
       console.error('❌ データベース登録エラー:', insertErr.message);
       return;
    }

    console.log('✅ データベース登録完了。');

    console.log('⏳ JSONデータを更新中...');
    const { data: allTherapists } = await supabase.from('therapists').select('*');
    [path.resolve('src/data/therapists.json'), path.resolve('public/data/therapists.json')].forEach(p => {
      if (fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify(allTherapists, null, 2));
    });

    console.log('\n🎉 全キャストの抽出と登録が完璧に完了しました！ブラウザをリロードして確認してください。');

  } catch (e) {
    console.error('❌ エラー:', e.message);
  }
}
main();
