/**
 * Aroma Woo セラピスト・ロゴ・スケリンク・料金 一括登録
 * 実行: node insert_woo_therapists.mjs
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

  const SHOP_ID = 'tokyo_setagaya_meidaimae_aroma_woo';
  const SITE_URL = 'https://aroma-woo.com';
  const THERAPIST_PAGE = 'https://aroma-woo.com/cast/';
  const SCHEDULE_URL = 'https://aroma-woo.com';
  const WEBSITE_URL = 'https://aroma-woo.com';
  const LOGO_URL = 'https://aroma-woo.com/wp-content/uploads/2023/10/wooo-logo10.png';
  const STORAGE_BUCKET = 'shop-logos';
  const LOGO_FILE_NAME = 'AromaWoo.png';

  const price_system = `70分: 15,000円
90分: 18,000円
120分: 23,000円
150分: 29,000円`;

  console.log('🚀 Aroma Woo セットアップ開始\n');

  const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };

  // Step 1: セラピストページ取得
  console.log('📄 Step 1: セラピストページを取得中...');
  const res = await fetch(THERAPIST_PAGE, { headers: ua });
  const html = await res.text();
  console.log(`   ✅ HTML取得完了 (${html.length} chars)`);

  const $ = cheerio.load(html);

  // Step 2: パース（WordPress遅延読み込み → data-src）
  console.log('\n👩 Step 2: セラピストデータをパース中...');
  const casts = [];
  const seen = new Set();

  $('.therapist-box').each((i, el) => {
    // data-src から実際の画像URL取得（wp-content/uploads のみ）
    const imgEl = $(el).find('.photo img').first();
    const src = imgEl.attr('data-src') || imgEl.attr('src') || '';

    if (!src || seen.has(src)) return;
    if (!src.includes('wp-content/uploads')) return;
    seen.add(src);

    // 名前
    const name = $(el).find('.name a').first().text().trim();
    if (!name || name.length < 2) return;

    casts.push({ name, image_url: src });
  });

  console.log(`   ✅ ${casts.length}名のセラピストを取得`);
  casts.slice(0, 5).forEach(c =>
    console.log(`      ${c.name}: ${c.image_url.slice(0, 70)}`)
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

  // Step 4: shops更新
  console.log('\n🗄️  Step 4: shopsテーブルを更新中...');
  const shopUpdate = { schedule_url: SCHEDULE_URL, price_system, website_url: WEBSITE_URL };
  if (finalImageUrl) shopUpdate.image_url = finalImageUrl;

  const patchRes = await fetch(`${supabaseUrl}/rest/v1/shops?id=eq.${SHOP_ID}`, {
    method: 'PATCH', headers, body: JSON.stringify(shopUpdate)
  });
  console.log(patchRes.ok ? '   ✅ shops更新完了' : `   ❌ 失敗: ${await patchRes.text()}`);

  // Step 5: 削除 → Insert
  console.log('\n🗑️  Step 5: 既存セラピストを削除中...');
  const delRes = await fetch(`${supabaseUrl}/rest/v1/therapists?shop_id=eq.${SHOP_ID}`, {
    method: 'DELETE', headers
  });
  console.log(delRes.ok ? '   ✅ 削除完了' : `   ❌ ${await delRes.text()}`);

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

    const r = await fetch(`${supabaseUrl}/rest/v1/therapists`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'resolution=ignore-duplicates,return=minimal' },
      body: JSON.stringify(records)
    });

    if (r.ok) {
      inserted += batch.length;
      console.log(`   ✅ ${i + 1}〜${Math.min(i + BATCH, casts.length)}名目: 完了`);
    } else {
      console.log(`   ❌ バッチ失敗: ${(await r.text()).slice(0, 100)}`);
      errors += batch.length;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 完了: 登録 ${inserted}名 / エラー ${errors}名`);
  console.log('🎉 ページをリロードして確認してください！');
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
