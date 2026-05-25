/**
 * 大阪未処理店舗 自動一括処理スクリプト
 * caskan / 3days / wordpress / 独自 CMSを自動検出・処理
 * 実行: node scripts/insert/auto_process_osaka_shops.mjs
 */
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const ua = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

// ============================================================
// 共通ユーティリティ
// ============================================================
async function fetchHtml(url, timeout = 10000) {
  const res = await fetch(url, { headers: ua, signal: AbortSignal.timeout(timeout) });
  return await res.text();
}

function normalizeSize(s) {
  if (!s) return null;
  return String(s).normalize('NFKC').toUpperCase();
}

function extractCup(text) {
  const n = normalizeSize(text);
  const m = n?.match(/([A-Z])(?:CUP|カップ|cup)/i) || n?.match(/^([A-Z])$/);
  return m ? m[1].toUpperCase() : null;
}

function extractAge(text) {
  const m = text.match(/(\d{2,3})\s*歳/) || text.match(/age[\s.:]*(\d{2,3})/i) || text.match(/AGE[\s.]*(\d{2,3})/);
  return m ? parseInt(m[1]) : null;
}

function extractHeight(text) {
  const m = text.match(/T[．.:]?\s*(\d{3})/) || text.match(/(\d{3})\s*cm/i) || text.match(/身長[\s:：]*(\d{3})/);
  return m ? parseInt(m[1]) : null;
}

