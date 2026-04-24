import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  console.log('🔍 LINDA SPA（リンダスパ）各店舗のセラピスト登録状況を比較します...\n');

  try {
    // 1. LINDA SPAの店舗を取得
    const { data: shops, error: shopError } = await supabase
      .from('shops')
      .select('id, name')
      .or('name.ilike.%LINDA%,name.ilike.%リンダ%');

    if (shopError) throw shopError;

    if (!shops || shops.length === 0) {
      console.log('⚠️ LINDA SPAの店舗が見つかりませんでした。');
      return;
    }

    const shopIds = shops.map(s => s.id);
    const shopMap = {};
    shops.forEach(s => shopMap[s.id] = s.name);

    // 2. 該当店舗に紐づく全セラピストを取得
    const { data: therapists, error: therapistError } = await supabase
      .from('therapists')
      .select('name, shop_id')
      .in('shop_id', shopIds);

    if (therapistError) throw therapistError;

    // 3. 店舗ごとにセラピストを振り分け
    const shopTherapists = {};
    shops.forEach(s => shopTherapists[s.id] = new Set());

    if (therapists) {
      therapists.forEach(t => {
        shopTherapists[t.shop_id].add(t.name);
      });
    }

    // 4. 結果の出力と比較
    console.log(`✅ 店舗ごとの登録人数:`);
    let isAllSame = true;
    let referenceSet = null;
    let referenceName = '';

    for (const [id, nameSet] of Object.entries(shopTherapists)) {
      console.log(`  - ${shopMap[id]}: ${nameSet.size}名`);
      
      if (!referenceSet) {
        referenceSet = nameSet;
        referenceName = shopMap[id];
      } else {
        // 比較チェック（人数と中身が完全に一致しているか）
        if (nameSet.size !== referenceSet.size) {
          isAllSame = false;
        } else {
          for (let name of nameSet) {
            if (!referenceSet.has(name)) {
              isAllSame = false;
              break;
            }
          }
        }
      }
    }

    console.log('\n📊 比較結果:');
    if (isAllSame && referenceSet.size > 0) {
      console.log(`🟢 【完全一致】全店舗に全く同じ ${referenceSet.size}名のセラピストが登録されています！`);
    } else if (isAllSame && referenceSet.size === 0) {
      console.log(`🟡 全店舗ともセラピストが1人も登録されていません（0名）。`);
    } else {
      console.log(`🔴 【不一致】店舗によって登録されているセラピストの人数や顔ぶれがバラバラです。`);
    }

  } catch (err) {
    console.error('❌ エラー:', err);
  }
}

main();
