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

  const SHOP_ID = 'tokyo_shinjuku_shinjuku_first';
  const LOGO_SOURCE_URL = 'https://esthe-first.com/img/logo.png';
  const STORAGE_FILE_NAME = 'First.png';
  const STORAGE_BUCKET = 'shop-logos';

  console.log('🚀 First (ファースト) 新宿店の店舗画像設置を開始します...\n');

  try {
    // Step 1: ロゴ画像をダウンロード
    console.log(`📥 ロゴ画像をダウンロード中: ${LOGO_SOURCE_URL}`);
    const imgRes = await fetch(LOGO_SOURCE_URL);
    if (!imgRes.ok) {
      throw new Error(`ロゴ画像のダウンロード失敗: ${imgRes.status} ${imgRes.statusText}`);
    }
    const imgBuffer = await imgRes.arrayBuffer();
    const imgBytes = new Uint8Array(imgBuffer);
    console.log(`   ✅ ダウンロード完了 (${imgBytes.length} bytes)\n`);

    // Step 2: Supabase Storageにアップロード
    console.log(`📤 Supabase Storageにアップロード中: ${STORAGE_BUCKET}/${STORAGE_FILE_NAME}`);
    const uploadHeaders = {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'image/png',
      'x-upsert': 'true' // 既存ファイルがあっても上書き
    };

    const uploadRes = await fetch(
      `${url}/storage/v1/object/${STORAGE_BUCKET}/${STORAGE_FILE_NAME}`,
      {
        method: 'POST',
        headers: uploadHeaders,
        body: imgBytes
      }
    );

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(`アップロード失敗: ${uploadRes.status} - ${errText}`);
    }
    console.log(`   ✅ アップロード完了\n`);

    // Step 3: image_url を組み立て
    const imageUrl = `${url}/storage/v1/object/public/${STORAGE_BUCKET}/${STORAGE_FILE_NAME}`;
    console.log(`🔗 設定するimage_url: ${imageUrl}\n`);

    // Step 4: shopのimage_urlを更新
    console.log(`🗄️  Supabase DBを更新中: ${SHOP_ID}`);
    const patchRes = await fetch(
      `${url}/rest/v1/shops?id=eq.${SHOP_ID}`,
      {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify({ image_url: imageUrl })
      }
    );

    if (!patchRes.ok) {
      const errText = await patchRes.text();
      throw new Error(`DB更新失敗: ${patchRes.status} - ${errText}`);
    }
    console.log(`   ✅ DB更新完了\n`);

    // Step 5: ローカルJSONも更新
    console.log('📁 ローカルJSONファイルも更新中...');
    const allShopsPath = './public/data/all_shops.json';
    const allShops = JSON.parse(fs.readFileSync(allShopsPath, 'utf-8'));
    let updated = false;
    for (const shop of allShops) {
      if (shop.id === SHOP_ID) {
        shop.image_url = imageUrl;
        updated = true;
        break;
      }
    }
    if (updated) {
      fs.writeFileSync(allShopsPath, JSON.stringify(allShops, null, 2), 'utf-8');
      console.log(`   ✅ ${allShopsPath} 更新完了\n`);
    } else {
      console.log(`   ⚠️  ${allShopsPath} で ${SHOP_ID} が見つかりませんでした\n`);
    }

    console.log('🎉 完了！First (ファースト) 新宿店に店舗画像が設置されました。');

  } catch (err) {
    console.error('❌ エラー:', err.message);
    process.exit(1);
  }
}

run();
