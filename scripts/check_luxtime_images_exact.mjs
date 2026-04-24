import fs from 'fs';

async function run() {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const getEnv = (key) => {
    const match = envContent.match(new RegExp(`^${key}=['"]?(.*?)['"]?$`, 'm'));
    return match ? match[1].trim() : null;
  };

  const url = getEnv('VITE_SUPABASE_URL');
  const key = getEnv('VITE_SUPABASE_ANON_KEY');
  const headers = { 'apikey': key, 'Authorization': `Bearer ${key}` };

  try {
    console.log('🔍 【luxtime（お手本）】の画像データの入り方を完全に解剖します...\n');

    // 1. luxtimeの店舗データ（ロゴ画像）を確認
    const shopRes = await fetch(`${url}/rest/v1/shops?id=eq.tokyo_chiyoda_akihabara_luxtime&select=*`, { headers });
    const shopData = await shopRes.json();
    if (shopData && shopData.length > 0) {
      console.log('👑 luxtime 店舗データの画像カラム:');
      const shop = shopData[0];
      for (const k in shop) {
        if (typeof shop[k] === 'string' && (shop[k].includes('http') || k.includes('image') || k.includes('logo') || k.includes('pic'))) {
          console.log(`  - ${k}: ${shop[k]}`);
        }
      }
    }

    // 2. luxtimeのセラピストデータ（女の子の画像）を確認
    console.log('\n👑 luxtime セラピストデータ（1人目）の画像カラム:');
    const tRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.tokyo_chiyoda_akihabara_luxtime&select=*&limit=1`, { headers });
    const tData = await tRes.json();
    if (tData && tData.length > 0) {
      const therapist = tData[0];
      for (const k in therapist) {
        if (typeof therapist[k] === 'string' && (therapist[k].includes('http') || k.includes('image') || k.includes('logo') || k.includes('pic') || k.includes('url'))) {
          console.log(`  - ${k}: ${therapist[k]}`);
        }
      }
      console.log('\n  ※raw_dataの中身:', therapist.raw_data);
    }

    console.log('\n--------------------------------------------------\n');

    // 3. 比較のため FEVER（現在おかしい店舗）のデータも確認
    console.log('❌ 【FEVER】の現在の画像データの入り方:');
    const feverRes = await fetch(`${url}/rest/v1/shops?brand_id=eq.fever&select=*&limit=1`, { headers });
    const feverData = await feverRes.json();
    if (feverData && feverData.length > 0) {
      const feverShop = feverData[0];
      console.log('  [FEVER店舗]');
      for (const k in feverShop) {
        if (typeof feverShop[k] === 'string' && (feverShop[k].includes('http') || k.includes('image') || k.includes('logo') || k.includes('pic'))) {
          console.log(`    - ${k}: ${feverShop[k]}`);
        }
      }
      
      const ftRes = await fetch(`${url}/rest/v1/therapists?shop_id=eq.fever&select=*&limit=1`, { headers });
      const ftData = await ftRes.json();
      if (ftData && ftData.length > 0) {
        console.log('\n  [FEVERセラピスト（1人目）]');
        const ft = ftData[0];
        for (const k in ft) {
          if (typeof ft[k] === 'string' && (ft[k].includes('http') || k.includes('image') || k.includes('logo') || k.includes('pic') || k.includes('url'))) {
            console.log(`    - ${k}: ${ft[k]}`);
          }
        }
      } else {
        console.log('\n  ⚠️ FEVERのセラピストデータが見つかりません（ここが原因かも！）');
      }
    } else {
      console.log('⚠️ FEVERの店舗データが見つかりません。');
    }

  } catch (err) {
    console.error('エラー:', err);
  }
}

run();
