/**
 * らんぷ セラピスト・ロゴ・スケリンク 一括登録
 * 実行: node insert_ranpu_therapists.mjs
 */
import fs from 'fs';
import * as cheerio from 'cheerio';

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
    'Content-Type': 'application/json',
  };

  // らんぷ 北千住（メインサイト: www.senju-lamp.com）
  const SHOP_ID = 'tokyo_adachi_kitasenju_ranpu_kitasenju';
  const SITE_URL = 'https://www.senju-lamp.com';
  const SCHEDULE_URL = 'https://www.senju-lamp.com/schedule.html';
  const THERAPIST_PAGE = 'https://www.senju-lamp.com/therapist.html';
  const STORAGE_BUCKET = 'shop-logos';
  const LOGO_FILE_NAME = 'Ranpu.png';

  console.log('🚀 らんぷ セットアップ開始\n');

  // ============================================================
  // Step 1: HTMLをフェッチしてパース
  // ============================================================
  console.log('📄 Step 1: セラピストページを取得中...');
  let html = '';
  try {
    const res = await fetch(THERAPIST_PAGE, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
    });
    html = await res.text();
    console.log(`   ✅ HTML取得完了 (${html.length} chars)`);
  } catch (e) {
    console.log(`   ❌ フェッチ失敗: ${e.message}`);
    process.exit(1);
  }

  const $ = cheerio.load(html);

  // ============================================================
  // Step 2: セラピスト一覧をパース（#mainのul > liのみ）
  // ============================================================
  console.log('\n👩 Step 2: セラピストデータをパース中...');

  const casts = [];
  $('#main .therapist .contents ul > li').each((i, el) => {
    const imgSrc = $(el).find('.list_photo img').attr('src') || '';
    const rawName = $(el).find('.list_name').text().trim();

    // デフォルト画像はスキップ
    if (!imgSrc || imgSrc.includes('/www/default.jpg') || imgSrc.includes('default.jpg')) return;

    // 名前クリーニング
    // 【新人】【新人割】【体入割】【復帰】【限定割】などを除去
    // (数字) の年齢を除去
    let name = rawName
      .replace(/【[^】]*】/g, '')  // 【〇〇】を全除去
      .replace(/\(\d+\)/g, '')      // (27) などを除去
      .trim();

    // 名前が空 or ダミーエントリはスキップ
    if (!name || name === 'セラピスト面接' || name.length < 2) return;

    // 年齢を取得
    const ageMatch = rawName.match(/\((\d+)\)/);
    const age = ageMatch ? ageMatch[1] : '';

    // 画像URLが相対パスの場合は補完
    const imageUrl = imgSrc.startsWith('http') ? imgSrc : SITE_URL + imgSrc;

    casts.push({ name, age, image_url: imageUrl });
  });

  console.log(`   ✅ ${casts.length}名のセラピストを取得`);
  casts.slice(0, 5).forEach(c =>
    console.log(`      ${c.name}${c.age ? `(${c.age})` : ''}: ${c.image_url.slice(0, 60)}`)
  );

  // ============================================================
  // Step 3: ロゴ画像をStorageにアップロード
  // ============================================================
  console.log('\n📤 Step 3: ロゴをStorageにアップロード中...');
  let finalImageUrl = null;

  try {
    // og:imageまたはロゴを取得
    const topRes = await fetch(SITE_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const topHtml = await topRes.text();
    const $top = cheerio.load(topHtml);

    let logoSrc = $top('meta[property="og:image"]').attr('content')
      || $top('header img, .logo img, #logo img').attr('src');

    if (logoSrc && !logoSrc.startsWith('http')) logoSrc = SITE_URL + logoSrc;

    if (logoSrc) {
      const imgRes = await fetch(logoSrc, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (imgRes.ok) {
        const imgBytes = new Uint8Array(await imgRes.arrayBuffer());
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
        if (uploadRes.ok) {
          finalImageUrl = `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${LOGO_FILE_NAME}`;
          console.log(`   ✅ アップロード完了: ${logoSrc}`);
        } else {
          console.log(`   ⚠️  アップロード失敗: ${await uploadRes.text()}`);
        }
      }
    } else {
      console.log('   ⚠️  ロゴURLが見つかりませんでした');
    }
  } catch (e) {
    console.log(`   ⚠️  ${e.message}`);
  }

  // ============================================================
  // Step 4: shopsテーブルを更新
  // ============================================================
  console.log('\n🗄️  Step 4: shopsテーブルを更新中...');
  const shopUpdate = { schedule_url: SCHEDULE_URL };
  if (finalImageUrl) shopUpdate.image_url = finalImageUrl;

  const patchRes = await fetch(`${supabaseUrl}/rest/v1/shops?id=eq.${SHOP_ID}`, {
    method: 'PATCH', headers, body: JSON.stringify(shopUpdate)
  });
  console.log(patchRes.ok ? `   ✅ shops更新完了` : `   ❌ 失敗: ${await patchRes.text()}`);

  // ============================================================
  // Step 5: 既存セラピストを全削除 → 再Insert
  // ============================================================
  console.log('\n🗑️  Step 5: 既存セラピストを削除中...');
  const delRes = await fetch(`${supabaseUrl}/rest/v1/therapists?shop_id=eq.${SHOP_ID}`, {
    method: 'DELETE', headers
  });
  console.log(delRes.ok ? `   ✅ 削除完了` : `   ❌ 失敗: ${await delRes.text()}`);

  console.log(`\n📥 Step 6: ${casts.length}名をInsert中...`);
  const BATCH = 20;
  let inserted = 0, errors = 0;

  for (let i = 0; i < casts.length; i += BATCH) {
    const batch = casts.slice(i, i + BATCH);
    const records = batch.map(c => ({
      id: `${SHOP_ID}_${c.name.replace(/[\s　]+/g, '')}`,
      shop_id: SHOP_ID,
      name: c.name,
      image_url: c.image_url,
      is_active: true,
      raw_data: c.age ? { age: c.age } : {}
    }));

    const res = await fetch(`${supabaseUrl}/rest/v1/therapists`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'resolution=ignore-duplicates,return=minimal' },
      body: JSON.stringify(records)
    });

    if (res.ok) {
      inserted += batch.length;
      console.log(`   ✅ ${i + 1}〜${Math.min(i + BATCH, casts.length)}名目: 完了`);
    } else {
      console.log(`   ❌ バッチ失敗: ${(await res.text()).slice(0, 100)}`);
      errors += batch.length;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 完了: 登録 ${inserted}名 / エラー ${errors}名`);
  console.log('🎉 ページをリロードして確認してください！');
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
