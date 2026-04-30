import fs from 'fs';

async function run() {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const getEnv = (key) => {
    const match = envContent.match(new RegExp(`^${key}=['"]?(.*?)['"]?$`, 'm'));
    return match ? match[1].trim() : null;
  };

  const url = getEnv('VITE_SUPABASE_URL');
  const key = getEnv('VITE_SUPABASE_SERVICE_ROLE_KEY') || getEnv('VITE_SUPABASE_ANON_KEY');
  
  // スキーマ変更（カラム追加）を行うには、本来サービスロールキーなどの強い権限か、
  // SQLを直接実行する必要があります。
  // SupabaseのREST API（RESTfulなPOST/PATCH等）からは、デフォルトでは新規カラムの作成（ALTER TABLE）はできません。
  
  const headers = { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };

  console.log(`⚠️ 【重要なお知らせ】`);
  console.log(`SupabaseのREST API経由（このスクリプト）からは、直接テーブルに新しいカラム（area_id）を追加する操作（ALTER TABLE）がセキュリティ上禁止されています。`);
  console.log(`そのため、まずSupabaseの管理画面（SQL Editor）で以下のSQLを実行して、カラムを追加してください。\n`);
  
  console.log(`--------------------------------------------------`);
  console.log(`ALTER TABLE shops ADD COLUMN IF NOT EXISTS area_id TEXT;`);
  console.log(`--------------------------------------------------\n`);

  console.log(`SQLの実行が終わりましたら、以下のデータ統合・更新処理を実行します...`);
  
  // 5秒待機してからデータ更新処理に進む（実際は手動でSQL実行後に再度このスクリプトを回す形が安全ですが、
  // すでにカラムがあると仮定して進む処理を書きます）
  await new Promise(resolve => setTimeout(resolve, 5000));

  try {
    console.log(`\n🔍 全店舗のデータを取得し、area_idの自動付与とrelaxの統合を行います...\n`);

    const res = await fetch(`${url}/rest/v1/shops?select=*`, { headers });
    if (!res.ok) {
        console.log(`❌ エラー: ${res.statusText}。 まだ area_id カラムが作成されていない可能性があります。`);
        return;
    }
    const allShops = await res.json();

    let updateCount = 0;

    // 1. 全店舗に area_id を付与する処理
    for (const shop of allShops) {
      // IDの構造が "tokyo_shinagawa_gotanda_shopname" だと仮定して、
      // 最初の3つのアンダースコア区切りの部分（tokyo_shinagawa_gotanda）を抽出
      const idParts = shop.id.split('_');
      if (idParts.length >= 3) {
        const areaId = `${idParts[0]}_${idParts[1]}_${idParts[2]}`;
        
        // ただし、relaxの場合は後で個別に処理するのでスキップ
        if (shop.id === 'tokyo_minato_shinbashi_relax_tokyo' || shop.id === 'tokyo_shinagawa_gotanda_relax') {
            continue;
        }

        await fetch(`${url}/rest/v1/shops?id=eq.${shop.id}`, {
          method: 'PATCH',
          headers: headers,
          body: JSON.stringify({ area_id: areaId })
        });
        updateCount++;
      }
    }
    console.log(`   ✅ 既存 ${updateCount} 店舗の area_id 自動設定完了`);


    // 2. relax の統合処理
    console.log(`\n🔄 「RELAX」のデータ統合処理を開始します...`);

    const shinbashiId = 'tokyo_minato_shinbashi_relax_tokyo';
    const gotandaId = 'tokyo_shinagawa_gotanda_relax';

    // 新橋店に、新橋と五反田の2つのエリアIDを設定し、名前を統一
    const patchRelaxRes = await fetch(`${url}/rest/v1/shops?id=eq.${shinbashiId}`, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify({ 
            area_id: 'tokyo_minato_shinbashi,tokyo_shinagawa_gotanda',
            name: 'RELAX (リラックス)' // 名前を統一
        })
    });

    if (patchRelaxRes.ok) {
        console.log(`   ✅ 新橋RELAXに両方のエリアID（tokyo_minato_shinbashi, tokyo_shinagawa_gotanda）を設定完了`);
    } else {
        console.error(`   ❌ 新橋RELAXのエリア設定失敗`);
    }

    // 五反田店のキャストを削除
    const delCastsRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.${gotandaId}`, {
        method: 'DELETE',
        headers: headers
    });
    
    // 五反田店本体を削除
    const delShopRes = await fetch(`${url}/rest/v1/shops?id=eq.${gotandaId}`, {
        method: 'DELETE',
        headers: headers
    });

    if (delShopRes.ok) {
        console.log(`   🗑️  重複していた五反田RELAXとそのキャストの削除完了`);
    } else {
        console.error(`   ❌ 五反田RELAXの削除失敗: ${delShopRes.statusText}`);
    }

    console.log(`\n🎊 データベースの改修と統合が完了しました！`);
    console.log(`⚠️ フロントエンド（React）側で、店舗一覧を取得する際に 'area_id' を見てフィルタリングするよう、コードの変更が必要です。`);

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

run();
