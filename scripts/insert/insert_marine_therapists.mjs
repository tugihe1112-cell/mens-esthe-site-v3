/**
 * Marine (マリン) 横浜・綱島 セラピスト・ロゴ・スケリンク・料金 登録
 * 実行: node scripts/insert/insert_marine_therapists.mjs
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

  const SHOP_ID = 'kanagawa_tsunashima_marine';
  const SITE_URL = 'https://tsunamarine.com';
  const STAFF_PAGE = 'https://tsunamarine.com/staff.php';
  const SCHEDULE_URL = 'https://tsunamarine.com/schedule.php';
  const WEBSITE_URL = 'https://tsunamarine.com';
  const LOGO_URL = 'https://tsunamarine.com/images/logo_header.png';
  const STORAGE_BUCKET = 'shop-logos';
  const LOGO_FILE_NAME = 'Marine.png';

  const price_system = `アロマコース
90分: 13,000円
120分: 17,000円
150分: 21,000円`;

  const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };

  console.log('🚀 Marine 綱島 セットアップ開始\n');

  console.log('📄 Step 1: スタッフページを取得中...');
  const res = await fetch(STAFF_PAGE, { headers: ua });
  const $ = cheerio.load(await res.text());
  console.log(`   ✅ HTML取得完了 (status: ${res.status})`);

  console.log('\n👩 Step 2: セラピストデータをパース中...');
  const casts = [];
  const seen = new Set();

  $('.cast_wrap').each((i, el) => {
    // data-src に images_staff を含む画像を探す
    const imgEl = $(el).find('img[data-src*="images_staff"]').first();
    if (!imgEl.length) return;

    const dataSrc = imgEl.attr('data-src') || '';
    if (!dataSrc || dataSrc.includes('no_image') || dataSrc.includes('noimage')) return;

    const imageUrl = dataSrc.startsWith('http') ? dataSrc : SITE_URL + dataSrc;
    if (seen.has(imageUrl)) return;
    seen.add(imageUrl);

    const name = (imgEl.attr('alt') || '').trim();
    if (!name || name === 'ノーイメージ' || name === 'NEW') return;

    // テキストから年齢・スペックを解析
    // 例: "りり (22) 体験入店 T.153 B.87(E) W.58 H.85"
    const text = $(el).text();
    const ageMatch = text.match(/\((\d{2})\)/);
    const age = ageMatch ? `${ageMatch[1]}歳` : '';
    const heightMatch = text.match(/T\.(\d+)/);
    const bustMatch = text.match(/B\.(\d+)/);
    const waistMatch = text.match(/W\.(\d+)/);
    const hipMatch = text.match(/H\.(\d+)/);

    const raw_data = {};
    if (age) raw_data.age = age;
    if (heightMatch) raw_data.height = heightMatch[1];
    if (bustMatch) raw_data.bust = bustMatch[1];
    if (waistMatch) raw_data.waist = waistMatch[1];
    if (hipMatch) raw_data.hip = hipMatch[1];

    casts.push({ name, image_url: imageUrl, raw_data });
  });

  console.log(`   ✅ ${casts.length}名のセラピストを取得`);
  casts.slice(0, 5).forEach(c =>
    console.log(`      ${c.name}（${c.raw_data.age || '-'}）T${c.raw_data.height || '-'} : ${c.image_url.slice(0, 70)}`)
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
          headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': contentType, 'x-upsert': 'true' },
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
  const shopUpdate = { schedule_url: SCHEDULE_URL, price_system, website_url: WEBSITE_URL };
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
