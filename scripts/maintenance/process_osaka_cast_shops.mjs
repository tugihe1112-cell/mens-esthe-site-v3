/**
 * 大阪 /cast/ ページ型 セラピスト登録
 * 対象: estama誤分類5店 + wordpress/castページ型11店 = 16店舗
 * 実行: node scripts/maintenance/process_osaka_cast_shops.mjs [--dry-run]
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
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Referer': url }, signal: AbortSignal.timeout(12000) });
    return res.ok ? res.text() : null;
  } catch { return null; }
}

async function uploadImage(url, storageKey, referer) {
  try {
    const cleanUrl = url.split('?')[0];
    const res = await fetch(cleanUrl, { headers: { 'User-Agent': UA, 'Referer': referer }, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = cleanUrl.split('.').pop().toLowerCase().replace(/[^a-z]/g, '') || 'jpg';
    const key = `${storageKey}.${ext === 'gif' ? 'gif' : ext === 'png' ? 'png' : 'jpg'}`;
    const { error } = await supabase.storage.from('therapist-images').upload(key, buf, {
      contentType: `image/${key.endsWith('.gif') ? 'gif' : key.endsWith('.png') ? 'png' : 'jpeg'}`, upsert: true
    });
    if (error) return null;
    const { data } = supabase.storage.from('therapist-images').getPublicUrl(key);
    return data.publicUrl;
  } catch { return null; }
}

// 包括的な名前抽出（alt属性から）
function extractName(alt) {
  if (!alt) return null;
  let s = alt.trim();

  // ⚠DATE速報⚠ パターン除去 (ぽっちゃりエステの通知型)
  s = s.replace(/⚠[^⚠]*⚠/g, '').trim();

  // 先頭の記号・数字除去
  s = s.replace(/^[^ぁ-んァ-ヾ一-龯a-zA-Z0-9]*/, '').trim();

  // 店舗名プレフィックス除去: "athena(アテナ)" → ""
  s = s.replace(/^[^\)）]*[\)）]\s*/, '').trim();

  // スペース分割して最後のトークン
  const parts = s.split(/\s+/);
  let name = parts[parts.length - 1] || '';

  // 日付サフィックス除去: "るあ5月22日体験入店" → "るあ"
  name = name.replace(/\d+月\d+日.*$/, '').replace(/\d+\/\d+.*$/, '').trim();

  // 年齢括弧・敬称除去
  name = name.replace(/\(\d+\)$/, '').replace(/（\d+）$/, '').replace(/さん$/, '').trim();

  if (!name || name.length === 0 || name.length > 15) return null;
  const hasJP = /[ぁ-んァ-ヾ一-龯]/.test(name);
  const hasRomaji = /^[a-zA-Z][a-zA-Z\-\.]{1,14}$/.test(name);
  if (!hasJP && !hasRomaji) return null;
  if (/出勤|速報|空き|ご案内|立入|体験入店|イベント|キャンペーン|割引|求人|バナー|ボタン|メニュー/i.test(name)) return null;
  if (/^(NEW|SNS|LINE|Twitter|Instagram|TEL|FAX|WEB|URL)$/i.test(name)) return null;

  return name;
}

// data-p1からimageURL抽出
function extractImageUrl(datap1, base) {
  if (!datap1) return null;
  const defconMatch = datap1.match(/[?&]p=([^&]+)/);
  if (defconMatch) return `${base.replace(/\/+$/, '')}/${defconMatch[1]}`;
  if (datap1.startsWith('http')) return datap1.split('?')[0];
  if (datap1.startsWith('//')) return 'https:' + datap1.split('?')[0];
  return `${base.replace(/\/+$/, '')}${datap1.split('?')[0]}`;
}

// スクレイプ実行
async function scrapeCastPage(baseUrl, shopName) {
  const cleanBase = baseUrl.replace(/\/top$/, '').replace(/\/+$/, '');
  const castUrl = cleanBase + '/cast/';
  const html = await fetchHtml(castUrl);
  if (!html) return [];
  const $ = cheerio.load(html);
  const results = [], seen = new Set();

  // パターン1: data-p1 (rookie_cms / hi-to-de / katuo CDN)
  $('[data-p1*="upload/cast/"]').each((_, el) => {
    const datap1 = $(el).attr('data-p1') || '';
    const alt = $(el).attr('alt') || '';
    const name = extractName(alt);
    if (!name || seen.has(name)) return;
    seen.add(name);
    const imgUrl = extractImageUrl(datap1, cleanBase);
    results.push({ name, rawImgUrl: imgUrl });
  });

  // パターン2: img src に cast/ を含む (cast/main, cast/thumb, upload/cast/)
  if (results.length === 0) {
    $('img[src*="cast/main"], img[src*="cast/thumb"], img[src*="upload/cast/"]').each((_, el) => {
      const src = $(el).attr('src') || '';
      // 100x100サムネイル(スケジュール通知用)を除外
      if (src.includes('/100x100/') || src.includes('noimage') || src.includes('no_image')) return;
      const alt = $(el).attr('alt') || '';
      const name = extractName(alt);
      if (!name || seen.has(name)) return;
      seen.add(name);
      const imgUrl = src.startsWith('http') ? src.split('?')[0]
                   : src.startsWith('//') ? 'https:' + src.split('?')[0]
                   : cleanBase + src.split('?')[0];
      results.push({ name, rawImgUrl: imgUrl });
    });
  }

  return results;
}

