import fs from 'fs';

async function run() {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const getEnv = (key) => {
    const match = envContent.match(new RegExp(`^${key}=['"]?(.*?)['"]?$`, 'm'));
    return match ? match[1].trim() : null;
  };

  const url = getEnv('VITE_SUPABASE_URL');
  const key = getEnv('VITE_SUPABASE_ANON_KEY');
  const headers = { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };

  // 被害に遭った関係ない店舗のIDリスト
  const wrongShopIds = [
    'osaka_umeda_first_class',
    'aichi_tsurumai_mrs_crystal',
    'hyogo_sannomiya_mrs_melty',
    'fukuoka_kurume_mothers',
    'hyogo_sannomiya_mrs_tenor',
    'osaka_shinosaka_spalot_mrs',
    '1191_1',
    '1207_1',
    '1193_1',
    'tokyo_shinjuku_shinjuku_first',
    'tokyo_shinjuku_takadanobaba_aroma-mrs'
  ];

  // 誤って登録されたR.sスパのキャスト名
  const wrongCastNames = [
    "はな", "あゆか", "みき", "りり", "ゆきの", "なる", "つき", "なな", "まどか", "うさ",
    "しおね", "みかさ", "まり", "ゆうり", "すい", "きさき", "れんか", "さく", "かや", "みずき",
    "らら", "いぶき", "みみ", "ゆめの", "えりか", "のの", "みれい", "らむ", "みゆ", "みなみ",
    "おと", "かのん", "みつ", "りか", "ひより", "りさ", "みあ", "せいな", "しらす", "もえ",
    "まな", "いろは", "さくら", "しおん"
  ];

  try {
    console.log(`🧹 誤って更新された店舗のデータ復旧・削除を開始します...\n`);

    for (const shopId of wrongShopIds) {
      console.log(`\n🏠 復旧処理: ${shopId}`);

      // 1. 店舗情報のリセット
      let patchBody = { website_url: null, schedule_url: null, price_system: null };
      
      // AROMA MRSだけは前回の正しいデータに復元
      if (shopId === 'tokyo_shinjuku_takadanobaba_aroma-mrs') {
        patchBody = {
          website_url: "https://aroma-mrs.com/",
          schedule_url: "https://aroma-mrs.com/schedule.php",
          price_system: "60min: 12,000円\n90min: 16,000円\n120min: 20,000円"
        };
      }

      const patchRes = await fetch(`${url}/rest/v1/shops?id=eq.${shopId}`, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify(patchBody)
      });

      if (patchRes.ok) {
        console.log(`   ✅ 店舗情報をリセット（AROMA MRSは復元完了）`);
      } else {
        console.error(`   ❌ 店舗情報の更新失敗: ${patchRes.statusText}`);
      }

      // 2. 誤って登録されたキャストの削除
      const dbRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${shopId}&select=id,name`, { headers });
      const dbCasts = await dbRes.json();

      let deletedCount = 0;
      for (const cast of dbCasts) {
        if (wrongCastNames.includes(cast.name)) {
          await fetch(`${url}/rest/v1/therapists?id=eq.${cast.id}`, {
            method: 'DELETE',
            headers: headers
          });
          deletedCount++;
        }
      }
      console.log(`   🗑️ 誤登録されたキャストを ${deletedCount} 名削除しました。`);
    }
    
    console.log(`\n🎊 復旧作業が完了しました。ご迷惑をおかけして本当に申し訳ありません！`);

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
