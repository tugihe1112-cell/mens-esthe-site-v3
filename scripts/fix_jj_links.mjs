import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const TARGET_SHOP_ID = 'tokyo_suginami_ogikubo_mens_esthe_jj';
const SCHEDULE_URL = 'http://www.spa-jj.tokyo/schedule.html';
const WEBSITE_URL = 'http://www.spa-jj.tokyo/';

async function main() {
  console.log('🚀 メンズエステJJにスケジュールリンクを復旧します...\n');

  try {
    console.log(`🏪 店舗データ (${TARGET_SHOP_ID}) にURLを追加中...`);
    const { error: updateErr } = await supabase
      .from('shops')
      .update({ 
        schedule_url: SCHEDULE_URL,
        website_url: WEBSITE_URL
      })
      .eq('id', TARGET_SHOP_ID);

    if (updateErr) throw updateErr;
    console.log('✅ データベースの更新が完了しました。');

    // ローカルJSON同期
    console.log('⏳ JSONに同期中...');
    const { data: allShops } = await supabase.from('shops').select('*');
    [path.resolve('src/data/shops.json'), path.resolve('public/data/shops.json')].forEach(p => {
      if (fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify(allShops, null, 2));
    });

    console.log(`\n🎉 スケジュールリンクの復旧が完了しました！`);

  } catch (err) {
    console.error('❌ エラー:', err.message);
  }
}

main();
