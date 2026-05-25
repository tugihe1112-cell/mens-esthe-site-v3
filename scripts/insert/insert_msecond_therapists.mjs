/**
 * M～second～ (エムセカンド) セラピスト・ロゴ・スケリンク・料金 登録
 * 実行: node scripts/insert/insert_msecond_therapists.mjs
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

  const SHOP_ID = 'chiba_funabashi_m_second';
  const SITE_URL = 'https://funabashi-m.com';
  const CAST_PAGE = 'https://funabashi-m.com/cast/';
  const SCHEDULE_URL = 'https://funabashi-m.com/schedule/';
  const WEBSITE_URL = 'https://funabashi-m.com';
  const LOGO_URL = 'https://funabashi-m.com/images_shop/logo.png';
  const STORAGE_BUCKET = 'shop-logos';
  const LOGO_FILE_NAME = 'MSecond.png';

  const price_system = `60分: 12,000円
90分: 15,000円
120分: 19,000円
150分: 23,000円
180分: 27,000円
延長15分: 3,000円`;

  const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };

  console.log('🚀 M～second～ セットアップ開始\n');

  // Step 1: キャストページ取得
  console.log('📄 Step 1: キャストページを取得中...');
  const res = await fetch(CAST_PAGE, { headers: ua });
  const $ = cheerio.load(await res.text());
  console.log(`   ✅ HTML取得完了 (status: ${res.status})`);

  console.log('\n👩 Step 2: セラピストデータをパース中...');
  const casts = [];
  const seen = new Set();

  $('.cast_box').each((i, el) => {
    const imgEl = $(el).find('.cast_box_img img').first();
    const src = imgEl.attr('src') || '';

    // noimage はスキップ
    if (!src || src.includes('noimage')) return;

    // 相対パス ../images_staff/... → 絶対URL
    const imageUrl = src.startsWith('http') ? src
      : SITE_URL + '/' + src.replace(/^\.\.\//, '');
    if (seen.has(imageUrl)) return;
    seen.add(imageUrl);

    // .cast_box_info のテキストから名前・年齢・スペック取得
    // 例: "来来　らら / 20歳\nT150 B87(D) W55 H83"
    const infoText = $(el).find('.cast_box_info').text();
    const lines = infoText.split('\n').map(l => l.trim()).filter(l => l);

    // 1行目: "名前 / 年齢"
    const firstLine = lines[0] || '';
    const slashIdx = firstLine.indexOf('/');
    const name = slashIdx >= 0
      ? firstLine.slice(0, slashIdx).trim()
      : firstLine.trim();
    const ageMatch = firstLine.match(/(\d+)歳/);
    const age = ageMatch ? `${ageMatch[1]}歳` : '';

    if (!name || name === '新人セラピスト') {
      // 新人で名前未定の場合はスキップ（noimage と合わせてチェック済みだが念のため）
    }
    if (!name) return;

    // スペック行から T/B/W/H
    const specText = lines.slice(1).join(' ');
    const heightMatch = specText.match(/T(\d+)/);
    const bustMatch = specText.match(/B(\d+)/);
    const waistMatch = specText.match(/W(\d+)/);
    const hipMatch = specText.match(/H(\d+)/);

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
      id: `${SHOP_ID}_${c.name.replace(/[\s　～〜]+/g, '')}`,
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
