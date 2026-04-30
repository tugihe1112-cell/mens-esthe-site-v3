/**
 * ぐらどるスパ セラピスト・ロゴ・スケリンク・料金 一括登録
 * 実行: node insert_gladol_therapists.mjs
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

  const SHOP_ID = 'tokyo_tachikawa_tachikawa_gladol-spa';
  const SITE_URL = 'https://www.gladol-spa.tokyo';
  const THERAPIST_PAGE = 'https://www.gladol-spa.tokyo/staff/';
  const SCHEDULE_URL = 'https://www.gladol-spa.tokyo/schedule/';
  const WEBSITE_URL = 'https://www.gladol-spa.tokyo';
  const LOGO_URL = 'https://www.gladol-spa.tokyo/asset/img/logo.png';
  const STORAGE_BUCKET = 'shop-logos';
  const LOGO_FILE_NAME = 'GladolSpa.png';

  const price_system = `60分: 11,000円
90分: 13,000円
120分: 17,000円
150分: 22,000円`;

  console.log('🚀 ぐらどるスパ セットアップ開始\n');

  const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };

  // Step 1: スタッフページ取得
  console.log('📄 Step 1: スタッフページを取得中...');
  const res = await fetch(THERAPIST_PAGE, { headers: ua });
  const html = await res.text();
  console.log(`   ✅ HTML取得完了 (${html.length} chars)`);

  const $ = cheerio.load(html);

  // Step 2: パース
  console.log('\n👩 Step 2: セラピストデータをパース中...');
  const casts = [];
  const seen = new Set();

  $('.list-staff .item').each((i, el) => {
    const imgEl = $(el).find('img.img-fluid').first();
    const style = imgEl.attr('style') || '';

    // background-image: url(/images/ml_11_1_9617.jpg?3017) → 絶対URL
    const urlMatch = style.match(/background-image:\s*url\(['"]?([^'")\s]+)['"]?\)/);
    if (!urlMatch) return;
    const imageUrl = urlMatch[1].startsWith('http') ? urlMatch[1] : SITE_URL + urlMatch[1].split('?')[0];

    if (seen.has(imageUrl)) return;
    seen.add(imageUrl);

    // 名前
    const name = $(el).find('.cinfo a').first().text().trim();
    if (!name || name.length < 2) return;

    // プロフィール情報（年齢・身長・バスト）
    const profileText = $(el).find('.p_profile').text().replace(/\s+/g, ' ').trim();
    const ageMatch = profileText.match(/(\d+)歳/);
    const heightMatch = profileText.match(/T[.\s]*(\d+)/);
    const bustMatch = profileText.match(/B[.\s]*(\d+)(?:\(([A-Z]+)\))?/);

    const raw_data = {};
    if (ageMatch) raw_data.age = ageMatch[1] + '歳';
    if (heightMatch) raw_data.height = 'T' + heightMatch[1];
    if (bustMatch) raw_data.bust = 'B' + bustMatch[1] + (bustMatch[2] ? '(' + bustMatch[2] + ')' : '');

    casts.push({ name, image_url: imageUrl, raw_data });
  });

  console.log(`   ✅ ${casts.length}名のセラピストを取得`);
  casts.slice(0, 5).forEach(c =>
    console.log(`      ${c.name}(${c.raw_data.age || ''}/${c.raw_data.height || ''}/${c.raw_data.bust || ''}): ${c.image_url.slice(0, 60)}`)
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
      raw_data: c.raw_data
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
