/**
 * PLATINUM TOKYO (プラチナム東京) セラピスト・ロゴ・スケリンク・料金・group_id 一括登録
 * 全9店舗更新 + saitama_kawagoe_platina 削除
 * 実行: node scripts/insert/insert_platinum_therapists.mjs
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
    'tokyo_shinjuku_nishishinjuku_platinum_tokyo',
    'tokyo_shinjuku_higashishinjuku_platinum_tokyo',
    'tokyo_shinjuku_shinjuku_gyoen_platinum_tokyo',
    'tokyo_shinjuku_okubo_platinum_tokyo',
    'tokyo_toshima_ikebukuro_platinum_tokyo',
    'tokyo_shibuya_yoyogi_harajuku_platinum_tokyo',
    'tokyo_chofu_platinum_tokyo',
    'saitama_omiya_platinum_tokyo',
  ];
  const DELETE_SHOP = 'saitama_kawagoe_platina'; // 川越→大宮に統合のため削除

  const SITE_URL = 'https://esthe-platinum.tokyo';
  const STAFF_PAGE = 'https://esthe-platinum.tokyo/staff/';
  const SCHEDULE_URL = 'https://esthe-platinum.tokyo/staff/';
  const WEBSITE_URL = 'https://esthe-platinum.tokyo';
  const LOGO_URL = 'https://esthe-platinum.tokyo/images/logo_header.png';
  const STORAGE_BUCKET = 'shop-logos';
  const LOGO_FILE_NAME = 'PlatinumTokyo.png';
  const GROUP_ID = 'platinum_tokyo';

  const price_system = `75分: 15,000円（通常 17,000円）
90分: 18,000円（通常 20,000円）
120分: 23,000円（通常 25,000円）
150分: 28,000円（通常 30,000円）`;

  const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };

  console.log('🚀 PLATINUM TOKYO セットアップ開始\n');

  // Step 0: saitama_kawagoe_platina を削除
  console.log(`🗑️  Step 0: ${DELETE_SHOP} を削除中...`);
  const delThRes = await fetch(`${supabaseUrl}/rest/v1/therapists?shop_id=eq.${DELETE_SHOP}`, {
    method: 'DELETE', headers
  });
  console.log(delThRes.ok ? '   ✅ セラピスト削除完了' : `   ⚠️  ${await delThRes.text()}`);
  const delShRes = await fetch(`${supabaseUrl}/rest/v1/shops?id=eq.${DELETE_SHOP}`, {
    method: 'DELETE', headers
  });
  console.log(delShRes.ok ? '   ✅ 店舗削除完了' : `   ⚠️  ${await delShRes.text()}`);

  // Step 1: スタッフページ取得・パース
  console.log('\n📄 Step 1: スタッフページを取得中...');
  const res = await fetch(STAFF_PAGE, { headers: ua });
  const $ = cheerio.load(await res.text());
  console.log(`   ✅ HTML取得完了`);

  console.log('\n👩 Step 2: セラピストデータをパース中...');
  const casts = [];
  const seen = new Set();

  $('.cast_box.list li').each((i, el) => {
    // images_staffのimg
    const imgEl = $(el).find('img[src*="images_staff"]').first();
    const src = imgEl.attr('src') || '';
    if (!src) return;

    const imageUrl = src.startsWith('http') ? src : SITE_URL + src;
    if (seen.has(imageUrl)) return;
    seen.add(imageUrl);

    const name = (imgEl.attr('alt') || '').trim();
    if (!name) return;

    casts.push({ name, image_url: imageUrl, raw_data: {} });
  });

  console.log(`   ✅ ${casts.length}名のセラピストを取得`);
  casts.slice(0, 5).forEach(c =>
    console.log(`      ${c.name} : ${c.image_url.slice(0, 70)}`)
  );

  if (casts.length === 0) {
    console.error('❌ セラピストが0名 → 処理中断');
    process.exit(1);
  }

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
        console.log(`   ⚠️  ${await uploadRes.text()}`);
      }
    }
  } catch (e) {
    console.log(`   ⚠️  ${e.message}`);
  }

  // Step 4: 各店舗を更新
  for (const SHOP_ID of SHOPS) {
    console.log(`\n${'='.repeat(40)}`);
    console.log(`🏪 ${SHOP_ID}`);

    const shopUpdate = {
      schedule_url: SCHEDULE_URL,
      price_system,
      website_url: WEBSITE_URL,
      group_id: GROUP_ID,
    };
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
        raw_data: c.raw_data || {}
      }));

      const r = await fetch(`${supabaseUrl}/rest/v1/therapists`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'resolution=ignore-duplicates,return=minimal' },
        body: JSON.stringify(records)
      });

      if (r.ok) inserted += batch.length;
      else { console.log(`   ❌ バッチ失敗: ${(await r.text()).slice(0, 100)}`); errors += batch.length; }
    }
    console.log(`   ✅ ${inserted}名登録完了 / エラー ${errors}名`);
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 完了: ${casts.length}名 × ${SHOPS.length}店舗 / group_id: ${GROUP_ID}`);
  console.log('🎉 ページをリロードして確認してください！');
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