// ===== 店舗リスト =====
// estama誤分類(実はrookie_cms CDN) + wordpress/castページ型
const SHOPS = [
  // estama group → actually hi-to-de/katuo CDN (rookie_cms pattern)
  { id: 'osaka_nippombashi_luxeazルクシーズ',      url: 'https://luxeaz-esthe.com/top',        prefix: 'luxeaz' },
  { id: 'osaka_nippombashi_pinkyringピンキーリン',  url: 'https://pinkyring-osaka.com/top',     prefix: 'pinkyring' },
  { id: 'osaka_umeda_aromafeniceアロマフ',          url: 'https://fenice-osaka.com/top',        prefix: 'fenice' },
  { id: 'osaka_umeda_richessespaリシェス',          url: 'https://richesse-spa.com/top',        prefix: 'richesse' },
  { id: 'osaka_umeda_ばするむ',                     url: 'https://bath-room.jp/top',            prefix: 'bathroom' },

  // wordpress group → /cast/ + cast/* images
  { id: 'osaka_nippombashi_naniwajoshiなにわ女',    url: 'https://naniwajoshi.com/',            prefix: 'naniwajoshi' },
  { id: 'osaka_sakaihigashi_royalmadamロイヤルマ',  url: 'https://royal-madam.com/top',         prefix: 'royalmadam' },
  { id: 'osaka_sakaihigashi_yoluspaヨルスパ堺東店', url: 'https://yoluosaka-spa.com/top',       prefix: 'yoluspa' },
  { id: 'osaka_sakaihonmachi_aquaspaアクアスパ',    url: 'https://aquaspa-osaka.com/',          prefix: 'aquaspa' },
  { id: 'osaka_sakaihonmachi_fantasyファンタジー',   url: 'https://fantasy-spa.com/',            prefix: 'fantasy' },
  { id: 'osaka_sakaihonmachi_堺筋本町倶楽部',       url: 'https://sakahon-club.com/',           prefix: 'sakahon' },
  { id: 'osaka_shinsaibashi_sevenluckspaセブン',    url: 'https://seven-luck-spa.com/',         prefix: 'sevenluck' },
  { id: 'osaka_shinsosaka_chackmateチェックメイ',   url: 'https://o-checkmate.com/',            prefix: 'checkmate' },
  { id: 'osaka_shinsosaka_彼女ん家',                url: 'https://kanojonti.com/',              prefix: 'kanojonti' },
  { id: 'osaka_umeda_edenspaエデンスパ',            url: 'https://eden-spa.jp/',                prefix: 'edenspa' },
  { id: 'osaka_umeda_luanaspaルアナスパ',           url: 'https://luanaspa.net/',               prefix: 'luanaspa' },
  { id: 'osaka_umeda_小悪魔aliceアリス',            url: 'https://koakuma-alice.com/top',       prefix: 'koakuma' },

  // ぷちどり～む: upload/cast/{id}_{ts}.jpg + alt "SHOP NAME日付体験入店"
  { id: 'osaka_sakaihonmachi_ぷちどりむ',           url: 'https://petitpetit-dream.com/',       prefix: 'puchidoream' },
];

console.log(`大阪 /cast/ 型 セラピスト登録${DRY_RUN ? ' [DRY-RUN]' : ''}`);
console.log(`対象: ${SHOPS.length}店舗\n`);

let totalAdded = 0, totalFailed = 0;

for (const shop of SHOPS) {
  console.log(`${shop.id.split('_').slice(-1)[0]}`);
  console.log(`  URL: ${shop.url}`);

  // 既登録チェック
  const { count } = await supabase.from('therapists').select('id', { count: 'exact' }).eq('shop_id', shop.id);
  if (count > 0) { console.log(`  スキップ（既存 ${count}件）`); continue; }

  const results = await scrapeCastPage(shop.url, shop.id);
  console.log(`  取得: ${results.length}名`);
  if (results.length === 0) { totalFailed++; await sleep(500); continue; }

  results.slice(0, 5).forEach(t => console.log(`    ${t.name}  ${t.rawImgUrl?.slice(0, 65)}`));

  if (DRY_RUN) { await sleep(600); continue; }

  let added = 0;
  for (const t of results) {
    let imageUrl = null;
    if (t.rawImgUrl) {
      const fileBase = t.rawImgUrl.split('/').pop().split('?')[0].replace(/[^a-z0-9._-]/gi, '_').slice(0, 40);
      imageUrl = await uploadImage(t.rawImgUrl, `${shop.prefix}_${fileBase}`, shop.url);
    }
    const id = `${shop.id}_${t.name}`;
    const { error } = await supabase.from('therapists').insert({ id, shop_id: shop.id, name: t.name, image_url: imageUrl });
    if (!error) { added++; process.stdout.write('.'); }
    else process.stdout.write('!');
  }
  process.stdout.write('\n');
  console.log(`  ✅ 登録: ${added}名`);
  totalAdded += added;
  await sleep(800);
}

console.log(`\n============================`);
console.log(`合計 登録: ${totalAdded}名 / 失敗: ${totalFailed}`);
console.log(`dry-run: ${DRY_RUN}`);