async function uploadImageToSupabase(imageUrl, therapistId, supabase) {
  try {
    const res = await fetch(imageUrl, { headers: ua, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const ext = imageUrl.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
    const fileName = `${therapistId}.${ext}`;
    const { data, error } = await supabase.storage
      .from('therapist-images')
      .upload(fileName, buffer, { contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`, upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('therapist-images').getPublicUrl(fileName);
    return publicUrl;
  } catch (e) {
    return null;
  }
}

// ============================================================
// caskan CMS パーサー
// ============================================================
async function processCaskan(shop, supabaseUrl, supabaseKey, supabase) {
  const html = await fetchHtml(shop.website_url);
  const $ = cheerio.load(html);

  // ショップID取得
  const caskanIdMatch = html.match(/caskan\/img\/cast_tmb\/(\d+)_/) || html.match(/cdn2-caskan\.com\/caskan\/img\/shop_logo\/(\d+)_/);
  const caskanId = caskanIdMatch?.[1];

  // ロゴ取得
  let logoUrl = null;
  const logoMatch = html.match(/cdn2-caskan\.com\/caskan\/img\/shop_logo\/(\d+_logo_\d+\.\w+)/);
  if (logoMatch) {
    logoUrl = `https://cdn2-caskan.com/caskan/img/shop_logo/${logoMatch[1]}`;
  }

  // セラピストリスト
  const items = $('li:has(img[src*="caskan/img/cast_tmb"])');
  if (items.length === 0) {
    console.log(`  ⚠️  セラピストなし (caskan)`);
    return { count: 0, logoUrl };
  }

  const therapists = [];
  items.each((_, el) => {
    const $el = $(el);
    const img = $el.find('img[src*="caskan/img/cast_tmb"]').first();
    const name = img.attr('alt')?.trim() || '';
    if (!name || /logo|shop|banner/i.test(name)) return;

    const imgSrc = img.attr('src') || '';
    const text = $el.text();
    const age = extractAge(text);
    const height = extractHeight(text);
    const cup = extractCup(text);

    therapists.push({ name, imgSrc, age, height, cup });
  });

  // 重複除去
  const unique = [...new Map(therapists.map(t => [t.name, t])).values()];
  console.log(`  caskan: ${unique.length}名`);

  let inserted = 0;
  for (const t of unique) {
    const therapistId = `${shop.id}_${t.name.replace(/\s+/g, '_').replace(/[^\w぀-鿿]/g, '')}`;
    const imageUrl = t.imgSrc.startsWith('http') ? t.imgSrc : `https://cdn2-caskan.com${t.imgSrc}`;
    const storedUrl = await uploadImageToSupabase(imageUrl, therapistId, supabase);

    const { error } = await supabase.from('therapists').upsert({
      id: therapistId,
      shop_id: shop.id,
      name: t.name,
      age: t.age,
      height: t.height,
      cup: t.cup,
      image_url: storedUrl || imageUrl,
    });
    if (!error) inserted++;
  }

  return { count: inserted, logoUrl };
}

// ============================================================
// 3days CMS パーサー
// ============================================================
async function process3days(shop, supabaseUrl, supabaseKey, supabase) {
  const html = await fetchHtml(shop.website_url);

  // data.jsのURL検索
  const dataJsMatch = html.match(/src=["']([^"']*data\.js[^"']*)["']/);
  if (!dataJsMatch) {
    // セラピストページを探す
    const $ = cheerio.load(html);
    let therapistPageUrl = null;
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      if (/therapist|cast|lady|staff|girl|セラピスト|在籍/i.test(href + text) && !therapistPageUrl) {
        therapistPageUrl = href.startsWith('http') ? href : new URL(href, shop.website_url).href;
      }
    });
    if (therapistPageUrl) {
      return await process3daysFromPage(shop, therapistPageUrl, supabase);
    }
    return { count: 0, logoUrl: null };
  }

  const dataJsUrl = dataJsMatch[1].startsWith('http') ? dataJsMatch[1] : new URL(dataJsMatch[1], shop.website_url).href;

  try {
    const dataJs = await fetchHtml(dataJsUrl);
    const evalResult = {};
    const wrappedCode = dataJs.replace(
      /^(?:var|const|let)\s+(\w+)\s*=/,
      (_, varName) => `evalResult["${varName}"] =`
    );
    new Function('evalResult', wrappedCode)(evalResult);
    const parsed = Object.values(evalResult)[0];
    if (!parsed || !Array.isArray(parsed)) return { count: 0, logoUrl: null };

    console.log(`  3days: ${parsed.length}名`);
    let inserted = 0;

    for (const t of parsed) {
      const name = t.therapistName || t.name || '';
      if (!name) continue;
      const therapistId = `${shop.id}_${name.replace(/\s+/g, '_').replace(/[^\w぀-鿿]/g, '')}`;
      const imgPath = t.img1 || t.image || '';
      const imageUrl = imgPath.startsWith('http') ? imgPath : new URL(imgPath, shop.website_url).href;
      const storedUrl = await uploadImageToSupabase(imageUrl, therapistId, supabase);

      const ageVal = t.age ? parseInt(t.age) : null;
      const heightVal = t.height ? parseInt(t.height) : null;
      const threeSize = normalizeSize(t.threeSize || t.bust || '');
      const cupMatch = threeSize?.match(/([A-Z])(?:CUP)?/);
      const cup = cupMatch ? cupMatch[1] : null;

      const { error } = await supabase.from('therapists').upsert({
        id: therapistId,
        shop_id: shop.id,
        name,
        age: ageVal,
        height: heightVal,
        cup,
        image_url: storedUrl || imageUrl,
      });
      if (!error) inserted++;
    }
    return { count: inserted, logoUrl: null };
  } catch (e) {
    console.log(`  3days parse error: ${e.message}`);
    return { count: 0, logoUrl: null };
  }
}

async function process3daysFromPage(shop, pageUrl, supabase) {
  const html = await fetchHtml(pageUrl);
  const $ = cheerio.load(html);

  const therapists = [];
  $('div.item, div.cast-item, article.cast').each((_, el) => {
    const $el = $(el);
    const nameEl = $el.find('h3, .name, .cast-name').first();
    const name = nameEl.text().replace(/\(\d+歳\)/, '').trim();
    if (!name) return;
    const img = $el.find('img').first();
    const imgSrc = img.attr('data-src') || img.attr('src') || '';
    const text = $el.text();
    therapists.push({ name, imgSrc, age: extractAge(text), height: extractHeight(text), cup: extractCup(text) });
  });

  if (therapists.length === 0) return { count: 0, logoUrl: null };
  console.log(`  3days(page): ${therapists.length}名`);

  let inserted = 0;
  for (const t of therapists) {
    const therapistId = `${shop.id}_${t.name.replace(/\s+/g, '_').replace(/[^\w぀-鿿]/g, '')}`;
    const imageUrl = t.imgSrc.startsWith('http') ? t.imgSrc : new URL(t.imgSrc, pageUrl).href;
    const storedUrl = await uploadImageToSupabase(imageUrl, therapistId, supabase);

    const { error } = await supabase.from('therapists').upsert({
      id: therapistId,
      shop_id: shop.id,
      name: t.name,
      age: t.age,
      height: t.height,
      cup: t.cup,
      image_url: storedUrl || imageUrl,
    });
    if (!error) inserted++;
  }
  return { count: inserted, logoUrl: null };
}

// ============================================================
// men-es CMS パーサー
// ============================================================
async function processMenEs(shop, supabase) {
  const html = await fetchHtml(shop.website_url);
  const $ = cheerio.load(html);

  // セラピストページへのリンクを探す
  let therapistUrl = null;
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().trim();
    if (/therapist|cast|lady|staff|girl|セラピスト|在籍/i.test(href + text) && !therapistUrl) {
      therapistUrl = href.startsWith('http') ? href : new URL(href, shop.website_url).href;
    }
  });

  if (!therapistUrl) return { count: 0, logoUrl: null };

  const tHtml = await fetchHtml(therapistUrl);
  const $t = cheerio.load(tHtml);
  const therapists = [];

  $t('.cast-item, .therapist-item, li.cast, div.cast').each((_, el) => {
    const $el = $t(el);
    const name = $el.find('.name, .cast-name, h3, h4').first().text().trim();
    if (!name) return;
    const img = $el.find('img').first();
    const imgSrc = img.attr('src') || img.attr('data-src') || '';
    const text = $el.text();
    therapists.push({ name, imgSrc, age: extractAge(text), height: extractHeight(text), cup: extractCup(text) });
  });

  if (therapists.length === 0) return { count: 0, logoUrl: null };
  console.log(`  men-es: ${therapists.length}名`);

  let inserted = 0;
  for (const t of therapists) {
    const therapistId = `${shop.id}_${t.name.replace(/\s+/g, '_').replace(/[^\w぀-鿿]/g, '')}`;
    const imageUrl = t.imgSrc.startsWith('http') ? t.imgSrc : new URL(t.imgSrc, therapistUrl).href;
    const storedUrl = await uploadImageToSupabase(imageUrl, therapistId, supabase);

    const { error } = await supabase.from('therapists').upsert({
      id: therapistId,
      shop_id: shop.id,
      name: t.name,
      age: t.age,
      height: t.height,
      cup: t.cup,
      image_url: storedUrl || imageUrl,
    });
    if (!error) inserted++;
  }
  return { count: inserted, logoUrl: null };
}

// ============================================================
// WordPress パーサー
// ============================================================
async function processWordPress(shop, supabase) {
  const html = await fetchHtml(shop.website_url);
  const $ = cheerio.load(html);

  // セラピストページへのリンクを探す
  let therapistUrl = null;
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().trim();
    if (/therapist|cast|lady|staff|girl|セラピスト|在籍/i.test(href + text) && !therapistUrl) {
      therapistUrl = href.startsWith('http') ? href : new URL(href, shop.website_url).href;
    }
  });

  const targetUrl = therapistUrl || shop.website_url;
  const tHtml = targetUrl !== shop.website_url ? await fetchHtml(targetUrl) : html;
  const $t = cheerio.load(tHtml);
  const therapists = [];

  $t('li:has(img[src*="wp-content/uploads"]), article:has(img[src*="wp-content/uploads"]), div.therapist:has(img)').each((_, el) => {
    const $el = $t(el);
    const img = $el.find('img').first();
    const name = (img.attr('alt') || $el.find('.name, h3, h4, .cast-name').first().text()).trim();
    if (!name || /logo|banner|icon|twitter|line|instagram/i.test(name)) return;
    const imgSrc = img.attr('src') || img.attr('data-src') || '';
    const text = $el.text();
    therapists.push({ name, imgSrc, age: extractAge(text), height: extractHeight(text), cup: extractCup(text) });
  });

  if (therapists.length === 0) return { count: 0, logoUrl: null };
  console.log(`  wordpress: ${therapists.length}名`);

  let inserted = 0;
  for (const t of therapists) {
    const therapistId = `${shop.id}_${t.name.replace(/\s+/g, '_').replace(/[^\w぀-鿿]/g, '')}`;
    const imageUrl = t.imgSrc.startsWith('http') ? t.imgSrc : new URL(t.imgSrc, targetUrl).href;
    const storedUrl = await uploadImageToSupabase(imageUrl, therapistId, supabase);

    const { error } = await supabase.from('therapists').upsert({
      id: therapistId,
      shop_id: shop.id,
      name: t.name,
      age: t.age,
      height: t.height,
      cup: t.cup,
      image_url: storedUrl || imageUrl,
    });
    if (!error) inserted++;
  }
  return { count: inserted, logoUrl: null };
}

