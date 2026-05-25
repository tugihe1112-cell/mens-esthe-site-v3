/**
 * Natural Organic Spa 新宿 セラピスト登録
 * URL: https://www.naturalorganicspa-sjk.com/cast/
 * 実行: node scripts/maintenance/process_natural_organic_spa.mjs [--dry-run]
 */
import fs from 'fs';
import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
if (DRY_RUN) console.log('[DRY RUN]\n');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const SHOP_ID = 'tokyo_shinjuku_shinjuku_natural_organic_spa';
const BASE = 'https://www.naturalorganicspa-sjk.com';
const BUCKET = 'therapist-images';

// Shift-JIS でフェッチ
const fetchSJIS = async (url) => {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  return iconv.decode(Buffer.from(buf), 'shift-jis');
};

// Storage アップロード
const uploadImage = async (imageUrl, filename) => {
  try {
    const res = await fetch(imageUrl, { headers: { Referer: BASE + '/' } });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = imageUrl.split('.').pop().split('?')[0] || 'jpg';
    const path = `natural_organic_spa/${filename}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, buf, {
      contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
      upsert: true,
    });
    if (error) { console.log(`  ⚠️ upload失敗: ${error.message}`); return null; }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  } catch (e) {
    console.log(`  ⚠️ 画像取得失敗: ${e.message}`);
    return null;
  }
};

// 1. cast一覧から girl ID を収集
console.log('キャスト一覧を取得中...');
const castHtml = await fetchSJIS(`${BASE}/cast/`);
const $c = cheerio.load(castHtml);
const girlIds = new Set();
$c('a[href*="girl.php?id="]').each((_, el) => {
  const href = $c(el).attr('href') || '';
  const id = href.match(/girl\.php\?id=([^&"]+)/)?.[1];
  if (id && id.length > 0) girlIds.add(id);
});
console.log(`${girlIds.size}名 のIDを取得`);

// 2. 個別ページから名前・画像を取得
const therapists = [];
let idx = 0;
for (const girlId of girlIds) {
  idx++;
  const url = `${BASE}/sys/girl.php?id=${girlId}`;
  try {
    const html = await fetchSJIS(url);
    const $ = cheerio.load(html);

    // 名前: <title>名前 | ...</title> の最初の部分
    const titleText = $('title').text().trim();
    const name = titleText.split('|')[0].trim();

    // 画像: /photo/staff/ パス
    let imageUrl = null;
    $('img[src*="/photo/staff/"]').each((_, el) => {
      if (!imageUrl) imageUrl = $(el).attr('src');
    });

    if (!name || name.length === 0 || name.length > 12) {
      console.log(`  [${idx}] ${girlId}: 名前取得失敗 → スキップ`);
      continue;
    }

    // staffId を画像URLから抽出（Storage ファイル名に使用）
    const staffIdMatch = imageUrl?.match(/\/staff\/\d+\/(\d+)_/);
    const staffId = staffIdMatch?.[1] || girlId;

    process.stdout.write(`  [${idx}] ${name} (${girlId})`);

    therapists.push({ name, girlId, imageUrl: imageUrl ? `${BASE}${imageUrl}` : null, staffId });
    process.stdout.write(' ✓\n');

    // リクエスト間隔
    await new Promise(r => setTimeout(r, 200));
  } catch (e) {
    console.log(`  [${idx}] ${girlId}: エラー → ${e.message}`);
  }
}

console.log(`\n取得完了: ${therapists.length}名\n`);

if (DRY_RUN) {
  therapists.forEach(t => console.log(`  ${t.name} | img=${t.imageUrl ? '✅' : 'null'}`));
  process.exit(0);
}

// 3. 既存セラピストを確認
const { data: existing } = await supabase.from('therapists').select('name').eq('shop_id', SHOP_ID);
const existingNames = new Set((existing || []).map(t => t.name?.replace(/[\s　]+/g, '').toLowerCase()));

// 4. 登録
let inserted = 0, skipped = 0;
for (const t of therapists) {
  const norm = t.name.replace(/[\s　]+/g, '').toLowerCase();
  if (existingNames.has(norm)) { skipped++; continue; }

  let storedUrl = null;
  if (t.imageUrl) {
    process.stdout.write(`  アップロード: ${t.name}... `);
    storedUrl = await uploadImage(t.imageUrl, `${t.staffId}`);
    process.stdout.write(storedUrl ? '✅\n' : '❌\n');
  }

  const therapistId = `${SHOP_ID}_${t.name}`;
  const { error } = await supabase.from('therapists').upsert({
    id: therapistId,
    shop_id: SHOP_ID,
    name: t.name,
    image_url: storedUrl,
  });
  if (error) {
    console.log(`  ❌ ${t.name}: ${error.message}`);
  } else {
    inserted++;
  }
}

console.log(`\n✅ 登録: ${inserted}名, スキップ(既存): ${skipped}名`);
