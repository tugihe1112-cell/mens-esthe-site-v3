/**
 * doigt de fee 本厚木店 セラピスト登録
 * 実行: node scripts/insert/insert_doigt_atsugi_therapists.mjs
 */
import fs from 'fs';
import * as cheerio from 'cheerio';

const SHOP_ID = 'kanagawa_atsugi_doigt_de_fee';
const SITE = 'https://exe-fee.com';
const LADY_URL = `${SITE}/lady/`;
const SCHEDULE_URL = `${SITE}/schedule/`;
const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

// 厚木店として認識する店舗名パターン
const STORE_NAMES = ['本厚木店', '厚木店', 'Atsugi', 'atsugi'];

const SKIP_NAME_PATTERN = /First割引|割引|店オープン|増室決定|体験入店|NEW OPEN/;

async function run() {
  const envContent = fs.readFileSync('.env', 'utf-8');
  const getEnv = (key) => envContent.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
  const supabaseUrl = getEnv('VITE_SUPABASE_URL');
  const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');
  const headers = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' };

  console.log('lady一覧取得中...');
  const listRes = await fetch(LADY_URL, { headers: ua });
  const $ = cheerio.load(await listRes.text());
  console.log(`HTTP: ${listRes.status}`);

  // 全 li のテキストから店舗名一覧を確認
  const allStoreNames = new Set();
  $('li:has(img[src*="imgsrv.jp"][src*="/lady/"])').each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    const m = text.match(/([^\s]+店)$/);
    if (m) allStoreNames.add(m[1]);
  });
  console.log(`\n確認できた店舗名: ${[...allStoreNames].join(', ')}`);

  const therapists = [];
  const seen = new Set();

  $('li:has(img[src*="imgsrv.jp"][src*="/lady/"])').each((_, el) => {
    const liText = $(el).text().replace(/\s+/g, ' ').trim();

    // 厚木店かどうか
    const isAtsugi = STORE_NAMES.some(s => liText.includes(s));
    if (!isAtsugi) return;

    const name = $(el).find('h2.elps a[href*="/lady/"]').text().trim();
    if (!name || SKIP_NAME_PATTERN.test(name) || seen.has(name)) return;
    if (!/[぀-ヿ一-鿿ぁ-ん]/.test(name) && name.length < 2) return;
    seen.add(name);

    let imageUrl = $(el).find('img[src*="imgsrv.jp"][src*="/lady/"]').first().attr('src') || '';

    const raw_data = {};
    const ageM = liText.match(/(\d{2,3})\s*歳/);
    const heightM = liText.match(/T(\d{3})cm|(\d{3})cm/);
    const cupM = liText.match(/B\d+\(([A-J])\)/i) || liText.match(/([A-J])カップ/i);
    if (ageM) raw_data.age = parseInt(ageM[1]);
    if (heightM) raw_data.height = parseInt(heightM[1] || heightM[2]);
    if (cupM) raw_data.cup = cupM[1].toUpperCase();

    therapists.push({ name, image_url: imageUrl, raw_data });
  });

  console.log(`\n厚木セラピスト候補: ${therapists.length}名`);
  therapists.forEach(t =>
    console.log(`  ${t.name} age=${t.raw_data.age} h=${t.raw_data.height} cup=${t.raw_data.cup}`)
  );

  if (therapists.length === 0) {
    console.log('❌ 本日出勤の厚木セラピストが見つかりません。');
    console.log('  → schedule_url とロゴだけ更新します。');
  }

  // ロゴは kawasaki と同じ（既存 doigt ロゴを流用）
  const LOGO_PUBLIC_URL = `${supabaseUrl}/storage/v1/object/public/shop-logos/doigt%20de%20fee.png`;

  const shopUpdate = {
    schedule_url: SCHEDULE_URL,
    image_url: LOGO_PUBLIC_URL,
  };
  const shopRes = await fetch(`${supabaseUrl}/rest/v1/shops?id=eq.${SHOP_ID}`, {
    method: 'PATCH', headers, body: JSON.stringify(shopUpdate),
  });
  console.log(`\n店舗更新: ${shopRes.ok ? '✅' : `❌ ${await shopRes.text()}`}`);

  if (therapists.length > 0) {
    await fetch(`${supabaseUrl}/rest/v1/therapists?shop_id=eq.${SHOP_ID}`, { method: 'DELETE', headers });
    console.log('既存削除 ✅');

    const rows = therapists.map((t, i) => ({
      id: `${SHOP_ID}_${t.name.replace(/[\s　]+/g, '')}_${i}`,
      shop_id: SHOP_ID, name: t.name, image_url: t.image_url, raw_data: t.raw_data,
    }));
    const insRes = await fetch(`${supabaseUrl}/rest/v1/therapists`, {
      method: 'POST', headers: { ...headers, 'Prefer': 'return=minimal' }, body: JSON.stringify(rows),
    });
    console.log(`挿入: ${insRes.ok ? `✅ ${rows.length}名` : `❌ ${await insRes.text()}`}`);
  }

  console.log('完了 ✅');
}
run().catch(e => { console.error('❌', e.message); process.exit(1); });
