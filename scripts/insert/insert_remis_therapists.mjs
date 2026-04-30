/**
 * ランス (REMIS) セラピスト・ロゴ・スケリンク・料金 一括登録
 * 実行: node insert_remis_therapists.mjs
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

  const SHOP_ID = 'tokyo_adachi_kitasenju_remis';
  const SITE_URL = 'https://remis-esthe.com';
  const THERAPIST_PAGE = 'https://remis-esthe.com/therapist';
  const SCHEDULE_URL = 'https://remis-esthe.com/schedule';
  const STORAGE_BUCKET = 'shop-logos';
  const LOGO_FILE_NAME = 'Remis.png';

  const price_system = `60分: 16,000円
80分: 20,000円
100分: 24,000円`;

  console.log('🚀 ランス (REMIS) セットアップ開始\n');

  // ============================================================
  // Step 1: セラピストページを取得してパース
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
  // Step 2: セラピスト一覧をパース
  // ============================================================
  console.log('\n👩 Step 2: セラピストデータをパース中...');

  const casts = [];
  $('.therapist-datas-each').each((i, el) => {
    const imgEl = $(el).find('img.therapist-data-each-tmb');
    const rawName = $(el).find('.therapist-datas-name').text().trim()
      || imgEl.attr('alt') || '';

    const imgSrc = imgEl.attr('src') || '';

    if (!imgSrc || !rawName) return;

    // 絵文字・記号プレフィックスを除去（🍀 など）
    const name = rawName.replace(/^[\p{Emoji}\s]+/u, '').trim();

    if (!name || name.length < 2) return;

    casts.push({ name, image_url: imgSrc });
  });

  console.log(`   ✅ ${casts.length}名のセラピストを取得`);
  casts.slice(0, 5).forEach(c =>
    console.log(`      ${c.name}: ${c.image_url.slice(0, 60)}`)
  );

  // ============================================================
  // Step 3: ロゴ画像をStorageにアップロード
  // ============================================================
  console.log('\n📤 Step 3: ロゴをStorageにアップロード中...');
  let finalImageUrl = null;

  try {
    const topRes = await fetch(SITE_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const topHtml = await topRes.text();
    const $top = cheerio.load(topHtml);

    let logoSrc = $top('meta[property="og:image"]').attr('content')
      || $top('header img, .logo img, #logo img, .site-logo img').attr('src');

    if (logoSrc && !logoSrc.startsWith('http')) logoSrc = SITE_URL + logoSrc;

    if (logoSrc) {
      console.log(`   ロゴURL: ${logoSrc}`);
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
          console.log(`   ✅ アップロード完了`);
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
  // Step 4: shopsテーブルを更新（スケリンク・ロゴ・料金）
  // ============================================================
  console.log('\n🗄️  Step 4: shopsテーブルを更新中...');
  const shopUpdate = { schedule_url: SCHEDULE_URL, price_system };
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

  // ============================================================
  // Step 6: セラピストをInsert
  // ============================================================
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
      raw_data: {}
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
  console.log(`📊 完了:`);
  console.log(`   セラピスト登録: ${inserted}名 / エラー: ${errors}名`);
  console.log(`   スケジュールURL: ${SCHEDULE_URL}`);
  console.log(`   料金: ${price_system.replace(/\n/g, ' / ')}`);
  console.log('🎉 ページをリロードして確認してください！');
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
