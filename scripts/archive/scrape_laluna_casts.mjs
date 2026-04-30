/**
 * Aroma LaLuna セラピスト画像スクレイピング + Supabase一括登録
 *
 * 初回のみ: npm install puppeteer
 * 実行:     node scrape_laluna_casts.mjs
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
    'Content-Type': 'application/json'
  };

  const SHOP_ID = 'tokyo_shinjuku_shinjuku_aroma_laluna';
  const CAST_PAGE_URL = 'https://laluna2020.com/therapist/krc_cast';
  const SITE_URL = 'https://laluna2020.com';
  const STORAGE_BUCKET = 'shop-logos';
  const LOGO_FILE_NAME = 'AromaLaLuna.png';

  console.log('🚀 Aroma LaLuna セラピスト情報取得スクリプト開始\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36');

    // ============================================================
    // Step 1: トップページからロゴ・料金を取得
    // ============================================================
    console.log('📄 Step 1: トップページを取得中...');
    await page.goto(SITE_URL, { waitUntil: 'networkidle2', timeout: 30000 });

    const topData = await page.evaluate(() => {
      // og:image
      const ogImg = document.querySelector('meta[property="og:image"]')?.content;
      // ロゴ画像
      const logoEl = document.querySelector('img[class*="logo"], header img, .site-logo img, #logo img');
      const logoSrc = logoEl?.src || logoEl?.dataset?.src;

      // 料金情報（数字+分+円 パターン）
      const bodyText = document.body.innerText;
      const priceMatches = [...bodyText.matchAll(/(\d+)分[^\d]*?(\d{1,3}(?:,\d{3})*)円/g)];
      const prices = priceMatches.map(m => `${m[1]}分: ${m[2]}円`);
      const uniquePrices = [...new Set(prices)];

      // スケジュールリンク
      const scheduleLink = [...document.querySelectorAll('a[href*="schedule"], a[href*="cast"], a[href*="予約"]')]
        .map(a => a.href)[0];

      return { ogImg, logoSrc, uniquePrices, scheduleLink };
    });

    console.log(`   og:image: ${topData.ogImg || 'なし'}`);
    console.log(`   logoSrc: ${topData.logoSrc || 'なし'}`);
    console.log(`   料金: ${topData.uniquePrices.join(' / ') || 'なし'}`);
    console.log(`   スケジュールURL: ${topData.scheduleLink || 'なし'}`);

    const logoUrl = topData.ogImg || topData.logoSrc;
    const priceSystem = topData.uniquePrices.join('\n') || null;
    const scheduleUrl = topData.scheduleLink || null;

    // ============================================================
    // Step 2: ロゴをSupabase Storageにアップロード
    // ============================================================
    let finalImageUrl = null;
    if (logoUrl) {
      console.log(`\n📤 Step 2: ロゴをStorageにアップロード中...`);
      try {
        const imgRes = await fetch(logoUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (imgRes.ok) {
          const imgBuffer = await imgRes.arrayBuffer();
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
              body: new Uint8Array(imgBuffer)
            }
          );
          if (uploadRes.ok) {
            finalImageUrl = `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${LOGO_FILE_NAME}`;
            console.log(`   ✅ アップロード完了`);
          } else {
            console.log(`   ⚠️  アップロード失敗: ${await uploadRes.text()}`);
          }
        }
      } catch (e) {
        console.log(`   ⚠️  ${e.message}`);
      }
    } else {
      console.log(`\n⚠️  Step 2: ロゴURLが見つかりませんでした`);
    }

    // ============================================================
    // Step 3: セラピスト一覧ページをスクレイピング
    // ============================================================
    console.log(`\n👩 Step 3: セラピスト一覧を取得中...`);
    console.log(`   URL: ${CAST_PAGE_URL}`);

    await page.goto(CAST_PAGE_URL, { waitUntil: 'networkidle2', timeout: 30000 });

    // JSレンダリングを待つ（rx-sns.jpは遅延ロードが多い）
    await new Promise(r => setTimeout(r, 3000));

    // スクロールして遅延読み込みを発火
    await page.evaluate(async () => {
      for (let i = 0; i < 5; i++) {
        window.scrollBy(0, window.innerHeight);
        await new Promise(r => setTimeout(r, 800));
      }
      window.scrollTo(0, 0);
    });

    await new Promise(r => setTimeout(r, 1000));

    const casts = await page.evaluate(() => {
      const results = [];

      // パターン1: img + 近くのテキストノード（名前）
      const allImgs = [...document.querySelectorAll('img')];
      allImgs.forEach(img => {
        const src = img.src || img.dataset?.src || img.dataset?.lazySrc;
        if (!src) return;
        // ロゴ・バナー系を除外
        if (/logo|banner|header|footer|icon|bg|background/i.test(src)) return;
        // 人物画像らしいURLを優先
        const isCastImg = /cast|therapist|member|staff|photo|img\/[0-9]|profile/i.test(src)
          || (img.width > 80 && img.height > 80);
        if (!isCastImg) return;

        // 近くのテキストから名前を探す
        let name = img.alt?.trim() || '';
        if (!name) {
          // 親要素のテキストを取得
          let el = img.parentElement;
          for (let i = 0; i < 5; i++) {
            if (!el) break;
            const text = el.innerText?.trim().split('\n')[0]?.trim();
            if (text && text.length > 0 && text.length < 30 && !/https?:/.test(text)) {
              name = text;
              break;
            }
            el = el.parentElement;
          }
        }

        if (src) results.push({ name: name || '不明', image_url: src });
      });

      return results;
    });

    // rx-sns固有のセレクタを追加で試みる
    const rxSnsCasts = await page.evaluate(() => {
      const results = [];
      // rx-snsはdata-v-*属性を持つことが多い
      const castCards = document.querySelectorAll('[class*="cast"], [class*="therapist"], [class*="member"], [class*="staff"]');
      castCards.forEach(card => {
        const img = card.querySelector('img');
        const nameEl = card.querySelector('[class*="name"], h2, h3, p');
        if (img) {
          const src = img.src || img.dataset?.src;
          const name = nameEl?.innerText?.trim() || img.alt?.trim() || '';
          if (src && !/logo|banner|header|icon/i.test(src)) {
            results.push({ name, image_url: src });
          }
        }
      });
      return results;
    });

    const allCasts = rxSnsCasts.length > 0 ? rxSnsCasts : casts;
    const uniqueCasts = Array.from(
      new Map(allCasts.filter(c => c.image_url).map(c => [c.image_url, c])).values()
    );

    console.log(`   ✅ ${uniqueCasts.length}件のセラピスト画像を取得`);
    if (uniqueCasts.length > 0) {
      uniqueCasts.slice(0, 5).forEach(c =>
        console.log(`      ${c.name}: ${c.image_url.slice(0, 70)}...`)
      );
    }

    // ============================================================
    // Step 4: shopsテーブルを更新
    // ============================================================
    console.log(`\n🗄️  Step 4: shopsテーブルを更新中...`);
    const shopUpdate = {};
    if (finalImageUrl) shopUpdate.image_url = finalImageUrl;
    if (scheduleUrl)   shopUpdate.schedule_url = scheduleUrl;
    if (priceSystem)   shopUpdate.price_system = priceSystem;

    if (Object.keys(shopUpdate).length > 0) {
      const res = await fetch(`${supabaseUrl}/rest/v1/shops?id=eq.${SHOP_ID}`, {
        method: 'PATCH', headers, body: JSON.stringify(shopUpdate)
      });
      console.log(res.ok ? `   ✅ shops更新完了` : `   ❌ 失敗: ${await res.text()}`);
    } else {
      console.log(`   ⚠️  更新データなし`);
    }

    // ============================================================
    // Step 5: therapistsテーブルに画像URLを反映
    // ============================================================
    if (uniqueCasts.length > 0) {
      console.log(`\n📸 Step 5: セラピスト画像をDBに反映中...`);
      const dbRes = await fetch(
        `${supabaseUrl}/rest/v1/therapists?shop_id=eq.${SHOP_ID}&select=id,name,image_url`,
        { headers }
      );
      const dbTherapists = await dbRes.json();
      console.log(`   DBに登録済み: ${dbTherapists.length}名`);

      let updated = 0, skipped = 0, notFound = 0;
      for (const cast of uniqueCasts) {
        const match = dbTherapists.find(db => {
          const d = db.name?.replace(/[\s　]+/g, '');
          const c = cast.name?.replace(/[\s　]+/g, '');
          return d && c && (d === c || d.includes(c) || c.includes(d));
        });
        if (!match) { notFound++; continue; }
        if (match.image_url) { skipped++; continue; }

        const res = await fetch(`${supabaseUrl}/rest/v1/therapists?id=eq.${match.id}`, {
          method: 'PATCH', headers, body: JSON.stringify({ image_url: cast.image_url })
        });
        if (res.ok) { updated++; console.log(`   ✅ ${match.name}`); }
      }
      console.log(`\n   更新: ${updated}名 / スキップ: ${skipped}名 / 未照合: ${notFound}名`);
    }

    // ============================================================
    // ローカルJSONも更新
    // ============================================================
    const allShopsPath = './public/data/all_shops.json';
    const allShops = JSON.parse(fs.readFileSync(allShopsPath, 'utf-8'));
    for (const shop of allShops) {
      if (shop.id === SHOP_ID) {
        if (finalImageUrl) shop.image_url = finalImageUrl;
        if (scheduleUrl)   shop.schedule_url = scheduleUrl;
        break;
      }
    }
    fs.writeFileSync(allShopsPath, JSON.stringify(allShops, null, 2), 'utf-8');

    console.log('\n' + '='.repeat(50));
    console.log('🎉 完了！ページをリロードして確認してください。');

  } finally {
    await browser.close();
  }
}

run().catch(err => { console.error('❌ エラー:', err); process.exit(1); });
