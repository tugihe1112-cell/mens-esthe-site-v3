import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  const SHOP_ID = 'tokyo_suginami_ogikubo_crest';
  console.log('🚀 ローカルのHTMLからキャスト情報を抽出し、データベースに登録します...\n');

  try {
    const htmlPath = path.resolve('crest.html');
    const html = fs.readFileSync(htmlPath, 'utf-8');
    const $ = cheerio.load(html);
    const therapists = [];

    $('.staffsView .item').each((i, el) => {
      const rawNameText = $(el).find('.itemName').contents().filter(function() {
        return this.nodeType === 3; 
      }).text().trim();
      
      let name = rawNameText;
      const ageMatch = rawNameText.match(/(.+?)\s*\((\d+)歳\)/);
      if (ageMatch) {
        name = ageMatch[1].trim();
      }

      let imageUrl = $(el).find('.itemImg img').attr('data-src') || $(el).find('.itemImg img').attr('src');
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = 'https://crestspa-tokyo.com' + imageUrl;
      }

      if (name && imageUrl) {
        therapists.push({
          id: `${SHOP_ID}_${name}`,
          shop_id: SHOP_ID,
          name: name,
          image_url: imageUrl,
          is_active: true,
          review_count: 0
        });
      }
    });

    console.log(`🔍 埋め込みデータから ${therapists.length} 名のキャストを検出しました！`);

    if (therapists.length === 0) return;

    console.log('🔄 既存のデータをリセット中...');
    await supabase.from('therapists').delete().eq('shop_id', SHOP_ID);

    console.log('📥 データベースへ一括登録中...');
    const { error: insertErr } = await supabase.from('therapists').insert(therapists);
    if (insertErr) throw insertErr;

    console.log('✅ データベース登録完了。ローカルJSONを同期します...');
    const { data: allTherapists } = await supabase.from('therapists').select('*');
    [path.resolve('src/data/therapists.json'), path.resolve('public/data/therapists.json')].forEach(p => {
      if (fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify(allTherapists, null, 2));
    });

    console.log('\n🎉 全キャストの登録が完璧に完了しました！ブラウザをリロードして確認してください。');

  } catch (e) {
    console.error('❌ エラー:', e.message);
  }
}
main();
