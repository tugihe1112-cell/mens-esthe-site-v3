/**
 * アラウンドフォーティー セラピスト・ロゴ・スケリンク・料金 一括登録
 * 実行: node insert_araundo_therapists.mjs
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

  const SHOP_ID = 'tokyo_nerima_nerima_around_forty';
  const THERAPIST_PAGE = 'https://araundoforty.com/therapist.php';
  const SCHEDULE_URL = 'https://araundoforty.com/schedule.php#contents';
  const WEBSITE_URL = 'https://araundoforty.com';
  const STORAGE_BUCKET = 'shop-logos';
  const LOGO_FILE_NAME = 'AraundoForty.png';

  const price_system = `90分: 14,000円
120分: 18,000円
150分: 23,000円`;

  const SHOP_NAME = 'Araundoforty アラウンドフォーティー';

  console.log('🚀 アラウンドフォーティー セットアップ開始\n');

  const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };

  // Step 1: セラピストページ取得
  console.log('📄 Step 1: セラピストページを取得中...');
  const res = await fetch(THERAPIST_PAGE, { headers: ua });
  const html = await res.text();
  console.log(`   ✅ HTML取得完了 (${html.length} chars)`);

  const $ = cheerio.load(html);

  // Step 2: パース（pwchp.com/images_staff のimgからalt=名前）
  console.log('\n👩 Step 2: セラピストデータをパース中...');
  const casts = [];
  const seen = new Set();

  $('img').each((i, el) => {
    const src = $(el).attr('src') || '';
    const alt = $(el).attr('alt') || '';

    if (!src.includes('pwchp.com/images_staff')) return;

    const name = alt.trim();
    if (!name || name.length < 2) return;
    // アイコン系をスキップ
    if (/アイコン|icon|新人|おすすめ|人気|在籍|出勤/.test(name)) return;

    if (seen.has(src)) return;
    seen.add(src);

    casts.push({ name, image_url: src });
  });

  console.log(`   ✅ ${casts.length}名のセラピストを取得`);
  casts.slice(0, 5).forEach(c =>
    console.log(`      ${c.name}: ${c.image_url.slice(0, 70)}`)
  );

  // Step 3: ロゴアップロード（images_pageの最初の画像を使用）
  console.log('\n📤 Step 3: ロゴをStorageにアップロード中...');
  let finalImageUrl = null;
  try {
    let logoSrc = null;
    $('img').each((i, el) => {
      if (logoSrc) return;
      const src = $(el).attr('src') || '';
      if (src.includes('pwchp.com/images_page')) logoSrc = src;
    });

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

  // Step 4: shops更新（名前も変更）
  console.log('\n🗄️  Step 4: shopsテーブルを更新中...');
  const shopUpdate = {
    name: SHOP_NAME,
    schedule_url: SCHEDULE_URL,
    price_system,
    website_url: WEBSITE_URL
  };
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
