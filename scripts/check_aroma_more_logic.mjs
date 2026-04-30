import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  console.log('🔍 「アロマモア」のデータ構造とキャスト取得方式を調査します...\n');
  try {
    // 1. shopsテーブルの確認
    const { data: shops, error: shopErr } = await supabase
      .from('shops')
      .select('*')
      .ilike('name', '%アロマモア%');

    if (shopErr) throw shopErr;

    if (!shops || shops.length === 0) {
      console.log('⚠️ 「アロマモア」が見つかりませんでした。別の店舗名で試す必要があります。');
      return;
    }

    const shop = shops[0];
    console.log(`✅ 店舗を発見: ${shop.name} (ID: ${shop.id})`);
    console.log(`   - website_url: ${shop.website_url}`);
    console.log(`   - schedule_url: ${shop.schedule_url}`);
    
    // スクレピング用の特殊なカラムがないか探す
    console.log('\n🎯 【注目】自動取得に関連しそうな特殊設定カラム:');
    let hasSpecialKey = false;
    for (const key in shop) {
        if (key.includes('scrape') || key.includes('sync') || key.includes('auto') || key.includes('platform')) {
            console.log(`   - ${key}: ${shop[key]}`);
            hasSpecialKey = true;
        }
    }
    if (!hasSpecialKey) console.log('   (特になし)');

    // 2. therapistsテーブルの確認（本当にデータが入っていないか）
    console.log('\n🔍 次に、therapistsテーブル内にデータが直接保存されているか確認します...');
    const { count, error: countErr } = await supabase
      .from('therapists')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', shop.id);

    if (countErr) throw countErr;

    if (count > 0) {
      console.log(`\n✅ 結果: therapists テーブル内に 【 ${count} 名 】 のデータが直接保存されています。`);
      console.log('💡 結論: アロマモアも、画面が直接サイトを見に行っているわけではなく、何らかの「自動更新スクリプト」が裏で動いてSupabaseに保存している仕組みです。');
    } else {
      console.log(`\n⚠️ 結果: therapists テーブルは 【 0 名 】 です。`);
      console.log('💡 結論: ご認識の通り！Supabaseにセラピストデータを保存せず、URL等の情報を使って「その都度外部から持ってくる」という高度な仕組みで動いています。');
    }

  } catch (e) {
    console.error('❌ エラー:', e.message);
  }
}
main();
