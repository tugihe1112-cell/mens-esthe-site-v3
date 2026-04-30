/**
 * LaLunaの誤データを全削除 → 正しいセラピストのみ再登録
 * 実行: node cleanup_laluna_therapists.mjs
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

  const SHOP_ID = 'tokyo_shinjuku_shinjuku_aroma_laluna';
  const CAST_PAGE_URL = 'https://laluna2020.com/therapist/krc_cast';

  // ============================================================
  // Step 1: このショップの全セラピストを削除
  // ============================================================
  console.log('🗑️  Step 1: 既存セラピストを全削除中...');
  const delRes = await fetch(
    `${supabaseUrl}/rest/v1/therapists?shop_id=eq.${SHOP_ID}`,
    { method: 'DELETE', headers }
  );
  console.log(delRes.ok ? `   ✅ 削除完了 (status: ${delRes.status})` : `   ❌ 失敗: ${await delRes.text()}`);

  // ============================================================
  // Step 2: セラピスト一覧を正しくスクレイピング
  // ============================================================
  console.log('\n👩 Step 2: セラピスト一覧を取得中...');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });

  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36');
    await page.goto(CAST_PAGE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000));

    // スクロールして遅延ロードを発火
    await page.evaluate(async () => {
      for (let i = 0; i < 10; i++) {
        window.scrollBy(0, window.innerHeight);
        await new Promise(r => setTimeout(r, 500));
      }
      window.scrollTo(0, 0);
    });
    await new Promise(r => setTimeout(r, 1000));

    const casts = await page.evaluate(() => {
      const results = [];
      const seen = new Set();

      // /therapist/krc_cast/{name} のリンクからURLデコードで名前取得
      const castLinks = [...document.querySelectorAll('a[href*="/therapist/krc_cast/"]')];

      castLinks.forEach(link => {
        const href = link.href || '';
        const match = href.match(/\/therapist\/krc_cast\/([^/?#]+)$/);
        if (!match) return;

        const encodedName = match[1];
        // 数字IDはスキップ（ご予約はこちら等のバナーページ）
        if (/^\d+(-\d+)?$/.test(encodedName)) return;

        let name = '';
        try { name = decodeURIComponent(encodedName); } catch(e) { return; }
        if (!name || name.length < 2) return;
        if (seen.has(name)) return;
        seen.add(name);

        // リンク内またはカード内の画像を取得
        let img = link.querySelector('img');
        if (!img) {
          const parent = link.closest('article, li, [class*="card"], [class*="item"], [class*="cast"], [class*="therapist"]') || link.parentElement?.parentElement;
          img = parent?.querySelector('img');
        }

        const src = img?.src || img?.dataset?.src || '';

        // 画像がない or バナー系はスキップ
        if (!src) return;
        if (/logo|banner|qr|line|予約|recruit|dummy|noimage/i.test(src)) return;
        // wp-content/uploads の画像のみ採用（人物写真）
        if (!src.includes('wp-content/uploads')) return;

        results.push({ name, image_url: src });
      });

      return results;
    });

    console.log(`   ✅ ${casts.length}名のセラピストを取得`);
    casts.slice(0, 5).forEach(c =>
      console.log(`      ${c.name}: ${c.image_url.slice(0, 60)}`)
    );

    // ============================================================
    // Step 3: 正しいデータをInsert
    // ============================================================
    console.log(`\n📥 Step 3: ${casts.length}名を一括Insert中...`);

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

    console.log('\n' + '='.repeat(50));
    console.log(`📊 完了:`);
    console.log(`   登録: ${inserted}名 / エラー: ${errors}名`);
    console.log('🎉 ページをリロードして確認してください！');

  } finally {
    await browser.close();
  }
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
