/**
 * 熟女東京 セラピスト・ロゴ・スケリンク・料金 一括登録
 * 実行: node insert_jukujo_therapists.mjs
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

  const SHOP_ID = 'tokyo_dispatch_jukujo_tokyo';
  const SITE_URL = 'https://tokyo-jukujo.jp';
  const THERAPIST_PAGE = 'https://tokyo-jukujo.jp/therapist.html';
  const SCHEDULE_URL = 'https://tokyo-jukujo.jp/schedule.html';
  const WEBSITE_URL = 'https://tokyo-jukujo.jp';
  const LOGO_URL = 'https://tokyo-jukujo.jp/wp-content/themes/tokyo-jukujo/images/logo.png';
  const STORAGE_BUCKET = 'shop-logos';
  const LOGO_FILE_NAME = 'JukujoTokyo.png';

  // ★ 料金システム（要確認）
  const price_system = `60分: 12,000円
90分: 17,000円
120分: 21,000円`;

  const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };

  console.log('🚀 熟女東京 セットアップ開始\n');

  // Step 1: セラピストページ取得
  console.log('📄 Step 1: セラピストページを取得中...');
  const res = await fetch(THERAPIST_PAGE, { headers: ua });
  const $ = cheerio.load(await res.text());
  console.log(`   ✅ 取得完了`);

  // Step 2: パース
  console.log('\n👩 Step 2: セラピストデータをパース中...');
  const casts = [];
  const seen = new Set();

  $('.staff_block li').each((i, el) => {
    const imgEl = $(el).find('img[data-del="avatar"]').first();
    const src = imgEl.attr('src') || '';
    if (!src || src.includes('/themes/')) return;

    const imageUrl = src.startsWith('http') ? src : SITE_URL + src;
    if (seen.has(imageUrl)) return;
    seen.add(imageUrl);

    // 名前+年齢「弓月 あいり（44）」→ name / age
    const rawName = $(el).find('.name a').first().text().trim();
    if (!rawName) return;

    const ageMatch = rawName.match(/[（(](\d+)[）)]/);
    const age = ageMatch ? ageMatch[1] + '歳' : null;
    const name = rawName.replace(/\s*[（(]\d+[）)].*$/, '').trim();
    if (!name) return;

    const raw_data = {};
    if (age) raw_data.age = age;

    casts.push({ name, image_url: imageUrl, raw_data });
  });

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

  // Step 5: 既存削除
  const delRes = await fetch(`${supabaseUrl}/rest/v1/therapists?shop_id=eq.${SHOP_ID}`, {
    method: 'DELETE', headers
  });
  console.log(delRes.ok ? '   ✅ 既存セラピスト削除完了' : `   ❌ ${await delRes.text()}`);

  // Step 6: バッチ登録
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
