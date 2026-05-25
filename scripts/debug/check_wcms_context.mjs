/**
 * wcms サイトのトップページで名前と画像IDの対応を確認
 * ミセスの子守唄 / ムーンR 大阪 / ムーンR 兵庫
 * 実行: node scripts/debug/check_wcms_context.mjs
 */
import fs from 'fs';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const supabase = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'));

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function fetchHtml(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function analyzeWcmsSite(siteKey, baseUrl, urlPart) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`【${siteKey}】 ${baseUrl}`);
  console.log('='.repeat(60));

  // DB null therapists
  const { data: shops } = await supabase.from('shops').select('id, name').ilike('website_url', `%${urlPart}%`);
  const shopIds = shops?.map(s => s.id) || [];
  const { data: nullT } = await supabase.from('therapists').select('id, name, shop_id').in('shop_id', shopIds).is('image_url', null);
  const nullNames = new Set(nullT?.map(t => t.name) || []);
  console.log(`DB写真なし: ${nullNames.size}名`);

  // トップページ取得
  const html = await fetchHtml(baseUrl);
  const $ = cheerio.load(html);

  // ─ wcms/gals 画像の周辺コンテキスト（親要素/兄弟テキスト）で名前を探す ─
  console.log('\n--- wcms/gals 画像と周辺テキスト ---');
  const nameImagePairs = [];

  $('img[src*="/wcms/gals/"]').each((_, el) => {
    const src = $(el).attr('src') || '';
    const galsId = src.match(/\/gals\/images\/(\d+)\//)?.[1];
    if (!galsId) return;

    // 親・祖父・兄弟要素からテキスト抽出
    const $el = $(el);
    const contexts = [
      $el.attr('alt') || '',
      $el.closest('li').text().trim().slice(0, 30),
      $el.closest('div').text().trim().slice(0, 30),
      $el.closest('a').text().trim().slice(0, 30),
      $el.closest('figure').text().trim().slice(0, 30),
      $el.next().text().trim().slice(0, 20),
      $el.parent().next().text().trim().slice(0, 20),
    ];

    // 日本語名らしきテキストを探す（2〜6文字の漢字/かな）
    let foundName = null;
    for (const ctx of contexts) {
      if (!ctx) continue;
      // 改行/スペース除去してチェック
      const cleaned = ctx.replace(/[\s\n\r\t]/g, '');
      // 2〜6文字の日本語
      const m = cleaned.match(/^([ぁ-ん一-龯ァ-ヾ]{2,6})/);
      if (m) { foundName = m[1]; break; }
    }

    const inNullList = foundName && nullNames.has(foundName);
    const mark = inNullList ? '★' : foundName ? '  ' : '??';
    if (foundName || galsId) {
      console.log(`  ${mark} galsId=${galsId} name="${foundName || '(不明)'}" src="${src.slice(-40)}"`);
      if (foundName) nameImagePairs.push([foundName, src, galsId]);
    }
  });

  console.log(`\n名前取得できたペア: ${nameImagePairs.length}件`);
  const matchedNull = nameImagePairs.filter(([n]) => nullNames.has(n));
  console.log(`DB nullと一致: ${matchedNull.length}件`);
  matchedNull.forEach(([name, src, id]) => console.log(`  → ${name} (id=${id})`));

  // ─ HTMLに含まれる名前をすべて探す ─
  console.log('\n--- HTML内のDB null名 ---');
  const htmlText = $.html();
  const foundInHtml = [...nullNames].filter(n => htmlText.includes(n));
  console.log(`${foundInHtml.length}/${nullNames.size}名がHTML内に存在`);
  foundInHtml.forEach(n => {
    // その名前の前後50文字
    const idx = htmlText.indexOf(n);
    const context = htmlText.slice(Math.max(0, idx - 30), idx + n.length + 30).replace(/\n/g, ' ');
    console.log(`  "${n}": ...${context}...`);
  });

  return nameImagePairs;
}

// ─── 各サイト分析 ─────────────────────────────────────────────────
await analyzeWcmsSite('ミセスの子守唄', 'https://mrs-komoriuta.com/', 'komoriuta');
await analyzeWcmsSite('ミセスムーンR 大阪', 'https://www.moonr.jp/', 'moonr.jp');
await analyzeWcmsSite('ミセスムーンR 兵庫', 'https://moor-kobe.jp/', 'moor-kobe');

console.log('\n完了');
