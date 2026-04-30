import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  console.log('🔍 1. 立川・赤羽など、他エリアの CREST SPA の存在と group_id を確認します...\n');
  try {
    const { data: crestShops } = await supabase
      .from('shops')
      .select('id, name, group_id')
      .ilike('name', '%CREST%');

    let commonGroupId = 'crest_spa_group'; // 共通グループIDの基準

    if (crestShops && crestShops.length > 0) {
      crestShops.forEach(s => {
        console.log(` - [${s.name}] (ID: ${s.id})`);
        console.log(`   └ 現在の GroupID: ${s.group_id || '未設定'}`);
        // もし既にどこかの店舗でグループIDが設定されていればそれに合わせる
        if (s.group_id && s.id !== 'tokyo_suginami_ogikubo_crest') {
          commonGroupId = s.group_id;
        }
      });
    }

    console.log(`\n⚙️ 2. 共通グループID [${commonGroupId}] と、いただいた本物のデータを荻窪店に適用します...`);
    const { error: updateErr } = await supabase
      .from('shops')
      .update({
        business_hours: '11:00~05:00 (受付時間 10:00~03:30)',
        price_system: '90min ¥20,000 / 120min ¥24,000 / 150min ¥29,000 / 180min ¥36,000',
        schedule_url: 'https://crestspa-tokyo.com/schedule',
        group_id: commonGroupId
      })
      .eq('id', 'tokyo_suginami_ogikubo_crest');

    if (updateErr) throw updateErr;
    console.log('✅ 荻窪店のデータを完璧に更新しました。');

    // クチコミ吸収のため、他エリアの CREST SPA の group_id が空なら一緒に更新しておく
    if (crestShops) {
      for (const shop of crestShops) {
        if (!shop.group_id || shop.group_id !== commonGroupId) {
          await supabase.from('shops').update({ group_id: commonGroupId }).eq('id', shop.id);
          console.log(`✅ ${shop.name} の group_id も同期しました（クチコミ共有完了）。`);
        }
      }
    }

    console.log('\n⏳ 3. JSONデータを更新中...');
    const { data: allShops } = await supabase.from('shops').select('*');
    [path.resolve('src/data/shops.json'), path.resolve('public/data/shops.json')].forEach(p => {
      if (fs.existsSync(p)) {
        fs.writeFileSync(p, JSON.stringify(allShops, null, 2));
      }
    });

    console.log('\n🎉 全ての処理が完了しました！ブラウザをリロードしてカードを確認してください。');
  } catch (e) {
    console.error('❌ エラー:', e.message);
  }
}
main();
