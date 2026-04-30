/**
 * 秘密のミセスルーム（北千住・南浦和）セットアップ
 * - ロゴアップロード
 * - スケリンク・料金・公式URL更新
 * - セラピスト登録（Puppeteer）
 * 実行: node insert_himitsu_mrs.mjs
 */
import fs from 'fs';
import puppeteer from 'puppeteer';

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

  const SITE_URL = 'https://himitsu-mrs-27.com';
  const THERAPIST_PAGE = 'https://himitsu-mrs-27.com/therapist.html';
  const SCHEDULE_URL = 'https://himitsu-mrs-27.com/schedule.html';
  const LOGO_URL = 'https://himitsu-mrs-27.com/img/f-logo.png';
  const STORAGE_BUCKET = 'shop-logos';
  const LOGO_FILE_NAME = 'HimitsuMrs.png';

  const price_system = `70分: 12,000円
100分: 16,000円
120分: 20,000円
150分: 24,000円
180分: 30,000円`;

  const SHOPS = [
    { id: 'tokyo_adachi_kitasenju_himitsu_mrs_room', name: '北千住' },
    { id: 'himitsu_mrs_room_minamiurawa', name: '南浦和' },
  ];

  console.log('🚀 秘密のミセスルーム セットアップ開始\n');

  // ============================================================
  // Step 1: ロゴをアップロード
  // ============================================================
  console.log('📤 Step 1: ロゴをStorageにアップロード中...');
  let finalImageUrl = null;
  try {
    const imgRes = await fetch(LOGO_URL, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (imgRes.ok) {
      const imgBytes = new Uint8Array(await imgRes.arrayBuffer());
      const uploadRes = await fetch(
        `${supabaseUrl}/storage/v1/object/${STORAGE_BUCKET}/${LOGO_FILE_NAME}`,
        {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'image/png',
            'x-upsert': 'true'
          },
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

  // ============================================================
  // Step 2: 両店舗のshopsテーブルを更新
  // ============================================================
  console.log('\n🗄️  Step 2: shopsテーブルを更新中...');
  for (const shop of SHOPS) {
    const shopUpdate = {
      schedule_url: SCHEDULE_URL,
      price_system,
    };
    if (finalImageUrl) shopUpdate.image_url = finalImageUrl;

    const patchRes = await fetch(`${supabaseUrl}/rest/v1/shops?id=eq.${shop.id}`, {
      method: 'PATCH', headers, body: JSON.stringify(shopUpdate)
    });
    console.log(patchRes.ok
      ? `   ✅ ${shop.name}店 更新完了`
      : `   ❌ ${shop.name}店 失敗: ${await patchRes.text()}`
    );
  }

  // ============================================================
  // Step 3: Puppeteerでセラピスト一覧を取得
  // ============================================================
  console.log('\n👩 Step 3: セラピストページをPuppeteerで取得中...');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });

  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36');
    await page.goto(THERAPIST_PAGE, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000));

    // スクロールして遅延ロードを発火
    await page.evaluate(async () => {
      for (let i = 0; i < 8; i++) {
        window.scrollBy(0, window.innerHeight);
        await new Promise(r => setTimeout(r, 500));
      }
      window.scrollTo(0, 0);
    });
    await new Promise(r => setTimeout(r, 1000));

    const casts = await page.evaluate(() => {
      const results = [];
      const seen = new Set();

      // .staff-box 内の background-image から画像URL、.staff-name からセラピスト名を取得
      document.querySelectorAll('.staff-box').forEach(box => {
        // background-image:url(...)
        const imgEl = box.querySelector('[style*="background-image"]');
        const style = imgEl?.getAttribute('style') || '';
        const urlMatch = style.match(/background-image\s*:\s*url\(['"]?([^'")\s]+)['"]?\)/);
        const src = urlMatch ? urlMatch[1] : '';

        if (!src || seen.has(src)) return;
        seen.add(src);

        // 名前
        const nameEl = box.querySelector('.staff-name');
        const name = nameEl?.innerText?.trim() || '';

        results.push({ name, image_url: src });
      });

      return results;
    });

    console.log(`   取得: ${casts.length}件`);
    casts.slice(0, 5).forEach(c => console.log(`      ${c.name || '(名前不明)'}: ${c.image_url.slice(0, 70)}`));

    if (casts.length === 0) {
      console.log('   ⚠️  セラピストが見つかりませんでした。HTMLダンプします...');
      const html = await page.content();
      fs.writeFileSync('/tmp/himitsu_debug.html', html);
      console.log('   → /tmp/himitsu_debug.html に保存しました');
      return;
    }

    // ============================================================
    // Step 4: 北千住・南浦和それぞれに同じセラピストをInsert
    // ============================================================
    for (const shop of SHOPS) {
      console.log(`\n🗑️  ${shop.name}店: 既存セラピストを削除中...`);
      const delRes = await fetch(`${supabaseUrl}/rest/v1/therapists?shop_id=eq.${shop.id}`, {
        method: 'DELETE', headers
      });
      console.log(delRes.ok ? `   ✅ 削除完了` : `   ❌ 失敗: ${await delRes.text()}`);

      console.log(`📥 ${shop.name}店: ${casts.length}名をInsert中...`);
      const BATCH = 20;
      let inserted = 0, errors = 0;

      for (let i = 0; i < casts.length; i += BATCH) {
        const batch = casts.slice(i, i + BATCH);
        const records = batch.map(c => ({
          id: `${shop.id}_${(c.name || c.image_url.split('/').pop()).replace(/[\s　]+/g, '')}`,
          shop_id: shop.id,
          name: c.name || '',
          image_url: c.image_url,
          is_active: true,
          raw_data: {}
        }));

        const res = await fetch(`${supabaseUrl}/rest/v1/therapists`, {
          method: 'POST',
          headers: { ...headers, 'Prefer': 'resolution=ignore-duplicates,return=minimal' },
          body: JSON.stringify(records)
        });

        if (res.ok) {
          inserted += batch.length;
          console.log(`   ✅ ${i + 1}〜${Math.min(i + BATCH, casts.length)}名目: 完了`);
        } else {
          console.log(`   ❌ バッチ失敗: ${(await res.text()).slice(0, 100)}`);
          errors += batch.length;
        }
      }
      console.log(`   登録: ${inserted}名 / エラー: ${errors}名`);
    }

  } finally {
    await browser.close();
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎉 完了！ページをリロードして確認してください！');
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
