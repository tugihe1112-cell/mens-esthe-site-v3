/**
 * 大阪 rookie_cms 4店舗 名前修正スクリプト
 * Phase2で誤登録した癒刻・SPA Mona・新感覚Mエステ・C'est la 美を削除→正しく再登録
 * 実行: node scripts/maintenance/fix_osaka_rookie_names.mjs [--dry-run]
 */
import fs from 'fs';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const DRY_RUN = process.argv.includes('--dry-run');
const env = fs.readFileSync('.env', 'utf-8');
const getEnv = k => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchHtml(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(12000) });
    return res.ok ? res.text() : null;
  } catch { return null; }
}

async function uploadImage(url, storageKey, referer) {
  try {
    const headers = { 'User-Agent': UA, 'Referer': referer };
    const res = await fetch(url.split('?')[0], { headers, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = url.split('?')[0].split('.').pop().toLowerCase().replace(/[^a-z]/g, '') || 'jpg';
    const key = `${storageKey}.${ext}`;
    const { error } = await supabase.storage.from('therapist-images').upload(key, buf, {
      contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`, upsert: true
    });
    if (error) return null;
    const { data } = supabase.storage.from('therapist-images').getPublicUrl(key);
    return data.publicUrl;
  } catch { return null; }
}

// alt最終トークンから名前を取得（このCMS共通）
function extractNameFromAlt(alt) {
  if (!alt) return null;
  const parts = alt.trim().split(/\s+/);
  let name = parts[parts.length - 1] || '';
  // 年齢・サフィックス除去
  name = name.replace(/\(\d+\)$/, '').replace(/（\d+）$/, '').trim();
  // ハイフン括弧系（梓-あずさ-など）はそのまま保持
  if (!name || name.length > 15) return null;
  // 日本語またはローマ字名として有効か
  const hasJP = /[ぁ-んァ-ヾ一-龯]/.test(name);
  const hasRomaji = /^[a-zA-Z][a-zA-Z\s\-]{1,14}$/.test(name);
  if (!hasJP && !hasRomaji) return null;
  // ノイズ除外
  if (/NEW|SNS|LINE|Twitter|Instagram|予約|体験|割引|求人/i.test(name)) return null;
  return name;
}

// data-p1からimage URLを抽出（複数フォーマット対応）
function extractImageUrl(datap1, base) {
  if (!datap1) return null;
  // def/con?x=N&p=path&... → baseUrl/path
  const defconMatch = datap1.match(/[?&]p=([^&]+)/);
  if (defconMatch) return `${base}/${defconMatch[1]}`;
  // https://... → そのまま（クエリストリング除去）
  if (datap1.startsWith('http')) return datap1.split('?')[0];
  return `${base}${datap1.split('?')[0]}`;
}

const SHOPS = [
  { name: '癒刻',          url: 'https://yukoku-esthe.com',              prefix: 'yukoku' },
  { name: 'SPA Mona',      url: 'https://menesthe-higashiosak-mona.com', prefix: 'spamona' },
  { name: '新感覚Mエステ', url: 'https://www.shinkankaku.com',           prefix: 'shinkankaku' },
  { name: "C'est la 美",   url: 'https://cestlavieosaka.com',            prefix: 'cestlavie' },
];

console.log(`大阪 rookie名前修正${DRY_RUN ? ' [DRY-RUN]' : ''}`);

for (const shop of SHOPS) {
  console.log(`\n=== ${shop.name} ===`);

  // shop_id取得
  const domain = shop.url.replace(/https?:\/\/(www\.)?/, '').replace(/\/+$/, '');
  const { data: dbShops } = await supabase.from('shops').select('id,name').ilike('website_url', `%${domain}%`);
  if (!dbShops?.length) { console.log('  shop not found'); continue; }
  const shopId = dbShops[0].id;
  console.log(`  shop_id: ${shopId}`);

  // 既存セラピスト削除
  if (!DRY_RUN) {
    const { error } = await supabase.from('therapists').delete().eq('shop_id', shopId);
    if (error) console.log(`  削除エラー: ${error.message}`);
    else console.log(`  既存レコード削除完了`);
  } else {
    const { count } = await supabase.from('therapists').select('id', { count: 'exact' }).eq('shop_id', shopId);
    console.log(`  [DRY-RUN] 削除予定: ${count}件`);
  }

  // /cast/ ページを取得
  const castUrl = shop.url.replace(/\/+$/, '') + '/cast/';
  const html = await fetchHtml(castUrl);
  if (!html) { console.log('  cast page fetch失敗'); continue; }
  const $ = cheerio.load(html);

  const results = [], seen = new Set();

  // data-p1 を持つimg要素を処理
  $('img[data-p1]').each((_, el) => {
    const datap1 = $(el).attr('data-p1') || '';
    const alt = $(el).attr('alt') || '';
    // thumb_ または cast/{id}_ パターンを含む要素のみ
    if (!datap1.includes('upload/cast/') && !datap1.includes('thumb_')) return;

    const name = extractNameFromAlt(alt);
    if (!name || seen.has(name)) return;
    seen.add(name);

    const imgUrl = extractImageUrl(datap1, shop.url.replace(/\/+$/, ''));
    results.push({ name, rawImgUrl: imgUrl });
  });

  console.log(`  取得: ${results.length}名`);
  results.slice(0, 8).forEach(t => console.log(`    ${t.name}  ${t.rawImgUrl}`));

  if (DRY_RUN) continue;

  // 画像アップロード＋登録
  let added = 0;
  for (const t of results) {
    let imageUrl = null;
    if (t.rawImgUrl) {
      const storageKey = `osaka_${shop.prefix}_${t.name.replace(/[^\w]/g, '_')}`;
      imageUrl = await uploadImage(t.rawImgUrl, storageKey, shop.url);
    }
    const id = `${shopId}_${t.name}`;
    await supabase.from('therapists').insert({ id, shop_id: shopId, name: t.name, image_url: imageUrl });
    added++;
    process.stdout.write('.');
  }
  process.stdout.write('\n');
  console.log(`  ✅ 登録: ${added}名`);
  await sleep(800);
}

console.log('\n完了');
