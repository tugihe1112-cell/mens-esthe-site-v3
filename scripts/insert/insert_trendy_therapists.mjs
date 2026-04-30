/**
 * TRENDY SPA セラピスト・ロゴ・スケリンク・料金 一括登録
 * 調布・多摩センター・聖蹟桜ヶ丘 全店舗同一内容
 * 実行: node insert_trendy_therapists.mjs
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

  const SHOPS = [
    'tokyo_chofu_trendy_spa',
    'tokyo_tama_tamacenter_trendy_spa',
    'tokyo_tama_seisekisakuragaoka_trendy_spa',
  ];
  const SITE_URL = 'https://www.trendy-spa.com';
  const THERAPIST_PAGE = 'https://www.trendy-spa.com';
  const SCHEDULE_URL = 'https://www.trendy-spa.com';
  const WEBSITE_URL = 'https://www.trendy-spa.com';
  const LOGO_URL = 'https://www.trendy-spa.com/images/logo.png';
  const STORAGE_BUCKET = 'shop-logos';
  const LOGO_FILE_NAME = 'TrendySpa.png';

  const price_system = `75分(お試しコース): 14,000円
90分: 16,000円
120分: 20,000円
150分: 24,000円`;

  console.log('🚀 TRENDY SPA セットアップ開始\n');

  const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };

  // Step 1: トップページ取得（セラピスト情報も同ページ）
  console.log('📄 Step 1: ページを取得中...');
  const res = await fetch(THERAPIST_PAGE, { headers: ua });
  const html = await res.text();
  console.log(`   ✅ HTML取得完了 (${html.length} chars)`);

  const $ = cheerio.load(html);

  // Step 2: パース（cast/img, figcaption > span）
  console.log('\n👩 Step 2: セラピストデータをパース中...');
  const casts = [];
  const seen = new Set();

  $('img[src*="cast/img"]').each((i, el) => {
    const src = $(el).attr('src') || '';
    if (!src) return;

    const imageUrl = src.startsWith('http') ? src : SITE_URL + '/' + src.replace(/^\.\//, '');
    if (seen.has(imageUrl)) return;
    seen.add(imageUrl);

    // 親のfigcaptionから名前・年齢を取得
    const figcaption = $(el).closest('a').find('figcaption').first();

    // 年齢を取得してから除去した名前を取得
    const ageText = figcaption.find('.age').text().trim(); // " (25)"
    const ageMatch = ageText.match(/\d+/);
    const age = ageMatch ? ageMatch[0] + '歳' : null;

    // nameのspan（.ageを除く）
    const nameSpan = figcaption.find('span').first().clone();
    nameSpan.find('.age').remove();
    const name = nameSpan.text().trim();

    if (!name || name.length < 2) return;

    const raw_data = {};
    if (age) raw_data.age = age;

    casts.push({ name, image_url: imageUrl, raw_data });
  });

  console.log(`   ✅ ${casts.length}名のセラピストを取得`);
  casts.slice(0, 5).forEach(c =>
    console.log(`      ${c.name}${c.raw_data.age ? '(' + c.raw_data.age + ')' : ''}: ${c.image_url.slice(0, 60)}`)
  );

  // Step 3: ロゴアップロード
  console.log('\n📤 Step 3: ロゴをStorageにアップロード中...');
  let finalImageUrl = null;
  try {
    const imgRes = await fetch(LOGO_URL, { headers: ua });
    if (imgRes.ok) {
      const imgBytes = new Uint8Array(await imgRes.arrayBuffer());
      const contentType = imgRes.headers.get('content-type') || 'image/png';
      const uploadRes = await fetch(
        `${supabaseUrl}/storage/v1/object/${STORAGE_BUCKET}/${LOGO_FILE_NAME}`,
        {
          method: 'POST',
          headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': contentType, 'x-upsert': 'true' },
          body: imgBytes
        }
      );
      if (uploadRes.ok) {
        finalImageUrl = `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${LOGO_FILE_NAME}`;
        console.log('   ✅ アップロード完了');
      } else {
        console.log(`   ⚠️  アップロード失敗: ${await uploadRes.text()}`);
      }
    }
  } catch (e) {
    console.log(`   ⚠️  ${e.message}`);
  }

  // Step 4〜6: 各店舗を更新
  for (const SHOP_ID of SHOPS) {
    console.log(`\n${'='.repeat(40)}`);
    console.log(`🏪 ${SHOP_ID}`);

    const shopUpdate = { schedule_url: SCHEDULE_URL, price_system, website_url: WEBSITE_URL };
    if (finalImageUrl) shopUpdate.image_url = finalImageUrl;

    const patchRes = await fetch(`${supabaseUrl}/rest/v1/shops?id=eq.${SHOP_ID}`, {
      method: 'PATCH', headers, body: JSON.stringify(shopUpdate)
    });
    console.log(patchRes.ok ? '   ✅ shops更新完了' : `   ❌ 失敗: ${await patchRes.text()}`);

    const delRes = await fetch(`${supabaseUrl}/rest/v1/therapists?shop_id=eq.${SHOP_ID}`, {
      method: 'DELETE', headers
    });
    console.log(delRes.ok ? '   ✅ 既存セラピスト削除完了' : `   ❌ ${await delRes.text()}`);

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
        raw_data: c.raw_data
      }));

      const r = await fetch(`${supabaseUrl}/rest/v1/therapists`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'resolution=ignore-duplicates,return=minimal' },
        body: JSON.stringify(records)
      });

      if (r.ok) {
        inserted += batch.length;
      } else {
        console.log(`   ❌ バッチ失敗: ${(await r.text()).slice(0, 100)}`);
        errors += batch.length;
      }
    }
    console.log(`   ✅ ${inserted}名登録完了 / エラー ${errors}名`);
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 完了: ${casts.length}名 × ${SHOPS.length}店舗`);
  console.log('🎉 ページをリロードして確認してください！');
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
