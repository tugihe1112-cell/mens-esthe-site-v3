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
    console.log('🚀 Tokyo Fairy Land の正しいエリア（豊島区池袋）を登録します...');
    
    // Web検索で特定した正確なエリア情報
    const areaPayload = {
      prefecture: "tokyo",
      city: "toshima",
      area: "ikebukuro"
    };

    const res = await fetch(`${url}/rest/v1/shops?id=eq.tokyo_fairy_land`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(areaPayload)
    });

    if (res.ok) {
      console.log('\n🎊 完璧です！正しいエリア情報「東京都 / 豊島区 / 池袋」がセットされました。');
      console.log('ブラウザをリロードして、池袋エリアの店舗一覧をご確認ください！');
    } else {
      console.log('❌ エラーが発生しました:', await res.text());
    }

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
