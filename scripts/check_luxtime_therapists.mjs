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

  try {
    const luxId = 'tokyo_chiyoda_akihabara_luxtime';
    console.log(`🔍 「lux time (秋葉原店)」のセラピストデータがどこにあるか探します...\n`);

    // 1. まず、shopsテーブルの中にセラピスト情報が含まれていないか確認
    const shopRes = await fetch(`${url}/rest/v1/shops?id=eq.${luxId}&select=*`, { headers });
    const shops = await shopRes.json();
    if (shops && shops.length > 0) {
      const s = shops[0];
      // 謎のカラムにデータが入っていないかチェック
      const keys = Object.keys(s).filter(k => k.includes('staff') || k.includes('therapist') || k.includes('raw') || typeof s[k] === 'object');
      if (keys.length > 0) {
        console.log(`📂 shopsテーブル内の怪しいカラム:`);
        keys.forEach(k => console.log(` - ${k}:`, JSON.stringify(s[k]).substring(0, 100) + '...'));
      }
    }

    // 2. 独立した therapists テーブルに存在するか確認
    console.log(`\n📂 therapists テーブルを検索...`);
    const tRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${luxId}&select=*`, { headers });
    if (tRes.ok) {
      const tData = await tRes.json();
      if (tData.length > 0) {
        console.log(`✅ therapistsテーブルに ${tData.length} 名のデータを発見！`);
        console.log(`【サンプル1名】:`, tData[0]);
      } else {
        console.log(`❌ therapistsテーブルにはデータが存在しません。`);
      }
    } else {
      console.log(`❌ therapistsという名前のテーブル自体が存在しないか、エラーです。`);
    }

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
