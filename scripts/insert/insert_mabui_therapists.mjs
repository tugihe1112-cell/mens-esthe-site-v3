/**
 * MABUI SPA (マブイスパ) セラピスト・ロゴ・スケリンク・料金 登録
 * 実行: node scripts/insert/insert_mabui_therapists.mjs
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

  const SHOP_ID = 'saitama_warabi_mabui_spa';
  const SITE_URL = 'https://mabuispa.com';
  const THERAPIST_PAGE = 'https://mabuispa.com/therapist';
  const SCHEDULE_URL = 'https://mabuispa.com/schedule';
  const WEBSITE_URL = 'https://mabuispa.com';
  const LOGO_URL = 'https://mabuispa.com/assets/customer/logo-31da8fb1ab6c47072443862377bfc42616476f3a7d6d741804642adfe4b159e4.png';
  const STORAGE_BUCKET = 'shop-logos';
  const LOGO_FILE_NAME = 'MabuiSpa.png';

  const price_system = `90分: 14,000円
120分: 17,000円
150分: 23,000円
180分: 28,000円
延長30分: 6,000円`;

  const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };

  console.log('🚀 MABUI SPA セットアップ開始\n');

  // Step 1: セラピストページ取得
  console.log('📄 Step 1: セラピストページを取得中...');
  const res = await fetch(THERAPIST_PAGE, { headers: ua });
  const $ = cheerio.load(await res.text());
  console.log(`   ✅ HTML取得完了 (status: ${res.status})`);

  console.log('\n👩 Step 2: セラピストデータをパース中...');
  const casts = [];
  const seen = new Set();

  $('.item.clearfix').each((i, el) => {
    const dataSrc = $(el).find('img.lazyload').attr('data-src') || '';
    if (!dataSrc || dataSrc.includes('lazy/')) return;

    if (seen.has(dataSrc)) return;
    seen.add(dataSrc);

    // .itemName から名前・年齢・スペックを解析
    const lines = $(el).find('.itemName').text()
      .split('\n')
      .map(l => l.trim())
      .filter(l => l);

    let name = '';
    let age = '';
    let height = '', bust = '', waist = '', hip = '';

    for (const line of lines) {
      if (/^[（(]\d+歳?[）)]/.test(line)) {
        const m = line.match(/[（(](\d+)歳?[）)]/);
        if (m) age = `${m[1]}歳`;
      } else if (/^T\./.test(line)) {
        const tM = line.match(/T\.(\d+)/);
        const bM = line.match(/B[：:](\d+)/);
        const wM = line.match(/W[：:](\d+)/);
        const hM = line.match(/H[：:](\d+)/);
        if (tM) height = tM[1];
        if (bM) bust = bM[1];
        if (wM) waist = wM[1];
        if (hM) hip = hM[1];
      } else if (!name) {
        name = line;
      }
    }

    if (!name) return;

    const raw_data = {};
    if (age) raw_data.age = age;
    if (height) raw_data.height = height;
    if (bust) raw_data.bust = bust;
    if (waist) raw_data.waist = waist;
    if (hip) raw_data.hip = hip;

    casts.push({ name, image_url: dataSrc, raw_data });
  });

  console.log(`   ✅ ${casts.length}名のセラピストを取得`);
  casts.slice(0, 5).forEach(c =>
    console.log(`      ${c.name}（${c.raw_data.age || '-'}）: ${c.image_url.slice(0, 70)}`)
  );

  if (casts.length === 0) {
    console.error('❌ セラピストが0名 → 処理中断');
    process.exit(1);
  }

  // Step 3: ロゴアップロード
  console.log('\n📤 Step 3: ロゴをStorageにアップロード中...');
  let finalLogoUrl = null;
  try {
    const imgRes = await fetch(LOGO_URL, { headers: ua });
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
        finalLogoUrl = `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${LOGO_FILE_NAME}`;
        console.log('   ✅ アップロード完了:', finalLogoUrl);
      } else {
        console.log(`   ⚠️  アップロード失敗: ${await uploadRes.text()}`);
      }
    } else {
      console.log(`   ⚠️  ロゴ取得失敗: ${imgRes.status}`);
    }
  } catch (e) {
    console.log(`   ⚠️  ${e.message}`);
  }

  // Step 4: 店舗情報を更新
  console.log(`\n🏪 Step 4: ${SHOP_ID} を更新中...`);
  const shopUpdate = {
    schedule_url: SCHEDULE_URL,
    price_system,
    website_url: WEBSITE_URL,
  };
  if (finalLogoUrl) shopUpdate.image_url = finalLogoUrl;

  const patchRes = await fetch(`${supabaseUrl}/rest/v1/shops?id=eq.${SHOP_ID}`, {
    method: 'PATCH', headers, body: JSON.stringify(shopUpdate)
  });
  console.log(patchRes.ok ? '   ✅ shops更新完了' : `   ❌ 失敗: ${await patchRes.text()}`);

  // Step 5: 既存セラピスト削除 → 新規挿入
  console.log('\n🗑️  Step 5: 既存セラピストを削除中...');
  const delRes = await fetch(`${supabaseUrl}/rest/v1/therapists?shop_id=eq.${SHOP_ID}`, {
    method: 'DELETE', headers
  });
  console.log(delRes.ok ? '   ✅ 削除完了' : `   ❌ ${await delRes.text()}`);

  console.log('\n💾 Step 6: セラピストを登録中...');
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

  console.log(`\n${'='.repeat(50)}`);
  console.log(`📊 完了: ${inserted}名登録 / エラー ${errors}名`);
  console.log('🎉 ページをリロードして確認してください！');
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