// ============================================================
// smarts CMS パーサー
// ============================================================
async function processSmarts(shop, supabase) {
  const html = await fetchHtml(shop.website_url);
  const $ = cheerio.load(html);

  let therapistUrl = null;
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().trim();
    if (/therapist|cast|lady|staff|girl|セラピスト|在籍/i.test(href + text) && !therapistUrl) {
      therapistUrl = href.startsWith('http') ? href : new URL(href, shop.website_url).href;
    }
  });

  if (!therapistUrl) return { count: 0, logoUrl: null };

  const tHtml = await fetchHtml(therapistUrl);
  const $t = cheerio.load(tHtml);
  const therapists = [];

  $t('.cast-wrap, .cast-list li, .therapist-list li, .girl-item').each((_, el) => {
    const $el = $t(el);
    const img = $el.find('img').first();
    const name = (img.attr('alt') || $el.find('.name').first().text()).trim();
    if (!name) return;
    const imgSrc = img.attr('src') || img.attr('data-src') || '';
    const text = $el.text();
    therapists.push({ name, imgSrc, age: extractAge(text), height: extractHeight(text), cup: extractCup(text) });
  });

  if (therapists.length === 0) return { count: 0, logoUrl: null };
  console.log(`  smarts: ${therapists.length}名`);

  let inserted = 0;
  for (const t of therapists) {
    const therapistId = `${shop.id}_${t.name.replace(/\s+/g, '_').replace(/[^\w぀-鿿]/g, '')}`;
    const imageUrl = t.imgSrc.startsWith('http') ? t.imgSrc : new URL(t.imgSrc, therapistUrl).href;
    const storedUrl = await uploadImageToSupabase(imageUrl, therapistId, supabase);

    const { error } = await supabase.from('therapists').upsert({
      id: therapistId,
      shop_id: shop.id,
      name: t.name,
      age: t.age,
      height: t.height,
      cup: t.cup,
      image_url: storedUrl || imageUrl,
    });
    if (!error) inserted++;
  }
  return { count: inserted, logoUrl: null };
}

