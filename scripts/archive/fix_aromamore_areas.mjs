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
    console.log(`🧹 AROMA more 各店舗のエリア情報を修正します...\n`);

    // 修正対象の店舗リスト
    const updates = [
      {
        id: 'tokyo_chuo_ginza_aromamore',
        correct_area: '銀座',
        correct_city: '中央区'
      },
      {
        id: 'tokyo_shinjuku_kabukicho_aromamore',
        correct_area: '歌舞伎町',
        correct_city: '新宿区'
      }
      // ※六本木店と池袋店は現状で問題ないのでスキップ
    ];

    for (const target of updates) {
      // 1. まず現在の raw_data を取得する
      const res = await fetch(`${url}/rest/v1/shops?id=eq.${target.id}&select=raw_data`, { headers });
      const shop = await res.json();

      if (shop && shop.length > 0) {
        let rawData = shop[0].raw_data;

        // 2. raw_data の中身を正しい地名に書き換える
        rawData.area = target.correct_area;
        rawData.city = target.correct_city;

        // 3. 書き換えた raw_data を Supabase に送信（PATCH）
        const patchRes = await fetch(`${url}/rest/v1/shops?id=eq.${target.id}`, {
          method: 'PATCH',
          headers: headers,
          body: JSON.stringify({ raw_data: rawData })
        });

        if (patchRes.ok) {
          console.log(`   ✅ ID: ${target.id} のエリアを「${target.correct_city} ${target.correct_area}」に修正しました。`);
        } else {
          console.error(`   ❌ 修正失敗 (${target.id}): ${patchRes.statusText}`);
        }
      }
    }

    console.log(`\n🎊 修正が完了した！サイトをリロードして、六本木で検索してみてくれ！`);

  } catch (error) {
    console.error("エラー:", error);
  }
}
run();
