/**
 * 千葉・埼玉 新規登録店舗 セラピスト一括登録
 * 実行: node scripts/maintenance/process_chiba_saitama_therapists.mjs [--dry-run] [--shop shopId]
 */
import fs from 'fs';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const DRY_RUN = process.argv.includes('--dry-run');
const ONLY_SHOP = process.argv.find((a, i) => process.argv[i - 1] === '--shop');

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(
  getEnv('VITE_SUPABASE_URL'),
  getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('VITE_SUPABASE_ANON_KEY')
);

const sleep = ms => new Promise(r => setTimeout(r, ms));
const BUCKET = 'therapist-images';

async function fetchHtml(url, referer) {
  const headers = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };
  if (referer) headers['Referer'] = referer;
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function uploadImage(imageUrl, storageKey, referer) {
  try {
    const headers = { 'User-Agent': 'Mozilla/5.0' };
    if (referer) headers['Referer'] = referer;
    const res = await fetch(imageUrl, { headers, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = imageUrl.split('?')[0].split('.').pop().toLowerCase().replace(/[^a-z]/, '') || 'jpg';
    const key = `${storageKey}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(key, buf, {
      contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
      upsert: true,
    });
    if (error) return null;
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(key);
    return data.publicUrl;
  } catch { return null; }
}

function isNoise(name) {
  if (!name || name.length === 0) return true;
  if (name.length > 15) return true;
  if (/イベント|キャンペーン|割引|求人|banner|logo|icon|LINE|ライン凍結|Twitter|TOP|新人|体験|体入|ルーキー|降臨|超激|ランク|コース|スタッフ|セラピスト(?!$)|出勤|在籍|予約|電話|アクセス|システム|料金|お知らせ|コンセプト|トップ|アルバイト|募集|エステナビ|エステ図鑑|リフジョブ|エステラブ|マニアックス|口コミ|クレジット|フッター|リフラク|お問い合わせ|営業時間|最新トピック|ピックアップ|ご新規様|店休|割$|ナビ$|MAP$/i.test(name)) return true;
  if (!/[ぁ-んァ-ヾ一-龯]/.test(name)) return true;
  // 日付パターン（06/08(月) など）
  if (/^\d+\/\d+/.test(name)) return true;
  // 記号から始まるもの
  if (/^[★✉☆◆■●▲▶＊※]/.test(name)) return true;
  // 長い文章（名前ではない）
  if (name.includes('から徒歩') || name.includes('ご案内') || name.includes('ご予約') || name.includes('登録は')) return true;
  return false;
}

function cleanName(name) {
  return name
    .replace(/さんの写真$/, '')
    .replace(/\([^()]*\)/g, '') // (reading)除去
    .replace(/（[^（）]*）/g, '') // （reading）除去
    .replace(/　/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^\d+\/\d+.*/, '') // 日付プレフィックス除去
    .replace(/\d+\/\d+初出勤$/, '')
    .replace(/エステティシャン\s*/, '')
    .trim();
}

// ===== パターン別スクレイパー =====

// LEON SPA系 (/photos/{id}/raw_{id}.jpg)
async function scrapeLeonSpa(castUrl, base) {
  const html = await fetchHtml(castUrl);
  const $ = cheerio.load(html);
  const results = new Map();
  $('img[src*="/photos/"]').each((_, el) => {
    const src = $(el).attr('src') || '';
    const alt = cleanName($(el).attr('alt') || '');
    if (!alt || isNoise(alt)) return;
    const match = src.match(/\/photos\/(\d+)\/raw_\d+/);
    if (!match) return;
    const photoId = match[1];
    const imgUrl = `${base}/photos/${photoId}/raw_${photoId}.jpg`;
    if (!results.has(alt)) results.set(alt, imgUrl);
  });
  return [...results.entries()].map(([name, img]) => ({ name, imageUrl: img }));
}

// WordPress系 (wp-content/uploads)
async function scrapeWordpress(castUrl, base) {
  const html = await fetchHtml(castUrl, base);
  const $ = cheerio.load(html);
  const results = new Map();
  $('img').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src') || '';
    const alt = cleanName($(el).attr('alt') || '');
    if (!alt || isNoise(alt)) return;
    if (!src.includes('wp-content/uploads') && !src.includes('wp-content')) return;
    if (src.includes('logo') || src.includes('banner') || src.includes('icon') || src.includes('credit')) return;
    if (!results.has(alt)) results.set(alt, src.startsWith('http') ? src : `${base}${src}`);
  });
  return [...results.entries()].map(([name, img]) => ({ name, imageUrl: img }));
}

// caskan.com CDN
async function scrapeCaskan(castUrl) {
  const html = await fetchHtml(castUrl);
  const $ = cheerio.load(html);
  const results = new Map();
  $('img[src*="caskan/img/cast_tmb"]').each((_, el) => {
    const src = $(el).attr('src') || '';
    if (src.includes('comingsoon')) return;
    const alt = cleanName($(el).attr('alt') || '');
    if (!alt || isNoise(alt)) return;
    const match = src.match(/cast_tmb\/\d+_(\d+)\./);
    if (!results.has(alt)) results.set(alt, { url: src, castId: match?.[1] || alt });
  });
  return [...results.entries()].map(([name, d]) => ({ name, imageUrl: d.url, storageKey: `caskan_${d.castId}` }));
}

// images_staff パターン
async function scrapeImagesStaff(castUrl, base) {
  const html = await fetchHtml(castUrl, base);
  const $ = cheerio.load(html);
  const results = new Map();
  $('img[src*="images_staff"]').each((_, el) => {
    const src = $(el).attr('src') || '';
    let alt = cleanName($(el).attr('alt') || '');
    alt = alt.replace(/^【[^】]*】\s*/, ''); // 【地区名】 プレフィックス除去
    if (!alt || isNoise(alt)) return;
    const imgUrl = src.startsWith('http') ? src : `${base}/${src.replace(/^\//, '')}`;
    if (!results.has(alt)) results.set(alt, imgUrl);
  });
  return [...results.entries()].map(([name, img]) => ({ name, imageUrl: img }));
}

// ml_11_1 background-image パターン（「さんの写真」パターン）
async function scrapeMl11Bg(castUrl, base) {
  const html = await fetchHtml(castUrl, base);
  const $ = cheerio.load(html);
  const results = new Map();
  $('img[alt*="さんの写真"]').each((_, el) => {
    const name = cleanName($(el).attr('alt') || '');
    if (!name || isNoise(name)) return;
    const style = $(el).attr('style') || $(el).parent().attr('style') || '';
    const m = style.match(/url\(['"]?([^'")\s]+)['"]?\)/);
    let imgUrl = null;
    if (m) {
      imgUrl = m[1].startsWith('http') ? m[1].split('?')[0] : `${base}${m[1].split('?')[0]}`;
    }
    if (!results.has(name)) results.set(name, imgUrl);
  });
  return [...results.entries()].map(([name, img]) => ({ name, imageUrl: img }));
}

// PREMIUM SPA CMS (/data/staff/{id}/stf_{hash}.jpg)
async function scrapePremiumSpa(castUrl, base) {
  const html = await fetchHtml(castUrl, base);
  const $ = cheerio.load(html);
  const results = new Map();
  $('[style*="/data/staff/"]').each((_, el) => {
    const style = $(el).attr('style') || '';
    const m = style.match(/url\(['"]?([^'")\s]+stf_[^'")\s]+)['"]?\)/);
    if (!m) return;
    const imgUrl = m[1].startsWith('http') ? m[1] : `${base}${m[1]}`;
    // 名前は近くのテキスト要素から
    const nameEl = $(el).next().find('[class*="name"], h3, h4, p').first()
      || $(el).siblings('[class*="name"]').first()
      || $(el).parent().find('[class*="name"], h3, h4').first();
    const name = cleanName(nameEl.text().trim() || $(el).closest('[class*="cast"], [class*="staff"]').find('[class*="name"], h3, h4').first().text().trim());
    if (!name || isNoise(name)) return;
    const staffId = m[1].match(/\/staff\/(\d+)\//)?.[1] || name;
    if (!results.has(name)) results.set(name, { url: imgUrl, staffId });
  });
  return [...results.entries()].map(([name, d]) => ({ name, imageUrl: d.url, storageKey: `premium_${d.staffId}` }));
}

// PREMIUM SPA - alt+bg variant (omiya_ace)
async function scrapePremiumSpaAlt(castUrl, base) {
  const html = await fetchHtml(castUrl, base);
  const $ = cheerio.load(html);
  const results = new Map();
  // img[alt*="エステティシャン"] パターン
  $('img[alt]').each((_, el) => {
    const alt = $(el).attr('alt') || '';
    const src = $(el).attr('src') || '';
    const style = $(el).attr('style') || '';
    const bgMatch = style.match(/url\(['"]?([^'")\s]+)['"]?\)/);
    const rawName = cleanName(alt);
    if (!rawName || isNoise(rawName)) return;
    // bg imageがある場合はそちらを使用
    const imgSrc = bgMatch ? (bgMatch[1].startsWith('http') ? bgMatch[1] : `${base}${bgMatch[1]}`)
                 : (src.includes('/data/staff/') ? (src.startsWith('http') ? src : `${base}${src}`) : null);
    if (!results.has(rawName)) results.set(rawName, imgSrc);
  });
  // background-image styleのある要素からも取得
  $('[style*="/data/staff/"]').each((_, el) => {
    const style = $(el).attr('style') || '';
    const m = style.match(/url\(['"]?([^'")\s]+)['"]?\)/);
    if (!m) return;
    const imgUrl = m[1].startsWith('http') ? m[1] : `${base}${m[1]}`;
    const staffId = m[1].match(/\/staff\/(\d+)\//)?.[1];
    // テキスト要素から名前取得
    const parent = $(el).closest('li, div.item, div.cast, article');
    const name = cleanName(parent.find('h2,h3,h4,.name,p').first().text().trim());
    if (name && !isNoise(name) && !results.has(name)) {
      results.set(name, { url: imgUrl, staffId });
    }
  });
  return [...results.entries()].map(([name, d]) => ({
    name,
    imageUrl: typeof d === 'string' ? d : d?.url,
    storageKey: typeof d === 'object' ? `premium_${d?.staffId}` : undefined
  }));
}

// Mirajour CMS (/optImg/{shopId}/item/{itemId}/{hash}_640_0.jpg)
async function scrapeMirajour(castUrl, base) {
  const html = await fetchHtml(castUrl, base);
  const $ = cheerio.load(html);
  const results = new Map();
  $('img[src*="/optImg/"]').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || '';
    const alt = cleanName($(el).attr('alt') || '');
    if (!alt || alt.endsWith('2') || isNoise(alt)) return;
    const imgUrl = src.startsWith('http') ? src : `${base}${src}`;
    if (!results.has(alt)) results.set(alt, imgUrl);
  });
  return [...results.entries()].map(([name, img]) => ({ name, imageUrl: img }));
}

// Cloudflare Images (lovers)
async function scrapeCloudflare(castUrl, base) {
  const html = await fetchHtml(castUrl, base);
  const $ = cheerio.load(html);
  const seen = new Map();
  $('img[src*="imagedelivery.net"]').each((_, el) => {
    const src = $(el).attr('src') || '';
    const alt = cleanName($(el).attr('alt') || '');
    if (!src || src.includes('logo') || src.includes('banner')) return;
    const uuid = src.match(/imagedelivery\.net\/[^/]+\/([^/]+)\//)?.[1];
    if (!uuid || seen.has(uuid)) return;
    // 近くのテキストから名前を探す
    const parent = $(el).closest('li, div, article');
    let name = '';
    parent.find('p, span, h3, h4, .name').each((_, ne) => {
      const t = $(ne).text().trim();
      if (/^[ぁ-んァ-ヾ一-龯\s]{1,10}$/.test(t) && !isNoise(t)) { name = t; return false; }
    });
    if (!name) name = alt;
    if (!name || isNoise(name)) return;
    seen.set(uuid, { name, url: `${src.replace(/\/[^/]+$/, '')}/public` });
  });
  const deduped = new Map();
  for (const [, d] of seen) {
    if (!deduped.has(d.name)) deduped.set(d.name, d.url);
  }
  return [...deduped.entries()].map(([name, img]) => ({ name, imageUrl: img }));
}

// aroma_liberty (/therapist/{id}_1.jpg)
async function scrapeAromaLiberty(castUrl, base) {
  const html = await fetchHtml(castUrl, base);
  const $ = cheerio.load(html);
  const results = new Map();
  $('img[src*="therapist/"]').each((_, el) => {
    const src = $(el).attr('src') || '';
    if (!src.match(/therapist\/\d+_1\.jpg/)) return;
    const id = src.match(/therapist\/(\d+)_1/)?.[1];
    // 名前は周辺のテキスト
    const parent = $(el).closest('li, div.cast, div.staff, article, div.girl');
    const name = cleanName(parent.find('p, span, h3, h4, .name').filter((_, ne) => /[ぁ-んァ-ヾ一-龯]/.test($(ne).text())).first().text().trim());
    if (!name || isNoise(name)) return;
    const imgUrl = src.startsWith('http') ? src.split('?')[0] : `${base}/${src.replace(/^\//, '').split('?')[0]}`;
    if (!results.has(name)) results.set(name, { url: imgUrl, id });
  });
  return [...results.entries()].map(([name, d]) => ({ name, imageUrl: d.url, storageKey: `aromaliby_${d.id}` }));
}

// テキスト名前のみ（画像なし）
async function scrapeTextOnly(castUrl, base) {
  const html = await fetchHtml(castUrl, base);
  const $ = cheerio.load(html);
  const names = new Set();
  $('p, span, td, li, div').each((_, el) => {
    const t = $(el).text().trim();
    if (/^[ぁ-んァ-ヾ一-龯]{1,8}$/.test(t) && !isNoise(t)) names.add(t);
  });
  return [...names].map(name => ({ name, imageUrl: null }));
}

// kawagoe_king: JS lazy → alt のみ
async function scrapeKingAltOnly(castUrl) {
  const html = await fetchHtml(castUrl);
  const $ = cheerio.load(html);
  const names = new Set();
  $('img[alt]').each((_, el) => {
    const alt = cleanName($(el).attr('alt') || '');
    if (!alt || isNoise(alt)) return;
    names.add(alt);
  });
  return [...names].map(name => ({ name, imageUrl: null }));
}

// re-db.com: name(年齢) パターンのみ抽出、画像は対応させる
async function scrapeRedbImages(castUrl, base) {
  const html = await fetchHtml(castUrl, base);
  const $ = cheerio.load(html);

  // 画像（重複除去）
  const imgMap = new Map();
  $('img[src*="files.re-db.com"]').each((_, el) => {
    const src = $(el).attr('src') || '';
    const hexId = src.match(/file\/([a-f0-9]+)\./)?.[1];
    if (hexId && !imgMap.has(hexId)) imgMap.set(hexId, src);
  });
  const imgs = [...imgMap.entries()]; // [[hexId, url], ...]

  // name(年齢) パターンのテキストを収集
  const nameAgeRe = /^([ぁ-んァ-ヾ一-龯a-zA-Z\s　]{1,12})\((\d{2,3})\)$/;
  const names = [];
  $('*').each((_, el) => {
    const t = $(el).clone().children().remove().end().text().trim();
    const m = t.match(nameAgeRe);
    if (m) {
      const name = m[1].trim();
      if (!names.includes(name)) names.push(name);
    }
  });

  // 画像と名前を対応させる（順番ベース）
  const count = Math.min(imgs.length, names.length);
  return Array.from({ length: count }, (_, i) => ({
    name: names[i],
    imageUrl: imgs[i][1],
    storageKey: `redb_${imgs[i][0]}`
  }));
}

// ===== DB登録 =====
async function insertTherapists(shopId, therapists) {
  if (therapists.length === 0) return { inserted: 0, skipped: 0 };

  // 既存確認
  const { data: existing } = await supabase.from('therapists').select('id, name').eq('shop_id', shopId);
  const existingNames = new Set(existing?.map(t => t.name.replace(/[\s　]/g, '')) || []);

  let inserted = 0, skipped = 0;
  for (const t of therapists) {
    const normName = t.name.replace(/[\s　]/g, '');
    if (existingNames.has(normName)) { skipped++; continue; }

    let imageUrl = t.imageUrl || null;

    // 画像のStorage アップロード
    if (imageUrl && !DRY_RUN) {
      const storageKey = t.storageKey || `${shopId}_${normName}`.replace(/[^\w-]/g, '_');
      const uploaded = await uploadImage(imageUrl, storageKey, imageUrl.includes('wp-content') ? `https://${new URL(imageUrl).hostname}/` : undefined);
      if (uploaded) imageUrl = uploaded;
      await sleep(200);
    }

    const record = {
      id: `${shopId}_${t.name}`,
      shop_id: shopId,
      name: t.name,
      image_url: imageUrl,
    };

    if (DRY_RUN) {
      console.log(`    + ${t.name} | img=${imageUrl ? '✅' : '❌'}`);
      inserted++;
    } else {
      const { error } = await supabase.from('therapists').insert(record);
      if (error && error.code !== '23505') {
        console.log(`    ❌ ${t.name}: ${error.message}`);
      } else {
        inserted++;
        existingNames.add(normName);
      }
    }
  }
  return { inserted, skipped };
}

// ===== 店舗設定 =====
const SHOPS = [
  // --- LEON SPA ---
  { id: 'chiba_chiba_spa_dream', castUrl: 'https://spa-dream.com/girl', scraper: () => scrapeLeonSpa('https://spa-dream.com/girl', 'https://spa-dream.com') },
  { id: 'chiba_kashiwa_eden_spa', castUrl: 'https://eden-spa.net/girl', scraper: () => scrapeLeonSpa('https://eden-spa.net/girl', 'https://eden-spa.net') },

  // --- WordPress ---
  { id: 'chiba_matsudo_rose', castUrl: 'https://esthetic-rose.com/cast', scraper: () => scrapeWordpress('https://esthetic-rose.com/cast', 'https://esthetic-rose.com') },
  { id: 'chiba_chiba_suhada_spa', castUrl: 'https://suhadaspa.vsw.jp/chiba/therapist', scraper: () => scrapeWordpress('https://suhadaspa.vsw.jp/chiba/therapist', 'https://suhadaspa.vsw.jp') },
  { id: 'chiba_kashiwa_suhada_spa', castUrl: 'https://suhadaspa.vsw.jp/kashiwa/therapist', scraper: () => scrapeWordpress('https://suhadaspa.vsw.jp/kashiwa/therapist', 'https://suhadaspa.vsw.jp') },
  { id: 'chiba_kashiwa_m_labo_spa', castUrl: 'https://mlabospa.vsw.jp/kashiwa/therapist', scraper: () => scrapeWordpress('https://mlabospa.vsw.jp/kashiwa/therapist', 'https://mlabospa.vsw.jp') },
  { id: 'saitama_urawa_kurenai', castUrl: 'https://urawa-kurenai.com/staff', scraper: () => scrapeWordpress('https://urawa-kurenai.com/staff', 'https://urawa-kurenai.com') },
  { id: 'saitama_urawa_aroma_chiaful', castUrl: 'https://aroma-chiaful.com/cast', scraper: () => scrapeWordpress('https://aroma-chiaful.com/cast', 'https://aroma-chiaful.com') },
  { id: 'saitama_kawagoe_re_fle_spa', castUrl: 'https://www.re-fre-spa.com/therapist', scraper: () => scrapeWordpress('https://www.re-fre-spa.com/therapist', 'https://www.re-fre-spa.com') },
  { id: 'saitama_kawagoe_otona_neverland', castUrl: 'https://otona-neverland.net/cast', scraper: () => scrapeWordpress('https://otona-neverland.net/cast', 'https://otona-neverland.net') },
  { id: 'saitama_koshigaya_boku_no_esthe', castUrl: 'https://boku-este.jp/cast', scraper: () => scrapeWordpress('https://boku-este.jp/cast', 'https://boku-este.jp') },

  // --- caskan.com ---
  { id: 'saitama_urawa_romeo', castUrl: 'https://aromaspa-romeo.com/therapist', scraper: () => scrapeCaskan('https://aromaspa-romeo.com/therapist') },
  { id: 'saitama_koshigaya_red_ribbon', castUrl: 'https://redribbon-koshigaya.com/therapist', scraper: () => scrapeCaskan('https://redribbon-koshigaya.com/therapist') },
  { id: 'saitama_tokorozawa_audition', castUrl: 'https://tokorozawa-audition.com/therapist', scraper: () => scrapeCaskan('https://tokorozawa-audition.com/therapist') },

  // --- images_staff ---
  { id: 'chiba_matsudo_himitsu_no_tobira', castUrl: 'https://matsudo-mensesthe.com/cast', scraper: () => scrapeImagesStaff('https://matsudo-mensesthe.com/cast', 'https://matsudo-mensesthe.com') },
  { id: 'saitama_warabi_sukitto_spa', castUrl: 'https://sukitto-spa.com/therapist.php', scraper: () => scrapeImagesStaff('https://sukitto-spa.com/therapist.php', 'https://sukitto-spa.com') },

  // --- ml_11_1 background ---
  { id: 'saitama_urawa_mitsu_no_yasuragi', castUrl: 'http://www.mitsu-no-yasuragi.com/staff', scraper: () => scrapeMl11Bg('http://www.mitsu-no-yasuragi.com/staff', 'http://www.mitsu-no-yasuragi.com') },
  { id: 'saitama_koshigaya_laugh_tale', castUrl: 'https://www.laugh-tale.net/staff', scraper: () => scrapeMl11Bg('https://www.laugh-tale.net/staff', 'https://www.laugh-tale.net') },
  { id: 'saitama_tokorozawa_pause_grande', castUrl: 'https://www.tokorozawa-pause.net/staff', scraper: () => scrapeMl11Bg('https://www.tokorozawa-pause.net/staff', 'https://www.tokorozawa-pause.net') },

  // --- PREMIUM SPA CMS (Chrome対応予定) ---
  // { id: 'saitama_omiya_ace', ... }
  // { id: 'saitama_urawa_pink_lady', ... }

  // --- Mirajour ---
  { id: 'saitama_kawagoe_nature', castUrl: 'https://www.nature-esthetic.com/therapist', scraper: () => scrapeMirajour('https://www.nature-esthetic.com/therapist', 'https://www.nature-esthetic.com') },
  { id: 'saitama_tokorozawa_miyako', castUrl: 'https://miyakospa.com/itemList.html', scraper: () => scrapeMirajour('https://miyakospa.com/itemList.html', 'https://miyakospa.com') },

  // --- Simple ID ---
  { id: 'saitama_omiya_mrs_eternity', castUrl: 'https://salon-eternity.com/cast', scraper: async () => {
    const html = await fetchHtml('https://salon-eternity.com/cast');
    const $ = cheerio.load(html);
    const results = new Map();
    $('img[alt*="エステティシャン"], img[alt*="エステ"]').each((_, el) => {
      const alt = cleanName($(el).attr('alt') || '');
      const src = $(el).attr('src') || '';
      if (!alt || isNoise(alt)) return;
      const imgUrl = src.startsWith('http') ? src : `https://salon-eternity.com/${src.replace(/^\//, '')}`;
      if (!results.has(alt)) results.set(alt, imgUrl);
    });
    return [...results.entries()].map(([name, img]) => ({ name, imageUrl: img }));
  }},

  // --- Chrome対応予定（後回し）---
  // chiba_chiba_madame_relax: /img/{n}-1.jpg だが名前取得が難しい
  // chiba_matsudo_lovers: Cloudflare Images、名前抽出が難しい
  // saitama_koshigaya_aroma_liberty: /therapist/{id}_1.jpg、名前抽出が難しい

  // --- テキスト名前のみ ---
  { id: 'chiba_matsudo_aroma_mrs', castUrl: 'https://aromamrs.com/staff.php', scraper: () => scrapeTextOnly('https://aromamrs.com/staff.php', 'https://aromamrs.com') },
  { id: 'chiba_matsudo_paradise_spa', castUrl: 'https://paradise-spa.info/staff.php', scraper: () => scrapeTextOnly('https://paradise-spa.info/staff.php', 'https://paradise-spa.info') },

  // --- kawagoe_king (JS lazy → alt のみ) ---
  { id: 'saitama_kawagoe_king', castUrl: 'https://www.kawagoe2024king.com/staff', scraper: () => scrapeKingAltOnly('https://www.kawagoe2024king.com/staff') },

  // --- re-db sites (画像+テキスト名マッチング) ---
  { id: 'saitama_warabi_otona_no_teishajou', castUrl: 'https://otei.ug11pm.com/cast', scraper: () => scrapeRedbImages('https://otei.ug11pm.com/cast', 'https://otei.ug11pm.com') },
  { id: 'saitama_kawagoe_lamp', castUrl: 'https://kawagoe.senju-lamp.com/cast', scraper: () => scrapeRedbImages('https://kawagoe.senju-lamp.com/cast', 'https://kawagoe.senju-lamp.com') },
  { id: 'saitama_tokorozawa_lamp', castUrl: 'https://tokorozawa.senju-lamp.com/cast', scraper: () => scrapeRedbImages('https://tokorozawa.senju-lamp.com/cast', 'https://tokorozawa.senju-lamp.com') },

  // ===== Chrome必要（後回し） =====
  // chiba_kashiwa_bijo_spa: o-pack.jp CMS (JS rendering)
  // saitama_warabi_magokoro_spa: JS rendering
  // saitama_tokorozawa_bariano: JS rendering
];

async function main() {
  const shops = ONLY_SHOP ? SHOPS.filter(s => s.id === ONLY_SHOP) : SHOPS;
  console.log(`\n${DRY_RUN ? '[DRY-RUN] ' : ''}セラピスト登録開始 (${shops.length}店舗)\n`);

  let totalInserted = 0, totalSkipped = 0;

  for (const shop of shops) {
    console.log(`\n[${shop.id}]`);
    try {
      const therapists = await shop.scraper();
      console.log(`  取得: ${therapists.length}名`);
      if (therapists.length === 0) { console.log('  → スキップ'); continue; }

      const { inserted, skipped } = await insertTherapists(shop.id, therapists);
      console.log(`  登録: ${inserted}名 / スキップ: ${skipped}名`);
      totalInserted += inserted;
      totalSkipped += skipped;
    } catch (e) {
      console.log(`  ERROR: ${e.message}`);
    }
    await sleep(600);
  }

  console.log(`\n===完了: 登録${totalInserted}名 / スキップ${totalSkipped}名===`);
  console.log('\nChrome必要（後回し）: bijo_spa, magokoro_spa, bariano');
}

main();
