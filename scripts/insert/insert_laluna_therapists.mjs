/**
 * Aroma LaLuna セラピスト140名をSupabaseに一括登録
 * 実行: node insert_laluna_therapists.mjs
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
    'Prefer': 'return=minimal'
  };

  const SHOP_ID = 'tokyo_shinjuku_shinjuku_aroma_laluna';
  const CAST_PAGE_URL = 'https://laluna2020.com/therapist/krc_cast';

  console.log('🚀 Aroma LaLuna セラピスト登録スクリプト開始\n');

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });

  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36');

    // ============================================================
    // Step 1: セラピスト一覧をスクレイピング
    // ============================================================
    console.log(`📄 Step 1: ${CAST_PAGE_URL} を取得中...`);
    await page.goto(CAST_PAGE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000));

    // ページ全体をスクロールして遅延ロード発火
    await page.evaluate(async () => {
      for (let i = 0; i < 8; i++) {
        window.scrollBy(0, window.innerHeight);
        await new Promise(r => setTimeout(r, 600));
      }
      window.scrollTo(0, 0);
    });
    await new Promise(r => setTimeout(r, 1000));

    // URLエンコードされた名前からセラピスト名を取得する
    // 例: /therapist/krc_cast/%e7%a5%9e%e6%a5%bd%e3%81%99%e3%81%84 → 神楽すい
    const rawCasts = await page.evaluate(() => {
      const results = [];
      const seen = new Set();

      // /therapist/krc_cast/{name} 形式のリンクを全取得
      const castLinks = [...document.querySelectorAll('a[href*="/therapist/krc_cast/"]')];

      castLinks.forEach(link => {
        const href = link.href || '';
        // /krc_cast/ 以降のパスを取得
        const match = href.match(/\/therapist\/krc_cast\/([^/?#]+)/);
        if (!match) return;

        const encodedName = match[1];
        // "詳細" テキストのリンクや数字IDはスキップ
        if (/^\d+-?\d*$/.test(encodedName)) return;

        // URLデコードで名前を取得
        let name = '';
        try { name = decodeURIComponent(encodedName); } catch(e) { return; }
        if (!name || name.length < 2) return;

        // 重複チェック
        if (seen.has(name)) return;
        seen.add(name);

        // このリンク内またはその親カード内の画像を取得
        let img = link.querySelector('img');
        if (!img) {
          // 兄弟・親の中の画像を探す
          const parent = link.closest('article, li, div[class*="card"], div[class*="item"], div[class*="cast"], div[class*="therapist"]') || link.parentElement;
          img = parent?.querySelector('img');
        }

        const src = img?.src || img?.dataset?.src || img?.dataset?.lazySrc || '';
        // QRコード・バナー系を除外
        if (src && /logo|banner|header|footer|icon|bg|qr/i.test(src)) return;

        results.push({
          name,
          age: '',
          image_url: src || ''
        });
      });

      return results;
    });

    // 重複除去（image_urlで）＋名前が「不明」のものを除外
    const seen = new Set();
    const casts = rawCasts.filter(c => {
      if (seen.has(c.image_url)) return false;
      seen.add(c.image_url);
      return true;
    });

    console.log(`   ✅ ${casts.length}名のセラピストを取得`);
    casts.slice(0, 5).forEach(c =>
      console.log(`      ${c.name}${c.age ? ` (${c.age}歳)` : ''}: ${c.image_url.slice(0, 60)}`)
    );

    if (casts.length === 0) {
      console.log('   ❌ セラピストが取得できませんでした。スクリプトを終了します。');
      return;
    }

    // ============================================================
    // Step 2: 既存DBのセラピストを確認
    // ============================================================
    console.log(`\n🔍 Step 2: 既存DBを確認中...`);
    const existRes = await fetch(
      `${supabaseUrl}/rest/v1/therapists?shop_id=eq.${SHOP_ID}&select=id,name`,
      { headers }
    );
    const existingTherapists = await existRes.json();
    console.log(`   既存: ${existingTherapists.length}名`);

    const existingNames = new Set(existingTherapists.map(t => t.name.replace(/[\s　]+/g, '')));

    // ============================================================
    // Step 3: 新規セラピストをInsert
    // ============================================================
    console.log(`\n📥 Step 3: 新規セラピストをInsert中...`);

    let insertCount = 0, skipCount = 0, errorCount = 0;
    const BATCH_SIZE = 20;

    // 新規のみ抽出
    const newCasts = casts.filter(c => {
      const cleanName = c.name.replace(/[\s　]+/g, '');
      return !existingNames.has(cleanName);
    });

    console.log(`   新規登録対象: ${newCasts.length}名 / スキップ(既存): ${casts.length - newCasts.length}名`);

    // バッチ処理
    for (let i = 0; i < newCasts.length; i += BATCH_SIZE) {
      const batch = newCasts.slice(i, i + BATCH_SIZE);
      const records = batch.map(c => ({
        id: `${SHOP_ID}_${c.name.replace(/[\s　]+/g, '')}`,
        shop_id: SHOP_ID,
        name: c.name,
        image_url: c.image_url,
        is_active: true,
        raw_data: c.age ? { age: c.age } : {}
      }));

      const res = await fetch(`${supabaseUrl}/rest/v1/therapists`, {
        method: 'POST',
        headers: {
          ...headers,
          'Prefer': 'resolution=ignore-duplicates,return=minimal'
        },
        body: JSON.stringify(records)
      });

      if (res.ok) {
        insertCount += batch.length;
        console.log(`   ✅ ${i + 1}〜${Math.min(i + BATCH_SIZE, newCasts.length)}名目: 登録完了`);
      } else {
        const errText = await res.text();
        console.log(`   ❌ バッチ失敗: ${errText.slice(0, 100)}`);
        errorCount += batch.length;
      }
    }

    skipCount = casts.length - newCasts.length;

    // ============================================================
    // Step 4: 料金システムを正しく更新
    // ============================================================
    console.log(`\n💴 Step 4: 料金システムを再取得中...`);
    await page.goto('https://laluna2020.com/', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // 料金ページへ
    try {
      await page.goto('https://laluna2020.com/price/', { waitUntil: 'networkidle2', timeout: 15000 });
    } catch(e) {}

    const priceData = await page.evaluate(() => {
      const body = document.body.innerText;
      // 例: "90分 20,000円" のパターン（カンマありの数字）
      const matches = [...body.matchAll(/(\d+)分[^\d]{0,10}?([\d]{2,3}(?:,\d{3})+)円/g)];
      const prices = matches.map(m => `${m[1]}分: ${m[2]}円`);
      return [...new Set(prices)];
    });

    console.log(`   料金: ${priceData.join(' / ') || '取得できず'}`);

    if (priceData.length > 0) {
      const res = await fetch(`${supabaseUrl}/rest/v1/shops?id=eq.${SHOP_ID}`, {
        method: 'PATCH',
        headers: { ...headers, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ price_system: priceData.join('\n') })
      });
      console.log(res.ok ? '   ✅ 料金システム更新完了' : `   ❌ 失敗: ${await res.text()}`);
    }

    // ============================================================
    // 結果まとめ
    // ============================================================
    console.log('\n' + '='.repeat(50));
    console.log(`📊 完了サマリー:`);
    console.log(`   セラピスト新規登録: ${insertCount}名`);
    console.log(`   スキップ(既存):     ${skipCount}名`);
    console.log(`   エラー:             ${errorCount}名`);
    console.log('');
    console.log('🎉 完了！ページをリロードして写真が出るか確認してください。');

  } finally {
    await browser.close();
  }
}

run().catch(err => { console.error('❌ 致命的エラー:', err.message); process.exit(1); });