// ============================================================
// ロゴアップロード
// ============================================================
async function uploadLogo(logoUrl, shopId, supabase) {
  if (!logoUrl) return null;
  try {
    const res = await fetch(logoUrl, { headers: ua, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const ext = logoUrl.split('.').pop()?.split('?')[0]?.toLowerCase() || 'png';
    const fileName = `${shopId}_logo.${ext}`;
    const { data, error } = await supabase.storage
      .from('shop-logos')
      .upload(fileName, buffer, { contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`, upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('shop-logos').getPublicUrl(fileName);
    return publicUrl;
  } catch (e) {
    return null;
  }
}

// ============================================================
// メイン処理
// ============================================================
async function run() {
  const env = fs.readFileSync('.env', 'utf-8');
  const getEnv = (key) => env.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
  const supabaseUrl = getEnv('VITE_SUPABASE_URL');
  const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');
  const h = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` };
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 大阪でwebsite_urlあり店舗取得
  const r = await fetch(`${supabaseUrl}/rest/v1/shops?id=like.osaka_*&website_url=not.is.null&select=id,name,website_url`, { headers: h });
  if (!r.ok) {
    const err = await r.text();
    throw new Error(`Supabase query failed (${r.status}): ${err.slice(0, 200)}`);
  }
  const shops = await r.json();
  if (!Array.isArray(shops)) throw new Error(`Expected array, got: ${JSON.stringify(shops).slice(0, 200)}`);
  console.log(`大阪 website_urlあり: ${shops.length}件`);

  // セラピスト0の店舗を抽出
  const unprocessed = [];
  for (const shop of shops) {
    const tr = await fetch(`${supabaseUrl}/rest/v1/therapists?shop_id=eq.${shop.id}&select=id&limit=1`, { headers: h });
    const therapists = await tr.json();
    if (therapists.length === 0) unprocessed.push(shop);
  }
  console.log(`未処理: ${unprocessed.length}件\n`);

  const results = { success: [], skipped: [], failed: [] };

  for (const shop of unprocessed) {
    process.stdout.write(`\n[${shop.id}]\n  ${shop.name}\n  ${shop.website_url}\n  → `);

    try {
      const res = await fetch(shop.website_url, { headers: ua, signal: AbortSignal.timeout(10000) });
      const html = await res.text();

      // CMS判定
      let cms = '独自';
      if (html.includes('caskan')) cms = 'caskan';
      else if (html.includes('3days')) cms = '3days';
      else if (html.includes('men-es.jp')) cms = 'men-es';
      else if (html.includes('wp-content')) cms = 'wordpress';
      else if (html.includes('smarts')) cms = 'smarts';

      process.stdout.write(`${cms} ... `);

      let result = { count: 0, logoUrl: null };

      if (cms === 'caskan') {
        result = await processCaskan(shop, supabaseUrl, supabaseKey, supabase);
      } else if (cms === '3days') {
        result = await process3days(shop, supabaseUrl, supabaseKey, supabase);
      } else if (cms === 'men-es') {
        result = await processMenEs(shop, supabase);
      } else if (cms === 'wordpress') {
        result = await processWordPress(shop, supabase);
      } else if (cms === 'smarts') {
        result = await processSmarts(shop, supabase);
      } else {
        console.log(`⚠️  独自CMS - スキップ`);
        results.skipped.push({ id: shop.id, name: shop.name, url: shop.website_url, cms });
        continue;
      }

      if (result.count > 0) {
        // ロゴをアップロード
        if (result.logoUrl) {
          const storedLogo = await uploadLogo(result.logoUrl, shop.id, supabase);
          if (storedLogo) {
            await supabase.from('shops').update({ logo_url: storedLogo }).eq('id', shop.id);
            console.log(`  ✅ ${result.count}名挿入, ロゴ更新`);
          } else {
            console.log(`  ✅ ${result.count}名挿入`);
          }
        } else {
          console.log(`  ✅ ${result.count}名挿入`);
        }
        results.success.push({ id: shop.id, name: shop.name, count: result.count, cms });
      } else {
        console.log(`  ⚠️  セラピスト0名 - 手動確認要`);
        results.skipped.push({ id: shop.id, name: shop.name, url: shop.website_url, cms });
      }

    } catch (e) {
      console.log(`  ❌ ${e.message.slice(0, 60)}`);
      results.failed.push({ id: shop.id, name: shop.name, url: shop.website_url, error: e.message });
    }
  }

  // 結果サマリー
  console.log('\n' + '='.repeat(70));
  console.log(`\n✅ 成功: ${results.success.length}店舗`);
  results.success.forEach(s => console.log(`  ${s.id}: ${s.name} (${s.cms}, ${s.count}名)`));

  console.log(`\n⚠️  スキップ: ${results.skipped.length}店舗 (手動処理要)`);
  results.skipped.forEach(s => console.log(`  ${s.id}: ${s.name} [${s.cms}] ${s.url}`));

  console.log(`\n❌ エラー: ${results.failed.length}店舗`);
  results.failed.forEach(s => console.log(`  ${s.id}: ${s.name} - ${s.error?.slice(0, 50)}`));
}

run().catch(e => console.error('❌ Fatal:', e.message));
