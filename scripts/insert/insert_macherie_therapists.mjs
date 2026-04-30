/**
 * マシェリ セラピスト・ロゴ・スケリンク・料金 一括登録
 * 実行: node insert_macherie_therapists.mjs
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

  const SHOP_ID = 'tokyo_adachi_kitasenju_macherie';
  const SITE_URL = 'https://esthe-macherie.com';
  const THERAPIST_PAGE = 'https://esthe-macherie.com/girl';
  const SCHEDULE_URL = 'https://esthe-macherie.com/schedule';
  const WEBSITE_URL = 'https://esthe-macherie.com';
  const STORAGE_BUCKET = 'shop-logos';
  const LOGO_FILE_NAME = 'Macherie.png';

  const price_system = `60分: 15,000円
80分: 19,000円
100分: 23,000円
120分: 28,000円（本指名限定）`;

  console.log('🚀 マシェリ セットアップ開始\n');

  // ============================================================
  // Step 1: セラピストページを取得してパース
  // ============================================================
  console.log('📄 Step 1: セラピストページを取得中...');
  const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };
  const res = await fetch(THERAPIST_PAGE, { headers: ua });
  const html = await res.text();
  console.log(`   ✅ HTML取得完了 (${html.length} chars)`);

  const $ = cheerio.load(html);

  console.log('\n👩 Step 2: セラピストデータをパース中...');
  const casts = [];
  const seen = new Set();

  $('.girls_box').each((i, el) => {
    // 最初のimgが人物写真（SNSアイコンは除外）
    const imgEl = $(el).find('.image img').first();
    const src = imgEl.attr('src') || '';
    if (!src || seen.has(src)) return;
    // SNSアイコンを除外
    if (/twitter|litlink|icon_/i.test(src)) return;
    seen.add(src);

    // 名前（年齢を除去）
    const rawName = $(el).find('.name').text().trim();
    const name = rawName.replace(/\(\d+\)/, '').trim();
    if (!name) return;

    casts.push({ name, image_url: src });
  });

  console.log(`   ✅ ${casts.length}名のセラピストを取得`);
  casts.slice(0, 5).forEach(c =>
    console.log(`      ${c.name}: ${c.image_url.slice(0, 70)}`)
  );

  // ============================================================
  // Step 3: ロゴをStorageにアップロード
  // ============================================================
  console.log('\n📤 Step 3: ロゴをStorageにアップロード中...');
  let finalImageUrl = null;
  try {
    const topRes = await fetch(SITE_URL, { headers: ua });
    const topHtml = await topRes.text();
    const $top = cheerio.load(topHtml);
    let logoSrc = $top('meta[property="og:image"]').attr('content')
      || $top('header img, .logo img, #logo img').attr('src');
    if (logoSrc && !logoSrc.startsWith('http')) logoSrc = SITE_URL + logoSrc;

    if (logoSrc) {
      console.log(`   ロゴURL: ${logoSrc}`);
      const imgRes = await fetch(logoSrc, { headers: ua });
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
  const shopUpdate = { schedule_url: SCHEDULE_URL, price_system, website_url: WEBSITE_URL };
  if (finalImageUrl) shopUpdate.image_url = finalImageUrl;

  const patchRes = await fetch(`${supabaseUrl}/rest/v1/shops?id=eq.${SHOP_ID}`, {
    method: 'PATCH', headers, body: JSON.stringify(shopUpdate)
  });
  console.log(patchRes.ok ? '   ✅ shops更新完了' : `   ❌ 失敗: ${await patchRes.text()}`);

  // ============================================================
  // Step 5: 既存セラピストを削除 → 再Insert
  // ============================================================
  console.log('\n🗑️  Step 5: 既存セラピストを削除中...');
  const delRes = await fetch(`${supabaseUrl}/rest/v1/therapists?shop_id=eq.${SHOP_ID}`, {
    method: 'DELETE', headers
  });
  console.log(delRes.ok ? '   ✅ 削除完了' : `   ❌ 失敗: ${await delRes.text()}`);

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
