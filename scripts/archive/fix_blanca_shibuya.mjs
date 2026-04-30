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
    console.log("⏳ 「サロンブランカ 代々木店」を「渋谷店」に修正中...");
    
    const updateRes = await fetch(`${url}/rest/v1/shops?id=eq.tokyo_shibuya_yoyogi_harajuku_salon_blanca`, {
      method: 'PATCH',
      headers: headers,
      body: JSON.stringify({ name: 'SALON BLANCA (サロンブランカ) 渋谷店' })
    });

    if (updateRes.ok) {
      console.log("✅ 代々木店を「渋谷店」に名前変更しました！");
      console.log("🎉 これで「渋谷」検索で1つ、「恵比寿」検索で1つヒットするようになります！");
    } else {
      console.error("❌ 更新に失敗しました:", await updateRes.text());
    }

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
