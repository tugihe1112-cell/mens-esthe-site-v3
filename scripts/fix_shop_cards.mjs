import fs from 'fs';
import path from 'path';

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
    console.log('🚀 1. データベース上の「すべてのFEVER」にロゴを強制注入します...');
    const logoUrl = "https://azuetkuzzmshqfbrhqmf.supabase.co/storage/v1/object/public/shop-logos/FEVER.png";
    
    // 名前にFEVERが含まれる全店舗を検索
    const res = await fetch(`${url}/rest/v1/shops?name=ilike.*FEVER*&select=id,name`, { headers });
    const shops = await res.json();
    
    if (shops && shops.length > 0) {
      for (const s of shops) {
        await fetch(`${url}/rest/v1/shops?id=eq.${s.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ image_url: logoUrl }) // 👈 存在しない logo_url は絶対に入れない
        });
        console.log(` ✅ ${s.name} (${s.id}) にロゴをセットしました！`);
      }
    } else {
      console.log('⚠️ FEVER店舗が見つかりませんでした。');
    }

    console.log('\n🔧 2. 検索結果カード（ShopCard等）の画像表示ロジックを luxtime 仕様に修正します...');
    
    // カードコンポーネントの可能性が高いファイルを探す
    const candidates = [
      'src/components/ShopCard.jsx',
      'src/components/Card.jsx',
      'src/pages/SearchPage.jsx',
      'src/pages/HomePage.jsx'
    ];

    let foundAndFixed = false;

    for (const file of candidates) {
      if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        
        // カードの画像部分で "No Image" を出している条件や、脆弱な読み込みを強固にする
        // shop.image_url または shop.image をシンプルに読み込むように置換
        const imgRegex1 = /<img\s+src=\{shop(?:\?)?\.image_url\s*\|\|[^}]+\}\s+alt=\{[^}]+\}/g;
        const imgRegex2 = /<img\s+src=\{[^}]+\}\s+alt=\{[^}]+\}\s+className="[^"]*w-full[^"]*h-full[^"]*object-cover[^"]*"/g;
        
        // LazyImageを使っているパターン
        const lazyRegex = /<LazyImage\s+src=\{shop(?:\?)?\.image_url\s*\|\|[^}]+\}/g;

        let modified = false;

        if (lazyRegex.test(content)) {
          content = content.replace(lazyRegex, `<LazyImage src={shop.image_url || shop.image}`);
          modified = true;
        } else if (content.includes('No Image')) {
          // "No Image" のテキストを出している付近のロジックを直接直すための簡易パッチ
          content = content.replace(/shop(?:\?)?\.image\s*\|\|\s*shop(?:\?)?\.image_url/g, "shop?.image_url || shop?.image");
          modified = true;
        }

        if (modified) {
          fs.writeFileSync(file, content);
          console.log(` ✅ ${file} のカード画像ロジックを修正しました！`);
          foundAndFixed = true;
        }
      }
    }

    if (!foundAndFixed) {
      console.log('⚠️ 自動修正できるカードコンポーネントが見つかりませんでした。');
    }

    console.log('\n🎊 完了しました！ブラウザをリロードして検索結果一覧を確認してください。');

  } catch (err) {
    console.error('エラー:', err);
  }
}

run();
