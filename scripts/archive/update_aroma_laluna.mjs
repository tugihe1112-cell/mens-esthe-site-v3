import fs from 'fs';

// ============================================================
// Aroma LaLuna (アロマラルーナ) - 一括セットアップスクリプト
// 実行: node update_aroma_laluna.mjs
// ============================================================

async function run() {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const getEnv = (key) => {
    const match = envContent.match(new RegExp(`^${key}=['"]?(.*?)['"]?$`, 'm'));
    return match ? match[1].trim() : null;
  };

  const supabaseUrl = getEnv('VITE_SUPABASE_URL');
  const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json'
  };

  const SHOP_ID = 'tokyo_shinjuku_shinjuku_aroma_laluna';
  const SITE_URL = 'https://laluna2020.com';
  const CAST_PAGE_URL = 'https://laluna2020.com/therapist/krc_cast';
  const STORAGE_BUCKET = 'shop-logos';
  const LOGO_FILE_NAME = 'AromaLaLuna.png';

  console.log('🚀 Aroma LaLuna セットアップ開始\n');
  console.log('=' .repeat(50));

  // ============================================================
  // Step 1: トップページからロゴ・料金・スケジュールURLを取得
  // ============================================================
  console.log('\n📄 Step 1: トップページを取得中...');
  let logoUrl = null;
  let scheduleUrl = null;
  let priceSystem = null;

  try {
    const res = await fetch(SITE_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
    });
    const html = await res.text();

    // og:image からロゴURL取得
    const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (ogImageMatch) {
      logoUrl = ogImageMatch[1];
      if (logoUrl.startsWith('/')) logoUrl = SITE_URL + logoUrl;
      console.log(`   ✅ og:image: ${logoUrl}`);
    }

    // ロゴimg要素から取得（og:imageがない場合）
    if (!logoUrl) {
      const logoImgMatch = html.match(/<img[^>]+(?:logo|header)[^>]+src=["']([^"']+)["']/i)
        || html.match(/<img[^>]+src=["']([^"']+(?:logo|header)[^"']+)["']/i);
      if (logoImgMatch) {
        logoUrl = logoImgMatch[1];
        if (logoUrl.startsWith('/')) logoUrl = SITE_URL + logoUrl;
        console.log(`   ✅ ロゴimg: ${logoUrl}`);
      }
    }

    // スケジュールリンク取得
    const scheduleMatch = html.match(/href=["']([^"']*(?:schedule|cast|therapist|予約|スケジュール)[^"']*)["']/i);
    if (scheduleMatch) {
      scheduleUrl = scheduleMatch[1];
      if (scheduleUrl.startsWith('/')) scheduleUrl = SITE_URL + scheduleUrl;
      console.log(`   ✅ スケジュールURL: ${scheduleUrl}`);
    }

    // 料金情報取得（数字+分+円のパターン）
    const priceMatches = [...html.matchAll(/(\d+)分[^0-9]*?(\d{1,3}(?:,\d{3})*)円/g)];
    if (priceMatches.length > 0) {
      const prices = priceMatches.map(m => `${m[1]}分: ${m[2]}円`);
      const unique = [...new Set(prices)];
      priceSystem = unique.join('\n');
      console.log(`   ✅ 料金情報 ${unique.length}件取得`);
      unique.forEach(p => console.log(`      ${p}`));
    }

  } catch (err) {
    console.log(`   ⚠️  トップページ取得エラー: ${err.message}`);
  }

  // ============================================================
  // Step 2: ロゴ画像をSupabase Storageにアップロード
  // ============================================================
  let finalImageUrl = null;

  if (logoUrl) {
    console.log(`\n📤 Step 2: ロゴをStorageにアップロード中...`);
    try {
      const imgRes = await fetch(logoUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      if (!imgRes.ok) throw new Error(`ダウンロード失敗: ${imgRes.status}`);

      const imgBuffer = await imgRes.arrayBuffer();
      const imgBytes = new Uint8Array(imgBuffer);
      const contentType = imgRes.headers.get('content-type') || 'image/png';

      const uploadRes = await fetch(
        `${supabaseUrl}/storage/v1/object/${STORAGE_BUCKET}/${LOGO_FILE_NAME}`,
        {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': contentType,
            'x-upsert': 'true'
          },
          body: imgBytes
        }
      );

      if (!uploadRes.ok) {
        const errText = await uploadRes.text();
        throw new Error(`アップロード失敗: ${uploadRes.status} - ${errText}`);
      }

      finalImageUrl = `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${LOGO_FILE_NAME}`;
      console.log(`   ✅ アップロード完了: ${finalImageUrl}`);
    } catch (err) {
      console.log(`   ⚠️  ロゴアップロードエラー: ${err.message}`);
    }
  } else {
    console.log(`\n⚠️  Step 2: ロゴURLが取得できなかったためスキップ`);
  }

  // ============================================================
  // Step 3: セラピスト一覧ページをスクレイピング
  // ============================================================
  console.log(`\n👩 Step 3: セラピスト一覧を取得中...`);
  console.log(`   URL: ${CAST_PAGE_URL}`);

  let therapists = [];

  try {
    const castRes = await fetch(CAST_PAGE_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
    });
    const castHtml = await castRes.text();

    // 画像URLと名前を抽出（一般的なパターン）
    // パターン1: <img src="..."> + 近くにテキスト
    const imgMatches = [...castHtml.matchAll(/<img[^>]+src=["']([^"']*(?:cast|therapist|member|profile|photo)[^"']*)["'][^>]*>/gi)];

    // パターン2: data-src（遅延読み込み）
    const dataSrcMatches = [...castHtml.matchAll(/<img[^>]+data-src=["']([^"']*(?:cast|therapist|member|profile|photo|krc)[^"']*)["'][^>]*>/gi)];

    // パターン3: 全img要素
    const allImgMatches = [...castHtml.matchAll(/<img[^>]+(?:src|data-src)=["']([^"']+)["'][^>]*alt=["']([^"']*)["'][^>]*>/gi)];
    const allImgMatchesRev = [...castHtml.matchAll(/<img[^>]+alt=["']([^"']*)["'][^>]+(?:src|data-src)=["']([^"']+)["'][^>]*>/gi)];

    console.log(`   imgMatches: ${imgMatches.length}件`);
    console.log(`   dataSrcMatches: ${dataSrcMatches.length}件`);
    console.log(`   allImgMatches: ${allImgMatches.length}件`);

    // alt付き画像を優先
    const candidates = [];
    for (const m of allImgMatches) {
      const imgUrl = m[1].startsWith('/') ? SITE_URL + m[1] : m[1];
      const name = m[2];
      if (name && name.trim() && !imgUrl.includes('logo') && !imgUrl.includes('banner')) {
        candidates.push({ name: name.trim(), image_url: imgUrl });
      }
    }
    for (const m of allImgMatchesRev) {
      const name = m[1];
      const imgUrl = m[2].startsWith('/') ? SITE_URL + m[2] : m[2];
      if (name && name.trim() && !imgUrl.includes('logo') && !imgUrl.includes('banner')) {
        // 重複チェック
        if (!candidates.find(c => c.name === name.trim())) {
          candidates.push({ name: name.trim(), image_url: imgUrl });
        }
      }
    }

    // cast/therapist関連画像のみ残す
    const castImgs = [...imgMatches, ...dataSrcMatches].map(m => {
      const url = m[1].startsWith('/') ? SITE_URL + m[1] : m[1];
      return url;
    });

    if (candidates.length > 0) {
      therapists = candidates;
      console.log(`   ✅ ${therapists.length}名のセラピストデータを取得`);
      therapists.slice(0, 5).forEach(t => console.log(`      ${t.name}: ${t.image_url.slice(0, 60)}...`));
    } else if (castImgs.length > 0) {
      console.log(`   ⚠️  名前なし: cast画像 ${castImgs.length}件を取得（名前は別途確認が必要）`);
      therapists = castImgs.map((url, i) => ({ name: `セラピスト${i+1}`, image_url: url }));
    } else {
      console.log(`   ⚠️  セラピストデータが取得できませんでした`);
      // HTMLの先頭500文字を出力してデバッグ
      console.log(`   デバッグ (HTML先頭):\n${castHtml.slice(0, 500)}`);
    }

  } catch (err) {
    console.log(`   ⚠️  セラピストページ取得エラー: ${err.message}`);
  }

  // ============================================================
  // Step 4: Supabaseのshopsテーブルを更新
  // ============================================================
  console.log(`\n🗄️  Step 4: shopsテーブルを更新中...`);

  const updateData = {};
  if (finalImageUrl) updateData.image_url = finalImageUrl;
  if (scheduleUrl) updateData.schedule_url = scheduleUrl;
  if (priceSystem) updateData.price_system = priceSystem;

  if (Object.keys(updateData).length > 0) {
    try {
      const patchRes = await fetch(
        `${supabaseUrl}/rest/v1/shops?id=eq.${SHOP_ID}`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify(updateData)
        }
      );
      if (!patchRes.ok) {
        const errText = await patchRes.text();
        throw new Error(`${patchRes.status} - ${errText}`);
      }
      console.log(`   ✅ shops更新完了`);
      Object.entries(updateData).forEach(([k, v]) =>
        console.log(`      ${k}: ${String(v).slice(0, 60)}`)
      );
    } catch (err) {
      console.log(`   ❌ shops更新エラー: ${err.message}`);
    }
  } else {
    console.log(`   ⚠️  更新データなし（トップページ取得失敗の可能性）`);
  }

  // ============================================================
  // Step 5: セラピストの画像URLをtherapistsテーブルに更新
  // ============================================================
  if (therapists.length > 0) {
    console.log(`\n📸 Step 5: セラピスト画像を更新中... (${therapists.length}名)`);

    // 現在のDBのセラピスト一覧を取得
    const dbRes = await fetch(
      `${supabaseUrl}/rest/v1/therapists?shop_id=eq.${SHOP_ID}&select=id,name,image_url`,
      { headers }
    );
    const dbTherapists = await dbRes.json();
    console.log(`   DBに登録済み: ${dbTherapists.length}名`);

    let updateCount = 0;
    let skipCount = 0;

    for (const t of therapists) {
      // 名前で照合
      const match = dbTherapists.find(db => {
        const dbName = db.name?.replace(/[\s　]+/g, '');
        const tName = t.name?.replace(/[\s　]+/g, '');
        return dbName === tName || dbName?.includes(tName) || tName?.includes(dbName);
      });

      if (match) {
        if (match.image_url) {
          skipCount++;
          continue; // 既に画像があればスキップ
        }
        try {
          const res = await fetch(
            `${supabaseUrl}/rest/v1/therapists?id=eq.${match.id}`,
            {
              method: 'PATCH',
              headers,
              body: JSON.stringify({ image_url: t.image_url })
            }
          );
          if (res.ok) {
            updateCount++;
            console.log(`   ✅ ${match.name}: 画像設定完了`);
          }
        } catch (err) {
          console.log(`   ⚠️  ${t.name} 更新失敗: ${err.message}`);
        }
      }
    }
    console.log(`\n   ✅ セラピスト更新完了: ${updateCount}名更新 / ${skipCount}名スキップ`);
  }

  // ============================================================
  // Step 6: ローカルJSONを更新
  // ============================================================
  console.log(`\n📁 Step 6: ローカルJSONを更新中...`);
  try {
    const allShopsPath = './public/data/all_shops.json';
    const allShops = JSON.parse(fs.readFileSync(allShopsPath, 'utf-8'));
    let updated = false;
    for (const shop of allShops) {
      if (shop.id === SHOP_ID) {
        if (finalImageUrl) shop.image_url = finalImageUrl;
        if (scheduleUrl) shop.schedule_url = scheduleUrl;
        updated = true;
        break;
      }
    }
    if (updated) {
      fs.writeFileSync(allShopsPath, JSON.stringify(allShops, null, 2), 'utf-8');
      console.log(`   ✅ ${allShopsPath} 更新完了`);
    }
  } catch (err) {
    console.log(`   ⚠️  ローカルJSON更新エラー: ${err.message}`);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎉 完了！ページをリロードして確認してください。');
  console.log('   画像・スケリンク・料金が反映されているはずです。');
  console.log('   セラピスト写真が出ない場合はHTMLの構造を確認してください。');
}

run().catch(err => {
  console.error('❌ 致命的エラー:', err);
  process.exit(1);
});
