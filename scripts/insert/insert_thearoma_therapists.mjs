/**
 * ザ アロマ (The Aroma) セラピスト・ロゴ・スケリンク・料金 一括登録
 * 実行: node insert_thearoma_therapists.mjs
 */
import fs from 'fs';

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

  const SHOP_ID = 'tokyo_dispatch_the_aroma';
  const DATA_JS = 'https://3days-cms-bucket-prod.s3.ap-northeast-1.amazonaws.com/cms-content/1006/js/data.js';
  const SCHEDULE_URL = 'https://the-aroma.site/schedule';
  const WEBSITE_URL = 'https://the-aroma.site';
  const LOGO_URL = 'https://the-aroma.site/assets/img/logoWhite%20(1).png';
  const STORAGE_BUCKET = 'shop-logos';
  const LOGO_FILE_NAME = 'TheAroma.png';

  const price_system = `90分: 22,000円（税込）
120分: 28,000円（税込）
150分: 34,000円（税込）
180分: 44,000円（税込）
240分: 56,000円（税込）
300分: 68,000円（税込）`;

  const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };

  console.log('🚀 ザ アロマ セットアップ開始\n');

  // Step 1: data.js取得・パース
  console.log('📄 Step 1: data.jsを取得中...');
  const res = await fetch(DATA_JS, { headers: ua });
  const jsText = await res.text();
  console.log(`   ✅ 取得完了 (${jsText.length} chars)`);

  // var shopData = {...} をFunction経由で評価
  const fn = new Function(`${jsText}; return shopData;`);
  const shopData = fn();
  const therapists = shopData.therapists || [];
  console.log(`   セラピスト総数: ${therapists.length}名`);

  // Step 2: パース
  console.log('\n👩 Step 2: セラピストデータをパース中...');
  const casts = [];
  const seen = new Set();

  for (const t of therapists) {
    const imageUrl = t.img1 || '';
    if (!imageUrl) continue;
    if (seen.has(imageUrl)) continue;
    seen.add(imageUrl);

    const name = (t.therapistName || '').trim();
    if (!name) continue;

    const raw_data = {};
    if (t.age)    raw_data.age    = t.age + '歳';

    // threeSize: "T157 B84(C) W56 H82"
    const ts = t.threeSize || '';
    const hMatch = ts.match(/T(\d{2,3})/i);
    const bMatch = ts.match(/B(\d{2,3})(?:\(([A-Z]+)\))?/i);
    const wMatch = ts.match(/W(\d{2,3})/i);
    const hipMatch = ts.match(/H(\d{2,3})/i);

    if (hMatch)   raw_data.height = 'T' + hMatch[1];
    if (bMatch)   raw_data.bust   = 'B' + bMatch[1] + (bMatch[2] ? '(' + bMatch[2] + ')' : '');
    if (wMatch)   raw_data.waist  = 'W' + wMatch[1];
    if (hipMatch) raw_data.hip    = 'H' + hipMatch[1];

    casts.push({ name, image_url: imageUrl, raw_data });
  }

  console.log(`   ✅ ${casts.length}名のセラピストを取得`);
  casts.slice(0, 5).forEach(c =>
    console.log(`      ${c.name} / ${JSON.stringify(c.raw_data)} : ${c.image_url.slice(0, 70)}`)
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
        console.log(`   ⚠️  アップロード失敗: ${await uploadRes.text()}`);
      }
    } else {
      console.log(`   ⚠️  ロゴ取得失敗: ${imgRes.status}`);
    }
  } catch (e) {
    console.log(`   ⚠️  ${e.message}`);
  }

  // Step 4: shops更新
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
      raw_data: c.raw_data || {}
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
  console.log('\n' + '='.repeat(50));
  console.log('🎉 ページをリロードして確認してください！');
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
