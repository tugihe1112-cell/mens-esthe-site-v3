/**
 * Tigger (旧Jesse) セラピスト登録 - caskan CMS
 * 実行: node scripts/insert/insert_tigger_therapists.mjs
 */
import fs from 'fs';
import * as cheerio from 'cheerio';

const SHOP_IDS = [
  'kanagawa_kawasaki_mizonokuchi_jesse',
  'kanagawa_kawasaki_musashikosugi_jesse',
  'kanagawa_kawasaki_noborito_jesse',
];

const SITE = 'https://tigger-esthe.com';
const THERAPIST_URL = `${SITE}/therapist`;
const SCHEDULE_URL = `${SITE}/schedule`;
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

async function run() {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const getEnv = (key) => {
    const match = envContent.match(new RegExp(`^${key}=(.+)$`, 'm'));
    return match ? match[1].trim().replace(/^['"]|['"]$/g, '') : null;
  };
  const supabaseUrl = getEnv('VITE_SUPABASE_URL');
  const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  // ── 1. セラピスト一覧取得 ─────────────────────────────────────
  const res = await fetch(THERAPIST_URL, { headers: ua });
  const $ = cheerio.load(await res.text());
  console.log(`HTTP: ${res.status}`);

  // caskan CMS: li/article 単位でスペックを取得（aタグ外にスペックがある構造）
  const therapists = [];
  const seen = new Set();

  $('li:has(img[src*="caskan"]), article:has(img[src*="caskan"])').each((_, el) => {
    // 画像
    const imgEl = $(el).find('img[src*="cast_tmb"]').first();
    const imgSrc = imgEl.attr('src') || '';
    if (!imgSrc) return;

    // 名前（alt 属性）
    const rawName = (imgEl.attr('alt') || '').trim();
    if (!rawName) return;

    // 店舗アカウント（"Tigger"等）をスキップ
    if (!/[぀-ヿ一-鿿ぁ-ん]/.test(rawName) && rawName.length < 10) {
      console.log(`  スキップ（店舗名）: ${rawName}`);
      return;
    }

    if (seen.has(rawName)) return;
    seen.add(rawName);

    // li 全体のテキストからスペック取得
    const liText = $(el).text().replace(/\s+/g, ' ').trim();

    const ageM = liText.match(/(\d{2,3})歳/);
    const hM   = liText.match(/(\d{3})\s*(?:cm|ｃｍ|㎝)/i);
    const cM   = liText.match(/[\(（]\s*([A-J])\s*[\)）]/);

    const raw_data = {};
    if (ageM) raw_data.age    = parseInt(ageM[1]);
    if (hM)   raw_data.height = parseInt(hM[1]);
    if (cM)   raw_data.cup    = cM[1];

    const imageUrl = imgSrc.startsWith('http') ? imgSrc : `${SITE}${imgSrc}`;
    therapists.push({ name: rawName, image_url: imageUrl, raw_data });
  });

  console.log(`\nセラピスト数: ${therapists.length}名`);
  therapists.slice(0, 8).forEach(t =>
    console.log(`  ${t.name} age=${t.raw_data.age} h=${t.raw_data.height} cup=${t.raw_data.cup}`)
  );

  if (therapists.length === 0) {
    console.log('❌ セラピストが見つかりませんでした');
    process.exit(1);
  }

  // ── 2. ロゴ取得 ───────────────────────────────────────────────
  console.log('\nロゴ検索中...');
  let logoPublicUrl = null;
  try {
    const topRes = await fetch(SITE, { headers: ua });
    const top$ = cheerio.load(await topRes.text());
    let logoSrc = top$('img[src*="logo"], header img, .logo img').first().attr('src') || '';
    // caskan の店舗ロゴは /caskan/img/shop/ 以下にあることが多い
    if (!logoSrc) {
      top$('img[src*="caskan"]').each((_, el) => {
        const src = top$(el).attr('src') || '';
        if (src.includes('/shop/') && !src.includes('cast_tmb') && !logoSrc) logoSrc = src;
      });
    }
    if (logoSrc) {
      const logoUrl = logoSrc.startsWith('http') ? logoSrc : `${SITE}${logoSrc}`;
      console.log(`  ロゴ候補: ${logoUrl}`);
      const logoRes = await fetch(logoUrl, { headers: ua });
      if (logoRes.ok) {
        const blob = await logoRes.arrayBuffer();
        const ext = logoUrl.split('.').pop().split('?')[0] || 'png';
        const fileName = `kanagawa_kawasaki_tigger.${ext}`;
        const uploadRes = await fetch(
          `${supabaseUrl}/storage/v1/object/shop-logos/${fileName}`,
          {
            method: 'POST',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': `image/${ext === 'jpg' ? 'jpeg' : ext}`,
              'x-upsert': 'true',
            },
            body: blob,
          }
        );
        if (uploadRes.ok) {
          logoPublicUrl = `${supabaseUrl}/storage/v1/object/public/shop-logos/${fileName}`;
          console.log(`  ロゴ ✅`);
        } else {
          console.log(`  ロゴアップロード失敗: ${await uploadRes.text()}`);
        }
      }
    } else {
      console.log('  ロゴ見つからず（後で手動設定）');
    }
  } catch (e) {
    console.log(`  ロゴ取得失敗: ${e.message}`);
  }

  // ── 3. 各 shop_id に登録 ──────────────────────────────────────
  for (const shopId of SHOP_IDS) {
    console.log(`\n--- ${shopId} ---`);

    // 店舗更新
    const shopUpdate = {
      schedule_url: SCHEDULE_URL,
      website_url: SITE,
    };
    if (logoPublicUrl) shopUpdate.image_url = logoPublicUrl;
    const shopRes = await fetch(`${supabaseUrl}/rest/v1/shops?id=eq.${shopId}`, {
      method: 'PATCH', headers, body: JSON.stringify(shopUpdate),
    });
    console.log(`  店舗更新: ${shopRes.ok ? '✅' : `❌ ${await shopRes.text()}`}`);

    // 既存削除
    const delRes = await fetch(`${supabaseUrl}/rest/v1/therapists?shop_id=eq.${shopId}`, {
      method: 'DELETE', headers,
    });
    console.log(`  既存削除: ${delRes.ok ? '✅' : '❌'}`);

    // 挿入
    const rows = therapists.map((t, i) => ({
      id: `${shopId}_${t.name.replace(/[\s　]+/g, '')}_${i}`,
      shop_id: shopId,
      name: t.name,
      image_url: t.image_url,
      raw_data: t.raw_data,
    }));
    const insRes = await fetch(`${supabaseUrl}/rest/v1/therapists`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=minimal' },
      body: JSON.stringify(rows),
    });
    console.log(`  挿入: ${insRes.ok ? `✅ ${rows.length}名` : `❌ ${await insRes.text()}`}`);
  }

  console.log('\n完了 ✅');
}

run().catch(e => { console.error('❌', e.message); process.exit(1); });
