/**
 * 大阪 残り4店舗 + Aroma oneノイズ削除
 * 1. Aroma one: ノイズ2件削除（Xアカウント・ゲリラ割）
 * 2. マダムスパ: spacer300x450.png + background-image パターン
 * 3. Deep Chill: 同上
 * 4. BESTSTAR (→Oil&Me): /manage/image/up/ パターン
 * 5. 絶頂SPA: 同上
 * 実行: node scripts/maintenance/fix_osaka_remaining4.mjs [--dry-run]
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

async function fetchHtml(url, referer) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Referer': referer || url }, signal: AbortSignal.timeout(12000) });
    return res.ok ? res.text() : null;
  } catch { return null; }
}

async function uploadImage(rawUrl, storageKey, referer) {
  try {
    const url = rawUrl.split('?')[0];
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Referer': referer }, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = url.split('.').pop().toLowerCase().replace(/[^a-z]/g,'') || 'jpg';
    const safeExt = ['jpg','jpeg','png','gif','webp'].includes(ext) ? ext : 'jpg';
    const key = `${storageKey}.${safeExt}`;
    const { error } = await supabase.storage.from('therapist-images').upload(key, buf, {
      contentType: `image/${safeExt === 'jpg' ? 'jpeg' : safeExt}`, upsert: true
    });
    if (error) return null;
    return supabase.storage.from('therapist-images').getPublicUrl(key).data.publicUrl;
  } catch { return null; }
}

async function insertTherapists(shopId, results, prefix, referer) {
  let added = 0;
  for (const t of results) {
    let imageUrl = null;
    if (t.rawImgUrl) {
      imageUrl = await uploadImage(t.rawImgUrl, `${prefix}_${t.storageId}`, referer);
    }
    const { error } = await supabase.from('therapists').insert({
      id: `${shopId}_${t.name}`, shop_id: shopId, name: t.name, image_url: imageUrl
    });
    if (!error) { added++; process.stdout.write('.'); }
    else process.stdout.write('!');
  }
  process.stdout.write('\n');
  return added;
}

// ===== PART 0: Aroma one ノイズ削除 =====
console.log('=== PART 0: Aroma one ノイズ削除 ===');
const AROMA_ONE_ID = 'osaka_nippombashi_aromaoneアロマワン';
const NOISE_NAMES = ['店舗Ｘアカウント', 'ゲリラ割2000円OFF'];

for (const name of NOISE_NAMES) {
  const { data } = await supabase.from('therapists').select('id,name').eq('shop_id', AROMA_ONE_ID).eq('name', name);
  if (data?.length) {
    console.log(`  削除: "${name}" (${data.length}件)`);
    if (!DRY_RUN) await supabase.from('therapists').delete().eq('shop_id', AROMA_ONE_ID).eq('name', name);
  } else {
    console.log(`  スキップ: "${name}" (存在しない)`);
  }
}
console.log();

// ===== PART 1: スペーサー + background-image パターン =====
// マダムスパ・Deep Chill → img[src*="spacer300x450"] のstyle属性からbg画像、alt属性から名前

async function scrapeSpacerBg(siteUrl, staffPath, prefix) {
  const base = siteUrl.replace(/\/+$/, '');
  const url = base + staffPath;
  const html = await fetchHtml(url, siteUrl);
  if (!html) { console.log(`  ✗ fetch失敗: ${url}`); return []; }

  const $ = cheerio.load(html);
  const results = [], seen = new Set();

  // パターン1: img[src*="spacer"][alt*="の写真"] + style or 親のstyle
  $('img[src*="spacer300x450"], img[src*="spacer"]').each((_, el) => {
    const alt = $(el).attr('alt') || '';
    const style = $(el).attr('style') || '';

    // 名前: alt から "さんの写真" 除去
    let name = alt.replace(/さんの写真$/, '').replace(/\s+/g, ' ').trim();
    if (!name) {
      // alt なし → 親要素のテキスト
      name = $(el).closest('li,div,article').find('p,span,h3,h4').first().text().trim();
      name = name.split(/[\s\n]/)[0].slice(0, 10);
    }
    name = name.replace(/\(\d+\)/g, '').replace(/（\d+）/g, '').trim();
    if (!name || name.length > 15) return;
    if (!/[ぁ-んァ-ヾ一-龯]/.test(name)) return;
    if (/出勤|速報|イベント|キャンペーン|割引|求人|logo|LINE|WEB/.test(name)) return;

    // 画像URL: styleのbackground-image
    let imgUrl = null;
    const bgMatch = style.match(/url\(['"]?([^'")\s]+)['"]?\)/);
    if (bgMatch) {
      const path = bgMatch[1];
      imgUrl = path.startsWith('http') ? path : (path.startsWith('//') ? 'https:' + path : base + path);
    } else {
      // 親要素のstyleを確認
      const parentStyle = $(el).parent().attr('style') || '';
      const parentBg = parentStyle.match(/url\(['"]?([^'")\s]+)['"]?\)/);
      if (parentBg) {
        const path = parentBg[1];
        imgUrl = path.startsWith('http') ? path : (path.startsWith('//') ? 'https:' + path : base + path);
      }
    }

    if (seen.has(name)) return;
    seen.add(name);

    const fileId = imgUrl ? imgUrl.split('/').pop().split('.')[0].replace(/[^a-z0-9]/gi, '_').slice(0, 30) : name;
    results.push({ name, rawImgUrl: imgUrl, storageId: fileId });
  });

  // パターン2: img[alt*="さんの写真"] (src関係なし)
  if (results.length === 0) {
    $('img[alt*="さんの写真"]').each((_, el) => {
      const alt = $(el).attr('alt') || '';
      const style = $(el).attr('style') || '';
      let name = alt.replace(/さんの写真$/, '').trim();
      name = name.replace(/\(\d+\)/g, '').replace(/（\d+）/g, '').trim();
      if (!name || name.length > 15) return;
      if (!/[ぁ-んァ-ヾ一-龯]/.test(name)) return;

      let imgUrl = null;
      const bgMatch = style.match(/url\(['"]?([^'")\s]+)['"]?\)/);
      if (bgMatch) {
        const path = bgMatch[1];
        imgUrl = path.startsWith('http') ? path : (path.startsWith('//') ? 'https:' + path : base + path);
      }

      if (seen.has(name)) return;
      seen.add(name);
      const fileId = imgUrl ? imgUrl.split('/').pop().split('.')[0].replace(/[^a-z0-9]/gi, '_').slice(0, 30) : name;
      results.push({ name, rawImgUrl: imgUrl, storageId: fileId });
    });
  }

  return results;
}

// ===== PART 2: /manage/image/up/ パターン =====
// BESTSTAR (Oil&Me) / 絶頂SPA → /cast/ ページ
// img src = /manage/image/up/{ts}_{hash}_cast_subphoto_img_url_0_w...webp
// alt = セラピスト名 (要確認)

async function scrapeManageImage(siteUrl, prefix) {
  const base = siteUrl.replace(/\/+$/, '');
  const url = base + '/cast/';
  const html = await fetchHtml(url, siteUrl);
  if (!html) { console.log(`  ✗ fetch失敗: ${url}`); return []; }

  const $ = cheerio.load(html);
  const results = [], seen = new Set();

  $('img[src*="/manage/image/up/"]').each((_, el) => {
    const src = $(el).attr('src') || '';
    const alt = $(el).attr('alt') || '';

    if (src.includes('noimage') || src.includes('no_image')) return;
    // ヘッダー/バナー画像をスキップ: cast_subphoto または cast_main 以外
    if (!src.includes('cast_subphoto') && !src.includes('cast_main') && !src.includes('cast_photo')) {
      // ランキング/バナー除外: w1920, slide, banner, shop
      if (/w1920|slide|banner|shop_|logo|header/.test(src)) return;
    }

    let name = alt.trim();
    // "プロフィール" 等のノイズ
    if (!name || /プロフィール|写真|アイコン|バナー|スライド|ロゴ/i.test(name)) return;
    name = name.replace(/\(\d+\)/g, '').replace(/（\d+）/g, '').replace(/さん$/, '').trim();
    if (!name || name.length > 15) return;
    if (!/[ぁ-んァ-ヾ一-龯a-zA-Z]/.test(name)) return;
    if (/出勤|速報|体験入店|イベント|キャンペーン|割引|求人/.test(name)) return;

    if (seen.has(name)) return;
    seen.add(name);

    const imgUrl = src.startsWith('http') ? src : (src.startsWith('//') ? 'https:' + src : base + src);
    const fileId = src.split('/').pop().split('.')[0].replace(/[^a-z0-9]/gi, '_').slice(0, 35);
    results.push({ name, rawImgUrl: imgUrl.split('?')[0], storageId: fileId });
  });

  // altがなければ、親要素のテキストから名前を取得
  if (results.length === 0) {
    $('img[src*="/manage/image/up/"]').each((_, el) => {
      const src = $(el).attr('src') || '';
      if (src.includes('noimage') || /w1920|slide|banner|shop_|logo|header/.test(src)) return;
      if (!src.includes('cast')) return;

      // 近くのテキストから名前を探す
      const container = $(el).closest('li,article,div.cast,div.therapist,.item,.girl');
      const nameEl = container.find('h2,h3,h4,.name,.cast-name,p').first();
      let name = nameEl.text().trim().split(/[\s\n]/)[0].slice(0, 10);
      name = name.replace(/\(\d+\)/g, '').replace(/（\d+）/g, '').trim();
      if (!name || name.length > 15) return;
      if (!/[ぁ-んァ-ヾ一-龯a-zA-Z]/.test(name)) return;

      if (seen.has(name)) return;
      seen.add(name);
      const imgUrl = src.startsWith('http') ? src : (src.startsWith('//') ? 'https:' + src : base + src);
      const fileId = src.split('/').pop().split('.')[0].replace(/[^a-z0-9]/gi, '_').slice(0, 35);
      results.push({ name, rawImgUrl: imgUrl.split('?')[0], storageId: fileId });
    });
  }

  return results;
}

// ===== 実行 =====
const SHOPS = [
  {
    type: 'spacer', name: 'マダムスパ', domain: 'madam-spa.net',
    url: 'http://www.madam-spa.net/', staffPath: '/staff/', prefix: 'madamspa'
  },
  {
    type: 'spacer', name: 'Deep Chill', domain: 'deep-chill.info',
    url: 'http://www.deep-chill.info/', staffPath: '/staff/', prefix: 'deepchill'
  },
  {
    type: 'manage', name: 'BESTSTAR→Oil&Me', domain: 'beststar-osaka.com',
    url: 'https://beststar-osaka.com/', staffPath: '/cast/', prefix: 'beststar'
  },
  {
    type: 'manage', name: '絶頂SPA', domain: 'zechoo-spa.com',
    url: 'https://zechoo-spa.com/', staffPath: '/cast/', prefix: 'zechoo'
  },
];

let totalAdded = 0;

for (const shop of SHOPS) {
  console.log(`\n=== ${shop.name} (${shop.type}) ===`);

  const { data: dbShops } = await supabase.from('shops').select('id,name').ilike('website_url', `%${shop.domain}%`);
  if (!dbShops?.length) { console.log(`  shop not found in DB`); continue; }
  const shopId = dbShops[0].id;
  console.log(`  shop_id: ${shopId}`);

  const { count } = await supabase.from('therapists').select('id', { count: 'exact' }).eq('shop_id', shopId);
  if (count > 0) { console.log(`  スキップ（既存 ${count}件）`); continue; }

  let results = [];
  if (shop.type === 'spacer') results = await scrapeSpacerBg(shop.url, shop.staffPath, shop.prefix);
  else if (shop.type === 'manage') results = await scrapeManageImage(shop.url, shop.prefix);

  console.log(`  取得: ${results.length}名`);
  results.slice(0, 5).forEach(t => console.log(`    ${t.name}  ${t.rawImgUrl?.slice(0, 70)}`));

  if (results.length === 0) {
    console.log('  → Chrome必要またはセラピスト非公開');
    continue;
  }

  if (DRY_RUN) { await sleep(600); continue; }

  const added = await insertTherapists(shopId, results, shop.prefix, shop.url);
  console.log(`  ✅ 登録: ${added}名`);
  totalAdded += added;
  await sleep(800);
}

console.log(`\n============================`);
console.log(`合計 登録: ${totalAdded}名`);
if (DRY_RUN) console.log('(dry-run)');
