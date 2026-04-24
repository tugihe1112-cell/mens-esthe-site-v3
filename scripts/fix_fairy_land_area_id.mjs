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
    console.log('🚀 池袋の正しい area_id を取得して Tokyo Fairy Land にセットします...');

    // 1. すでに正しく機能している FEVER (池袋) の area_id を盗み見る
    const feverRes = await fetch(`${url}/rest/v1/shops?id=eq.tokyo_toshima_ikebukuro_fever&select=area_id`, { headers });
    const feverData = await feverRes.json();

    if (!feverData || feverData.length === 0 || !feverData[0].area_id) {
        console.log('⚠️ FEVERから area_id を取得できませんでした。');
        return;
    }

    const exactAreaId = feverData[0].area_id;
    console.log(`🎯 正解の area_id を発見しました: ${exactAreaId}`);

    // 2. Tokyo Fairy Land に その area_id をセット
    const patchRes = await fetch(`${url}/rest/v1/shops?id=eq.tokyo_fairy_land`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ area_id: exactAreaId })
    });

    if (patchRes.ok) {
      console.log('\n🎊 完璧です！Tokyo Fairy Land が池袋エリアに完全に紐づきました！');
      console.log('ブラウザをリロードして、池袋の店舗一覧に表示されるか確認してください！');
    } else {
      console.log('❌ エラー:', await patchRes.text());
    }

  } catch (error) {
    console.error("エラー:", error);
  }
}

run();
