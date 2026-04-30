import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  console.log('🚀 表示されているJJのデータを基準に、CRESTの不足分を完全補強します...\n');
  try {
    const CREST_ID = 'tokyo_suginami_ogikubo_crest';
    const JJ_ID = 'tokyo_suginami_ogikubo_mens_esthe_jj';

    // 1. JJとCRESTの全データを取得
    const { data: shops, error: fetchErr } = await supabase
      .from('shops')
      .select('*')
      .in('id', [CREST_ID, JJ_ID]);

    if (fetchErr) throw fetchErr;

    const jj = shops.find(s => s.id === JJ_ID);
    const crest = shops.find(s => s.id === CREST_ID);

    if (!jj || !crest) {
      console.log('❌ 店舗データが見つかりません。');
      return;
    }

    // 2. JJにあって、CRESTにない（null）データをすべてコピーする準備
    const updateData = {};
    const ignoreKeys = ['id', 'name', 'created_at', 'updated_at', 'website_url', 'image_url', 'business_hours', 'price_system', 'schedule_url', 'group_id'];

    for (const key in jj) {
      if (ignoreKeys.includes(key)) continue; // 固有データは上書きしない
      
      // CREST側がnullまたは空文字で、JJ側にデータがある場合はJJのものを拝借する
      if ((crest[key] === null || crest[key] === '') && jj[key] !== null) {
        updateData[key] = jj[key];
      }
    }

    // 3. 非表示フラグなどがあれば強制的に「表示（true/published）」にする
    if ('is_active' in crest) updateData.is_active = true;
    if ('status' in crest) updateData.status = 'published';

    console.log('⚙️ 以下のデータをCRESTに補填・上書きします:');
    console.log(Object.keys(updateData).length > 0 ? Object.keys(updateData).join(', ') : '補填するデータはありませんでした。');

    // 4. データベースを更新
    if (Object.keys(updateData).length > 0) {
      const { error: updateErr } = await supabase
        .from('shops')
        .update(updateData)
        .eq('id', CREST_ID);

      if (updateErr) throw updateErr;
      console.log('✅ データベースの完全補強に成功しました。');
    }

    // 5. ローカルJSONの更新
    console.log('\n⏳ JSONデータを更新中...');
    const { data: allShops } = await supabase.from('shops').select('*');
    [path.resolve('src/data/shops.json'), path.resolve('public/data/shops.json')].forEach(p => {
      if (fs.existsSync(p)) {
        fs.writeFileSync(p, JSON.stringify(allShops, null, 2));
      }
    });

    console.log('\n🎉 完了しました！ブラウザをリロード（Cmd + R）して確認してください。');
    console.log('※もしこれで出ない場合は、Viteのキャッシュが強すぎるため、ターミナルで一度 npm run dev を「Ctrl+C」で止めて、再度 npm run dev を実行してください。');

  } catch (e) {
    console.error('❌ エラー:', e.message);
  }
}
main();
