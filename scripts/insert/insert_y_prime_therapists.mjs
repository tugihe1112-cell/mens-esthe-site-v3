/**
 * Y PRIME (ワイプライム) セラピスト登録
 * 実行: node scripts/insert/insert_y_prime_therapists.mjs
 */
import * as cheerio from 'cheerio';
import fs from 'fs';

const SHOP_ID = 'kanagawa_yokohama_y_prime';
const SITE = 'https://y-prime-yokohama.com';
const SCHEDULE_URL = `${SITE}/schedule`;
const LOGO_URL = `${SITE}/assets/customer/logo-cc10b918754f2ec974f9568dd3b956c1247a576135b1b121bbbf62108f29716f.png`;
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

async function run() {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const getEnv = (key) => envContent.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
  const supabaseUrl = getEnv('VITE_SUPABASE_URL');
  const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');
  const headers = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' };

  // ── 1. セラピストページ取得 ───────────────────────────────
  console.log('セラピストページ取得中...');
  const res = await fetch(`${SITE}/therapist`, { headers: ua });
  const $ = cheerio.load(await res.text());
  console.log(`HTTP: ${res.status}`);

  const therapists = [];
  const seen = new Set();

  // div.item.clearfix ごとに処理
  $('div.item.clearfix, div.item.fadein').each((_, el) => {
    const item = $(el);

    // 名前: h3.itemName のテキストから "(26歳)" を除いた部分
    const nameEl = item.find('h3.itemName, h3[class*="name"]').first();
    if (!nameEl.length) return;
    const rawName = nameEl.text().replace(/\s+/g, ' ').replace(/\(\d+歳\)/, '').trim();
    if (!rawName || seen.has(rawName)) return;
    if (!/[぀-ヿ一-鿿ぁ-ん]/.test(rawName) && rawName.length < 2) return;
    seen.add(rawName);

    // 画像: img[data-src*="s3"] → S3 URL
    const imgEl = item.find('img[data-src*="amazonaws"]').first();
    let imageUrl = imgEl.attr('data-src') || '';
    // data-src が切れていたらHTML全体から therapist_id で紐付け困難なため空文字に
    if (imageUrl && imageUrl.includes('the"')) imageUrl = ''; // 切れたURL排除

    // スペック: item 全体のテキスト
    const text = item.text().replace(/\s+/g, ' ').trim();
    const raw_data = {};
    const ageM = text.match(/\((\d{2,3})歳\)/);
    const heightM = text.match(/T(\d{3})cm|身長(\d{3})cm/);
    const cupM = text.match(/([A-J])\s*カップ/i);
    if (ageM) raw_data.age = parseInt(ageM[1]);
    if (heightM) raw_data.height = parseInt(heightM[1] || heightM[2]);
    if (cupM) raw_data.cup = cupM[1].toUpperCase();

    therapists.push({ name: rawName, image_url: imageUrl, raw_data });
  });

  // 画像URLが切れた場合に備えて、HTML全体のS3 URL リストと件数を照合
  const s3Urls = [...new Set(
    [...$('html').html().matchAll(/https?:\/\/y-prime-yokohama-bucket-prod[^\s"'<>\)]+/g)]
      .map(m => m[0])
  )];
  console.log(`\nS3 URL 取得数: ${s3Urls.length}, セラピスト候補: ${therapists.length}名`);

  // image_url が空のセラピストにS3 URLを順番に割り当て（件数が合う場合）
  const noImg = therapists.filter(t => !t.image_url);
  if (noImg.length > 0 && s3Urls.length >= noImg.length) {
    let idx = 0;
    for (const t of therapists) {
      if (!t.image_url && idx < s3Urls.length) {
        t.image_url = s3Urls[idx++];
      }
    }
    console.log(`画像URL補完: ${noImg.length}名`);
  }

  console.log(`\n登録対象: ${therapists.length}名`);
  therapists.slice(0, 8).forEach(t =>
    console.log(`  ${t.name} age=${t.raw_data.age} h=${t.raw_data.height} cup=${t.raw_data.cup} img=${t.image_url.slice(0, 55)}`)
  );

  if (therapists.length === 0) {
    console.log('❌ セラピスト0名');
    return;
  }

  // ── 2. ロゴアップロード ───────────────────────────────────
  console.log('\nロゴアップロード中...');
  const logoRes = await fetch(LOGO_URL, { headers: ua });
  let logoPublicUrl = null;
  if (logoRes.ok) {
    const blob = await logoRes.arrayBuffer();
    const ext = 'png';
    const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/shop-logos/${SHOP_ID}.${ext}`, {
      method: 'POST',
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'image/png', 'x-upsert': 'true' },
      body: blob,
    });
    if (uploadRes.ok) {
      logoPublicUrl = `${supabaseUrl}/storage/v1/object/public/shop-logos/${SHOP_ID}.${ext}`;
      console.log('ロゴ ✅');
    } else {
      console.log(`ロゴ失敗: ${await uploadRes.text()}`);
    }
  } else {
    console.log(`ロゴ取得失敗: HTTP ${logoRes.status}`);
  }

  // ── 3. 店舗更新・セラピスト登録 ─────────────────────────
  const shopUpdate = { schedule_url: SCHEDULE_URL };
  if (logoPublicUrl) shopUpdate.image_url = logoPublicUrl;
  const shopRes = await fetch(`${supabaseUrl}/rest/v1/shops?id=eq.${SHOP_ID}`, {
    method: 'PATCH', headers, body: JSON.stringify(shopUpdate),
  });
  console.log(`\n店舗更新: ${shopRes.ok ? '✅' : `❌ ${await shopRes.text()}`}`);

  const delRes = await fetch(`${supabaseUrl}/rest/v1/therapists?shop_id=eq.${SHOP_ID}`, {
    method: 'DELETE', headers,
  });
  console.log(`既存削除: ${delRes.ok ? '✅' : '❌'}`);

  const rows = therapists.map((t, i) => ({
    id: `${SHOP_ID}_${t.name.replace(/[\s　]+/g, '')}_${i}`,
    shop_id: SHOP_ID,
    name: t.name,
    image_url: t.image_url,
    raw_data: t.raw_data,
  }));
  const insRes = await fetch(`${supabaseUrl}/rest/v1/therapists`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'return=minimal' },
    body: JSON.stringify(rows),
  });
  console.log(`挿入: ${insRes.ok ? `✅ ${rows.length}名` : `❌ ${await insRes.text()}`}`);
  console.log('\n完了 ✅');
}

run().catch(e => { console.error('❌', e.message); process.exit(1); });
